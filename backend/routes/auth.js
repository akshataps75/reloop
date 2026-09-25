const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// SIGNUP
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const initials = name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, initials)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, initials, verified`,
      [name, email, passwordHash, initials]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong during signup' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    delete user.password_hash;

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong during login' });
  }
});

router.patch('/me', requireAuth, async (req, res) => {
  const { phone, address, lat, lng } = req.body;
  const hasCoords = lat !== undefined && lat !== null && lng !== undefined && lng !== null;
  try {
    const result = await pool.query(
      `UPDATE users 
       SET phone_number = COALESCE($1, phone_number), 
           address = COALESCE($2, address),
           location = CASE WHEN $4::boolean
                        THEN ST_SetSRID(ST_MakePoint($5::float8, $6::float8), 4326)::geography
                        ELSE location END
       WHERE id = $3 
       RETURNING id, name, email, initials, verified, phone_number, address`,
      [phone || null, address || null, req.userId, hasCoords, hasCoords ? Number(lng) : null, hasCoords ? Number(lat) : null]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong updating your profile' });
  }
});

module.exports = router;