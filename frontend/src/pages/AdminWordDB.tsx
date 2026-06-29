import { useState } from 'react';
import { Sparkles, Save, Trash2, Loader2, Plus, ArrowLeft, Settings2, Edit3, X, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AdminWordDB = () => {
  const navigate = useNavigate();
  const [words, setWords] = useState<any[]>([]);
  const [inputWord, setInputWord] = useState('');
  const [topic, setTopic] = useState(''); // เคลียร์เป็นค่าว่างให้สุ่มอิสระ
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // ✅ ป้องกันกดปุ่ม Save ซ้ำ
  const [aiModel, setAiModel] = useState('llama-3.3-70b-versatile');
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualEng, setManualEng] = useState('');
  const [manualThRead, setManualThRead] = useState('');
  const [manualTh, setManualTh] = useState('');
  const [manualExample, setManualExample] = useState('');
  const [manualExTrans, setManualExTrans] = useState('');

  const handleAnalyze = async () => {
    if (!inputWord) return;
    setLoading(true);
    try {
      const check = await api.get(`/ai/check-word/${inputWord}`);
      if (check.data.exists) {
        alert(`คำว่า "${inputWord}" มีอยู่ในระบบแล้ว ไม่ต้องเพิ่มใหม่ครับ`);
        setLoading(false);
        return;
      }
      
      const res = await api.post('/ai/analyze-word', { word: inputWord, model: aiModel });
      setWords([res.data, ...words]);
      setInputWord('');
    } catch (err: any) { 
      console.error(err);
      alert("AI ขัดข้อง ดูที่ Console ของ Backend ครับ"); 
    }
    setLoading(false);
  };

 const handleRandom = async () => {
    setLoading(true);
    try {
      // ส่งค่า topic (ถ้าว่าง Backend จะรู้เองว่าให้สุ่มอิสระ)
      const res = await api.post('/ai/random-words', { topic: topic.trim(), model: aiModel });
      setWords([...res.data, ...words]);
    } catch (err: any) { 
      console.error(err);
      alert("AI ขัดข้อง ดูที่ Console ของ Backend ครับ"); 
    }
    setLoading(false);
  };

  const handleSaveAll = async () => {
    if (isSaving) return; // double-click guard
    setIsSaving(true);
    try {
      await api.post('/ai/save-words', { words });
      alert("บันทึกข้อมูลสำเร็จ! (บันทึกในหมวด General)");
      setWords([]);
    } catch (err) { 
      alert("บันทึกไม่สำเร็จ"); 
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualAdd = async () => {
    if (!manualEng || !manualTh) return alert('กรุณากรอกคำศัพท์และคำแปลเป็นอย่างน้อย');
    
    // Check local staging list first
    if (words.some(w => w.eng.toLowerCase() === manualEng.toLowerCase())) {
      return alert(`คำว่า "${manualEng}" รอเซฟอยู่ในตารางแล้วครับ`);
    }

    setLoading(true);
    try {
      const check = await api.get(`/ai/check-word/${manualEng}`);
      if (check.data.exists) {
        alert(`คำว่า "${manualEng}" มีอยู่ในระบบแล้ว ไม่ต้องเพิ่มใหม่ครับ`);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);

    const newWord = {
      eng: manualEng,
      th_read: manualThRead || '-',
      th_meaning: manualTh,
      example_sentence: manualExample || '-',
      example_translation: manualExTrans || '-',
    };
    setWords([newWord, ...words]);
    setManualEng('');
    setManualThRead('');
    setManualTh('');
    setManualExample('');
    setManualExTrans('');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 p-8 font-['Inter'] relative">
      <button 
        onClick={() => navigate('/game')}
        className="absolute top-8 left-8 flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-bold z-10"
      >
        <ArrowLeft size={20} /> Back to Game
      </button>

      <div className="max-w-7xl mx-auto mt-16">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black italic flex items-center gap-3">
              <Sparkles className="text-purple-400" /> WORD DATABASE <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-1 rounded non-italic font-bold uppercase tracking-widest">AI Agent</span>
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-slate-500 text-sm">คลังคำศัพท์อัจฉริยะ (ทุกคำจะถูกบันทึกในหมวด 'General')</p>
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <Settings2 className="w-3 h-3 text-slate-400" />
                <select 
                  value={aiModel} 
                  onChange={(e) => setAiModel(e.target.value)}
                  className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
                >
                  <optgroup label="Google (Gemini)">
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (Fast)</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="gemini-pro">Gemini Pro</option>
                  </optgroup>
                  <optgroup label="Groq (Llama) - Requires Key">
                    <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Fast & Free)</option>
                    <option value="llama-3.1-8b-instant">Llama 3.1 8B (Super Fast)</option>
                    <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                  </optgroup>
                </select>
              </div>
            </div>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={words.length === 0 || isSaving}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[200px] justify-center"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                CONFIRM & SAVE ALL ({words.length})
              </>
            )}
          </button>
        </header>

        {/* Control Panel */}
        <div className="flex justify-end mb-4">
          <button 
            onClick={() => setShowManualForm(!showManualForm)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${showManualForm ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
          >
            {showManualForm ? <><X size={16}/> ซ่อนโหมดเพิ่มเอง</> : <><Edit3 size={16}/> เพิ่มคำศัพท์เอง (Manual)</>}
          </button>
        </div>

        {showManualForm && (
          <div className="bg-indigo-950/30 border border-indigo-500/20 p-6 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
             <label className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block mb-4">Fully Manual Entry (กรอกให้ครบทุกช่อง)</label>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
               <input value={manualEng} onChange={(e) => setManualEng(e.target.value)} placeholder="1. คำศัพท์ Eng" className="w-full bg-black/50 border border-indigo-500/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400" />
               <input value={manualThRead} onChange={(e) => setManualThRead(e.target.value)} placeholder="2. คำอ่าน (เช่น แอป-เพิล)" className="w-full bg-black/50 border border-indigo-500/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400" />
               <input value={manualTh} onChange={(e) => setManualTh(e.target.value)} placeholder="3. คำแปลไทย" className="w-full bg-black/50 border border-indigo-500/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400" />
               <input value={manualExample} onChange={(e) => setManualExample(e.target.value)} placeholder="4. ประโยคตัวอย่าง (Eng)" className="w-full bg-black/50 border border-indigo-500/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400" />
               <input value={manualExTrans} onChange={(e) => setManualExTrans(e.target.value)} placeholder="5. คำแปลประโยคตัวอย่าง" className="w-full md:col-span-2 bg-black/50 border border-indigo-500/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400" />
             </div>
             <div className="flex justify-end">
               <button onClick={handleManualAdd} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                 เพิ่มลงตาราง
               </button>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#111] border border-white/5 p-6 rounded-2xl">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-3">AI Word Analyze (พิมพ์คำ แล้วให้ AI คิดต่อ)</label>
            <div className="flex gap-2">
              <input value={inputWord} onChange={(e) => setInputWord(e.target.value)} placeholder="Type a word..." className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500" />
              <button onClick={handleAnalyze} disabled={loading || !inputWord} className="bg-white/5 hover:bg-white/10 px-4 rounded-xl border border-white/10 disabled:opacity-50 text-purple-400">
                {loading ? <Loader2 className="animate-spin" /> : <Plus />}
              </button>
            </div>
          </div>

          <div className="bg-[#111] border border-white/5 p-6 rounded-2xl">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-3">Random by AI Topic</label>
            <div className="flex gap-2">
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic: Anything " className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500" />
              <button onClick={handleRandom} disabled={loading} className="bg-purple-600 hover:bg-purple-500 px-6 rounded-xl font-bold disabled:opacity-50 text-white">
                {loading ? <Loader2 className="animate-spin" /> : "GENERATE"}
              </button>
            </div>
          </div>
        </div>

        {/* Preview Table */}
        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
              <tr>
                <th className="px-6 py-4 w-1/5">Word</th>
                <th className="px-6 py-4 w-1/4">Meaning / Phonetic</th>
                <th className="px-6 py-4 w-auto">Example Sentence (A1 Level)</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {words.map((item, index) => (
                <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-bold text-white text-lg">{item.eng}</td>
                  <td className="px-6 py-4">
                    <div className="text-purple-400 text-xs mb-1 font-medium">{item.th_read}</div>
                    <div className="text-slate-300">{item.th_meaning}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-300 italic">"{item.example_sentence}"</div>
                    <div className="text-slate-500 text-xs mt-1">{item.example_translation}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setWords(words.filter((_, i) => i !== index))} className="p-2 text-slate-600 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {words.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-24 text-center text-slate-500 italic">
                    ไม่มีข้อมูลในรายการตรวจ... เริ่มสร้างคำศัพท์ด้วย AI กันเลย!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminWordDB;