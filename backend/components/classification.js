const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /users/reclassify
// Automatically update skill_level for all users
router.get('/users/reclassify', (req, res) => {
  const sql = `
    SELECT u.id, u.display_name,
           COUNT(m.id) AS post_count,
           COALESCE(AVG(m.upvotes), 0) AS avg_upvotes
    FROM users u
    LEFT JOIN messages m ON u.id = m.user_id
    GROUP BY u.id
  `;

  db.query(sql, (err, users) => {
    if (err) return res.status(500).json({ error: 'Failed to get stats' });

    const updates = users.map(user => {
      let newLevel = 'Beginner';
      if (user.post_count >= 20 && user.avg_upvotes >= 2) {
        newLevel = 'Expert';
      } else if (user.post_count >= 5) {
        newLevel = 'Intermediate';
      }

      return new Promise((resolve, reject) => {
        const updateSql = `UPDATE users SET skill_level = ? WHERE id = ?`;
        db.query(updateSql, [newLevel, user.id], (err) => {
          if (err) return reject(err);
          resolve({ id: user.id, display_name: user.display_name, newLevel });
        });
      });
    });

    Promise.all(updates)
      .then(results => res.json({
        message: '✅ Classification updated',
        updated: results
      }))
      .catch(err => res.status(500).json({
        error: 'Failed to update levels',
        details: err
      }));
  });
});

module.exports = router;
