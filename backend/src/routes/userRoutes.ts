import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// API สมัครสมาชิก
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

// API สำหรับ Login 
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // สร้าง Token โดยฝัง userId และ role ไว้ข้างใน
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    // ส่งข้อมูลกลับ: แยก token และ role ออกมาให้ชัดเจน
    res.json({
      message: 'Login successful',
      token,
      role: user.role, // ส่ง role ออกมาตรงๆ เพื่อให้ Frontend เช็คได้ทันที
      user: { id: user.id, username: user.username } 
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// API สำหรับดึงข้อมูลผู้ใช้ทั้งหมด 
// ดึงข้อมูล User ทั้งหมด (เฉพาะ Admin)
// หมายเหตุ: ถ้าคุณทำ middleware authenticateToken กับ isAdmin เสร็จแล้วให้เอามาใส่ตรงกลางด้วยนะครับ
router.get('/users', async (req: Request, res: Response) => {
  try {
    // ดึงข้อมูลที่จำเป็นมาโชว์ (ไม่ดึง password_hash มาเพื่อความปลอดภัย)
    const result = await query(
      'SELECT id, username, role, total_points FROM users ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// api สำหรับลบ User รายบุคคล
// อัปเดตข้อมูล User รายบุคคล
router.put('/update-user/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, role, total_points, password } = req.body;
  
  try {
    let updateQuery = 'UPDATE users SET username = $1, role = $2, total_points = $3';
    let params = [username, role, total_points, id];

    // ถ้ามีการส่ง password ใหม่มาด้วย ให้ hash แล้วอัปเดตเข้าไปด้วย
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery = 'UPDATE users SET username = $1, role = $2, total_points = $3, password_hash = $4 WHERE id = $5';
      params = [username, role, total_points, hashedPassword, id];
    } else {
      updateQuery += ' WHERE id = $4';
    }

    await query(updateQuery, params);
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// 2. API สำหรับลบผู้ใช้ (Remove User)
router.delete('/delete-user/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // ป้องกันการลบ Admin (เลือกเช็คจาก ID หรือ Username ก็ได้)
    // หรือเช็คว่าห้ามลบตัวเอง (ถ้าเรามีระบบตรวจสอบ Token)
    await query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'ลบผู้ใช้สำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ไม่สามารถลบผู้ใช้ได้' });
  }
});


export default router;