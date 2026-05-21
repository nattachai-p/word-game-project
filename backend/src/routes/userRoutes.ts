import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js'; // หรือ .ts ขึ้นอยู่กับ config ของกัปตัน



const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// 1. API สมัครสมาชิก
router.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const userExist = await query('SELECT * FROM users WHERE username = $1', [username]);
    if (userExist.rows.length > 0) return res.status(400).json({ message: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, hashedPassword, 'user']
    );
    res.status(201).json({ message: 'User created', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 2. API สำหรับ Login 
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      message: 'Login successful',
      token,
      role: user.role,
      user: { id: user.id, username: user.username } 
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// 3. API สำหรับดึงข้อมูลผู้ใช้ทั้งหมด
router.get('/users', authenticateToken, isAdmin, async (req: Request, res: Response) => {
 
  try {
    const result = await query(
      'SELECT id, username, role, total_points FROM users ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 4. API สำหรับแก้ไขผู้ใช้ (✅ แก้ Bug เรียบร้อย)
router.put('/update-user/:id', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, role, total_points, new_password } = req.body; 

  try {
    let queryText: string;
    let queryParams: any[];

    if (new_password && new_password.trim() !== "") {
      console.log("Detecting new password, hashing...");
      const hashedPassword = await bcrypt.hash(new_password, 10);
      
      // ✅ แก้ไขชื่อคอลัมน์เป็น password_hash ให้ตรงกับ DB
      queryText = `
        UPDATE users 
        SET username = $1, role = $2, total_points = $3, password_hash = $4 
        WHERE id = $5
      `;
      queryParams = [username, role, total_points, hashedPassword, id];
    } else {
      console.log("No new password provided, keeping old one.");
      queryText = `
        UPDATE users 
        SET username = $1, role = $2, total_points = $3 
        WHERE id = $4
      `;
      queryParams = [username, role, total_points, id];
    }

    // ✅ เปลี่ยนจาก pool.query เป็น query ตามที่ import ไว้ด้านบนสุด
    await query(queryText, queryParams);
    res.json({ message: 'User updated successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// 5. API สำหรับลบผู้ใช้
router.delete('/delete-user/:id', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'ลบผู้ใช้สำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ไม่สามารถลบผู้ใช้ได้' });
  }
});

// API สำหรับดึงข้อมูลตัวเอง (เช็คจาก Token)
router.get('/me', authenticateToken, async (req: any, res: Response) => {
  try {
    const result = await query(
      'SELECT id, username, role, total_points FROM users WHERE id = $1',
      [req.user.userId] // ดึง userId มาจาก token ที่ถูกถอดรหัสแล้วใน auth.ts
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// API สำหรับอัปเดตคะแนนของผู้เล่น (บวกเพิ่มจากแต้มเดิมที่มี)
router.post('/add-points', authenticateToken, async (req: any, res: Response) => {
  const { points } = req.body; // รับคะแนนที่ได้จากหน้าบ้าน

  // เช็คก่อนว่าคะแนนที่ส่งมาเป็นตัวเลขที่ถูกต้องไหม
  if (typeof points !== 'number' || points < 0) {
    return res.status(400).json({ message: 'คะแนนไม่ถูกต้อง' });
  }

  try {
    // ใช้ userId จาก Token ที่ถอดรหัสแล้วใน Middleware
    const userId = req.user.userId;

    // ✨ คำสั่ง SQL: บวกแต้มเพิ่มเข้ากับ total_points เดิม
    const result = await query(
      `UPDATE users 
       SET total_points = total_points + $1 
       WHERE id = $2 
       RETURNING id, username, total_points`,
      [points, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้ในระบบ' });
    }

    res.json({
      message: 'บันทึกคะแนนสำเร็จ! 🏆',
      updatedUser: result.rows[0]
    });
  } catch (err) {
    console.error('Update points error:', err);
    res.status(500).json({ error: 'Failed to update points' });
  }
});

// ✅ API ดึงข้อมูล Leaderboard (เรียงลำดับจากคะแนนมากไปน้อย Top 10)
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, username, total_points 
       FROM users 
       ORDER BY total_points DESC 
       LIMIT 10`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ✅ เปลี่ยนชื่อเป็น /update-points ให้ครอบคลุมทั้งบวกและลบ
router.post('/update-points', authenticateToken, async (req: any, res: Response) => {
  const { points } = req.body;

  if (typeof points !== 'number') {
    return res.status(400).json({ message: 'คะแนนไม่ถูกต้อง' });
  }

  try {
    const userId = req.user.userId;

    const result = await query(
      `UPDATE users 
       SET total_points = GREATEST(0, total_points + $1) 
       WHERE id = $2 
       RETURNING id, username, total_points`,
      [points, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้ในระบบ' });
    }

    res.json({
      message: 'อัปเดตคะแนนเรียลไทม์สำเร็จ!',
      updatedUser: result.rows[0]
    });
  } catch (err) {
    console.error('Update points error:', err);
    res.status(500).json({ error: 'Failed to update points' });
  }
});

export default router;