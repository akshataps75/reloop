const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Step 1: "start" verification — in a real integration this would return
// a redirect URL to DigiLocker's consent screen. Here we just acknowledge it.
router.post('/start', requireAuth, async (req, res) => {
  res.json({
    message: 'Mock DigiLocker consent initiated',
    mockRedirectUrl: `/api/verification/callback?userId=${req.userId}`
  });
});

// Step 2: "callback" — in real DigiLocker this fires after the user approves
// consent on DigiLocker's site. Here, calling it directly IS the approval.
router.post('/callback', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE users SET verified = true WHERE id = $1 RETURNING id, name, email, verified',
      [req.userId]
    );
    res.json({ message: 'Verification successful', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong during verification' });
  }
});

module.exports = router;