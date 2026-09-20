const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Files land in memory briefly, then get pushed to Supabase Storage —
// never written to local disk, so nothing to clean up afterward.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB per file
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = 'listing-images';

// POST /api/uploads  (multipart/form-data, field name: "files")
// Accepts one or more files, uploads each to Supabase Storage,
// returns their public URLs in the same order they were sent.
router.post('/', requireAuth, upload.array('files', 8), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files provided' });
  }

  try {
    const urls = [];

    for (const file of req.files) {
      const ext = file.originalname.split('.').pop();
      const path = `${req.userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file.buffer, { contentType: file.mimetype });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      urls.push(data.publicUrl);
    }

    res.json({ urls });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;