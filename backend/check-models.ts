import dotenv from 'dotenv';
dotenv.config(); // โหลดค่า GEMINI_API_KEY จากไฟล์ .env

const API_KEY = process.env.GEMINI_API_KEY;

async function checkAvailableModels() {
  console.log("🚀 กำลังสแกนหา Model ทั้งหมดที่เข้าถึงได้...\n");

  try {
    // ยิงไปถาม Google API ตรงๆ เลย
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await response.json();

    if (data.models) {
      console.log("✅ พบรายชื่อโมเดลที่ใช้ได้ดังนี้:\n");
      
      // กรองเอาเฉพาะโมเดลที่รองรับการสร้างข้อความ (generateContent) มาโชว์
      const textModels = data.models.filter((m: any) => 
        m.supportedGenerationMethods.includes("generateContent")
      );

      textModels.forEach((model: any) => {
        console.log(`📌 ชื่อที่ต้องเอาไปใส่ในโค้ด: ${model.name.replace('models/', '')}`);
        console.log(`   รายละเอียด: ${model.displayName}`);
        console.log(`   เวอร์ชัน: ${model.version}`);
        console.log("--------------------------------------------------");
      });

    } else {
      console.log("❌ ไม่พบโมเดล หรือ API Key อาจจะมีปัญหา:", data);
    }
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเชื่อมต่อ:", error);
  }
}

checkAvailableModels();