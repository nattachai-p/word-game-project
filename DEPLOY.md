# 🚀 Deploy to Vercel (Services mode — Frontend + Backend ในโปรเจกต์เดียว)

แอปนี้ deploy ขึ้น **Vercel** โดยใช้โหมด **Services** — รวม frontend (Vite) และ backend (Express)
ไว้ใน Vercel project เดียว โดเมนเดียว Database ยังใช้ **Supabase** (ที่มีอยู่แล้ว)

```
ผู้เล่น → Vercel (domain เดียว)
            ├── /api/*  → service "backend"  (Express)  → Supabase (Postgres) + Gemini/Groq
            └── /*      → service "frontend" (Vite static)
```

## ไฟล์ [`vercel.json`](vercel.json) (Services format)
```json
{
  "services": {
    "backend":  { "root": "backend",  "framework": "express" },
    "frontend": { "root": "frontend", "framework": "vite" }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": { "service": "backend" } },
    { "source": "/(.*)",     "destination": { "service": "frontend" } }
  ]
}
```
- `backend` เปิด public เฉพาะ path `/api/*` (เบราว์เซอร์เรียกตรง)
- `frontend` รับ path ที่เหลือทั้งหมด (รองรับ React Router)
- **ไม่มี bindings** — frontend เป็น SPA เรียก `/api` ผ่านเบราว์เซอร์ ไม่ใช่ service เรียก service กัน

> `backend/src/index.ts` listen บน `process.env.PORT` (Vercel inject ให้ในโหมด express service) — ตอน dev ใช้ 8080

---

## ขั้นตอน Deploy
1. ไป https://vercel.com → Sign in ด้วย GitHub
2. **Add New → Project** → เลือก repo `word-game-project`, branch `main`
3. **Root Directory: `./`** (อย่ากด "Import single project" ของ backend/frontend)
4. Vercel จะอ่าน `vercel.json` แล้วตั้ง 2 services ให้อัตโนมัติ
5. กาง **Environment Variables** ใส่ค่าเหล่านี้ (เอาจาก `backend/.env`):

| Key | ค่า | จำเป็น |
|-----|-----|--------|
| `DATABASE_URL` | Supabase connection string (ตัว **pooler** port 6543) | ✅ |
| `JWT_SECRET` | ค่าสุ่มยาว ๆ (อันเดิมใน .env ใช้ได้) | ✅ |
| `GEMINI_API_KEY` | API key ของ Google Gemini | ✅ (ถ้าใช้ Gemini) |
| `GROQ_API_KEY` | API key ของ Groq | ✅ (ถ้าใช้ Groq) |
| `FRONTEND_URL` | โดเมนที่อนุญาต CORS (เช่น `https://xxx.vercel.app`) | ⬜ (ไม่ใส่ก็ได้ เพราะโดเมนเดียวกัน) |

6. กด **Deploy**

> ⚠️ **อย่า commit `.env`** (gitignore กันไว้แล้ว) — ใส่ค่าผ่านหน้า Vercel เท่านั้น
> `VITE_API_URL` ไม่ต้องตั้ง — frontend ใช้ `/api` (โดเมนเดียวกัน) อัตโนมัติ

---

## รันในเครื่อง (local dev)
```bash
# Terminal 1 - backend (พอร์ต 8080)
cd backend && npm run dev
# Terminal 2 - frontend (พอร์ต 5173, /api proxy ไป 8080 อัตโนมัติ)
cd frontend && npm run dev
```
หรือดับเบิลคลิก `Run Word Game.bat` บน Desktop
(จะลองแบบ Vercel จริงก็ใช้ `vercel dev` ที่ root — รันทั้ง 2 services พร้อมกัน)

---

## ⚠️ ข้อควรรู้
1. **Rate limit แบบ in-memory ไม่เป๊ะ** เมื่อ scale หลาย instance — ถ้าต้องการแม่น ให้ต่อ **Upstash Redis** (free) ใน `backend/src/middleware/rateLimit.ts`
2. **DB** ใช้ Supabase **pooler (port 6543)** อยู่แล้ว ✅ เหมาะกับการ scale
3. เลี่ยง AI รุ่น "thinking" ที่ตอบช้า (ใช้ `gemini-2.5-flash` เป็นค่าเริ่มต้น)
4. **กันบอทสมัคร**: แนะนำเพิ่ม **Cloudflare Turnstile** (ฟรี) ที่หน้า Register ภายหลัง
