import express, { Request, Response } from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { query } from '../db.js';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SIMPLE_PROMPT_REQUIREMENT = `
1. eng: English word.
2. th_read: Thai phonetics (e.g., 'แอป-เพิล').
3. th_meaning: Clear Thai translation.
4. example_sentence: VERY SIMPLE, short everyday English sentence (Beginner A1 level).
5. example_translation: Thai translation for the sentence.
`;

// 1. Manual Input
router.post('/analyze-word', async (req: Request, res: Response) => {
  const { word } = req.body;
  try {
    // ✅ เปลี่ยนมาใช้ 'gemini-pro' ที่รองรับ 100% ในทุกเวอร์ชัน
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `Analyze the English word "${word}". Return ONLY a JSON object containing the keys: eng, th_read, th_meaning, example_sentence, example_translation. ${SIMPLE_PROMPT_REQUIREMENT}`;
    
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // ✅ ท่าไม้ตายล้างคราบ Markdown เผื่อ AI แอบแถม ```json มาให้
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    res.json(JSON.parse(text));
  } catch (err: any) {
    console.error("AI Analyze Error:", err.message || err);
    res.status(500).json({ error: "AI Analysis failed" });
  }
});

// 2. Random AI Topic
router.post('/random-words', async (req: Request, res: Response) => {
  const { topic } = req.body;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // ✨ ปรับ Prompt ใหม่: ถ้าไม่มี topic ส่งมา ให้สุ่มแบบครอบจักรวาล
    const topicInstruction = topic && topic.trim() !== "" 
      ? `strictly about "${topic}"` 
      : `from completely random and diverse topics (e.g., nature, science, daily life, emotions, technology, space)`;
      
    const prompt = `Generate 5 English words ${topicInstruction}. Return ONLY a JSON ARRAY of objects. Each object must have keys: eng, th_read, th_meaning, example_sentence, example_translation. ${SIMPLE_PROMPT_REQUIREMENT}`;
    
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // ท่าไม้ตายล้างคราบ Markdown
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    res.json(JSON.parse(text));
  } catch (err: any) {
    console.error("AI Random Error:", err.message || err);
    res.status(500).json({ error: "Random generation failed" });
  }
});

// 3. Save to DB (บังคับหมวดหมู่เป็น General)
router.post('/save-words', async (req: Request, res: Response) => {
  const { words } = req.body;
  try {
    for (const item of words) {
      const checkExist = await query('SELECT id FROM words WHERE eng = $1', [item.eng]);
      if (checkExist.rows.length === 0) {
        await query(
          `INSERT INTO words (eng, th_read, th_meaning, category, example_sentence, example_translation) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [item.eng, item.th_read, item.th_meaning, 'General', item.example_sentence, item.example_translation]
        );
      }
    }
    res.json({ message: "Saved successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save words" });
  }
});

export default router;