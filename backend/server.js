// backend/server.js

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

// ✅ Updated: Get messages + user info
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

// ✅ Updated: Post message with user_id
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

// ✅ Register route
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

// ✅ Login route
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

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
