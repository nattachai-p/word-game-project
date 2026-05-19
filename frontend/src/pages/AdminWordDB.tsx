import { useState } from 'react';
import { Sparkles, Save, Trash2, Loader2, Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AdminWordDB = () => {
  const navigate = useNavigate();
  const [words, setWords] = useState<any[]>([]);
  const [inputWord, setInputWord] = useState('');
const [topic, setTopic] = useState(''); // เคลียร์เป็นค่าว่างให้สุ่มอิสระ
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!inputWord) return;
    setLoading(true);
    try {
      const res = await api.post('/ai/analyze-word', { word: inputWord });
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
      const res = await api.post('/ai/random-words', { topic: topic.trim() });
      setWords([...res.data, ...words]);
    } catch (err: any) { 
      console.error(err);
      alert("AI ขัดข้อง ดูที่ Console ของ Backend ครับ"); 
    }
    setLoading(false);
  };

  const handleSaveAll = async () => {
    try {
      await api.post('/ai/save-words', { words });
      alert("บันทึกข้อมูลสำเร็จ! (บันทึกในหมวด General)");
      setWords([]);
    } catch (err) { 
      alert("บันทึกไม่สำเร็จ"); 
    }
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
            <p className="text-slate-500 text-sm mt-1">คลังคำศัพท์อัจฉริยะ (ทุกคำจะถูกบันทึกในหมวด 'General')</p>
          </div>
          <button onClick={handleSaveAll} disabled={words.length === 0} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-30 transition-all">
            <Save className="w-5 h-5" /> CONFIRM & SAVE ALL ({words.length})
          </button>
        </header>

        {/* Control Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#111] border border-white/5 p-6 rounded-2xl">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-3">Manual Input</label>
            <div className="flex gap-2">
              <input value={inputWord} onChange={(e) => setInputWord(e.target.value)} placeholder="Type a word..." className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500" />
              <button onClick={handleAnalyze} disabled={loading || !inputWord} className="bg-white/5 hover:bg-white/10 px-4 rounded-xl border border-white/10 disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" /> : <Plus />}
              </button>
            </div>
          </div>

          <div className="bg-[#111] border border-white/5 p-6 rounded-2xl">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-3">Random by AI Topic</label>
            <div className="flex gap-2">
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic: Anything " className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500" />
              <button onClick={handleRandom} disabled={loading} className="bg-purple-600 hover:bg-purple-500 px-6 rounded-xl font-bold disabled:opacity-50">
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