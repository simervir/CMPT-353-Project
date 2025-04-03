const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

db.query('SELECT 1', (err) => {
  if (err) console.error('❌ DB test failed:', err.message);
  else console.log('✅ DB test succeeded');
});

// Channels
app.get('/channels', (req, res) => {
  db.query('SELECT * FROM channels', (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results);
  });
});

app.post('/channels', (req, res) => {
  const { name, description } = req.body;
  db.query('INSERT INTO channels (name, description) VALUES (?, ?)', [name, description], (err, result) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.status(201).json({ id: result.insertId, name, description });
  });
});

// Messages
app.get('/channels/:channelId/messages', (req, res) => {
  const channelId = req.params.channelId;
  const sql = `
    SELECT messages.*, users.display_name
    FROM messages
    LEFT JOIN users ON messages.user_id = users.id
    WHERE channel_id = ?
    ORDER BY created_at ASC
  `;
  db.query(sql, [channelId], (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results);
  });
});

app.post('/channels/:channelId/messages', (req, res) => {
  const channelId = req.params.channelId;
  const { content, image_url, parent_id, user_id } = req.body;
  const sql = `
    INSERT INTO messages (channel_id, content, image_url, parent_id, user_id)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [channelId, content, image_url, parent_id || null, user_id], (err, result) => {
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
  });
});

// Register
app.post('/register', (req, res) => {
  const { username, password, display_name, is_admin } = req.body;
  db.query('INSERT INTO users (username, password, display_name, is_admin) VALUES (?, ?, ?, ?)',
    [username, password, display_name, is_admin || 0], (err, result) => {
      if (err) return res.status(500).json({ error: 'Username taken or DB error' });
      res.status(201).json({ message: '✅ Registered successfully!', userId: result.insertId });
    });
});

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = results[0];
    res.json({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      is_admin: !!user.is_admin
    });
  });
});

// Admin check
function verifyAdmin(req, res, next) {
  const { admin_user_id } = req.body;
  if (!admin_user_id) return res.status(400).json({ error: 'Missing admin_user_id' });

  db.query('SELECT is_admin FROM users WHERE id = ?', [admin_user_id], (err, results) => {
    if (err || results.length === 0 || !results[0].is_admin) {
      return res.status(403).json({ error: 'Admin access denied' });
    }
    next();
  });
}

// Admin routes
app.post('/admin/delete-user', verifyAdmin, (req, res) => {
  const { user_id } = req.body;
  db.query('DELETE FROM users WHERE id = ?', [user_id], (err) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ message: '✅ User deleted' });
  });
});

app.post('/admin/delete-channel', verifyAdmin, (req, res) => {
  const { channel_id } = req.body;
  db.query('DELETE FROM channels WHERE id = ?', [channel_id], (err) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ message: '✅ Channel deleted' });
  });
});

app.post('/admin/delete-message', verifyAdmin, (req, res) => {
  const { message_id } = req.body;
  db.query('DELETE FROM messages WHERE id = ?', [message_id], (err) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ message: '✅ Message deleted' });
  });
});

app.get('/admin/users', (req, res) => {
  db.query('SELECT id, username, display_name, is_admin FROM users ORDER BY id ASC', (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results);
  });
});

app.get('/admin/channels', (req, res) => {
  db.query('SELECT * FROM channels ORDER BY id ASC', (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results);
  });
});

// ✅ Vote logic with user check
function handleVote(req, res, voteType) {
  const messageId = req.params.id;
  const { user_id } = req.body;

  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

  const checkSql = `SELECT * FROM message_votes WHERE user_id = ? AND message_id = ?`;
  db.query(checkSql, [user_id, messageId], (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error (check)' });

    if (results.length > 0) {
      return res.status(400).json({ error: 'User has already voted on this message' });
    }

    const updateSql = `UPDATE messages SET ${voteType === 'up' ? 'upvotes' : 'downvotes'} = ${voteType === 'up' ? 'upvotes' : 'downvotes'} + 1 WHERE id = ?`;
    db.query(updateSql, [messageId], (err) => {
      if (err) return res.status(500).json({ error: 'DB error (update)' });

      const insertSql = `INSERT INTO message_votes (user_id, message_id, vote_type) VALUES (?, ?, ?)`;
      db.query(insertSql, [user_id, messageId, voteType], (err) => {
        if (err) return res.status(500).json({ error: 'DB error (insert)' });
        res.json({ message: `✅ ${voteType === 'up' ? 'Upvoted' : 'Downvoted'}` });
      });
    });
  });
}

// Routes for vote
app.post('/messages/:id/upvote', (req, res) => handleVote(req, res, 'up'));
app.post('/messages/:id/downvote', (req, res) => handleVote(req, res, 'down'));

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
