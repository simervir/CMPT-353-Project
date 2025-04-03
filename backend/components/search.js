const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/channels/:channelId/messages', (req, res) => {
  const channelId = req.params.channelId;
  const { search, user } = req.query;

  const sql = `
    SELECT m.*, u.display_name, u.username
    FROM messages m
    LEFT JOIN users u ON m.user_id = u.id
    WHERE m.channel_id = ?
    ${search ? `AND (m.content LIKE ? OR u.display_name LIKE ?)` : ''}
    ${user ? `AND LOWER(u.username) = LOWER(?)` : ''}
    ORDER BY m.created_at ASC
  `;

  const params = [channelId];
  if (search) {
    const like = `%${search}%`;
    params.push(like, like);
  }
  if (user) {
    params.push(user);
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('❌ DB error:', err.message);
      return res.status(500).json({ error: 'DB error' });
    }
    res.json(results);
  });
});


module.exports = router;
