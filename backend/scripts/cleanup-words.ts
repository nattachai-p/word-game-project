// One-off maintenance script:
//  1) ensure login_log table exists
//  2) find words whose Thai fields contain foreign scripts (Korean/Chinese/Japanese)
//     e.g. "เทค-นิ-컬" and let AI regenerate clean Thai, then UPDATE the DB
//
// Run:  npx tsx --env-file=.env scripts/cleanup-words.ts
// Add --dry to only preview without updating.

import pkg from 'pg';
import { GoogleGenerativeAI } from '@google/generative-ai';

const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const MODEL = 'gemini-2.5-flash';
const DRY = process.argv.includes('--dry');

// อักษรต่างด้าวที่ไม่ควรโผล่ในฟิลด์ภาษาไทย: Hangul / Hiragana+Katakana / CJK
const FOREIGN = /[가-힯぀-ヿ一-鿿]/;

const hasForeign = (s: string | null) => !!s && FOREIGN.test(s);

async function fixWord(eng: string) {
  const prompt =
    `Analyze the English word "${eng}". Return ONLY a JSON object with keys: ` +
    `th_read (Thai phonetic e.g. "แอป-เพิล"), th_meaning (clear Thai translation), ` +
    `example_sentence (very simple A1 English sentence), example_translation (Thai translation of that sentence). ` +
    `IMPORTANT: all Thai text must use ONLY Thai script — no Korean/Chinese/Japanese characters.`;
  const model = genAI.getGenerativeModel({ model: MODEL });
  const result = await model.generateContent(prompt);
  let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(text) as {
    th_read: string;
    th_meaning: string;
    example_sentence: string;
    example_translation: string;
  };
}

async function main() {
  console.log(`\n=== Cleanup words ${DRY ? '(DRY RUN)' : ''} ===`);

  // 1) ensure login_log table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS login_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      username TEXT,
      logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  console.log('✓ login_log table ensured');

  // 2) scan words
  const { rows } = await pool.query(
    'SELECT id, eng, th_read, th_meaning, example_sentence, example_translation FROM words ORDER BY id'
  );
  console.log(`scanning ${rows.length} words...`);

  const flagged = rows.filter(
    (r: any) =>
      hasForeign(r.th_read) ||
      hasForeign(r.th_meaning) ||
      hasForeign(r.example_translation) ||
      hasForeign(r.example_sentence)
  );
  console.log(`found ${flagged.length} word(s) with foreign characters\n`);

  let fixed = 0;
  for (const r of flagged) {
    console.log(`• [${r.id}] ${r.eng}`);
    console.log(`    before: th_read="${r.th_read}" | th_meaning="${r.th_meaning}"`);
    try {
      const fix = await fixWord(r.eng);
      console.log(`    after : th_read="${fix.th_read}" | th_meaning="${fix.th_meaning}"`);
      if (!DRY) {
        await pool.query(
          `UPDATE words
           SET th_read = $1, th_meaning = $2, example_sentence = $3, example_translation = $4
           WHERE id = $5`,
          [fix.th_read, fix.th_meaning, fix.example_sentence, fix.example_translation, r.id]
        );
        fixed++;
      }
    } catch (e: any) {
      console.log(`    !! failed: ${e?.message || e}`);
    }
  }

  console.log(`\n=== Done. ${DRY ? 'would fix' : 'fixed'} ${DRY ? flagged.length : fixed} word(s) ===`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
