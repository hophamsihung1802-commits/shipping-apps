// =============================================================
// spinLogic.js - Cập nhật xác suất mới
// =============================================================
//
// Xác suất mới:
//   Móc khóa     : 91%  → range 1–91
//   Nón bảo hiểm : 3%   → range 92–94
//   Áo mưa       : 3%   → range 95–97
//   Túi vải      : 3%   → range 98–100
//   iPhone 17PM  : 0%   → không xuất hiện
//   500.000đ     : 0%   → không xuất hiện
//
// Tổng = 100%
// =============================================================

const PRIZES = [
  {
    id: 1,
    name: '500.000đ',
    label: 'Tiền mặt\n500.000đ',
    color: '#1a7a40',
    min: null,    // 0% — không trúng
    max: null,
    probability: 0,
  },
  {
    id: 2,
    name: 'Móc khóa',
    label: 'Móc\nkhóa',
    color: '#c95100',
    min: 1,
    max: 91,      // 91%
    probability: 91,
  },
  {
    id: 3,
    name: 'Nón bảo hiểm',
    label: 'Nón\nbảo hiểm',
    color: '#a62b20',
    min: 92,
    max: 94,      // 3%
    probability: 3,
  },
  {
    id: 4,
    name: 'Áo mưa',
    label: 'Áo\nmưa',
    color: '#6d2f8c',
    min: 95,
    max: 97,      // 3%
    probability: 3,
  },
  {
    id: 5,
    name: 'Túi vải',
    label: 'Túi\nvải',
    color: '#1a6ca8',
    min: 98,
    max: 100,     // 3%
    probability: 3,
  },
  {
    id: 6,
    name: 'iPhone 17PM',
    label: 'iPhone\n17PM',
    color: '#1a2744',
    min: null,    // 0% — không trúng
    max: null,
    probability: 0,
  },
];

/**
 * Thứ tự trên wheel (clockwise từ 12 giờ):
 * Index 0 = ô ở đỉnh khi rotation = 0
 * Phải khớp CHÍNH XÁC với WHEEL_PRIZES trong frontend/index.html
 *
 * Frontend order: [iPhone(6), Túi vải(5), Nón bảo hiểm(3), Móc khóa(2), Áo mưa(4), 500K(1)]
 */
const WHEEL_ORDER = [6, 5, 3, 2, 4, 1];
const TOTAL_SEGMENTS = WHEEL_ORDER.length; // 6
const SEGMENT_ANGLE  = 360 / TOTAL_SEGMENTS; // 60°

/**
 * Random phần thưởng theo tỷ lệ %
 * Random số 1–100, map vào range của từng prize
 */
function spinWheel() {
  const rand = Math.floor(Math.random() * 100) + 1;

  // Tìm prize có range bao gồm rand
  const prize = PRIZES.find(
    p => p.min !== null && rand >= p.min && rand <= p.max
  );

  // Fallback an toàn: nếu không khớp (không nên xảy ra) → Móc khóa
  return {
    prize: prize || PRIZES.find(p => p.id === 2),
    randomNumber: rand,
  };
}

/**
 * Lấy index trên wheel (0-based, clockwise từ 12 giờ)
 */
function getPrizeWheelIndex(prizeId) {
  return WHEEL_ORDER.indexOf(prizeId);
}

module.exports = { PRIZES, spinWheel, getPrizeWheelIndex, WHEEL_ORDER };