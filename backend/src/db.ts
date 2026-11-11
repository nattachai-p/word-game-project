import pkg from 'pg';
const { Pool } = pkg;

// ไม่ต้อง import dotenv หรือ path แล้วครับ 
// เพราะเราจะสั่งให้ Node.js โหลดจากด้านนอกแทน

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// เพิ่มตัวช่วยเช็ค Error ตอน Query
export const query = async (text: string, params?: any[]) => {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error("❌ Database Query Error:", err);
    throw err;
  }
};

// สร้างตารางที่จำเป็นถ้ายังไม่มี (idempotent) — เรียกตอน start server
export const ensureSchema = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS login_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      username TEXT,
      logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
};