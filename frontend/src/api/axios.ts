import axios from 'axios';

// สร้าง instance ของ axios ที่ตั้งค่าพื้นฐานไว้แล้ว
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // ดึงค่าจาก .env มาใช้ตรงนี้
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