import { Router } from 'express';
import { query } from '../db.js'; // หรือที่เก็บฟังก์ชันติดต่อ DB ของคุณ

const router = Router();

router.get('/', async (req, res) => {
  try {
    // SELECT DISTINCT เพื่อดึงหมวดหมู่ที่ไม่ซ้ำกันออกมา
    const result = await query('SELECT DISTINCT category FROM words WHERE category IS NOT NULL ORDER BY category ASC');
    const categories = result.rows.map(row => row.category);
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;