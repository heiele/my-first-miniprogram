// backend/config/database.js
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dataDir = path.join(__dirname, '../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'miniapp.db')
const db = new Database(dbPath)

// 启用外键约束
db.pragma('journal_mode = WAL')

function initDatabase() {
  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      openid TEXT UNIQUE,
      nickname TEXT DEFAULT '同学',
      avatar_url TEXT,
      signature TEXT DEFAULT '',
      theme TEXT DEFAULT 'light',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 任务表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'pending',
      deadline DATETIME,
      date TEXT,
      interest INTEGER DEFAULT 50,
      completed INTEGER DEFAULT 0,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  // 子任务表
  db.exec(`
    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `)

  // 专注记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS focus_records (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      duration INTEGER,
      type TEXT DEFAULT 'pomodoro',
      started_at DATETIME,
      ended_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  // 习惯打卡表
  db.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      icon TEXT,
      description TEXT,
      target_days INTEGER DEFAULT 21,
      streak INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  // 习惯打卡记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS habit_checkins (
      id TEXT PRIMARY KEY,
      habit_id TEXT,
      user_id TEXT,
      checkin_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  // 学习目标表
  db.exec(`
    CREATE TABLE IF NOT EXISTS study_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      daily_duration INTEGER DEFAULT 180,
      types TEXT,
      deadline TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  // 打卡记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS goal_checkins (
      id TEXT PRIMARY KEY,
      goal_id TEXT,
      user_id TEXT,
      checkin_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (goal_id) REFERENCES study_goals(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  console.log('✅ 数据库初始化完成')
}

module.exports = { db, initDatabase }
