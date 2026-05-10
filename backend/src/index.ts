import 'dotenv/config'; // ต้องอยู่บรรทัดแรกสุดเสมอ!
import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import wordRoutes from './routes/wordRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', userRoutes);         // จัดการระบบ Auth
app.use('/api/words', wordRoutes);   // จัดการระบบคำศัพท์

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`-------------------------------------------`);
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 Ready for Game API connections...`);
  console.log(`-------------------------------------------`);
});