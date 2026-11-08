import axios from 'axios';

// baseURL:
//  - prod (Vercel): ใช้ '/api' = โดเมนเดียวกัน (serverless function)
//  - dev: '/api' ผ่าน vite proxy ไป http://localhost:8080 (ดู vite.config.ts)
//  - override ได้ด้วย VITE_API_URL ถ้าต้องการชี้ backend คนละที่
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// ลูกเล่นมือโปร: ดักจับ Token ใน LocalStorage แล้วใส่เข้าไปใน Header ทุกครั้งที่ส่ง
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;