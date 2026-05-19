import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, UserCog, BookPlus, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    // ✅ ตั้งให้ User Management วิ่งไปหน้า /admin/users
    { id: 'users', icon: UserCog, label: 'User Management', path: '/admin/users' }, 
    { id: 'word-db', icon: BookPlus, label: 'Word Database (AI)', path: '/admin/word-db' },
  ];

  const handleMenuClick = (item: any) => {
    if (item.id === 'dashboard') {
      alert('ฟีเจอร์นี้อยู่ระหว่างการ Implement ครับกัปตัน! 🚀');
    } else {
      navigate(item.path);
    }
  };

  return (
    <motion.aside 
      animate={{ width: isCollapsed ? 88 : 288 }} // 288px = w-72 ของเดิม
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      // ✅ ใช้สีพื้นหลัง bg-[#0a0a0a] ตามหน้า Admin เดิม
      className="bg-[#0a0a0a] border-r border-white/5 flex flex-col min-h-screen relative z-50"
    >
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-10 bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-full border-4 border-[#0a0a0a] transition-colors"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={`p-6 mb-8 mt-4 ${isCollapsed ? 'text-center px-0' : 'px-8'}`}>
        <h2 className="text-2xl font-black italic tracking-tighter text-indigo-500">
          {isCollapsed ? 'AP' : 'ADMIN PANEL'}
        </h2>
        {!isCollapsed && <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold mt-1">Control Center v1.0</p>}
      </div>

      <nav className="flex-1 space-y-3 px-4">
        {menuItems.map((item) => {
          // เช็คให้แม่นยำขึ้น: ถ้าเป็น /admin เฉยๆ ต้องตรงเป๊ะ จะได้ไม่ไปซ้อนกับ /admin/word-db
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item)}
              title={isCollapsed ? item.label : ''}
              className={`w-full flex items-center gap-4 py-4 rounded-2xl transition-all font-bold ${
                isCollapsed ? 'justify-center px-0' : 'px-4'
              } ${
                isActive 
                  // ✅ สไตล์ปุ่มเรืองแสงที่กัปตันชอบ
                  ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} className={isActive && !isCollapsed ? 'text-black' : ''} />
              {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button 
          onClick={() => {
            localStorage.removeItem('token');
            navigate('/login');
          }}
          title={isCollapsed ? 'Sign Out' : ''}
          className={`w-full flex items-center gap-4 py-4 rounded-2xl text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all ${
            isCollapsed ? 'justify-center px-0' : 'px-4'
          }`}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="font-bold text-sm whitespace-nowrap">Sign Out</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;