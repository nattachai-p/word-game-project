import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Play, CheckCircle2, ArrowRight, RefreshCcw, User as UserIcon, Lightbulb, Target, BookOpen, Clock } from 'lucide-react';
import api from '../api/axios';
import Logo from '../components/Logo';
import Sidebar from '../components/Sidebar';

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
  const navigate = useNavigate();

  // --- States ---
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState<'select' | 'playing' | 'result'>('select');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [level, setLevel] = useState<'Easy' | 'Normal' | 'Hard'>('Easy');
  const [words, setWords] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0); // คะแนนของรอบนี้
  const [maskedWord, setMaskedWord] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [showExample, setShowExample] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);  // ✅ โหมด Focus
  const [focusCount, setFocusCount] = useState(0);         // ✅ จำนวนคำที่ Focus ไว้
  
  // Timer States
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTiming, setIsTiming] = useState(false);

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
    let interval: ReturnType<typeof setInterval>;
    if (isTiming) {
      const startTimeMs = Date.now() - timeElapsed * 1000;
      interval = setInterval(() => {
        setTimeElapsed((Date.now() - startTimeMs) / 1000);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isTiming]);

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

  // ✅ ดึงจำนวน Focus เพื่อแสดงใน Select Screen
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
  const startStore = async () => {
    try {
      const url = selectedCategory === 'ALL' ? '/words/random' : `/words/random?category=${selectedCategory}`;
      const res = await api.get(url);

      // ✅ Backend ตอบกลับเป็น { words: [...], isFocusMode: bool }
      const wordList = res.data.words;
      const focusMode = res.data.isFocusMode ?? false;

      if (!wordList || wordList.length === 0) return alert("ไม่พบคำศัพท์ในหมวดนี้!");
      
      setWords(wordList);
      setIsFocusMode(focusMode);
      setStep('playing');
      setCurrentIndex(0);
      setScore(0);
      setUserInput('');
      setFeedback('none');
      setShowExample(false);
      setIsRevealed(false);
      setIsTiming(true);
      setTimeElapsed(0);
      prepareWord(wordList[0], level);
    } catch (err) { alert("Server Error"); }
  };

  const prepareWord = (wordObj: any, currentLevel: string) => {
    const settings = { lv1: 0.6, lv2: 0.3 }; 
    setMaskedWord(generateHint(wordObj.eng, currentLevel, settings));
  };

  // ✅ ฟังก์ชันอัปเดตคะแนนลง Database ทันทีที่เล่นแต่ละข้อ
  const syncPoints = async (pointsChange: number) => {
    setScore(prev => prev + pointsChange); // อัปเดตคะแนนรอบนี้บนจอ

    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/update-points', // 🚀 ยิงไป API ตัวใหม่
        { points: pointsChange },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data && res.data.updatedUser) {
        setUser((prevUser: any) => ({
          ...prevUser,
          total_points: res.data.updatedUser.total_points // อัปเดตแต้มรวมบนจอให้ตรง DB ทันที
        }));
      }
    } catch (err) {
      console.error("Auto-save คะแนนล้มเหลว:", err);
    }
  };

  const checkAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput || showExample) return;

    const isMatch = userInput.toLowerCase().trim() === words[currentIndex].eng.toLowerCase().trim();

    if (isMatch) {
      setFeedback('correct');
      setIsTiming(false); // Stop the timer when correct
      syncPoints(10); // 🚀 ตอบถูก ยิงเซฟ +10
      setTimeout(() => {
        setFeedback('none');
        setShowExample(true);
      }, 1200);
    } else {
      setFeedback('wrong');
      syncPoints(-5); // 🚀 ตอบผิด ยิงเซฟ -5
      setTimeout(() => setFeedback('none'), 1000);
    }
  };

  const handleSkip = () => {
    if (showExample) return;
    syncPoints(-2); // 🚀 กดข้าม ยิงเซฟ -2
    nextWord();
  };

  const handleRevealAnswer = () => {
    if (showExample) return;
    setMaskedWord(words[currentIndex].eng);
    setIsRevealed(true);
    setShowExample(true);
  };

  const nextWord = async () => {
    setFeedback('none');
    setShowExample(false);
    setIsRevealed(false); 
    setUserInput('');
    setIsTiming(false);
    setTimeElapsed(0);
    
    if (currentIndex < words.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      prepareWord(words[nextIdx], level);
    } else {
      // 🚀 เล่นจบไปหน้า Result เลย ไม่ต้องยิงเซฟคะแนนอีกรอบแล้ว
      setStep('result');
    }
  };

  if (!user) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-['Inter']">Loading Data...</div>;

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-['Inter']">
      
      {/* ✅ เปิดให้ทุกคนเห็น Sidebar และบังคับย่อ */}
      <Sidebar role={user.role} initialCollapsed={true} />

      <main className={`flex-1 relative transition-colors duration-500 overflow-hidden flex flex-col items-center justify-center
        ${step !== 'select' && feedback === 'wrong' ? 'bg-red-950' : ''}
        ${step !== 'select' && feedback === 'correct' ? 'bg-green-950' : ''}
      `}>

        {/* ----------------- STEP: SELECT ----------------- */}
        {step === 'select' && (
          <div className="flex flex-col items-center p-6 text-center w-full max-w-4xl">
            <div className="w-full flex justify-between items-center mb-10 border-b border-white/5 pb-6">
              <Logo />
              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="text-[10px] text-slate-500 tracking-widest uppercase font-bold">Welcome,</p>
                  <p className="font-bold text-indigo-400">{user.username}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-slate-300" />
                </div>
              </div>
            </div>

            <div className="space-y-12 w-full max-w-2xl mt-4">

              {/* ✅ Focus Mode Info Banner */}
              {focusCount > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between gap-4 bg-indigo-600/10 border border-indigo-500/30 rounded-2xl px-6 py-4"
                >
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div className="text-left">
                      <p className="text-indigo-300 font-bold text-sm">Focus Mode Active</p>
                      <p className="text-indigo-500 text-xs">คุณมี {focusCount} คำที่ Focus ไว้ — เกมจะสุ่มเฉพาะคำเหล่านี้</p>
                    </div>
                  </div>
                  <a
                    href="/vocabulary"
                    className="shrink-0 flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> จัดการ
                  </a>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between gap-4 bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-slate-600 shrink-0" />
                    <p className="text-slate-500 text-sm text-left">ไม่มีคำ Focus — เกมจะสุ่มจากคำศัพท์ทั้งหมด</p>
                  </div>
                  <a
                    href="/vocabulary"
                    className="shrink-0 flex items-center gap-1.5 text-xs text-slate-500 hover:text-white font-bold transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> เลือก Focus
                  </a>
                </motion.div>
              )}

              <section>
                <p className="text-indigo-500 text-[10px] tracking-[0.4em] uppercase font-black mb-6">Category Selection</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button onClick={() => setSelectedCategory('ALL')} className={`px-6 py-3 rounded-xl border transition-all font-bold ${selectedCategory === 'ALL' ? 'bg-white text-black border-white' : 'border-white/10 text-slate-500 hover:text-white'}`}>ALL</button>
                  {categories.map(c => (
                    <button key={c} onClick={() => setSelectedCategory(c)} className={`px-6 py-3 rounded-xl border transition-all font-bold ${selectedCategory === c ? 'bg-white text-black border-white' : 'border-white/10 text-slate-500 hover:border-white/30'}`}>{c}</button>
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
        )}

        {/* ----------------- STEP: PLAYING / RESULT ----------------- */}
        {step !== 'select' && (
          <div className="w-full h-full flex flex-col items-center p-6 pt-12 relative">
            
            <AnimatePresence>
              {feedback !== 'none' && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }} className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50 backdrop-blur-sm ${feedback === 'correct' ? 'bg-green-950/90' : 'bg-red-950/90'}`}>
                  <span className="text-[12rem] drop-shadow-2xl">{feedback === 'correct' ? '🤩' : '😢'}</span>
                  <p className={`text-4xl font-black uppercase tracking-[0.3em] mt-8 ${feedback === 'correct' ? 'text-green-100' : 'text-red-100'}`}>
                    {feedback === 'correct' ? 'Excellent!' : 'Wrong! (-5 PTS)'}
                  </p>
                  {feedback === 'correct' && (
                    <p className="text-xl text-green-200 mt-4 font-bold tracking-widest bg-green-900/50 px-6 py-2 rounded-full border border-green-500/30 flex items-center gap-2">
                      <Clock className="w-5 h-5" /> TIME: {timeElapsed.toFixed(1)}s
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-full max-w-4xl z-10 flex-1 flex flex-col">
              <div className="flex justify-between items-end mb-20 text-white">
                <div className="flex items-center gap-4">
                  <div className="scale-75 origin-left"><Logo /></div>
                  {/* ✅ Focus Mode Badge — แสดงเฉพาะตอนเล่นในโหมด Focus */}
                  {isFocusMode && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1.5 bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 rounded-full"
                      title="กำลังเล่นในโหมด Focus — สุ่มเฉพาะคำที่คุณ Tick ไว้"
                    >
                      <Target className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-wider">Focus Mode</span>
                    </motion.div>
                  )}
                </div>
                
                {/* ✅ โชว์คะแนนรวม (DB) และคะแนนรอบนี้แยกกัน */}
                <div className="flex gap-8 text-right">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" /> Time
                    </p>
                    <p className={`text-4xl font-black transition-all ${isTiming ? 'text-white' : 'text-slate-400'}`}>
                      {timeElapsed.toFixed(1)}s
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold">Total Points</p>
                    <p className="text-2xl font-black text-slate-300">{user.total_points}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Round Score</p>
                    <p className={`text-4xl font-black transition-all ${feedback === 'wrong' ? 'text-red-500 scale-110' : feedback === 'correct' ? 'text-green-400 scale-110' : 'text-white'}`}>
                      {score > 0 ? `+${score}` : score}
                    </p>
                  </div>
                </div>
              </div>

              {step === 'playing' && (
                <div className="text-center space-y-12">
                  <div className="space-y-6 relative">
                    <p className="text-8xl font-mono tracking-[0.2em] text-indigo-500 font-bold uppercase">{maskedWord}</p>
                    <p className="text-3xl text-slate-300 font-medium tracking-wide">{words[currentIndex]?.th_read}</p>
                    <p className="text-5xl text-slate-500 font-light italic">{words[currentIndex]?.th_meaning}</p>
                    
                    {!showExample && (
                      <div className="absolute -right-20 top-0 flex flex-col gap-4">
                        <button onClick={handleSkip} className="p-3 text-slate-700 hover:text-white transition-colors group flex flex-col items-center gap-1" title="Skip Word (-2 pts)">
                          <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                          <span className="text-[8px] font-bold text-red-500 uppercase tracking-tighter opacity-0 group-hover:opacity-100">-2 PTS</span>
                        </button>
                        <button onClick={handleRevealAnswer} className="p-3 text-slate-700 hover:text-amber-400 transition-colors group flex flex-col items-center gap-1" title="Reveal & Learn (0 pts)">
                          <Lightbulb className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span className="text-[8px] font-bold text-amber-400 uppercase tracking-tighter opacity-0 group-hover:opacity-100">LEARN</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {showExample && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto bg-white/[0.03] p-10 rounded-[40px] border border-indigo-500/30 backdrop-blur-xl">
                        
                        <p className="mb-6 uppercase tracking-[0.2em] text-xs font-bold">
                          {isRevealed ? (
                            <span className="text-amber-400 flex items-center justify-center gap-2"><Lightbulb className="w-4 h-4" /> Study Mode: Word Revealed</span>
                          ) : (
                            <span className="text-green-400 flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Correct Answer!</span>
                          )}
                        </p>

                        <p className="text-2xl font-medium text-white mb-3 italic">"{words[currentIndex]?.example_sentence}"</p>
                        <p className="text-lg text-slate-400 mb-10">{words[currentIndex]?.example_translation}</p>
                        
                        <button ref={nextBtnRef} onClick={nextWord} className="bg-white text-black px-12 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all">
                          {isRevealed ? "Skip to Next" : "Next Word"} <ArrowRight className="inline w-5 h-5 ml-2" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!showExample && (
                    <form onSubmit={checkAnswer} className="pt-20 max-w-2xl mx-auto relative">
                      {/* Visual Boxes */}
                      <div className="flex justify-center gap-2 sm:gap-4 relative z-0 pointer-events-none">
                        {(words[currentIndex]?.eng || '').split('').map((_, i) => {
                          const char = userInput[i] || '';
                          const isFocused = userInput.length === i; // The current active box
                          
                          let boxBorder = 'border-white/10';
                          let boxText = 'text-white/30';
                          
                          if (feedback === 'wrong') {
                            boxBorder = 'border-red-500';
                            boxText = 'text-red-500';
                          } else if (char) {
                            boxBorder = 'border-indigo-400';
                            boxText = 'text-white';
                          } else if (isFocused) {
                            boxBorder = 'border-indigo-500 animate-pulse';
                          }

                          return (
                            <div 
                              key={i} 
                              className={`w-12 h-16 sm:w-16 sm:h-20 border-b-4 flex items-center justify-center text-4xl sm:text-5xl font-black uppercase transition-all ${boxBorder} ${boxText}`}
                            >
                              {char}
                            </div>
                          );
                        })}
                      </div>

                      {/* Hidden Actual Input */}
                      <input 
                        autoFocus
                        type="text"
                        value={userInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!isTiming && !showExample && val.length > 0) setIsTiming(true);
                          if (val.length <= (words[currentIndex]?.eng || '').length) {
                            setUserInput(val);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10 focus:outline-none"
                      />
                      
                      <div className="text-center relative z-0">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-slate-700 mt-8">Type and press Enter</p>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {step === 'result' && (
                <div className="text-center py-24 bg-white/[0.02] rounded-[60px] border border-white/5 backdrop-blur-sm m-auto w-full">
                  <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-8" />
                  <h2 className="text-6xl font-black text-white mb-4 uppercase italic tracking-tighter">Mission Clear</h2>
                  <p className="text-2xl text-slate-400 mb-12">Final Round Score: <span className="text-white font-bold">{score}</span></p>
                  <button onClick={() => setStep('select')} className="bg-white text-black px-14 py-6 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Restart Session</button>
                </div>
              )}

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default GamePage;