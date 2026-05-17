import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

export const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'ไม่มีบัตรผ่าน (Token required)' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'บัตรหมดอายุ หรือบัตรปลอม' });
    }
    req.user = user;
    next();
  });
};

export const isAdmin = (req: any, res: Response, next: NextFunction) => {
  // ตรวจสอบว่ามี user ใน request ไหม และ role เป็น admin หรือเปล่า
  if (req.user && req.user.role === 'admin') {
    next(); // ถ้าเป็น admin จริง ก็ให้ไปต่อได้
  } else {
    return res.status(403).json({ message: 'สงวนสิทธิ์เฉพาะผู้ดูแลระบบเท่านั้น (Admin only)' });
  }
};
