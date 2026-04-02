// =============================================================
// database.js - Khởi tạo SQLite database và tạo bảng
// =============================================================
const Database = require('better-sqlite3');
const path = require('path');

// Đường dẫn tới file database
const DB_PATH = path.join(__dirname, 'lucky_wheel.db');

// Khởi tạo kết nối database
const db = new Database(DB_PATH);

// Bật WAL mode để tăng hiệu suất
db.pragma('journal_mode = WAL');

// -------------------------------------------------------
// Tạo bảng users
// -------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    username  TEXT    NOT NULL UNIQUE,
    password  TEXT    NOT NULL,           -- bcrypt hash
    spin_count INTEGER NOT NULL DEFAULT 1,
    role      TEXT    NOT NULL DEFAULT 'user', -- 'admin' hoặc 'user'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// -------------------------------------------------------
// Tạo bảng spin_logs (lịch sử quay)
// -------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS spin_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    username   TEXT    NOT NULL,
    reward     TEXT    NOT NULL,
    spun_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

console.log('[DB] Database initialized successfully at:', DB_PATH);

module.exports = db;
