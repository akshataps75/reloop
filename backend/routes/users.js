const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /api/users/:id — public seller profile: active + sold listings.
router.get('/users/:id', async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT id, name, initials, verified FROM users WHERE id = $1`,
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