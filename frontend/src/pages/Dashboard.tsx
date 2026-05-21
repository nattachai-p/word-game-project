import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, BarChart3, Star, ArrowLeft } from 'lucide-react';
import api from '../api/axios';
// ❌ เอาการ Import Sidebar ออกไป

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/leaderboard');
        setLeaderboard(res.data);
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (!user) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-['Inter']">Loading...</div>;

  return (
    // ✅ ลบ Tag ย่อยของ Sidebar ออก เปลี่ยนให้เนื้อหาเต็มจอ
    <div className="min-h-screen bg-[#050505] text-white font-['Inter'] p-8 md:p-12 overflow-y-auto">
      
      {/* Header */}
      <div className="max-w-5xl mx-auto flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          {/* ✅ ปุ่ม Back to Game สุดเท่ */}
          <button 
            onClick={() => navigate('/game')}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-2xl transition-all font-bold tracking-wide"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Game
          </button>
          
          <div className="hidden md:flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-500" />
            <h1 className="text-3xl font-black uppercase tracking-widest">Dashboard</h1>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-[10px] text-slate-500 tracking-widest uppercase font-bold">Logged in as</p>
          <p className="font-bold text-indigo-400">{user.username}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* ช่องว่างซ้าย (รอฟีเจอร์อนาคต) */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-[30px] p-8 backdrop-blur-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2"><Star className="w-4 h-4"/> Coming Soon</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              พื้นที่นี้เตรียมไว้สำหรับสถิติส่วนตัว เช่น คำศัพท์ที่ตอบผิดบ่อยที่สุด หรืออัตราการชนะ (Win Rate) ในอนาคตครับ!
            </p>
          </div>
        </div>

        {/* กระดาน Leaderboard */}
        <div className="md:col-span-2 bg-white/[0.02] border border-white/5 rounded-[40px] p-8 md:p-12 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="flex flex-col items-center mb-10 relative z-10">
            <Trophy className="w-16 h-16 text-yellow-500 mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]" />
            <h2 className="text-4xl font-black uppercase italic tracking-tighter">Hall of Fame</h2>
            <p className="text-indigo-400 text-xs tracking-[0.3em] font-bold mt-2">TOP 10 PLAYERS</p>
          </div>

          {loading ? (
            <p className="text-center text-slate-500 py-10 animate-pulse relative z-10">Loading Leaderboard...</p>
          ) : (
            <div className="space-y-3 relative z-10">
              {leaderboard.map((player, index) => {
                const isFirst = index === 0;
                const isSecond = index === 1;
                const isThird = index === 2;
                
                return (
                  <div key={player.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isFirst ? 'bg-yellow-500/10 border-yellow-500/30' : isSecond ? 'bg-slate-300/10 border-slate-300/20' : isThird ? 'bg-orange-700/10 border-orange-700/30' : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03]'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${isFirst ? 'text-yellow-500 bg-yellow-500/10' : isSecond ? 'text-slate-300 bg-slate-300/10' : isThird ? 'text-orange-400 bg-orange-700/20' : 'text-slate-600 bg-white/5'}`}>
                        {index < 3 ? <Medal className="w-5 h-5" /> : `#${index + 1}`}
                      </div>
                      <p className={`font-bold tracking-wide ${isFirst ? 'text-yellow-400 text-xl' : 'text-white'}`}>
                        {player.username}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black font-mono tracking-wider">{player.total_points}</p>
                      <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Points</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default Dashboard;