import rateLimit from 'express-rate-limit';

// ─────────────────────────────────────────────
// Rate limiters — กัน brute force / การยิง API รัว ๆ
//
// หมายเหตุ (serverless): ตัวนับเก็บใน memory ของแต่ละ instance
// บน Vercel ที่ scale หลาย instance การจำกัดจะไม่เป๊ะ 100%
// ถ้าต้องการแม่นยำจริง ให้ต่อ store กลาง เช่น Upstash Redis (มี free tier)
// แต่สำหรับ traffic ระดับนี้ in-memory ก็ช่วยลดการ abuse ได้พอควร
// ─────────────────────────────────────────────

// Login / Register: กันเดารหัส — 20 ครั้ง ต่อ 15 นาที ต่อ IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'พยายามมากเกินไป กรุณารอสักครู่แล้วลองใหม่' },
});

// AI endpoints: กันเผา quota — 15 ครั้ง ต่อ 1 นาที ต่อ IP
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'เรียก AI ถี่เกินไป กรุณารอสักครู่' },
});
