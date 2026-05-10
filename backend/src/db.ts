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