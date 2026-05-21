import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Gamepad2, Database, Users, LogOut, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = ({ role, initialCollapsed = false }: { role?: string, initialCollapsed?: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className={`relative bg-[#0a0a0a] border-r border-white/5 flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-indigo-600 rounded-full p-1 text-white hover:bg-indigo-500 transition-colors z-50 shadow-[0_0_10px_rgba(79,70,229,0.5)]"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={`p-8 flex items-center ${isCollapsed ? 'justify-center px-0' : ''}`}>
        {/* ✅ เปลี่ยนโลโก้ตอนย่อให้เป็น Icon จอยเกม */}
        {isCollapsed ? (
          <Gamepad2 className="w-8 h-8 text-indigo-500" />
        ) : (
          <h2 className="text-2xl font-black italic tracking-tighter text-indigo-500 uppercase whitespace-nowrap overflow-hidden">
            Word<span className="text-white">Game</span>
          </h2>
        )}
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-hidden">
        {/* ❌ เอาปุ่ม Play Game ออกตามที่กัปตันสั่ง */}
        
        <Link to="/dashboard" title="Dashboard" className={`flex items-center gap-3 py-3 rounded-xl transition-all ${isActive('/dashboard') ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-500 hover:bg-white/5 hover:text-white'} ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}>
          <BarChart3 className="w-5 h-5 min-w-[20px]" />
          {!isCollapsed && <span className="font-bold tracking-wide text-sm whitespace-nowrap">Dashboard</span>}
        </Link>

        <Link to="/admin/word-db" title="Word Database" className={`flex items-center gap-3 py-3 rounded-xl transition-all ${isActive('/admin/word-db') ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-500 hover:bg-white/5 hover:text-white'} ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}>
          <Database className="w-5 h-5 min-w-[20px]" />
          {!isCollapsed && <span className="font-bold tracking-wide text-sm whitespace-nowrap">Word Database</span>}
        </Link>

        {role === 'admin' && (
          <Link to="/admin/users" title="User Management" className={`flex items-center gap-3 py-3 rounded-xl transition-all ${isActive('/admin/users') ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-500 hover:bg-white/5 hover:text-white'} ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}>
            <Users className="w-5 h-5 min-w-[20px]" />
            {!isCollapsed && <span className="font-bold tracking-wide text-sm whitespace-nowrap">User Management</span>}
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button onClick={handleLogout} title="Logout" className={`w-full flex items-center gap-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-bold tracking-wide text-sm ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}>
          <LogOut className="w-5 h-5 min-w-[20px]" />
          {!isCollapsed && <span className="whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;