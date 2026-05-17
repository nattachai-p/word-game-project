import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCog, 
  BookPlus, 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  User, 
  Coins 
} from 'lucide-react';
import api from '../api/axios';

const AdminSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'words'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูล User ทั้งหมดมาโชว์ในรูปแบบ Grid
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch users", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // =========================================================
  // [เริ่ม] ส่วนที่ 1: Logic สำหรับการแก้ไขและลบข้อมูล (Functions)
  // =========================================================
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', role: '', total_points: 0, new_password: '' });

  // ฟังก์ชันเปิด Modal พร้อมดึงข้อมูล User นั้นมาใส่ Form
  const handleEditClick = (user: any) => {
    setSelectedUser(user);
    setEditForm({ 
      username: user.username, 
      role: user.role, 
      total_points: user.total_points || 0, 
      new_password: '' 
    });
    setIsModalOpen(true);
  };

  // ฟังก์ชันบันทึกข้อมูล (Update)
  const handleSave = async () => {
    try {
      // เรียกใช้ API put ที่เราแก้ชื่อใหม่ /update-user/
      await api.put(`/update-user/${selectedUser.id}`, editForm);
      alert('บันทึกข้อมูลสำเร็จ!');
      setIsModalOpen(false);
      window.location.reload(); // รีโหลดเพื่อให้ข้อมูลล่าสุดแสดงผล
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  // ฟังก์ชันลบ User
  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ "${name}"?`)) {
      try {
        await api.delete(`/delete-user/${id}`);
        setUsers(users.filter(u => u.id !== id));
      } catch (err) {
        alert('ลบไม่สำเร็จ');
      }
    }
  };
  // =========================================================
  // [สิ้นสุด] ส่วนที่ 1
  // =========================================================

  return (
    <div className="min-h-screen bg-[#050505] text-white flex font-['Inter']">
      
      {/* --- Sidebar --- */}
      <aside className="w-72 border-r border-white/5 bg-[#0a0a0a] flex flex-col p-6">
        <div className="mb-12 px-2">
          <h1 className="text-2xl font-black italic tracking-tighter text-indigo-500">ADMIN PANEL</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold">Control Center v1.0</p>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all font-bold ${activeTab === 'users' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
          >
            <UserCog size={20} /> User Management
          </button>
          <button 
            onClick={() => setActiveTab('words')}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all font-bold ${activeTab === 'words' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
          >
            <BookPlus size={20} /> Word Database (AI)
          </button>
        </nav>

        <button 
          onClick={() => navigate('/game')}
          className="mt-auto flex items-center gap-4 px-4 py-4 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all font-bold"
        >
          <ArrowLeft size={20} /> Back to Game
        </button>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 p-12 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'users' ? (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
            >
              <header className="mb-10 flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tight italic">User Management</h2>
                  <p className="text-slate-500">จัดการข้อมูลสมาชิก บทบาท และคะแนนทั้งหมด</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-indigo-500">{users.length}</span>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Total Members</p>
                </div>
              </header>

              {/* Grid Cards Layout */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {loading ? (
    <p className="col-span-full text-center py-20 text-slate-500 italic">Loading agents...</p>
  ) : (
    users.map((u) => (
      <motion.div 
        key={u.id}
        whileHover={{ y: -5 }}
        className="bg-[#111] border border-white/5 p-6 rounded-[32px] group hover:border-indigo-500/50 transition-all relative overflow-hidden"
      >
        <div className="absolute -right-4 -top-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
          <UserCog size={120} />
        </div>

        <div className="flex justify-between items-start mb-6">
          <div className={`p-3 rounded-2xl ${u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-white/5 text-slate-400'}`}>
            {u.role === 'admin' ? <ShieldCheck size={24} /> : <User size={24} />}
          </div>
          
          {/* [แก้ไขตรงนี้] เอา opacity-0 ออกชั่วคราวเพื่อให้เห็นปุ่มชัดๆ และเพิ่ม z-index */}
          <button 
            onClick={(e) => {
              e.stopPropagation(); // กันไม่ให้ Event ไหลไปโดนตัวการ์ด
              console.log("Button Clicked for user:", u.username); // เช็คใน F12
              handleEditClick(u);
            }}
          /* อธิบาย Class:
    - opacity-0: ล่องหนตอนปกติ
    - group-hover:opacity-100: เมื่อเอาเมาส์วางที่ "การ์ด" ให้ปุ่มชัดขึ้นมา
    - transition-all & duration-300: ให้มันค่อยๆ เฟด ไม่ดีดขึ้นมาทันที
  */
  className="p-3 bg-white/10 hover:bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 relative z-10 text-white"
>
  <Edit3 size={20} />
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold truncate">{u.username}</h3>
          <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${u.role === 'admin' ? 'text-indigo-500' : 'text-slate-500'}`}>
            {u.role}
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Coins size={14} className="text-yellow-500" />
            <span className="text-sm font-bold text-slate-300">{u.total_points || 0} PTS</span>
          </div>

          <button 
            onClick={() => {
              console.log("Delete Clicked for id:", u.id);
              handleDelete(u.id, u.username);
            }}
            className="text-[10px] font-bold text-red-500 hover:bg-red-500/10 px-3 py-1 rounded-lg uppercase tracking-widest transition-colors relative z-10"
          >
            Delete
          </button>
        </div>
      </motion.div>
    ))
  )}
</div>
            </motion.div>
          ) : (
            <motion.div 
              key="words"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
            >
              <h2 className="text-4xl font-black uppercase tracking-tight italic">Word Database</h2>
              <p className="text-slate-500">ส่วนนี้เตรียมไว้สำหรับการเพิ่มคำศัพท์ด้วย AI...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ========================================================= */}
      {/* [เริ่ม] ส่วนที่ 2: UI หน้าต่างเด้ง (Modal Editor) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            {/* พื้นหลังมืดๆ (Backdrop) */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* การ์ดหน้าต่างแก้ไข (Modal Card) */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-[#111] border border-white/10 w-full max-w-lg rounded-[40px] p-10 shadow-2xl"
            >
              <h2 className="text-3xl font-black italic uppercase mb-8 text-indigo-500">Edit Agent</h2>
              
              <div className="space-y-6">
                {/* แก้ไข Username */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Username</label>
                  <input 
                    type="text" 
                    value={editForm.username} 
                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                {/* แก้ไข Role และ Points */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Role</label>
                    <select 
                      value={editForm.role}
                      onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none"
                    >
                      <option value="user" className="bg-[#111]">User</option>
                      <option value="admin" className="bg-[#111]">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Points</label>
                    <input 
                      type="number" 
                      value={editForm.total_points}
                      onChange={(e) => setEditForm({...editForm, total_points: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none"
                    />
                  </div>
                </div>

                {/* แก้ไข Password ใหม่ */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block mb-2">New Password (ปล่อยว่างไว้หากไม่เปลี่ยน)</label>
                  <input 
                    type="password" 
                    placeholder="Enter new password..."
                    value={editForm.new_password} 
                    onChange={(e) => setEditForm({...editForm, new_password: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* ปุ่มกดยืนยัน หรือ ยกเลิก */}
              <div className="mt-10 flex gap-4">
                <button 
                  onClick={handleSave}
                  className="flex-1 bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all"
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 rounded-2xl border border-white/10 font-bold text-slate-500 hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ========================================================= */}
      {/* [สิ้นสุด] ส่วนที่ 2 */}
      {/* ========================================================= */}

    </div>
  );
};

export default AdminSettings;