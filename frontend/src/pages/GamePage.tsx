import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Play, CheckCircle2, ArrowRight, RefreshCcw } from 'lucide-react';
import api from '../api/axios';
import Logo from '../components/Logo';

// ✅ Logic การใบ้คำ
const generateHint = (word: string, level: string, settings: any) => {
  if (!word) return "";
  if (level === 'Hard') return word.replace(/[a-zA-Z]/g, "_");
  const ratio = level === 'Easy' ? (settings?.lv1 || 0.6) : (settings?.lv2 || 0.3);
  const chars = word.split("");
  const revealedCount = Math.floor(chars.length * ratio);
  const revealIndices = new Set<number>();
  while (revealIndices.size < revealedCount && revealIndices.size < chars.length) {
    revealIndices.add(Math.floor(Math.random() * chars.length));
  }
  return chars.map((char, i) => (revealIndices.has(i) ? char : "_")).join("");
};

const GamePage = () => {
  // --- States ---
  const [step, setStep] = useState<'select' | 'playing' | 'result'>('select');
  const [categories, setCategories] = useState<string[]>([]); // เก็บหมวดหมู่จาก DB
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [level, setLevel] = useState<'Easy' | 'Normal' | 'Hard'>('Easy');
  const [words, setWords] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [maskedWord, setMaskedWord] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [showExample, setShowExample] = useState(false);

  // ✅ 1. ดึง Categories จาก Database (Unique)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories') // สร้าง API นี้ที่ backend เพื่อ SELECT DISTINCT category
        setCategories(res.data);
      } catch (err) {
        console.error("Failed to fetch categories");
        setCategories(['Vocabulary', 'Verb', 'Idiom']); // Fallback หากดึงไม่สำเร็จ
      }
    };
    fetchCategories();
  }, []);

  // --- Functions ---
  const startStore = async () => {
    try {
      const url = selectedCategory === 'ALL' ? '/words/random' : `/words/random?category=${selectedCategory}`;
      const res = await api.get(url);
      if (res.data.length === 0) return alert("ไม่พบคำศัพท์ในหมวดนี้!");
      
      setWords(res.data);
      setStep('playing');
      setCurrentIndex(0);
      setScore(0);
      setUserInput('');
      setFeedback('none');
      setShowExample(false);
      prepareWord(res.data[0], level);
    } catch (err) { alert("Server Error"); }
  };

  const prepareWord = (wordObj: any, currentLevel: string) => {
    const settings = { lv1: 0.6, lv2: 0.3 }; 
    setMaskedWord(generateHint(wordObj.eng, currentLevel, settings));
  };

  const checkAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput || showExample) return;

    const isMatch = userInput.toLowerCase().trim() === words[currentIndex].eng.toLowerCase().trim();

    if (isMatch) {
      setFeedback('correct');
      setScore(prev => prev + 10);
      setTimeout(() => {
        setFeedback('none');
        setShowExample(true);
      }, 1200);
    } else {
      setFeedback('wrong');
      // ✅ 3. หักคะแนนเมื่อตอบผิด -5
      setScore(prev => Math.max(0, prev - 5)); 
      setTimeout(() => setFeedback('none'), 1000);
    }
  };

  // ✅ 2. ปุ่ม Random (Skip) หักคะแนน -2
  const handleSkip = () => {
    if (showExample) return;
    setScore(prev => Math.max(0, prev - 2)); // หักคะแนน
    nextWord();
  };

  const nextWord = () => {
    setFeedback('none');
    setShowExample(false);
    setUserInput('');
    if (currentIndex < words.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      prepareWord(words[nextIdx], level);
    } else {
      setStep('result');
    }
  };

  if (step === 'select') return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center font-['Inter']">
      <Logo />
      <div className="space-y-12 w-full max-w-2xl mt-10">
        <section>
          <p className="text-indigo-500 text-[10px] tracking-[0.4em] uppercase font-black mb-6">Category Selection</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button 
              onClick={() => setSelectedCategory('ALL')} 
              className={`px-6 py-3 rounded-xl border transition-all font-bold ${selectedCategory === 'ALL' ? 'bg-white text-black border-white' : 'border-white/10 text-slate-500'}`}
            >
              ALL
            </button>
            {categories.map(c => (
              <button 
                key={c} 
                onClick={() => setSelectedCategory(c)} 
                className={`px-6 py-3 rounded-xl border transition-all font-bold ${selectedCategory === c ? 'bg-white text-black border-white' : 'border-white/10 text-slate-500 hover:border-white/30'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="text-indigo-500 text-[10px] tracking-[0.4em] uppercase font-black mb-6">Challenge Mode</p>
          <div className="grid grid-cols-3 gap-4">
            {(['Easy', 'Normal', 'Hard'] as const).map(l => (
              <button key={l} onClick={() => setLevel(l)} className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-2 ${level === l ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_30px_rgba(79,70,229,0.3)]' : 'border-white/5 text-slate-600 hover:border-white/20'}`}>
                <span className="text-xl font-black italic uppercase tracking-tighter">{l}</span>
                <span className="text-[9px] opacity-60 uppercase tracking-widest">{l === 'Easy' ? '60% Hint' : l === 'Normal' ? '30% Hint' : 'No Hint'}</span>
              </button>
            ))}
          </div>
        </section>

        <button onClick={startStore} className="w-full bg-white py-6 rounded-2xl text-black font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-500 hover:text-white transition-all">
          Start Session <Play className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-500 flex flex-col items-center p-6 pt-12 relative overflow-hidden
      ${feedback === 'wrong' ? 'bg-red-950' : feedback === 'correct' ? 'bg-green-950' : 'bg-[#050505]'}
    `}>
      
      <AnimatePresence>
        {feedback !== 'none' && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }} className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50 backdrop-blur-sm ${feedback === 'correct' ? 'bg-green-950/90' : 'bg-red-950/90'}`}>
            <span className="text-[12rem] drop-shadow-2xl">{feedback === 'correct' ? '🤩' : '😢'}</span>
            <p className={`text-4xl font-black uppercase tracking-[0.3em] mt-8 ${feedback === 'correct' ? 'text-green-100' : 'text-red-100'}`}>
              {feedback === 'correct' ? 'Excellent!' : 'Wrong! (-5 PTS)'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-4xl z-10">
        <div className="flex justify-between items-end mb-20 text-white">
          <div className="scale-75 origin-left"><Logo /></div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Score</p>
            <p className="text-4xl font-black transition-all ${feedback === 'wrong' ? 'text-red-500 scale-110' : 'text-white'}">{score}</p>
          </div>
        </div>

        {step === 'playing' && (
          <div className="text-center space-y-12">
            <div className="space-y-6 relative">
              <p className="text-8xl font-mono tracking-[0.2em] text-indigo-500 font-bold uppercase">{maskedWord}</p>
              <p className="text-3xl text-slate-300 font-medium tracking-wide">{words[currentIndex]?.th_read}</p>
              <p className="text-5xl text-slate-500 font-light italic">{words[currentIndex]?.th_meaning}</p>
              
              {/* ✅ 2. ปุ่ม Random (Skip) */}
              {!showExample && (
                <button 
                  onClick={handleSkip}
                  className="absolute -right-12 top-0 p-4 text-slate-700 hover:text-white transition-colors group flex flex-col items-center gap-2"
                  title="Skip Word (-2 pts)"
                >
                  <RefreshCcw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="text-[9px] font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100">-2 PTS</span>
                </button>
              )}
            </div>

            <AnimatePresence>
              {showExample && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto bg-white/[0.03] p-10 rounded-[40px] border border-indigo-500/30 backdrop-blur-xl">
                  <p className="text-indigo-400 mb-6 uppercase tracking-[0.2em] text-xs font-bold"><CheckCircle2 className="inline w-4 h-4 mr-2" /> Correct Answer!</p>
                  <p className="text-2xl font-medium text-white mb-3 italic">"{words[currentIndex]?.example_sentence}"</p>
                  <p className="text-lg text-slate-400 mb-10">{words[currentIndex]?.example_translation}</p>
                  <button onClick={nextWord} className="bg-white text-black px-12 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all">Next Word <ArrowRight className="inline w-5 h-5 ml-2" /></button>
                </motion.div>
              )}
            </AnimatePresence>

            {!showExample && (
              <form onSubmit={checkAnswer} className="pt-20 max-w-md mx-auto">
                <input 
                  autoFocus
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className={`w-full bg-transparent border-b-4 py-4 text-5xl text-center focus:outline-none transition-all font-black tracking-[0.2em] uppercase ${feedback === 'wrong' ? 'border-red-500 text-red-500' : 'border-white/10 text-white focus:border-indigo-500'}`}
                  placeholder="..."
                />
                <p className="text-[10px] uppercase tracking-[0.4em] text-slate-700 mt-6">Type and press Enter</p>
              </form>
            )}
          </div>
        )}

        {step === 'result' && (
           <div className="text-center py-24 bg-white/[0.02] rounded-[60px] border border-white/5 backdrop-blur-sm">
              <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-8" />
              <h2 className="text-6xl font-black text-white mb-4 uppercase italic tracking-tighter">Mission Clear</h2>
              <p className="text-2xl text-slate-400 mb-12">Final Score: <span className="text-white font-bold">{score}</span></p>
              <button onClick={() => setStep('select')} className="bg-white text-black px-14 py-6 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Restart Session</button>
           </div>
        )}
      </div>
    </div>
  );
};

export default GamePage;