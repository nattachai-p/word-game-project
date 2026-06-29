import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Search, CheckSquare, Square, ChevronLeft, ChevronRight,
  Target, X, Filter, Layers, ArrowLeft, Loader2, Star
} from 'lucide-react';
import api from '../api/axios';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Word {
  id: number;
  eng: string;
  th_read: string;
  th_meaning: string;
  category: string;
  example_sentence: string;
  example_translation: string;
}

// ─── VocabularyPage ───────────────────────────────────────────────────────────
const VocabularyPage = () => {
  const navigate = useNavigate();

  // ── Data States ──
  // rawWords = ข้อมูลดิบจาก API (ไม่ถูก filter ด้วย focus)
  const [rawWords, setRawWords]       = useState<Word[]>([]);
  const [focusIds, setFocusIds]       = useState<Set<number>>(new Set());
  const [categories, setCategories]   = useState<string[]>([]);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [loading, setLoading]         = useState(true);
  // focusLoading เก็บแค่ word_id ที่กำลัง API call อยู่ (spinner เฉพาะ card)
  const [focusLoading, setFocusLoading] = useState<Set<number>>(new Set());

  // ── Filter / Search States ──
  const [search, setSearch]           = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory]       = useState('');
  const [showFocusOnly, setShowFocusOnly] = useState(false);
  const [page, setPage]               = useState(1);
  const [isAll, setIsAll]             = useState(false);

  const LIMIT = 20;

  // ── displayedWords = คำนวณจาก rawWords + focusIds + showFocusOnly ──────────
  // useMemo: คำนวณใหม่เฉพาะเมื่อ rawWords, focusIds, หรือ showFocusOnly เปลี่ยน
  // ✅ ไม่ trigger re-fetch ใด ๆ ทั้งสิ้น
  const displayedWords = useMemo<Word[]>(() => {
    if (!showFocusOnly) return rawWords;
    return rawWords.filter(w => focusIds.has(w.id));
  }, [rawWords, focusIds, showFocusOnly]);

  // ── Debounce search ──────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Fetch Focus IDs (เรียกครั้งเดียวตอน mount) ───────────────────────────
  const fetchFocusIds = useCallback(async () => {
    try {
      const res = await api.get('/focus');
      setFocusIds(new Set<number>(res.data.focusIds));
    } catch (_) {
      setFocusIds(new Set());
    }
  }, []);

  // ── Fetch Categories ──────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  // ── Fetch Words ─────────────────────────────────────────────────────────────
  // ✅ KEY FIX: focusIds และ showFocusOnly ไม่อยู่ใน dependency อีกต่อไป
  //    fetchWords จะ re-run เฉพาะเมื่อ pagination / search / category เปลี่ยน
  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        limit: isAll ? 'all' : String(LIMIT),
        page: String(page),
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (category)        params.category = category;

      const res = await api.get('/words/all', { params });
      // เก็บ rawWords ไว้ตรง ๆ ไม่ filter ที่นี่
      setRawWords(res.data.words);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [page, isAll, debouncedSearch, category]); // ← ไม่มี focusIds, showFocusOnly

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => { fetchFocusIds(); }, [fetchFocusIds]);
  useEffect(() => { fetchWords(); }, [fetchWords]);

  // reset page เมื่อ pagination mode หรือ filter หลักเปลี่ยน
  // ✅ showFocusOnly ไม่ trigger fetch แล้ว — filter ฝั่ง client ล้วน ๆ
  useEffect(() => { setPage(1); }, [category, isAll]);

  // ── Toggle single focus (Optimistic Update) ───────────────────────────────
  // ✅ ไม่ re-fetch หน้าเลย — แค่ flip focusIds แล้ว displayedWords คำนวณใหม่เอง
  const toggleFocus = async (wordId: number) => {
    const wasSelected = focusIds.has(wordId);

    // 1. Optimistic: อัปเดต UI ทันที ก่อน API response
    setFocusIds(prev => {
      const next = new Set(prev);
      if (wasSelected) next.delete(wordId);
      else next.add(wordId);
      return next;
    });

    // 2. Show spinner บน card นั้น ๆ
    setFocusLoading(prev => new Set(prev).add(wordId));

    try {
      if (wasSelected) {
        await api.delete(`/focus/${wordId}`);
      } else {
        await api.post(`/focus/${wordId}`);
      }
    } catch (err) {
      // 3. Rollback ถ้า API ล้มเหลว
      console.error('Toggle focus failed — rolling back:', err);
      setFocusIds(prev => {
        const rollback = new Set(prev);
        if (wasSelected) rollback.add(wordId);   // คืนค่าเดิม
        else rollback.delete(wordId);
        return rollback;
      });
    } finally {
      setFocusLoading(prev => { const n = new Set(prev); n.delete(wordId); return n; });
    }
  };

  // ── Bulk Focus ────────────────────────────────────────────────────────────
  const handleBulk = async (action: 'focus_all' | 'unfocus_all') => {
    try {
      const res = await api.post('/focus/bulk', { action });
      if (action === 'focus_all') {
        // ต้องดึง ID ทุกคำมาใส่ focusIds — ดึง fresh จาก API
        await fetchFocusIds();
        alert(`✅ Focus ทั้งหมด ${res.data.count} คำแล้ว!`);
      } else {
        setFocusIds(new Set());
        alert('🗑️ เคลียร์ Focus ทั้งหมดแล้ว!');
      }
    } catch (err) {
      alert('❌ เกิดข้อผิดพลาด');
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050505] text-white font-['Inter']">

      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-[#050505]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/game')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-bold text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <h1 className="text-xl font-black uppercase tracking-widest">Vocabulary</h1>
            </div>
          </div>

          {/* Focus counter pill — อัปเดต smooth ไม่กระโดด */}
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {focusIds.size > 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-2 bg-indigo-600/20 border border-indigo-500/30 px-4 py-2 rounded-full"
                >
                  <Target className="w-4 h-4 text-indigo-400" />
                  <motion.span
                    key={focusIds.size}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-indigo-300 font-bold text-sm tabular-nums"
                  >
                    {focusIds.size} Focused
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Toolbar ── */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาคำศัพท์หรือคำแปล..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-600"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="bg-transparent text-sm text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Focus Only Toggle */}
          <button
            onClick={() => setShowFocusOnly(!showFocusOnly)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-bold text-sm transition-all ${
              showFocusOnly
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Star className={`w-4 h-4 ${showFocusOnly ? 'fill-indigo-400 text-indigo-400' : ''}`} />
            Focus Only
          </button>
        </div>

        {/* ── Bulk Action Bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
          <p className="text-sm text-slate-500">
            แสดง <span className="text-white font-bold">{displayedWords.length}</span> จาก{' '}
            <span className="text-white font-bold">{total}</span> คำ
            {focusIds.size > 0 && (
              <span className="ml-2 text-indigo-400">
                · Focus ไว้{' '}
                <motion.span
                  key={focusIds.size}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  className="font-bold tabular-nums"
                >
                  {focusIds.size}
                </motion.span>{' '}
                คำ
              </span>
            )}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleBulk('focus_all')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-xl text-sm font-bold transition-all"
            >
              <CheckSquare className="w-4 h-4" />
              Tick ทั้งหมด
            </button>
            <button
              onClick={() => handleBulk('unfocus_all')}
              disabled={focusIds.size === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-500/30 text-red-400 rounded-xl text-sm font-bold transition-all disabled:opacity-30"
            >
              <Square className="w-4 h-4" />
              เอาออกทั้งหมด
            </button>
            {/* Pagination toggle */}
            <button
              onClick={() => { setIsAll(!isAll); setPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                isAll
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              {isAll ? 'แบ่งหน้า' : 'แสดงทั้งหมด'}
            </button>
          </div>
        </div>

        {/* ── Word Grid ── */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          </div>
        ) : displayedWords.length === 0 ? (
          <div className="text-center py-32 text-slate-600">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">
              {showFocusOnly ? 'ยังไม่มีคำที่ Focus ไว้ในหน้านี้' : 'ไม่พบคำศัพท์ที่ตรงกัน'}
            </p>
          </div>
        ) : (
          // ✅ key ไม่รวม focusIds.size → ป้องกัน AnimatePresence destroy+remount ทั้ง grid
          <AnimatePresence mode="wait">
            <motion.div
              key={`${page}-${debouncedSearch}-${category}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {displayedWords.map(word => {
                const isFocused  = focusIds.has(word.id);
                const isToggling = focusLoading.has(word.id);

                return (
                  <motion.div
                    key={word.id}
                    layout="position"
                    className={`relative group bg-white/[0.02] border rounded-2xl p-5 transition-colors hover:bg-white/[0.04] cursor-default ${
                      isFocused
                        ? 'border-indigo-500/40 shadow-[0_0_20px_rgba(79,70,229,0.1)]'
                        : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Tick Button */}
                    <button
                      onClick={() => toggleFocus(word.id)}
                      disabled={isToggling}
                      title={isFocused ? 'ยกเลิก Focus' : 'เพิ่ม Focus'}
                      className={`absolute top-4 right-4 p-2 rounded-xl transition-all ${
                        isFocused
                          ? 'bg-indigo-600/30 text-indigo-300 hover:bg-red-900/30 hover:text-red-400'
                          : 'bg-white/5 text-slate-600 hover:bg-indigo-600/20 hover:text-indigo-400 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isToggling
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : isFocused
                          ? <CheckSquare className="w-4 h-4" />
                          : <Square className="w-4 h-4" />
                      }
                    </button>

                    {/* Word content */}
                    <div className="pr-10">
                      <div className="flex items-start gap-3 mb-2">
                        <div>
                          <p className="text-xl font-black text-white uppercase tracking-wide leading-tight">
                            {word.eng}
                          </p>
                          <p className="text-indigo-400 text-xs font-medium mt-0.5">
                            {word.th_read}
                          </p>
                        </div>
                        {word.category && (
                          <span className="ml-auto shrink-0 text-[9px] bg-white/5 border border-white/10 text-slate-500 px-2 py-1 rounded-lg font-bold uppercase tracking-widest">
                            {word.category}
                          </span>
                        )}
                      </div>

                      <p className="text-slate-300 text-sm font-medium mb-3">
                        {word.th_meaning}
                      </p>

                      {word.example_sentence && word.example_sentence !== '-' && (
                        <div className="border-t border-white/5 pt-3">
                          <p className="text-slate-500 text-xs italic leading-relaxed">
                            "{word.example_sentence}"
                          </p>
                          <p className="text-slate-600 text-xs mt-1">
                            {word.example_translation}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── Pagination ── */}
        {!isAll && !loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | string)[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (arr[idx - 1] as number) + 1 !== p) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`dot-${idx}`} className="text-slate-600 px-1">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                        page === p
                          ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'
                          : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabularyPage;
