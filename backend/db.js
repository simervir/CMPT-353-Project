const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'sql3.freesqldatabase.com',
  user: 'sql3771034',
  password: 'QpfxeR5MqR',
  database: 'sql3771034',
  port: 3306
});

// Create channels table
const createChannelsTable = `
  CREATE TABLE IF NOT EXISTS channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
  )
`;
connection.query(createChannelsTable, (err) => {
  if (err) console.error('❌ channels:', err.message);
  else console.log('✅ Channels table created (or already exists)');
});

// Create messages table
const createMessagesTable = `
  CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    channel_id INT NOT NULL,
    content TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    parent_id INT DEFAULT NULL,
    user_id INT DEFAULT NULL,
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
  )
`;
connection.query(createMessagesTable, (err) => {
  if (err) console.error('❌ messages:', err.message);
  else console.log('✅ Messages table created (or already exists)');
});

// Create users table
const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    is_admin BOOLEAN DEFAULT 0
  )
`;
connection.query(createUsersTable, (err) => {
  if (err) console.error('❌ users:', err.message);
  else console.log('✅ Users table created (or already exists)');
});

// ✅ TEMP: Add user_id column to messages (safety)
const addUserIdColumn = `
  ALTER TABLE messages ADD COLUMN user_id INT DEFAULT NULL
`;
connection.query(addUserIdColumn, (err) => {
  if (err) {
    if (err.message.includes("Duplicate column name")) {
      console.log("ℹ️ user_id column already exists");
    } else {
      console.error("❌ Failed to add user_id column:", err.message);
    }
  } else {
    console.log("✅ user_id column added to messages table");
  }
});

// ✅ Insert hardcoded system admin (only if not exists)
const insertAdmin = `
  INSERT IGNORE INTO users (username, password, display_name, is_admin)
  VALUES ('admin', 'admin123', 'System Admin', 1)
`;
connection.query(insertAdmin, (err, result) => {
  if (err) {
    console.error('❌ Failed to insert admin:', err.message);
  } else {
    console.log('✅ Admin account ensured');
  }
});

module.exports = connection;

