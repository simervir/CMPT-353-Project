const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'sql3.freesqldatabase.com',
  user: process.env.DB_USER || 'sql3771034',
  password: process.env.DB_PASSWORD || 'QpfxeR5MqR',
  database: process.env.DB_NAME || 'sql3771034',
  port: 3306
});

// ✅ Test DB
connection.query('SELECT 1', (err) => {
  if (err) console.error('❌ DB connection:', err.message);
  else console.log('✅ DB connected');
});

// ✅ Channels table
const createChannelsTable = `
  CREATE TABLE IF NOT EXISTS channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
  )
`;
connection.query(createChannelsTable, (err) => {
  if (err) console.error('❌ channels:', err.message);
  else console.log('✅ Channels table ready');
});

// ✅ Messages table
const createMessagesTable = `
  CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    channel_id INT NOT NULL,
    content TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    parent_id INT DEFAULT NULL,
    user_id INT DEFAULT NULL,
    upvotes INT DEFAULT 0,
    downvotes INT DEFAULT 0,
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
  )
`;
connection.query(createMessagesTable, (err) => {
  if (err) console.error('❌ messages:', err.message);
  else console.log('✅ Messages table ready');
});

// ✅ Alter upvotes/downvotes (ignore if already exist)
const alterColumns = [
  `ALTER TABLE messages ADD COLUMN upvotes INT DEFAULT 0`,
  `ALTER TABLE messages ADD COLUMN downvotes INT DEFAULT 0`
];
alterColumns.forEach(sql =>
  connection.query(sql, (err) => {
    if (err && !err.message.includes('Duplicate column')) {
      console.error('❌ Alter messages:', err.message);
    }
  })
);

// ✅ Users table
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
  else console.log('✅ Users table ready');
});

// ✅ Safe patch: Add skill_level only if missing
const checkSkillColumn = `
  SELECT COUNT(*) AS found
  FROM information_schema.COLUMNS
  WHERE TABLE_NAME = 'users'
    AND COLUMN_NAME = 'skill_level'
    AND TABLE_SCHEMA = DATABASE()
`;

connection.query(checkSkillColumn, (err, results) => {
  if (err) {
    console.error('❌ Failed to check skill_level:', err.message);
    return;
  }

  const exists = results[0].found > 0;
  if (!exists) {
    const alter = `
      ALTER TABLE users
      ADD COLUMN skill_level ENUM('Beginner', 'Intermediate', 'Expert') DEFAULT 'Beginner'
    `;
    connection.query(alter, (err) => {
      if (err) console.error('❌ Failed to add skill_level:', err.message);
      else console.log('✅ skill_level column added to users table');
    });
  } else {
    console.log('✅ skill_level column already exists');
  }
});

// ✅ Ensure admin user
const insertAdmin = `
  INSERT IGNORE INTO users (username, password, display_name, is_admin)
  VALUES ('admin', 'admin123', 'System Admin', 1)
`;
connection.query(insertAdmin, (err) => {
  if (err) console.error('❌ Admin insert:', err.message);
  else console.log('✅ Admin ensured');
});

// ✅ Votes table
const createVotesTable = `
  CREATE TABLE IF NOT EXISTS message_votes (
    user_id INT,
    message_id INT,
    vote_type ENUM('up', 'down'),
    PRIMARY KEY (user_id, message_id)
  )
`;
connection.query(createVotesTable, (err) => {
  if (err) console.error('❌ message_votes:', err.message);
  else console.log('✅ Votes table ready');
});

module.exports = connection;
