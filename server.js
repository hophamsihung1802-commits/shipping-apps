// =============================================================
// server.js - Express Backend Server
// Lucky Wheel - Shipping App
// =============================================================
require('dotenv').config();

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const cors    = require('cors');
const path    = require('path');

const db = require('./database');
const { spinWheel, PRIZES, getPrizeWheelIndex } = require('./spinLogic');
const { authenticate, requireAdmin } = require('./auth');

const app  = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET   = process.env.JWT_SECRET || 'fallback_secret';
const JWT_EXPIRES  = process.env.JWT_EXPIRES_IN || '24h';
const SALT_ROUNDS  = 10;

// -------------------------------------------------------
// Middleware toàn cục
// -------------------------------------------------------
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 👇 THÊM DÒNG NÀY (rất quan trọng)
app.options('*', cors());

app.use(express.json());

// Serve frontend tĩnh từ thư mục ../frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// -------------------------------------------------------
// ROUTE: POST /api/login
// Đăng nhập, trả về JWT token
// -------------------------------------------------------
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập username và password.',
    });
  }

  // Tìm user trong database
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Tài khoản không tồn tại.',
    });
  }

  // So sánh password với hash
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Mật khẩu không chính xác.',
    });
  }

  // Tạo JWT token
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  res.json({
    success: true,
    message: 'Đăng nhập thành công!',
    token,
    user: {
      id:         user.id,
      username:   user.username,
      role:       user.role,
      spin_count: user.spin_count,
    },
  });
});

// -------------------------------------------------------
// ROUTE: GET /api/me
// Lấy thông tin user hiện tại (cần xác thực)
// -------------------------------------------------------
app.get('/api/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, username, role, spin_count, created_at FROM users WHERE id = ?')
                 .get(req.user.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User không tồn tại.' });
  }

  res.json({ success: true, user });
});

// -------------------------------------------------------
// ROUTE: POST /api/spin
// Thực hiện quay - kiểm tra lượt quay, random giải thưởng
// -------------------------------------------------------
app.post('/api/spin', authenticate, (req, res) => {
  const userId = req.user.id;

  // Lấy thông tin user mới nhất từ DB (tránh race condition)
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User không tồn tại.' });
  }

  // Kiểm tra còn lượt quay không
  if (user.spin_count <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Bạn đã hết lượt quay.',
      spin_count: 0,
    });
  }

  // === RANDOM PHẦN THƯỞNG ===
  const { prize, randomNumber } = spinWheel();

  // Transaction: giảm spin_count và ghi log cùng lúc
  const transaction = db.transaction(() => {
    // Giảm spin_count đi 1
    db.prepare('UPDATE users SET spin_count = spin_count - 1 WHERE id = ?').run(userId);

    // Ghi lịch sử quay
    db.prepare(`
      INSERT INTO spin_logs (user_id, username, reward)
      VALUES (?, ?, ?)
    `).run(userId, user.username, prize.name);
  });

  transaction();

  // Lấy spin_count mới
  const updatedUser = db.prepare('SELECT spin_count FROM users WHERE id = ?').get(userId);

  console.log(`[SPIN] User "${user.username}" quay → ${prize.name} (rand: ${randomNumber})`);

  res.json({
    success: true,
    message: `Chúc mừng! Bạn trúng: ${prize.name}`,
    prize: {
      id:         prize.id,
      name:       prize.name,
      emoji:      prize.emoji,
      wheelIndex: getPrizeWheelIndex(prize.id),
    },
    spin_count:   updatedUser.spin_count,
    randomNumber, // debug info
  });
});

// -------------------------------------------------------
// ROUTE: GET /api/prizes
// Trả về danh sách phần thưởng (cho frontend vẽ bánh xe)
// -------------------------------------------------------
app.get('/api/prizes', (req, res) => {
  const publicPrizes = PRIZES.map(p => ({
    id:         p.id,
    name:       p.name,
    label:      p.label,
    emoji:      p.emoji,
    color:      p.color,
    textColor:  p.textColor,
    probability: p.probability,
  }));

  res.json({ success: true, prizes: publicPrizes });
});

// -------------------------------------------------------
// ADMIN ROUTES
// -------------------------------------------------------

// GET /api/admin/users - Danh sách tất cả users
app.get('/api/admin/users', authenticate, requireAdmin, (req, res) => {
  const users = db.prepare(`
    SELECT id, username, role, spin_count, created_at FROM users ORDER BY id
  `).all();
  res.json({ success: true, users });
});

// POST /api/admin/users - Tạo user mới
app.post('/api/admin/users', authenticate, requireAdmin, async (req, res) => {
  const { username, password, spin_count = 1, role = 'user' } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Thiếu username hoặc password.' });
  }

  // Kiểm tra username đã tồn tại chưa
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ success: false, message: 'Username đã tồn tại.' });
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const result = db.prepare(`
    INSERT INTO users (username, password, spin_count, role) VALUES (?, ?, ?, ?)
  `).run(username, hashed, spin_count, role);

  res.status(201).json({
    success: true,
    message: `Tạo user "${username}" thành công.`,
    userId: result.lastInsertRowid,
  });
});

// PUT /api/admin/users/:id - Cập nhật spin_count + role (dùng cho edit form)
app.put('/api/admin/users/:id', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { spin_count, role } = req.body;

  if (typeof spin_count !== 'number' || spin_count < 0) {
    return res.status(400).json({ success: false, message: 'spin_count không hợp lệ.' });
  }

  const validRoles = ['admin', 'user'];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: 'Role không hợp lệ.' });
  }

  const result = db.prepare(
    'UPDATE users SET spin_count = ?, role = ? WHERE id = ?'
  ).run(spin_count, role || 'user', id);

  if (result.changes === 0) {
    return res.status(404).json({ success: false, message: 'User không tìm thấy.' });
  }

  res.json({ success: true, message: 'Đã cập nhật user.' });
});

// PUT /api/admin/users/:id/spin - Cập nhật spin_count nhanh (quick modal)
app.put('/api/admin/users/:id/spin', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { spin_count } = req.body;

  if (typeof spin_count !== 'number' || spin_count < 0) {
    return res.status(400).json({ success: false, message: 'spin_count không hợp lệ.' });
  }

  const result = db.prepare('UPDATE users SET spin_count = ? WHERE id = ?').run(spin_count, id);

  if (result.changes === 0) {
    return res.status(404).json({ success: false, message: 'User không tìm thấy.' });
  }

  res.json({ success: true, message: `Đã cập nhật spin_count = ${spin_count}` });
});

// DELETE /api/admin/users/:id - Xóa user
app.delete('/api/admin/users/:id', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;

  // Không cho phép xóa chính mình
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ success: false, message: 'Không thể xóa tài khoản của chính mình.' });
  }

  // Xóa spin logs của user trước
  db.prepare('DELETE FROM spin_logs WHERE user_id = ?').run(id);

  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);

  if (result.changes === 0) {
    return res.status(404).json({ success: false, message: 'User không tìm thấy.' });
  }

  res.json({ success: true, message: 'Đã xóa user thành công.' });
});

// GET /api/admin/logs - Lịch sử quay
app.get('/api/admin/logs', authenticate, requireAdmin, (req, res) => {
  const logs = db.prepare(`
    SELECT * FROM spin_logs ORDER BY spun_at DESC LIMIT 100
  `).all();
  res.json({ success: true, logs });
});

// -------------------------------------------------------
// Serve frontend index.html cho mọi route khác
// ------------------------------------------------------
// Route fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// -------------------------------------------------------
// Khởi động server
// -------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n🚀 Lucky Wheel Backend đang chạy tại: http://localhost:${PORT}`);
  console.log(`📦 Database: lucky_wheel.db`);
  console.log(`\nAPI Endpoints:`);
  console.log(`  POST /api/login`);
  console.log(`  GET  /api/me`);
  console.log(`  POST /api/spin`);
  console.log(`  GET  /api/prizes`);
  console.log(`  GET  /api/admin/users   (admin only)`);
  console.log(`  POST /api/admin/users   (admin only)`);
  console.log(`  PUT  /api/admin/users/:id/spin (admin only)`);
  console.log(`  GET  /api/admin/logs    (admin only)`);
  console.log(`\nChạy "npm run seed" để tạo dữ liệu mẫu.\n`);
});