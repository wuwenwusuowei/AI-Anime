const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');

console.log('🔧 创建数据库表...');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    return;
  }
  console.log('✅ SQLite数据库连接成功');
});

// 创建用户表
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ 创建用户表失败:', err.message);
    } else {
      console.log('✅ 用户表创建成功');
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    prompt TEXT NOT NULL,
    videoUrl TEXT,
    thumbnailUrl TEXT,
    status TEXT DEFAULT 'PENDING',
    duration INTEGER,
    resolution TEXT,
    fileSize INTEGER,
    userId TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('❌ 创建视频表失败:', err.message);
    } else {
      console.log('✅ 视频表创建成功');
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS video_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userPrompt TEXT NOT NULL,
    style TEXT,
    translatedPrompt TEXT,
    status TEXT DEFAULT 'PENDING',
    promptId TEXT UNIQUE,
    videoUrl TEXT,
    userId TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('❌ 创建视频任务表失败:', err.message);
    } else {
      console.log('✅ 视频任务表创建成功');
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    prompt TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT NOT NULL,
    isPublic BOOLEAN DEFAULT 1,
    usageCount INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ 创建模板表失败:', err.message);
    } else {
      console.log('✅ 模板表创建成功');
    }
  });

  // 创建一个测试用户
  const testUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    username: 'testuser',
    password: 'password123'
  };

  bcrypt.hash(testUser.password, 10, (err, hash) => {
    if (err) {
      console.error('❌ 密码加密失败:', err.message);
      return;
    }

    db.run(`INSERT OR IGNORE INTO users (id, email, username, password) VALUES (?, ?, ?, ?)`, 
      [testUser.id, testUser.email, testUser.username, hash], 
      function(err) {
        if (err) {
          console.error('❌ 创建测试用户失败:', err.message);
        } else {
          console.log('✅ 测试用户创建成功');
        }
      });
  });
});

// 关闭数据库连接
db.close((err) => {
  if (err) {
    console.error('❌ 关闭数据库失败:', err.message);
  } else {
    console.log('✅ 数据库连接已关闭');
    console.log('✅ 数据库初始化完成！');
  }
});