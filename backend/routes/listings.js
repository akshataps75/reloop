const express = require('express');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const requireAuth = require('../middleware/auth');
const requireVerified = require('../middleware/requireVerified');

const router = express.Router();

// Mirrors lib/mock-data.ts THRESHOLDS on the frontend — keep these two in sync.
const CLUSTER_THRESHOLDS = {
  'Books & Stationery': 1500,
  'Mobile & Accessories': 10000,
  'Electronics & Gadgets': 8000,
  'Furniture & Home': 5000,
  'Vehicles': 6000,
  'Fashion & Accessories': 2500,
  'Sports & Fitness': 4000,
  'Appliances': 6000,
  'Musical Instruments': 5000,
  // 'Other' has no threshold — always Cluster A
};

function assignCluster(category, price) {
  const threshold = CLUSTER_THRESHOLDS[category];
  if (threshold === undefined) return 'A';
  return Number(price) >= threshold ? 'B' : 'A';
}

// Doesn't reject if there's no token — just attaches req.userId when one is
// present and valid. Lets a public route optionally know who's asking.
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      req.userId = decoded.userId;
    } catch {
      // invalid/expired token — just proceed as anonymous
    }
  }
  next();
}

// GET /api/listings/thresholds — public. Lets the frontend show a live
// "this will be Cluster B" hint before submission, without duplicating
// the threshold values. Backend still re-validates independently in
// assignCluster() on POST /listings, so this is a convenience, not a
// trust boundary.
router.get('/thresholds', (req, res) => {
  res.json(CLUSTER_THRESHOLDS);
});

// GET /api/listings/category-counts — public. Real per-category active-listing
// counts for the Home page category grid.
router.get('/category-counts', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT category, COUNT(*)::int AS count FROM listings WHERE status = 'active' GROUP BY category`
    );
    const counts = {};
    result.rows.forEach(r => { counts[r.category] = r.count; });
    res.json(counts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong fetching category counts' });
  }
});

// GET /api/listings?lat&lng&radius&search&category
// Public — browsing doesn't require auth or verification.
router.get('/', optionalAuth, async (req, res) => {
  const { lat, lng, radius, search, category } = req.query;

  const conditions = ["status = 'active'"];
  const params = [];

  if (req.userId) {
    params.push(req.userId);
    conditions.push(`l.seller_id != $${params.length}`);
  }

  if (lat && lng && radius) {
    params.push(Number(lng), Number(lat), Number(radius));
    conditions.push(
      `ST_DWithin(l.location, ST_SetSRID(ST_MakePoint($${params.length - 2}, $${params.length - 1}), 4326)::geography, $${params.length})`
    );
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`title ILIKE $${params.length}`);
  }

  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT l.id, l.title, l.category, l.price, l.image, l.cluster, l.status, l.created_at,
              u.name AS seller, u.initials AS seller_initials
       FROM listings l
       JOIN users u ON u.id = l.seller_id
       ${where}
       ORDER BY l.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong fetching listings' });
  }
});

// GET /api/listings/:id — public, single listing with seller info joined.
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, u.name AS seller, u.initials AS seller_initials, u.verified AS seller_verified
       FROM listings l
       JOIN users u ON u.id = l.seller_id
       WHERE l.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    let alreadyInterested = false;
    if (req.userId) {
      const interestCheck = await pool.query(
        'SELECT 1 FROM listing_interests WHERE listing_id = $1 AND buyer_id = $2',
        [req.params.id, req.userId]
      );
      alreadyInterested = interestCheck.rows.length > 0;
    }

    res.json({ ...result.rows[0], alreadyInterested });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong fetching the listing' });
  }
});

// GET /api/listings/:id/interested — seller-only. Buyers who expressed interest,
// each with a get-or-create thread id so the seller can message them right away.
router.get('/:id/interested', requireAuth, async (req, res) => {
  try {
    const listingResult = await pool.query('SELECT seller_id FROM listings WHERE id = $1', [req.params.id]);
    if (listingResult.rows.length === 0) return res.status(404).json({ error: 'Listing not found' });
    if (listingResult.rows[0].seller_id !== req.userId) {
      return res.status(403).json({ error: 'Only the seller can view interested buyers' });
    }

    const buyers = await pool.query(
      `SELECT li.buyer_id, li.interested_on, u.name, u.initials
       FROM listing_interests li
       JOIN users u ON u.id = li.buyer_id
       WHERE li.listing_id = $1
       ORDER BY li.interested_on DESC`,
      [req.params.id]
    );

    const withThreads = await Promise.all(buyers.rows.map(async (b) => {
      const threadResult = await pool.query(
        `INSERT INTO chat_threads (listing_id, seller_id, buyer_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (listing_id, buyer_id) DO UPDATE SET listing_id = EXCLUDED.listing_id
         RETURNING id`,
        [req.params.id, req.userId, b.buyer_id]
      );
      return { ...b, thread_id: threadResult.rows[0].id };
    }));

    res.json(withThreads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong fetching interested buyers' });
  }
});

// POST /api/listings — gated: must be authed AND verified.
router.post('/', requireAuth, requireVerified, async (req, res) => {
  const { title, category, price, description, condition, image, images, documentType, documentUrl, lat, lng } = req.body;

  if (!title || !category || price === undefined) {
    return res.status(400).json({ error: 'title, category, and price are required' });
  }

  const cluster = assignCluster(category, price);

  try {
    const imageList = Array.isArray(images) ? images : [];
    const coverImage = image || imageList[0] || null;
    const result = await pool.query(
      `INSERT INTO listings
         (seller_id, title, category, price, image, images, description, condition, cluster, document_type, document_url, location)
       VALUES
         ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          CASE WHEN $12::float8 IS NOT NULL AND $13::float8 IS NOT NULL
               THEN ST_SetSRID(ST_MakePoint($12, $13), 4326)::geography
               ELSE NULL END)
       RETURNING *`,
      [req.userId, title, category, price, coverImage, imageList, description || null, condition || null,
       cluster, documentType || null, documentUrl || null,
       lng !== undefined ? Number(lng) : null, lat !== undefined ? Number(lat) : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong creating the listing' });
  }
});

// POST /api/listings/:id/interest — gated: authed + verified. Idempotent.
router.post('/:id/interest', requireAuth, requireVerified, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO listing_interests (listing_id, buyer_id)
       VALUES ($1, $2)
       ON CONFLICT (listing_id, buyer_id) DO NOTHING`,
      [req.params.id, req.userId]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong registering interest' });
  }
});

module.exports = router;