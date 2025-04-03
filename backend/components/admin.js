const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware: verify admin
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

// Delete user
router.post('/admin/delete-user', verifyAdmin, (req, res) => {
  const { user_id } = req.body;
  db.query('DELETE FROM users WHERE id = ?', [user_id], (err) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ message: '✅ User deleted' });
  });
});

// Delete channel
router.post('/admin/delete-channel', verifyAdmin, (req, res) => {
  const { channel_id } = req.body;
  db.query('DELETE FROM channels WHERE id = ?', [channel_id], (err) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ message: '✅ Channel deleted' });
  });
});

// Delete message
router.post('/admin/delete-message', verifyAdmin, (req, res) => {
  const { message_id } = req.body;
  db.query('DELETE FROM messages WHERE id = ?', [message_id], (err) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ message: '✅ Message deleted' });
  });
});

// List all users
router.get('/admin/users', (req, res) => {
  db.query('SELECT id, username, display_name, is_admin FROM users ORDER BY id ASC', (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results);
  });
});

// List all channels
router.get('/admin/channels', (req, res) => {
  db.query('SELECT * FROM channels ORDER BY id ASC', (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results);
  });
});

module.exports = router;
