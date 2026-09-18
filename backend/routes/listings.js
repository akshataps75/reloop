const express = require('express');
const pool = require('../db');
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

// GET /api/listings?lat&lng&radius&search&category
// Public — browsing doesn't require auth or verification.
router.get('/', async (req, res) => {
  const { lat, lng, radius, search, category } = req.query;

  const conditions = ["status = 'active'"];
  const params = [];

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
router.get('/:id', async (req, res) => {
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
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong fetching the listing' });
  }
});

// POST /api/listings — gated: must be authed AND verified.
router.post('/', requireAuth, requireVerified, async (req, res) => {
  const { title, category, price, description, condition, image, documentType, documentUrl, lat, lng } = req.body;

  if (!title || !category || price === undefined) {
    return res.status(400).json({ error: 'title, category, and price are required' });
  }

  const cluster = assignCluster(category, price);

  try {
    const result = await pool.query(
      `INSERT INTO listings
         (seller_id, title, category, price, image, description, condition, cluster, document_type, document_url, location)
       VALUES
         ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          CASE WHEN $11::float8 IS NOT NULL AND $12::float8 IS NOT NULL
               THEN ST_SetSRID(ST_MakePoint($11, $12), 4326)::geography
               ELSE NULL END)
       RETURNING *`,
      [req.userId, title, category, price, image || null, description || null, condition || null,
       cluster, documentType || null, documentUrl || null,
       lng !== undefined ? Number(lng) : null, lat !== undefined ? Number(lat) : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong creating the listing' });
  }
});

// GET /api/users/:id — public seller profile: active + sold listings.
router.get('/users/:id', async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT id, name, initials, role, verified FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const listingsResult = await pool.query(
      `SELECT id, title, price, image, status, sold_on
       FROM listings
       WHERE seller_id = $1
       ORDER BY created_at DESC`,
      [req.params.id]
    );

    res.json({ ...userResult.rows[0], listings: listingsResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong fetching this profile' });
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

// GET /api/me/activity — authed. Selling (mine) + buying (interested-in), split active/completed.
router.get('/me/activity', requireAuth, async (req, res) => {
  try {
    const selling = await pool.query(
      `SELECT id, title, price, image, status, sold_on
       FROM listings
       WHERE seller_id = $1
       ORDER BY created_at DESC`,
      [req.userId]
    );

    const buying = await pool.query(
      `SELECT l.id AS listing_id, l.title, l.price, l.image, l.status, li.interested_on
       FROM listing_interests li
       JOIN listings l ON l.id = li.listing_id
       WHERE li.buyer_id = $1
       ORDER BY li.interested_on DESC`,
      [req.userId]
    );

    res.json({
      selling: {
        active: selling.rows.filter(l => l.status === 'active'),
        sold: selling.rows.filter(l => l.status === 'sold'),
      },
      buying: {
        ongoing: buying.rows.filter(l => l.status === 'active'),
        completed: buying.rows.filter(l => l.status === 'sold'),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong fetching activity' });
  }
});

module.exports = router;