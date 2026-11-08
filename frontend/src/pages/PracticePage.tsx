import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle2, ArrowRight, Keyboard, Target, BookOpen } from 'lucide-react';
import api from '../api/axios';
import Logo from '../components/Logo';
import Sidebar from '../components/Sidebar';

const PracticePage = () => {
  const navigate = useNavigate();

  // --- States ---
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState<'select' | 'playing'>('select');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [words, setWords] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [showExample, setShowExample] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusCount, setFocusCount] = useState(0);
  const [useFocus, setUseFocus] = useState(true); // ✅ เลือกใช้ Focus หรือไม่

  const nextBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (showExample && nextBtnRef.current) {
      nextBtnRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      nextBtnRef.current.focus();
    }
  }, [showExample]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');
        const res = await api.get('/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
      } catch (err) {
        navigate('/login');
      }
    };
    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data);
      } catch (err) {
        setCategories(['Vocabulary', 'Verb', 'Idiom']);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchFocusCount = async () => {
      try {
        const res = await api.get('/focus');
        setFocusCount(res.data.focusIds.length);
      } catch (_) {
        setFocusCount(0);
      }
    };
    fetchFocusCount();
  }, []);

  // --- Functions ---
  const startPractice = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      if (!useFocus) params.set('focus', 'off'); // ไม่เอา Focus → สุ่มทั้งหมด
      const qs = params.toString();
      const url = qs ? `/words/random?${qs}` : '/words/random';
      const res = await api.get(url);

      const wordList = res.data.words;
      const focusMode = res.data.isFocusMode ?? false;

      if (!wordList || wordList.length === 0) return alert("ไม่พบคำศัพท์ในหมวดนี้!");
      
      setWords(wordList);
      setIsFocusMode(focusMode);
      setStep('playing');
      setCurrentIndex(0);
      setUserInput('');
      setFeedback('none');
      setShowExample(false);
    } catch (err) { alert("Server Error"); }
  };

  const checkAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput || showExample) return;

    const isMatch = userInput.toLowerCase().trim() === words[currentIndex].eng.toLowerCase().trim();

    if (isMatch) {
      setFeedback('correct');
      setTimeout(() => {
        setFeedback('none');
        setShowExample(true);
      }, 800);
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback('none'), 800);
    }
  };

  const nextWord = () => {
    setFeedback('none');
    setShowExample(false);
    setUserInput('');
    
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      alert('จบการฝึกพิมพ์รอบนี้แล้ว! ยอดเยี่ยมมากครับ');
      setStep('select');
    }
  };

  if (!user) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-['Inter']">Loading Data...</div>;

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-['Inter']">
      <Sidebar role={user.role} initialCollapsed={true} />

      <main className={`flex-1 relative transition-colors duration-500 overflow-hidden flex flex-col items-center justify-center
        ${step !== 'select' && feedback === 'wrong' ? 'bg-red-950' : ''}
        ${step !== 'select' && feedback === 'correct' ? 'bg-teal-950' : ''}
      `}>

        {/* ----------------- STEP: SELECT ----------------- */}
        {step === 'select' && (
          <div className="flex flex-col items-center p-6 text-center w-full max-w-4xl">
            <div className="w-full flex justify-between items-center mb-10 border-b border-white/5 pb-6">
              <Logo />
              <div className="flex items-center gap-4 text-right">
                 <h1 className="text-3xl font-black italic tracking-tighter text-teal-400 uppercase flex items-center gap-2">
                    <Keyboard className="w-8 h-8" /> Practice Mode
                 </h1>
              </div>
            </div>

            <div className="space-y-12 w-full max-w-2xl mt-4">

              {focusCount > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between gap-4 bg-teal-600/10 border border-teal-500/30 rounded-2xl px-6 py-4"
                >
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-teal-400 shrink-0" />
                    <div className="text-left">
                      <p className="text-teal-300 font-bold text-sm">Focus Mode Active</p>
                      <p className="text-teal-500 text-xs">คุณมี {focusCount} คำที่ Focus ไว้ — ระบบจะสุ่มเฉพาะคำเหล่านี้มาให้ฝึกพิมพ์</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between gap-4 bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-slate-600 shrink-0" />
                    <p className="text-slate-500 text-sm text-left">ไม่มีคำ Focus — ระบบจะสุ่มจากคำศัพท์ทั้งหมด</p>
                  </div>
                </motion.div>
              )}

              <section>
                <p className="text-teal-500 text-[10px] tracking-[0.4em] uppercase font-black mb-6">Category Selection</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button onClick={() => setSelectedCategory('ALL')} className={`px-6 py-3 rounded-xl border transition-all font-bold ${selectedCategory === 'ALL' ? 'bg-white text-black border-white' : 'border-white/10 text-slate-500 hover:text-white'}`}>ALL</button>
                  {categories.map(c => (
                    <button key={c} onClick={() => setSelectedCategory(c)} className={`px-6 py-3 rounded-xl border transition-all font-bold ${selectedCategory === c ? 'bg-white text-black border-white' : 'border-white/10 text-slate-500 hover:border-white/30'}`}>{c}</button>
                  ))}
                </div>

                {/* ✅ ตัวเลือก Focus — โชว์เมื่อมีคำ Focus */}
                {focusCount > 0 && (
                  <div className="flex items-center justify-center gap-3 mt-8">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Focus</span>
                    <button onClick={() => setUseFocus(true)} className={`px-5 py-2.5 rounded-xl border text-sm font-bold transition-all ${useFocus ? 'bg-teal-500 border-teal-400 text-white' : 'border-white/10 text-slate-500 hover:text-white'}`}>เฉพาะคำ Focus ({focusCount})</button>
                    <button onClick={() => setUseFocus(false)} className={`px-5 py-2.5 rounded-xl border text-sm font-bold transition-all ${!useFocus ? 'bg-white border-white text-black' : 'border-white/10 text-slate-500 hover:text-white'}`}>สุ่มทั้งหมด</button>
                  </div>
                )}
              </section>

              <button onClick={startPractice} className="w-full bg-teal-500 py-6 rounded-2xl text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-teal-400 transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)]">
                Start Typing <Play className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
        )}

        {/* ----------------- STEP: PLAYING ----------------- */}
        {step === 'playing' && (
          <div className="w-full h-full flex flex-col items-center p-6 pt-12 relative">
            
            <AnimatePresence>
              {feedback !== 'none' && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }} className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50 backdrop-blur-sm ${feedback === 'correct' ? 'bg-teal-950/90' : 'bg-red-950/90'}`}>
                  <span className="text-[12rem] drop-shadow-2xl">{feedback === 'correct' ? '🤩' : '😢'}</span>
                  <p className={`text-4xl font-black uppercase tracking-[0.3em] mt-8 ${feedback === 'correct' ? 'text-teal-100' : 'text-red-100'}`}>
                    {feedback === 'correct' ? 'Perfect!' : 'Oops! Try again'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-full max-w-4xl z-10 flex-1 flex flex-col">
              <div className="flex justify-between items-end mb-20 text-white">
                <div className="flex items-center gap-4">
                  <div className="scale-75 origin-left"><Logo /></div>
                  <div className="px-3 py-1 bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Keyboard className="w-3 h-3" /> Practice Mode
                  </div>
                  {isFocusMode && (
                    <div className="flex items-center gap-1.5 bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 rounded-full">
                      <Target className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-wider">Focus Mode</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-8 text-right">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Progress</p>
                    <p className="text-2xl font-black text-slate-300">{currentIndex + 1} / {words.length}</p>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-12">
                <div className="space-y-6 relative">
                  {/* แสดงคำศัพท์เต็มๆ ให้พิมพ์ตาม */}
                  <p className="text-8xl font-mono tracking-[0.2em] text-teal-400 font-bold lowercase">{words[currentIndex]?.eng}</p>
                  <p className="text-3xl text-slate-300 font-medium tracking-wide">{words[currentIndex]?.th_read}</p>
                  <p className="text-5xl text-slate-500 font-light italic">{words[currentIndex]?.th_meaning}</p>
                </div>

                <AnimatePresence>
                  {showExample && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto bg-white/[0.03] p-10 rounded-[40px] border border-teal-500/30 backdrop-blur-xl">
                      <p className="mb-6 uppercase tracking-[0.2em] text-xs font-bold text-green-400 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Correct Spelling!
                      </p>
                      <p className="text-2xl font-medium text-white mb-3 italic">"{words[currentIndex]?.example_sentence}"</p>
                      <p className="text-lg text-slate-400 mb-10">{words[currentIndex]?.example_translation}</p>
                      
                      <button ref={nextBtnRef} onClick={nextWord} className="bg-white text-black px-12 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all">
                        Next Word <ArrowRight className="inline w-5 h-5 ml-2" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!showExample && (
                  <form onSubmit={checkAnswer} className="pt-20 max-w-2xl mx-auto relative">
                    <div className="flex justify-center gap-2 sm:gap-4 relative z-0 pointer-events-none">
                      {(words[currentIndex]?.eng || '').split('').map((_: string, i: number) => {
                        const char = userInput[i] || '';
                        const isFocused = userInput.length === i;
                        
                        let boxBorder = 'border-white/10';
                        let boxText = 'text-white/30';
                        
                        if (feedback === 'wrong') {
                          boxBorder = 'border-red-500';
                          boxText = 'text-red-500';
                        } else if (char) {
                          boxBorder = 'border-teal-400';
                          boxText = 'text-white';
                        } else if (isFocused) {
                          boxBorder = 'border-teal-500 animate-pulse';
                        }

                        return (
                          <div 
                            key={i} 
                            className={`w-12 h-16 sm:w-16 sm:h-20 border-b-4 flex items-center justify-center text-4xl sm:text-5xl font-black lowercase transition-all ${boxBorder} ${boxText}`}
                          >
                            {char}
                          </div>
                        );
                      })}
                    </div>

                    <input 
                      autoFocus
                      type="text"
                      value={userInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.length <= (words[currentIndex]?.eng || '').length) {
                          setUserInput(val);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10 focus:outline-none"
                    />
                    
                    <div className="text-center relative z-0">
                      <p className="text-[10px] uppercase tracking-[0.4em] text-slate-700 mt-8">Type the word above and press Enter</p>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default PracticePage;
