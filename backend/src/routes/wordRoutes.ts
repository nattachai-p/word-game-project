import express, { Request, Response } from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ─────────────────────────────────────────────
// GET /api/words/random
// สุ่มคำศัพท์ 10 คำ — รองรับ Focus Mode
//
// Logic:
//   ถ้า User Login และมี Focus ≥ 1 คำ → สุ่มเฉพาะ Focus
//   ถ้า User ไม่มี Focus เลย (หรือไม่ได้ Login) → สุ่มทั้งหมด
//
// Query Params:
//   ?category=Verb  (optional, กรองตาม category)
// ─────────────────────────────────────────────
router.get('/random', async (req: any, res: Response) => {
  const category = req.query.category as string | undefined;

  // ดึง token ถ้ามี (ไม่บังคับ login)
  let userId: number | null = null;
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    try {
      const token = authHeader.split(' ')[1];
      const jwt = await import('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
      const decoded: any = jwt.default.verify(token, JWT_SECRET);
      userId = decoded.userId;
    } catch (_) {
      // token ไม่ valid → ถือว่าไม่ได้ login
    }
  }

  try {
    let isFocusMode = false;

    if (userId) {
      // นับว่า User มี Focus กี่คำ
      const countResult = await query(
        'SELECT COUNT(*) FROM user_word_focus WHERE user_id = $1',
        [userId]
      );
      const focusCount = parseInt(countResult.rows[0].count);

      if (focusCount > 0) {
        // ─── Focus Mode: สุ่มเฉพาะคำที่ Focus ───
        isFocusMode = true;
        let sql = `
          SELECT w.*
          FROM words w
          JOIN user_word_focus f ON f.word_id = w.id
          WHERE f.user_id = $1
        `;
        const params: any[] = [userId];

        if (category) {
          params.push(category);
          sql += ` AND w.category = $${params.length}`;
        }

        sql += ' ORDER BY RANDOM() LIMIT 10';
        const result = await query(sql, params);
        return res.json({ words: result.rows, isFocusMode });
      }
    }

    // ─── Normal Mode: สุ่มทั้งหมด ───
    let sql = 'SELECT * FROM words';
    const params: any[] = [];

    if (category) {
      params.push(category);
      sql += ' WHERE category = $1';
    }

    sql += ' ORDER BY RANDOM() LIMIT 10';
    const result = await query(sql, params);
    return res.json({ words: result.rows, isFocusMode });

  } catch (err) {
    console.error('GET /words/random error:', err);
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

// ─────────────────────────────────────────────
// GET /api/words/all
// ดึงคำศัพท์ทั้งหมด (สำหรับหน้า Vocabulary)
// พร้อม Pagination และ Search
//
// Query Params:
//   ?page=1          (default: 1)
//   ?limit=20        (default: 20, ส่ง 'all' เพื่อดึงทั้งหมด)
//   ?search=apple    (optional, ILIKE search)
//   ?category=Verb   (optional)
// ─────────────────────────────────────────────
router.get('/all', async (req: Request, res: Response) => {
  const search = req.query.search as string | undefined;
  const category = req.query.category as string | undefined;
  const limitParam = req.query.limit as string | undefined;
  const page = parseInt(req.query.page as string) || 1;

  const isAll = limitParam === 'all';
  const limit = isAll ? null : (parseInt(limitParam || '20') || 20);
  const offset = isAll ? 0 : (page - 1) * (limit || 20);

  try {
    const params: any[] = [];
    const conditions: string[] = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(w.eng ILIKE $${params.length} OR w.th_meaning ILIKE $${params.length})`);
    }

    if (category) {
      params.push(category);
      conditions.push(`w.category = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // นับจำนวนทั้งหมด (สำหรับ Pagination)
    const countResult = await query(
      `SELECT COUNT(*) FROM words w ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // ดึงข้อมูล
    let dataQuery = `SELECT w.* FROM words w ${whereClause} ORDER BY w.eng ASC`;
    const dataParams = [...params];

    if (!isAll) {
      dataParams.push(limit as number);
      dataQuery += ` LIMIT $${dataParams.length}`;
      dataParams.push(offset);
      dataQuery += ` OFFSET $${dataParams.length}`;
    }

    const result = await query(dataQuery, dataParams);

    res.json({
      words: result.rows,
      total,
      page: isAll ? 1 : page,
      limit: isAll ? total : limit,
      totalPages: isAll ? 1 : Math.ceil(total / (limit || 20)),
      isAll,
    });
  } catch (err) {
    console.error('GET /words/all error:', err);
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

// ─────────────────────────────────────────────
// POST /api/words
// เพิ่มคำศัพท์ใหม่ (ต้องมี Token)
// ─────────────────────────────────────────────
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