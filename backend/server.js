const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// DB test
db.query('SELECT 1', (err) => {
  if (err) console.error('❌ DB test query failed:', err.message);
  else console.log('✅ DB test query succeeded!');
});

// Get all channels
app.get('/channels', (req, res) => {
  db.query('SELECT * FROM channels', (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results);
  });
});

// Create channel
app.post('/channels', (req, res) => {
  const { name, description } = req.body;
  db.query('INSERT INTO channels (name, description) VALUES (?, ?)', [name, description], (err, result) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.status(201).json({ id: result.insertId, name, description });
  });
});

// Get messages for a channel
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

// Post message or reply
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

// Admin middleware
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

// Admin: Delete user
app.post('/admin/delete-user', verifyAdmin, (req, res) => {
  const { user_id } = req.body;
  db.query('DELETE FROM users WHERE id = ?', [user_id], (err) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ message: '✅ User deleted' });
  });
});

// Admin: Delete channel
app.post('/admin/delete-channel', verifyAdmin, (req, res) => {
  const { channel_id } = req.body;
  db.query('DELETE FROM channels WHERE id = ?', [channel_id], (err) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ message: '✅ Channel deleted' });
  });
});

// Admin: Delete message
app.post('/admin/delete-message', verifyAdmin, (req, res) => {
  const { message_id } = req.body;
  db.query('DELETE FROM messages WHERE id = ?', [message_id], (err) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ message: '✅ Message deleted' });
  });
});

// Admin: List users
app.get('/admin/users', (req, res) => {
  db.query('SELECT id, username, display_name, is_admin FROM users ORDER BY id ASC', (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results);
  });
});

// Admin: List channels
app.get('/admin/channels', (req, res) => {
  db.query('SELECT * FROM channels ORDER BY id ASC', (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results);
  });
});

// ✅ Upvote a message
app.post('/messages/:id/upvote', (req, res) => {
  const messageId = req.params.id;
  db.query(
    'UPDATE messages SET upvotes = upvotes + 1 WHERE id = ?',
    [messageId],
    (err) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ message: '✅ Upvoted' });
    }
  );
});

// ✅ Downvote a message
app.post('/messages/:id/downvote', (req, res) => {
  const messageId = req.params.id;
  db.query(
    'UPDATE messages SET downvotes = downvotes + 1 WHERE id = ?',
    [messageId],
    (err) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ message: '✅ Downvoted' });
    }
  );
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
