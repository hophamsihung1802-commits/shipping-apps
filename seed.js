// =============================================================
// seed.js - Tạo dữ liệu mẫu (admin + users)
// Chạy: node seed.js
// =============================================================
const bcrypt = require('bcryptjs');
const db = require('./database');

const SALT_ROUNDS = 10;

// Danh sách tài khoản mẫu
const seedUsers = [
  { username: 'admin',    password: 'admin123',    spin_count: 0,  role: 'admin' },
  { username: 'driver01', password: 'driver123',   spin_count: 3,  role: 'user'  },
  { username: 'driver02', password: 'driver123',   spin_count: 1,  role: 'user'  },
  { username: 'driver03', password: 'driver123',   spin_count: 0,  role: 'user'  },
  { username: 'nguyen_van_a', password: 'pass1234', spin_count: 2, role: 'user'  },
];

async function seed() {
  console.log('[SEED] Bắt đầu tạo dữ liệu mẫu...\n');

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO users (username, password, spin_count, role)
    VALUES (?, ?, ?, ?)
  `);

  for (const user of seedUsers) {
    const hashed = await bcrypt.hash(user.password, SALT_ROUNDS);
    const result = insertStmt.run(user.username, hashed, user.spin_count, user.role);
    
    if (result.changes > 0) {
      console.log(`[SEED] ✅ Tạo user: ${user.username} (role: ${user.role}, spin_count: ${user.spin_count})`);
    } else {
      console.log(`[SEED] ⏭️  User đã tồn tại: ${user.username}`);
    }
  }

  console.log('\n[SEED] Hoàn tất! Danh sách tài khoản:');
  console.log('------------------------------------------');
  seedUsers.forEach(u => {
    console.log(`  Username: ${u.username} | Password: ${u.password} | Lượt quay: ${u.spin_count}`);
  });
  console.log('------------------------------------------');
}

seed().catch(console.error);
