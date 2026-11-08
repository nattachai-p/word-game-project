// ─────────────────────────────────────────────
// Central config — อ่านค่า secret สำคัญจาก environment ที่เดียว
// ถ้าไม่มี JWT_SECRET จะเตือนและใช้ค่า dev ชั่วคราว (ห้ามใช้บน production)
// ─────────────────────────────────────────────

const secretFromEnv = process.env.JWT_SECRET;

if (!secretFromEnv) {
  console.warn(
    '⚠️  [config] ไม่พบ JWT_SECRET ใน .env — กำลังใช้ค่า dev ชั่วคราว ' +
    '(ไม่ปลอดภัยสำหรับ production! กรุณาตั้ง JWT_SECRET ใน .env)'
  );
}

// ใช้ค่าจาก env ถ้ามี; ถ้าไม่มี fallback เป็น dev key (เฉพาะตอนพัฒนา)
export const JWT_SECRET: string = secretFromEnv || 'dev_only_insecure_secret_change_me';
