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
    if (err) {
      console.error('❌ Failed to fetch channels:', err.message);
      res.status(500).json({ error: 'DB error' });
    } else {
      res.json(results);
    }
  });
});

// Create a channel
app.post('/channels', (req, res) => {
  const { name, description } = req.body;
  const sql = 'INSERT INTO channels (name, description) VALUES (?, ?)';
  db.query(sql, [name, description], (err, result) => {
    if (err) {
      console.error('❌ Failed to insert channel:', err.message);
      res.status(500).json({ error: 'DB error' });
    } else {
      const newChannel = { id: result.insertId, name, description };
      res.status(201).json(newChannel);
    }
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
    if (err) {
      console.error('❌ Failed to fetch messages:', err.message);
      res.status(500).json({ error: 'DB error' });
    } else {
      res.json(results);
    }
  });
});

// Post a new message
app.post('/channels/:channelId/messages', (req, res) => {
  const channelId = req.params.channelId;
  const { content, image_url, parent_id, user_id } = req.body;
  const sql = `
    INSERT INTO messages (channel_id, content, image_url, parent_id, user_id)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [channelId, content, image_url, parent_id || null, user_id], (err, result) => {
    if (err) {
      console.error('❌ Failed to insert message:', err.message);
      res.status(500).json({ error: 'DB error' });
    } else {
      const newMessage = {
        id: result.insertId,
        channel_id: parseInt(channelId),
        content,
        image_url,
        parent_id: parent_id || null,
        user_id,
        created_at: new Date().toISOString()
      };
      res.status(201).json(newMessage);
    }
  });
});

// Register
app.post('/register', (req, res) => {
  const { username, password, display_name, is_admin } = req.body;
  const sql = `
    INSERT INTO users (username, password, display_name, is_admin)
    VALUES (?, ?, ?, ?)
  `;
  const values = [username, password, display_name, is_admin || 0];
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('❌ Registration failed:', err.message);
      return res.status(500).json({ error: 'Username already exists or DB error' });
    }
    res.status(201).json({ message: '✅ Registered successfully!', userId: result.insertId });
  });
});

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error('❌ Login failed:', err.message);
      return res.status(500).json({ error: 'DB error' });
    }
    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = results[0];
    res.json({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      is_admin: !!user.is_admin
    });
  });
});

// ✅ Secure admin check
function verifyAdmin(req, res, next) {
  const { admin_user_id } = req.body;

  if (!admin_user_id) {
    return res.status(400).json({ error: 'Missing admin_user_id' });
  }

  db.query('SELECT is_admin FROM users WHERE id = ?', [admin_user_id], (err, results) => {
    if (err) {
      console.error('❌ Admin check failed:', err.message);
      return res.status(500).json({ error: 'DB error' });
    }
    if (results.length === 0 || !results[0].is_admin) {
      return res.status(403).json({ error: 'Admin access denied' });
    }
    next();
  });
}

// ✅ Admin: Delete user
app.post('/admin/delete-user', verifyAdmin, (req, res) => {
  const { user_id } = req.body;
  db.query('DELETE FROM users WHERE id = ?', [user_id], (err) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ message: '✅ User deleted' });
  });
});

// ✅ Admin: Delete channel
app.post('/admin/delete-channel', verifyAdmin, (req, res) => {
  const { channel_id } = req.body;
  db.query('DELETE FROM channels WHERE id = ?', [channel_id], (err) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ message: '✅ Channel deleted' });
  });
});

// ✅ Admin: Delete message
app.post('/admin/delete-message', verifyAdmin, (req, res) => {
  const { message_id } = req.body;
  db.query('DELETE FROM messages WHERE id = ?', [message_id], (err) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ message: '✅ Message deleted' });
  });
});


// ✅ Admin: List all users
app.get('/admin/users', (req, res) => {
  db.query('SELECT id, username, display_name, is_admin FROM users ORDER BY id ASC', (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results);
  });
});

// ✅ Admin: List all channels
app.get('/admin/channels', (req, res) => {
  db.query('SELECT * FROM channels ORDER BY id ASC', (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results);
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
