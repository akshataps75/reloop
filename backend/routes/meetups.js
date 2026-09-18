const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

function generateCode() {
  // 6-digit numeric code, shown in person at the meetup — matches MeetupCard's "code" display.
  return crypto.randomInt(100000, 999999).toString();
}

async function getThread(threadId) {
  const result = await pool.query(
    'SELECT id, seller_id, buyer_id FROM chat_threads WHERE id = $1',
    [threadId]
  );
  return result.rows[0] || null;
}

// GET /api/threads/:threadId/meetup — authed, participant-only. Returns current state (or 'none').
router.get('/', requireAuth, async (req, res) => {
  try {
    const thread = await getThread(req.params.threadId);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    if (thread.seller_id !== req.userId && thread.buyer_id !== req.userId) {
      return res.status(403).json({ error: 'Not a participant in this thread' });
    }

    const result = await pool.query('SELECT * FROM meetups WHERE thread_id = $1', [req.params.threadId]);
    if (result.rows.length === 0) {
      return res.json({ status: 'none' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong fetching the meetup' });
  }
});

// POST /api/threads/:threadId/meetup — authed, participant-only. Body: { date, time, place }.
// Creates a fresh 'pending' request (overwrites any prior declined/expired one).
router.post('/', requireAuth, async (req, res) => {
  const { date, time, place } = req.body;
  if (!date || !time || !place) {
    return res.status(400).json({ error: 'date, time, and place are required' });
  }

  try {
    const thread = await getThread(req.params.threadId);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    if (thread.seller_id !== req.userId && thread.buyer_id !== req.userId) {
      return res.status(403).json({ error: 'Not a participant in this thread' });
    }

    const result = await pool.query(
      `INSERT INTO meetups (thread_id, status, date, time, place, requested_by_user_id)
       VALUES ($1, 'pending', $2, $3, $4, $5)
       ON CONFLICT (thread_id) DO UPDATE SET
         status = 'pending', date = $2, time = $3, place = $4,
         requested_by_user_id = $5, code = NULL, done_by_seller = FALSE, done_by_buyer = FALSE
       RETURNING *`,
      [req.params.threadId, date, time, place, req.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong proposing the meetup' });
  }
});

// POST /api/threads/:threadId/meetup/accept — authed. Only the non-requester can accept.
router.post('/accept', requireAuth, async (req, res) => {
  try {
    const thread = await getThread(req.params.threadId);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    if (thread.seller_id !== req.userId && thread.buyer_id !== req.userId) {
      return res.status(403).json({ error: 'Not a participant in this thread' });
    }

    const existing = await pool.query('SELECT * FROM meetups WHERE thread_id = $1', [req.params.threadId]);
    if (existing.rows.length === 0 || existing.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'No pending meetup request to accept' });
    }
    if (existing.rows[0].requested_by_user_id === req.userId) {
      return res.status(400).json({ error: 'You cannot accept your own request' });
    }

    const code = generateCode();
    const result = await pool.query(
      `UPDATE meetups SET status = 'confirmed', code = $2 WHERE thread_id = $1 RETURNING *`,
      [req.params.threadId, code]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong accepting the meetup' });
  }
});

// POST /api/threads/:threadId/meetup/decline — authed. Only the non-requester can decline.
router.post('/decline', requireAuth, async (req, res) => {
  try {
    const thread = await getThread(req.params.threadId);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    if (thread.seller_id !== req.userId && thread.buyer_id !== req.userId) {
      return res.status(403).json({ error: 'Not a participant in this thread' });
    }

    const existing = await pool.query('SELECT * FROM meetups WHERE thread_id = $1', [req.params.threadId]);
    if (existing.rows.length === 0 || existing.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'No pending meetup request to decline' });
    }
    if (existing.rows[0].requested_by_user_id === req.userId) {
      return res.status(400).json({ error: 'You cannot decline your own request' });
    }

    const result = await pool.query(
      `UPDATE meetups SET status = 'declined' WHERE thread_id = $1 RETURNING *`,
      [req.params.threadId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong declining the meetup' });
  }
});

// POST /api/threads/:threadId/meetup/confirm-done — authed, participant-only.
// Marks "it happened" for whichever side (seller/buyer) the caller is. Idempotent.
router.post('/confirm-done', requireAuth, async (req, res) => {
  try {
    const thread = await getThread(req.params.threadId);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    if (thread.seller_id !== req.userId && thread.buyer_id !== req.userId) {
      return res.status(403).json({ error: 'Not a participant in this thread' });
    }

    const existing = await pool.query('SELECT * FROM meetups WHERE thread_id = $1', [req.params.threadId]);
    if (existing.rows.length === 0 || existing.rows[0].status !== 'confirmed') {
      return res.status(400).json({ error: 'No confirmed meetup to mark as done' });
    }

    const column = thread.seller_id === req.userId ? 'done_by_seller' : 'done_by_buyer';
    const result = await pool.query(
      `UPDATE meetups SET ${column} = TRUE WHERE thread_id = $1 RETURNING *`,
      [req.params.threadId]
    );

    const row = result.rows[0];
    if (row.done_by_seller && row.done_by_buyer) {
      // Both sides confirmed — mark the underlying listing sold.
      await pool.query(
        `UPDATE listings SET status = 'sold', sold_on = now()
         WHERE id = (SELECT listing_id FROM chat_threads WHERE id = $1)`,
        [req.params.threadId]
      );
    }

    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong confirming the meetup' });
  }
});

module.exports = router;