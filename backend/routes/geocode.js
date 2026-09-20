const express = require('express');
const router = express.Router();

// GET /api/geocode/search?q=<free text>
// Proxies to Nominatim (OpenStreetMap's free geocoder), restricted to India.
// Public — no auth needed, this is just a lookup.
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 3) {
    return res.json([]); // avoid firing tiny/noisy queries at Nominatim
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
      q,
      countrycodes: 'in',
      format: 'json',
      addressdetails: '1',
      limit: '5',
    });

    const response = await fetch(url, {
      headers: {
        // Nominatim's usage policy requires a descriptive User-Agent identifying the app.
        'User-Agent': 'ReLoop-MCA-Project/1.0 (student project)',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim responded with ${response.status}`);
    }

    const results = await response.json();

    const mapped = results.map(r => ({
      name: r.address?.suburb || r.address?.neighbourhood || r.address?.road || r.address?.city || r.display_name.split(',')[0],
      addr: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));

    res.json(mapped);
  } catch (err) {
    console.error('Geocode search failed:', err);
    res.status(500).json({ error: 'Location search failed' });
  }
});

module.exports = router;