const express = require('express');
const cors = require('cors');
const db = require('./db');
const path = require('path')
const app = express();
app.use(cors());
app.use(express.json());

// Test DB
db.query('SELECT 1', (err) => {
  if (err) console.error('❌ DB test failed:', err.message);
  else console.log('✅ DB test succeeded');
});

// Route imports
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/', require('./components/upload'));

app.use('/', require('./components/auth'));
app.use('/', require('./components/channels'));
app.use('/', require('./components/messages'));
app.use('/', require('./components/search'));
app.use('/', require('./components/stats'));
app.use('/', require('./components/admin')); // if using
app.use('/', require('./components/classification'));
app.use('/', require('./components/replyWithImage'));

app.get('/', (req, res) => res.send('Backend is running!'));



// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
