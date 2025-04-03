const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/channels', (req, res) => {
  db.query('SELECT * FROM channels', (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results);
  });
});

router.post('/channels', (req, res) => {
  const { name, description } = req.body;
  db.query(
    'INSERT INTO channels (name, description) VALUES (?, ?)',
    [name, description],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.status(201).json({ id: result.insertId, name, description });
    }
  );
});

module.exports = router;
