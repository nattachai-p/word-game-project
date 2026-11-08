import express, { Request, Response } from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "missing_key" });

// ✅ จำกัดความถี่ก่อน แล้วค่อยเช็ค login (กันคนนอกยิง API เผา quota)
router.use(aiLimiter);
router.use(authenticateToken);

// Default model: เลือกรุ่น flash เจาะจงที่เร็วและเสถียร
// (ไม่ใช้ alias "latest" เพราะบางครั้ง map ไปรุ่น thinking ที่ตอบช้า/ค้าง)
const DEFAULT_MODEL = "gemini-2.5-flash";

// เลือก provider จากชื่อ model: ขึ้นต้น "gemini" = Google, นอกนั้น = Groq
const isGroqModel = (m: string) => !m.toLowerCase().startsWith("gemini");

const SIMPLE_PROMPT_REQUIREMENT = `
1. eng: English word.
2. th_read: Thai phonetics (e.g., 'แอป-เพิล').
3. th_meaning: Clear Thai translation.
4. example_sentence: VERY SIMPLE, short everyday English sentence (Beginner A1 level).
5. example_translation: Thai translation for the sentence.
`;

// 0. Check Word Exists
router.get('/check-word/:word', async (req: Request, res: Response) => {
  try {
    const word = String(req.params.word).trim().toLowerCase();
    const checkExist = await query('SELECT id FROM words WHERE LOWER(eng) = $1', [word]);
    res.json({ exists: checkExist.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: "Check failed" });
  }
});

// 1. Manual Input
router.post('/analyze-word', async (req: Request, res: Response) => {
  const { word, model: aiModel } = req.body;
  try {
    const modelName = aiModel || DEFAULT_MODEL;
    const prompt = `Analyze the English word "${word}". Return ONLY a JSON object containing the keys: eng, th_read, th_meaning, example_sentence, example_translation. ${SIMPLE_PROMPT_REQUIREMENT}`;

    let text = "";
    if (isGroqModel(modelName)) {
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: modelName,
        temperature: 0.5,
      });
      text = chatCompletion.choices[0]?.message?.content || "";
    } else {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      text = result.response.text();
    }
    
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
  const { topic, model: aiModel } = req.body;
  try {
    const modelName = aiModel || DEFAULT_MODEL;

    // ✨ ปรับ Prompt ใหม่: ถ้าไม่มี topic ส่งมา ให้สุ่มแบบครอบจักรวาล
    const topicInstruction = topic && topic.trim() !== ""
      ? `strictly about "${topic}"`
      : `from completely random and diverse topics (e.g., nature, science, daily life, emotions, technology, space)`;

    const prompt = `Generate 5 English words ${topicInstruction}. Return ONLY a JSON ARRAY of objects. Each object must have keys: eng, th_read, th_meaning, example_sentence, example_translation. ${SIMPLE_PROMPT_REQUIREMENT}`;

    let text = "";
    if (isGroqModel(modelName)) {
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: modelName,
        temperature: 0.8, // Slightly higher for random words
      });
      text = chatCompletion.choices[0]?.message?.content || "";
    } else {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      text = result.response.text();
    }
    
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