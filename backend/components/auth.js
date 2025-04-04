const express = require('express');
const router = express.Router();
const db = require('../db');

// Register
router.post('/register', (req, res) => {
  const { username, password, display_name, is_admin } = req.body;
  db.query(
    'INSERT INTO users (username, password, display_name, is_admin) VALUES (?, ?, ?, ?)',
    [username, password, display_name, is_admin || 0],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Username taken or DB error' });
      res.status(201).json({ message: '✅ Registered successfully!', userId: result.insertId });
    }
  );
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.query(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
      const user = results[0];
      res.json({
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        is_admin: !!user.is_admin,
        skill_level: user.skill_level 
      });
    }
  );
});

module.exports = router;
