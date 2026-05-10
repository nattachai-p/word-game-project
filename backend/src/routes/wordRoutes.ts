import express, { Request, Response } from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ดึงคำศัพท์แบบสุ่ม (Public)
router.get('/random', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM words ORDER BY RANDOM() LIMIT 10');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

// เพิ่มคำศัพท์ใหม่ (ต้องมี Token)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const { eng, th_read, th_meaning, category, example_sentence, example_translation } = req.body;
  try {
    const result = await query(
      `INSERT INTO words (eng, th_read, th_meaning, category, example_sentence, example_translation) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [eng, th_read, th_meaning, category, example_sentence, example_translation]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add word' });
  }
});

export default router;