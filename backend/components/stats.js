const express = require('express');
const router = express.Router();
const db = require('../db');

// Most active user
router.get('/stats/most-active', (req, res) => {
  const sql = `
    SELECT u.display_name, COUNT(m.id) AS post_count
    FROM users u
    LEFT JOIN messages m ON u.id = m.user_id
    GROUP BY u.id
    ORDER BY post_count DESC
    LIMIT 1
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results[0]);
  });
});

// Least active user
router.get('/stats/least-active', (req, res) => {
  const sql = `
    SELECT u.display_name, COUNT(m.id) AS post_count
    FROM users u
    LEFT JOIN messages m ON u.id = m.user_id
    GROUP BY u.id
    ORDER BY post_count ASC
    LIMIT 1
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results[0]);
  });
});
/// Highest ranked user
router.get('/stats/top-ranked', (req, res) => {
  const sql = `
    SELECT u.display_name, SUM(m.upvotes - m.downvotes) AS score
    FROM users u
    LEFT JOIN messages m ON u.id = m.user_id
    GROUP BY u.id
    ORDER BY score DESC
    LIMIT 1
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results[0]);
  });
});

// Lowest ranked user
router.get('/stats/lowest-ranked', (req, res) => {
  const sql = `
    SELECT u.display_name, SUM(m.upvotes - m.downvotes) AS score
    FROM users u
    LEFT JOIN messages m ON u.id = m.user_id
    GROUP BY u.id
    ORDER BY score ASC
    LIMIT 1
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results[0]);
  });
});

module.exports = router;
