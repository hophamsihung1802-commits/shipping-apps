// =============================================================
// spinLogic.js - FIXED VERSION
// =============================================================

/**
 * Danh sách phần thưởng và tỷ lệ trúng
 */
const PRIZES = [
  {
    id: 1,
    name: '500.000đ',
    label: 'Tiền mặt\n500.000đ',
    emoji: '💵',
    color: '#27ae60',
    textColor: '#ffffff',
    min: 1,
    max: 1,
    probability: 1,
  },
  {
    id: 2,
    name: 'Móc khóa',
    label: 'Móc\nkhóa',
    emoji: '🔑',
    color: '#e67e22',
    textColor: '#ffffff',
    min: 2,
    max: 51,
    probability: 50,
  },
  {
    id: 3,
    name: 'Nón bảo hiểm',
    label: 'Nón\nbảo hiểm',
    emoji: '⛑️',
    color: '#c0392b',
    textColor: '#ffffff',
    min: 52,
    max: 81,
    probability: 30,
  },
  {
    id: 4,
    name: 'Áo mưa',
    label: 'Áo\nmưa',
    emoji: '🧥',
    color: '#8e44ad',
    textColor: '#ffffff',
    min: 82,
    max: 91,
    probability: 10,
  },
  {
    id: 5,
    name: 'Túi vải',
    label: 'Túi\nvải',
    emoji: '👜',
    color: '#2980b9',
    textColor: '#ffffff',
    min: 92,
    max: 100,
    probability: 9,
  },
  {
    id: 6,
    name: 'iPhone 17PM',
    label: 'iPhone\n17PM',
    emoji: '📱',
    color: '#1a1a2e',
    textColor: '#ffffff',
    min: null,
    max: null,
    probability: 0,
  },
];

/**
 * Thứ tự trên wheel (QUAN TRỌNG)
 * phải match 100% với UI của bạn
 */
const WHEEL_ORDER = [6, 5, 3, 2, 4, 1];

/**
 * Tổng số ô
 */
const TOTAL_SEGMENTS = WHEEL_ORDER.length;
const SEGMENT_ANGLE = 360 / TOTAL_SEGMENTS;

/**
 * Random phần thưởng theo %
 */
function spinWheel() {
  const rand = Math.floor(Math.random() * 100) + 1;

  const prize = PRIZES.find(
    p => p.min !== null && rand >= p.min && rand <= p.max
  );

  return {
    prize: prize || PRIZES[1],
    randomNumber: rand,
  };
}

/**
 * Lấy index trên wheel
 */
function getPrizeWheelIndex(prizeId) {
  return WHEEL_ORDER.indexOf(prizeId);
}


function calculateRotation(prizeId) {
  const index = getPrizeWheelIndex(prizeId);

  if (index === -1) {
    console.error('Prize không tồn tại trên wheel');
    return 0;
  }

  const extraSpin = 360 * 5; // quay nhiều vòng cho đẹp

  // 🎯 CÔNG THỨC QUAN TRỌNG NHẤT
  const rotation =
    extraSpin +
    (360 - index * SEGMENT_ANGLE - SEGMENT_ANGLE / 2);

  return rotation;
}

module.exports = {
  PRIZES,
  spinWheel,
  getPrizeWheelIndex,
  WHEEL_ORDER,
  calculateRotation, // 👈 thêm cái này
};

