// components/replyWithImage.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });

// POST /channels/:channelId/reply-with-image
router.post('/channels/:channelId/reply-with-image', upload.single('screenshot'), (req, res) => {
  const channelId = req.params.channelId;
  const { content, parent_id, user_id } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = `
    INSERT INTO messages (channel_id, content, image_url, parent_id, user_id)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [channelId, content, imageUrl, parent_id || null, user_id], (err, result) => {
    if (err) return res.status(500).json({ error: 'DB error', details: err.message });
    res.status(201).json({ message: '✅ Reply posted with screenshot', id: result.insertId });
  });
});

module.exports = router;
