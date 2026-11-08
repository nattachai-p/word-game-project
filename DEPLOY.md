# 🚀 Deploy to Vercel (Frontend + Backend ในโปรเจกต์เดียว)

แอปนี้ deploy ขึ้น **Vercel** ทั้ง frontend (React/Vite = static) และ backend (Express = serverless function) ใน**โดเมนเดียวกัน**
Database ยังใช้ **Supabase** (ที่มีอยู่แล้ว)

```
ผู้เล่น → Vercel (React static)  →  /api/* → Vercel Serverless (Express)  →  Supabase (Postgres)
                                                      ↓
                                         Gemini / Groq (AI)
```

---

## 1. เตรียม repo
- โค้ดอยู่บน GitHub แล้ว (repo: `word-game-project`)
- ไฟล์ [`vercel.json`](vercel.json) ที่ root คุม build + routing ให้แล้ว:
  - `frontend/` → build เป็น static (เสิร์ฟที่ `/`)
  - `backend/src/index.ts` → serverless function (รับ `/api/*`)
  - path อื่น ๆ → fallback ไป `index.html` (รองรับ React Router)

> `backend/src/index.ts` จะ **ไม่** `app.listen()` บน Vercel (ตรวจจาก env `VERCEL`) แต่ export app ให้ runtime เรียกแทน — ตอน dev ยัง `listen` ที่พอร์ต 8080 ปกติ

## 2. สมัคร / ล็อกอิน Vercel
1. ไป https://vercel.com → Sign in ด้วย GitHub
2. **Add New → Project** → เลือก repo `word-game-project`
3. **Root Directory: ปล่อยเป็น root** (อย่าเลือก frontend/ หรือ backend/) เพราะ `vercel.json` อยู่ที่ root
4. Framework Preset: **Other** (ปล่อยให้ vercel.json จัดการ)

## 3. ตั้งค่า Environment Variables (สำคัญมาก!)
ใน Vercel → Project → **Settings → Environment Variables** ใส่ค่าเหล่านี้ (เอาจาก `backend/.env` ของคุณ):

| Key | ค่า | จำเป็น |
|-----|-----|--------|
| `DATABASE_URL` | connection string ของ Supabase (ใช้ตัว **pooler** port 6543) | ✅ |
| `JWT_SECRET` | ค่าสุ่มยาว ๆ (อันเดิมใน .env ใช้ได้) | ✅ |
| `GEMINI_API_KEY` | API key ของ Google Gemini | ✅ (ถ้าใช้ Gemini) |
| `GROQ_API_KEY` | API key ของ Groq | ✅ (ถ้าใช้ Groq) |
| `FRONTEND_URL` | โดเมนที่อนุญาต CORS เช่น `https://word-game-project.vercel.app` | ⬜ (ไม่ใส่ก็ได้ เพราะ fe/be โดเมนเดียวกัน) |

> ⚠️ **อย่า commit `.env` ขึ้น git** (gitignore กันไว้แล้ว) — ใส่ค่าผ่านหน้า Vercel เท่านั้น
> `VITE_API_URL` **ไม่ต้องตั้ง** — frontend จะใช้ `/api` (โดเมนเดียวกัน) โดยอัตโนมัติ

## 4. Deploy
กด **Deploy** รอสักครู่ → ได้ URL เช่น `https://word-game-project.vercel.app`
ทุกครั้งที่ `git push` ขึ้น branch `main` Vercel จะ deploy ใหม่ให้อัตโนมัติ

---

## รันในเครื่อง (local dev) — เหมือนเดิม
```bash
# Terminal 1 - backend (พอร์ต 8080)
cd backend && npm run dev

# Terminal 2 - frontend (พอร์ต 5173, /api proxy ไป 8080 อัตโนมัติ)
cd frontend && npm run dev
```
หรือดับเบิลคลิก `Run Word Game.bat` บน Desktop

---

## ⚠️ ข้อควรรู้ (serverless)
1. **Rate limit แบบ in-memory ไม่เป๊ะบน serverless** — แต่ละ instance นับแยกกัน
   ถ้าต้องการกันจริงจัง ให้ต่อ **Upstash Redis** (มี free tier) แล้วเปลี่ยน store ใน `backend/src/middleware/rateLimit.ts`
2. **เวลารันต่อ request จำกัด ~10s** (Vercel Hobby) — AI รุ่น flash ตอบทัน แต่เลี่ยงรุ่น "thinking" ที่ช้า
3. **DB connection** ใช้ Supabase **pooler (port 6543)** อยู่แล้ว ✅ เหมาะกับ serverless
4. **กันบอทสมัคร**: แนะนำเพิ่ม **Cloudflare Turnstile** (ฟรี) ที่หน้า Register ภายหลัง
