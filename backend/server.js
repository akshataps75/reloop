require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const authRoutes = require('./routes/auth');
const verificationRoutes = require('./routes/verification');
const listingsRoutes = require('./routes/listings');
const usersRoutes = require('./routes/users');
const threadsRoutes = require('./routes/threads');
const meetupsRoutes = require('./routes/meetups');
const uploadsRoutes = require('./routes/uploads');
const geocodeRoutes = require('./routes/geocode');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/verification', verificationRoutes);

// Quick sanity check route — confirms server + DB both work
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', dbTime: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.use('/api/listings', listingsRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/threads/:threadId/meetup', meetupsRoutes);
app.use('/api/threads', threadsRoutes);
app.use('/api', usersRoutes); // handles /api/users/:id and /api/me/activity
app.use('/api/geocode', geocodeRoutes);

// Centralized error handler — must be registered after all routes
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});