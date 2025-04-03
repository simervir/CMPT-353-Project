// server.js
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

db.query('SELECT 1', (err, results) => {
  if (err) {
    console.error('❌ DB test query failed:', err.message);
  } else {
    console.log('✅ DB test query succeeded!');
  }
});

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

app.get('/channels/:channelId/messages', (req, res) => {
  const channelId = req.params.channelId;

  const sql = 'SELECT * FROM messages WHERE channel_id = ? ORDER BY created_at ASC';
  db.query(sql, [channelId], (err, results) => {
    if (err) {
      console.error('❌ Failed to fetch messages:', err.message);
      res.status(500).json({ error: 'DB error' });
    } else {
      res.json(results);
    }
  });
});

// ✅ NEW: Post a new message into a channel
app.post('/channels/:channelId/messages', (req, res) => {
  const channelId = req.params.channelId;
  const { content, image_url } = req.body;

  const sql = 'INSERT INTO messages (channel_id, content, image_url) VALUES (?, ?, ?)';
  db.query(sql, [channelId, content, image_url], (err, result) => {
    if (err) {
      console.error('❌ Failed to insert message:', err.message);
      res.status(500).json({ error: 'DB error' });
    } else {
      const newMessage = {
        id: result.insertId,
        channel_id: parseInt(channelId),
        content,
        image_url,
        created_at: new Date().toISOString()
      };
      res.status(201).json(newMessage);
    }
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
