// db.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'sql3.freesqldatabase.com',   // ✅ from your panel
  user: 'sql3771034',                 // ✅ username
  password: 'QpfxeR5MqR',     // ⬅️ Replace this
  database: 'sql3771034',             // ✅ database name
  port: 3306                          // Usually 3306 (double-check in panel)
});

const createChannelsTable = `
  CREATE TABLE IF NOT EXISTS channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
  )
`;

connection.query(createChannelsTable, (err) => {
  if (err) {
    console.error('❌ Failed to create channels table:', err.message);
  } else {
    console.log('✅ Channels table created (or already exists)');
}
});

const createMessagesTable = `
  CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    channel_id INT NOT NULL,
    content TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
  )
`;

connection.query(createMessagesTable, (err) => {
  if (err) {
    console.error('❌ Failed to create messages table:', err.message);
  } else {
    console.log('✅ Messages table created (or already exists)');
  }
});

// const insertSampleChannel = `
//   INSERT INTO channels (name, description)
//   VALUES (?, ?)
// `;

// connection.query(insertSampleChannel, ['JavaScript Help', 'Ask anything about JS!'], (err, result) => {
//   if (err) {
//     console.error('❌ Failed to insert channel:', err.message);
//   } else {
//     console.log('✅ Sample channel inserted with ID:', result.insertId);
//   }
// });


module.exports = connection;
