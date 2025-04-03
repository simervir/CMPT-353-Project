const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/channels/:channelId/messages', (req, res) => {
  const channelId = req.params.channelId;
  const { search, user } = req.query;

  let sql = `
    SELECT m.*, u.display_name, u.username
    FROM messages m
    LEFT JOIN users u ON m.user_id = u.id
    WHERE m.channel_id = ?
  `;
  const params = [channelId];

  if (search) {
    sql += ' AND (m.content LIKE ? OR u.display_name LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like);
  }

  if (user) {
    sql += ' AND LOWER(u.username) = LOWER(?)';
    params.push(user);
  }

  sql += ' ORDER BY m.created_at ASC';

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results);
  });
});

router.post('/channels/:channelId/messages', (req, res) => {
  const channelId = req.params.channelId;
  const { content, image_url, parent_id, user_id } = req.body;

  db.query(
    'INSERT INTO messages (channel_id, content, image_url, parent_id, user_id) VALUES (?, ?, ?, ?, ?)',
    [channelId, content, image_url, parent_id || null, user_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.status(201).json({
        id: result.insertId,
        content,
        image_url,
        parent_id,
        user_id,
        channel_id: parseInt(channelId),
        created_at: new Date().toISOString()
      });
    }
  );
});

// Voting
function handleVote(voteType) {
  return (req, res) => {
    const messageId = req.params.id;
    const { user_id } = req.body;

    if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

    db.query('SELECT * FROM message_votes WHERE user_id = ? AND message_id = ?', [user_id, messageId], (err, results) => {
      if (err) return res.status(500).json({ error: 'DB error (check)' });
      if (results.length > 0) return res.status(400).json({ error: 'Already voted' });

      const updateSql = `UPDATE messages SET ${voteType} = ${voteType} + 1 WHERE id = ?`;
      db.query(updateSql, [messageId], (err) => {
        if (err) return res.status(500).json({ error: 'DB error (update)' });

        db.query('INSERT INTO message_votes (user_id, message_id, vote_type) VALUES (?, ?, ?)', [user_id, messageId, voteType], (err) => {
          if (err) return res.status(500).json({ error: 'DB error (insert)' });
          res.json({ message: `✅ ${voteType} successful` });
        });
      });
    });
  };
}

router.post('/messages/:id/upvote', handleVote('upvotes'));
router.post('/messages/:id/downvote', handleVote('downvotes'));

module.exports = router;
