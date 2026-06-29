import express, { Response } from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ทุก endpoint ใน focusRoutes ต้องมี Token (Login แล้วเท่านั้น)
router.use(authenticateToken);

// ─────────────────────────────────────────────
// GET /api/focus
// ดึง word_id ทั้งหมดที่ User Focus ไว้ (Active)
// ─────────────────────────────────────────────
router.get('/', async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const result = await query(
      'SELECT word_id FROM user_word_focus WHERE user_id = $1',
      [userId]
    );
    // ส่ง array ของ word_id กลับไป เช่น [1, 5, 12]
    const focusIds = result.rows.map((r: any) => r.word_id);
    res.json({ focusIds });
  } catch (err) {
    console.error('GET /focus error:', err);
    res.status(500).json({ error: 'Failed to fetch focus list' });
  }
});

// ─────────────────────────────────────────────
// POST /api/focus/:wordId
// Tick คำศัพท์ (Focus ON) + บันทึก Log
// ─────────────────────────────────────────────
router.post('/:wordId', async (req: any, res: Response) => {
  const userId = req.user.userId;
  const wordId = parseInt(req.params.wordId);

  if (isNaN(wordId)) return res.status(400).json({ error: 'Invalid word ID' });

  try {
    // INSERT OR IGNORE (ถ้า Tick ซ้ำก็ไม่ Error)
    await query(
      `INSERT INTO user_word_focus (user_id, word_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, word_id) DO NOTHING`,
      [userId, wordId]
    );

    // บันทึก Log ทุกครั้งที่ Tick (แม้ซ้ำ ก็ log ไว้)
    await query(
      `INSERT INTO user_word_focus_log (user_id, word_id, action)
       VALUES ($1, $2, 'focus')`,
      [userId, wordId]
    );

    res.json({ message: 'Focused!', wordId, isFocused: true });
  } catch (err) {
    console.error('POST /focus/:wordId error:', err);
    res.status(500).json({ error: 'Failed to focus word' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/focus/:wordId
// Untick คำศัพท์ (Focus OFF) + บันทึก Log
// ─────────────────────────────────────────────
router.delete('/:wordId', async (req: any, res: Response) => {
  const userId = req.user.userId;
  const wordId = parseInt(req.params.wordId);

  if (isNaN(wordId)) return res.status(400).json({ error: 'Invalid word ID' });

  try {
    await query(
      'DELETE FROM user_word_focus WHERE user_id = $1 AND word_id = $2',
      [userId, wordId]
    );

    // บันทึก Log การ Untick
    await query(
      `INSERT INTO user_word_focus_log (user_id, word_id, action)
       VALUES ($1, $2, 'unfocus')`,
      [userId, wordId]
    );

    res.json({ message: 'Unfocused!', wordId, isFocused: false });
  } catch (err) {
    console.error('DELETE /focus/:wordId error:', err);
    res.status(500).json({ error: 'Failed to unfocus word' });
  }
});

// ─────────────────────────────────────────────
// POST /api/focus/bulk
// Tick ทั้งหมด หรือ Untick ทั้งหมด
// Body: { action: 'focus_all' | 'unfocus_all' }
// ─────────────────────────────────────────────
router.post('/bulk', async (req: any, res: Response) => {
  const userId = req.user.userId;
  const { action } = req.body;

  if (!['focus_all', 'unfocus_all'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action. Use focus_all or unfocus_all' });
  }

  try {
    if (action === 'focus_all') {
      // Insert word_id ทุกคำที่มีในระบบ (ON CONFLICT = ข้ามถ้ามีอยู่แล้ว)
      await query(
        `INSERT INTO user_word_focus (user_id, word_id)
         SELECT $1, id FROM words
         ON CONFLICT (user_id, word_id) DO NOTHING`,
        [userId]
      );

      // Log แบบ bulk
      await query(
        `INSERT INTO user_word_focus_log (user_id, word_id, action)
         SELECT $1, id, 'focus' FROM words`,
        [userId]
      );

      // นับว่า Focus ทั้งหมดกี่คำ
      const countResult = await query(
        'SELECT COUNT(*) FROM user_word_focus WHERE user_id = $1',
        [userId]
      );
      res.json({ message: 'All words focused!', count: parseInt(countResult.rows[0].count) });

    } else {
      // Unfocus ทั้งหมด
      const countResult = await query(
        'SELECT COUNT(*) FROM user_word_focus WHERE user_id = $1',
        [userId]
      );
      const count = parseInt(countResult.rows[0].count);

      // Log ก่อนลบ
      if (count > 0) {
        await query(
          `INSERT INTO user_word_focus_log (user_id, word_id, action)
           SELECT $1, word_id, 'unfocus' FROM user_word_focus WHERE user_id = $1`,
          [userId]
        );
      }

      await query('DELETE FROM user_word_focus WHERE user_id = $1', [userId]);

      res.json({ message: 'All focus cleared!', count: 0 });
    }
  } catch (err) {
    console.error('POST /focus/bulk error:', err);
    res.status(500).json({ error: 'Bulk operation failed' });
  }
});

// ─────────────────────────────────────────────
// GET /api/focus/log
// ดูประวัติการ Tick / Untick ของ User (เรียงล่าสุดก่อน)
// ─────────────────────────────────────────────
router.get('/log', async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const result = await query(
      `SELECT l.id, l.action, l.created_at, w.eng, w.th_meaning
       FROM user_word_focus_log l
       JOIN words w ON w.id = l.word_id
       WHERE l.user_id = $1
       ORDER BY l.created_at DESC
       LIMIT 50`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /focus/log error:', err);
    res.status(500).json({ error: 'Failed to fetch focus log' });
  }
});

export default router;
