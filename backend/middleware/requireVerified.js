const pool = require('../db');

async function requireVerified(req, res, next) {
  try {
    const result = await pool.query('SELECT verified FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!result.rows[0].verified) {
      return res.status(403).json({ error: 'verification_required', message: 'Please verify your identity to continue' });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong checking verification' });
  }
}

module.exports = requireVerified;