// components/upload.js
const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

router.post('/upload', upload.single('screenshot'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const imageUrl = `http://localhost:3001/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

module.exports = router;
