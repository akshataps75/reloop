const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /api/threads — authed. Returns every thread the user is part of
// (as seller or buyer), with role/name/initials computed relative to the viewer.
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         t.id,
         t.listing_id,
         l.title AS listing_title,
         l.image AS listing_image,
         CASE WHEN t.seller_id = $1 THEN 'selling' ELSE 'buying' END AS role,
         CASE WHEN t.seller_id = $1 THEN buyer.name ELSE seller.name END AS name,
         CASE WHEN t.seller_id = $1 THEN buyer.initials ELSE seller.initials END AS initials,
         (SELECT text FROM chat_messages WHERE thread_id = t.id ORDER BY created_at DESC LIMIT 1) AS preview,
         (SELECT created_at FROM chat_messages WHERE thread_id = t.id ORDER BY created_at DESC LIMIT 1) AS last_message_at
       FROM chat_threads t
       JOIN listings l ON l.id = t.listing_id
       JOIN users seller ON seller.id = t.seller_id
       JOIN users buyer ON buyer.id = t.buyer_id
       WHERE t.seller_id = $1 OR t.buyer_id = $1
       ORDER BY last_message_at DESC NULLS LAST`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong fetching threads' });
  }
});

// POST /api/threads — authed. Body: { listingId }. Gated behind an existing
// interest record — you can't open a thread without having expressed interest first.
router.post('/', requireAuth, async (req, res) => {
  const { listingId } = req.body;
  if (!listingId) {
    return res.status(400).json({ error: 'listingId is required' });
  }

  try {
    const listingResult = await pool.query('SELECT seller_id FROM listings WHERE id = $1', [listingId]);
    if (listingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    const sellerId = listingResult.rows[0].seller_id;

    if (sellerId === req.userId) {
      return res.status(400).json({ error: 'You cannot message yourself about your own listing' });
    }

    const interestResult = await pool.query(
      'SELECT id FROM listing_interests WHERE listing_id = $1 AND buyer_id = $2',
      [listingId, req.userId]
    );
    if (interestResult.rows.length === 0) {
      return res.status(403).json({ error: 'interest_required', message: 'Express interest in this listing before starting a chat' });
    }

    // UNIQUE (listing_id, buyer_id) means this is safe to call repeatedly —
    // it returns the existing thread instead of erroring on conflict.
    const threadResult = await pool.query(
      `INSERT INTO chat_threads (listing_id, seller_id, buyer_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (listing_id, buyer_id) DO UPDATE SET listing_id = EXCLUDED.listing_id
       RETURNING *`,
      [listingId, sellerId, req.userId]
    );
    res.status(201).json(threadResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong creating the thread' });
  }
});

// Shared helper: confirms req.userId is seller or buyer on this thread.
async function assertParticipant(threadId, userId) {
  const result = await pool.query(
    'SELECT seller_id, buyer_id FROM chat_threads WHERE id = $1',
    [threadId]
  );
  if (result.rows.length === 0) return null;
  const { seller_id, buyer_id } = result.rows[0];
  if (seller_id !== userId && buyer_id !== userId) return false;
  return true;
}

// GET /api/threads/:id/messages — authed, participant-only.
router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const isParticipant = await assertParticipant(req.params.id, req.userId);
    if (isParticipant === null) return res.status(404).json({ error: 'Thread not found' });
    if (!isParticipant) return res.status(403).json({ error: 'Not a participant in this thread' });

    const result = await pool.query(
      `SELECT id, sender_id, text, status, created_at
       FROM chat_messages
       WHERE thread_id = $1
       ORDER BY created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong fetching messages' });
  }
});

// POST /api/threads/:id/messages — authed, participant-only. Body: { text }.
router.post('/:id/messages', requireAuth, async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }

  try {
    const isParticipant = await assertParticipant(req.params.id, req.userId);
    if (isParticipant === null) return res.status(404).json({ error: 'Thread not found' });
    if (!isParticipant) return res.status(403).json({ error: 'Not a participant in this thread' });

    const result = await pool.query(
      `INSERT INTO chat_messages (thread_id, sender_id, text)
       VALUES ($1, $2, $3)
       RETURNING id, sender_id, text, status, created_at`,
      [req.params.id, req.userId, text.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong sending the message' });
  }
});

module.exports = router;