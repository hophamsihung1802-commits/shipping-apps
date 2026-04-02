# 🎡 Vòng Quay May Mắn – Shipping App

Web app Lucky Wheel dành cho hệ thống Shipping, bao gồm Frontend (HTML/CSS/JS), Backend (Node.js + Express), Database (SQLite).

---

## 📁 Cấu trúc dự án

```
lucky-wheel/
├── backend/
│   ├── server.js          # Express server chính
│   ├── database.js        # Khởi tạo SQLite + tạo bảng
│   ├── spinLogic.js       # Logic random phần thưởng
│   ├── seed.js            # Tạo dữ liệu mẫu
│   ├── middleware/
│   │   └── auth.js        # JWT middleware
│   ├── .env               # Biến môi trường
│   └── package.json
├── frontend/
│   └── index.html         # Toàn bộ frontend (HTML + CSS + JS)
└── README.md
```

---

## 🚀 Hướng dẫn cài đặt & chạy

### 1. Cài đặt dependencies

```bash
cd backend
npm install


### 2. Tạo dữ liệu mẫu (users + admin)

```bash
npm run seed
```

Output:
```
[SEED] ✅ Tạo user: admin        (role: admin, spin_count: 0)
[SEED] ✅ Tạo user: driver01     (role: user,  spin_count: 3)
[SEED] ✅ Tạo user: driver02     (role: user,  spin_count: 1)
[SEED] ✅ Tạo user: driver03     (role: user,  spin_count: 0)
[SEED] ✅ Tạo user: nguyen_van_a (role: user,  spin_count: 2)
```

### 3. Khởi động server

```bash
npm start
```

Hoặc chạy development mode (tự restart khi sửa code):
```bash
npm run dev
```

### 4. Mở trình duyệt

```
http://localhost:3001
```

---

## 👤 Tài khoản mẫu

| Username     | Password    | Lượt quay | Role  |
|--------------|-------------|-----------|-------|
| admin        | admin123    | 0         | admin |
| driver01     | driver123   | 3         | user  |
| driver02     | driver123   | 1         | user  |
| driver03     | driver123   | 0         | user  |
| nguyen_van_a | pass1234    | 2         | user  |

---

## 🎁 Bảng phần thưởng & tỷ lệ

| Phần thưởng  | Tỷ lệ | Range    |
|--------------|-------|----------|
| iPhone 17PM  | 0%    | —        |
| 500.000đ     | 1%    | 1        |
| Móc khóa     | 50%   | 2 – 51   |
| Nón bảo hiểm | 30%   | 52 – 81  |
| Áo mưa       | 10%   | 82 – 91  |
| Túi vải      | 9%    | 92 – 100 |

---

## 🔌 API Endpoints

### Public
| Method | Path        | Mô tả              |
|--------|-------------|--------------------|
| POST   | /api/login  | Đăng nhập          |
| GET    | /api/prizes | Danh sách giải thưởng |

### Protected (cần JWT token)
| Method | Path       | Mô tả              |
|--------|------------|--------------------|
| GET    | /api/me    | Thông tin user     |
| POST   | /api/spin  | Thực hiện quay     |

### Admin only
| Method | Path                         | Mô tả               |
|--------|------------------------------|---------------------|
| GET    | /api/admin/users             | Danh sách users     |
| POST   | /api/admin/users             | Tạo user mới        |
| PUT    | /api/admin/users/:id/spin    | Cập nhật spin_count |
| GET    | /api/admin/logs              | Lịch sử quay        |

---

## 🔐 Ví dụ gọi API

### Login
```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"driver01","password":"driver123"}'
```

### Spin (cần token)
```bash
curl -X POST http://localhost:3001/api/spin \
  -H "Authorization: Bearer <TOKEN>"
```

### Tạo user (admin)
```bash
curl -X POST http://localhost:3001/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"username":"newdriver","password":"pass123","spin_count":5}'
```

### Cập nhật spin_count (admin)
```bash
curl -X PUT http://localhost:3001/api/admin/users/2/spin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"spin_count":10}'
```

---

## 🗄️ Database Schema

```sql
-- Bảng users
CREATE TABLE users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  username   TEXT    NOT NULL UNIQUE,
  password   TEXT    NOT NULL,       -- bcrypt hash
  spin_count INTEGER NOT NULL DEFAULT 1,
  role       TEXT    NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng lịch sử quay
CREATE TABLE spin_logs (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id  INTEGER NOT NULL,
  username TEXT    NOT NULL,
  reward   TEXT    NOT NULL,
  spun_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🔧 Yêu cầu hệ thống

- **Node.js** >= 16.x
- **npm** >= 7.x
- Hệ điều hành: Windows / macOS / Linux

---

## ⚙️ Biến môi trường (.env)

```env
PORT=3001
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=24h
```

---

## 📝 Ghi chú

- Database SQLite được tạo tự động tại `backend/lucky_wheel.db`
- Password được hash bằng **bcrypt** (salt rounds = 10)
- JWT token hết hạn sau **24 giờ**
- Mỗi lần quay được ghi log vào bảng `spin_logs`
- Admin có thể xem lịch sử quay qua `GET /api/admin/logs`
