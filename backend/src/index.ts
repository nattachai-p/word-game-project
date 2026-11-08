// env มาจาก: local = tsx --env-file=.env (ดู script "dev"), Vercel = platform env
// ไม่ใช้ dotenv เพื่อเลี่ยงปัญหา bundler หา subpath 'dotenv/config' ไม่เจอบน Vercel
import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import wordRoutes from './routes/wordRoutes.js';
import categoryRoute from './routes/categoryRoute.js'; // นำเข้า route สำหรับดึงหมวดหมู่
import airoutes from './routes/aiRoutes.js'; // นำเข้า route สำหรับ AI
import focusRoutes from './routes/focusRoutes.js'; // นำเข้า route สำหรับ Focus System


const app = express();

// อยู่หลัง proxy ของ Vercel → เชื่อ X-Forwarded-For เพื่อให้ได้ IP จริง (สำคัญต่อ rate limit)
app.set('trust proxy', 1);

// ─────────────────────────────────────────────
// CORS: จำกัดเฉพาะโดเมน frontend ที่อนุญาต (ตั้งใน env FRONTEND_URL)
// รองรับหลายโดเมนคั่นด้วย comma เช่น "https://app.com,https://staging.app.com"
// ถ้าไม่ตั้ง FRONTEND_URL → อนุญาตทั้งหมด (สะดวกตอน dev)
// ─────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // ไม่มี origin (เช่น curl, same-origin, serverless internal) → อนุญาต
      if (!origin) return callback(null, true);
      // ไม่ได้ตั้ง allowlist → อนุญาตทั้งหมด (dev)
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Middleware
app.use(express.json());

// Routes
app.use('/api', userRoutes);         // จัดการระบบ Auth
app.use('/api/words', wordRoutes);   // จัดการระบบคำศัพท์
app.use('/api/categories', categoryRoute); // เพิ่ม route สำหรับดึงหมวดหมู่
app.use('/api/ai', airoutes); // เพิ่ม route สำหรับ AI
app.use('/api/focus', focusRoutes); // เพิ่ม route สำหรับ Focus System

// Health check (ใช้เช็คว่า API ยังมีชีวิต)
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ─────────────────────────────────────────────
// Start server — listen บนพอร์ตที่ host กำหนด (process.env.PORT)
// Vercel (Services mode, framework=express) จะ inject PORT แล้วรันไฟล์นี้เป็น server
// ตอน dev ไม่มี PORT → ใช้ 8080
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`-------------------------------------------`);
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 Ready for Game API connections...`);
  console.log(`-------------------------------------------`);
});

export default app;
