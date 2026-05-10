import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, ArrowRight, Loader2 } from 'lucide-react'; // ลบ Command ออกเพราะไปอยู่ใน Logo แล้ว
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo'; // 1. Import Logo เข้ามา

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Identity and Credential are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:8080/api/login', { username, password });
      localStorage.setItem('token', response.data.token);
      navigate('/game'); 
    } catch (err: any) {
      setError(err.response?.data?.message || "Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex items-center justify-center p-6 font-['Inter'] relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-[400px] z-10"
      >
        {/* 2. เรียกใช้ Component Logo แทนก้อน div เดิม */}
        <Logo />

        <div className="space-y-4">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }} 
                className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3 px-4 rounded-xl mb-4"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold ml-1 text-left block">
                Identity
              </label>
              <div className="group relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Username" 
                  className="w-full bg-[#111] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-white/20 transition-all" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold ml-1 text-left block">
                Credential
              </label>
              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                <input 
                  type="password" 
                  placeholder="Password" 
                  className="w-full bg-[#111] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-white/20 transition-all" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
            </div>

            <motion.button 
              onClick={handleLogin} 
              disabled={loading} 
              whileHover={{ scale: 1.01, backgroundColor: "#fff", color: "#000" }} 
              whileTap={{ scale: 0.99 }} 
              className="w-full bg-white/5 border border-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-4 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
            </motion.button>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-xs text-slate-600">
            Don't have an account? 
            <button 
              onClick={() => navigate('/register')} 
              className="text-slate-400 hover:text-white ml-2 underline underline-offset-4 decoration-white/10 transition-colors"
            >
              Create one now
            </button>
          </p>
        </div>
      </motion.div>

      {/* Grid Background */}
      <div 
        className="absolute inset-0 z-[-1] opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 40V39L0 39V40zm40-40V0L39 0V40H40V0z'/%3E%3C/g%3E%3C/svg%3E")` }}
      ></div>
    </div>
  );
};

export default LoginPage;