import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCog, ArrowLeft, Edit3, ShieldCheck, User, Coins } from 'lucide-react';
import api from '../api/axios';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูล User ทั้งหมด
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

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', role: '', total_points: 0, new_password: '' });

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

  const handleSave = async () => {
    try {
      await api.put(`/update-user/${selectedUser.id}`, editForm);
      alert('บันทึกข้อมูลสำเร็จ!');
      setIsModalOpen(false);
      window.location.reload(); 
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

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

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-['Inter'] relative p-12">
      
      {/* --- ปุ่ม Back to Game --- */}
      <button 
        onClick={() => navigate('/game')}
        className="absolute top-10 left-12 flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-bold z-10"
      >
        <ArrowLeft size={20} /> Back to Game
      </button>

      {/* --- Main Content --- */}
      <main className="flex-1 max-w-7xl mx-auto w-full mt-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <header className="mb-10 flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tight italic flex items-center gap-4">
                <UserCog className="text-indigo-500 w-10 h-10" /> User Management
              </h2>
              <p className="text-slate-500 mt-2">จัดการข้อมูลสมาชิก บทบาท และคะแนนทั้งหมด</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-indigo-500">{users.length}</span>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Total Members</p>
            </div>
          </header>

          {/* Grid Cards Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); 
                        handleEditClick(u);
                      }}
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
                      onClick={() => handleDelete(u.id, u.username)}
                      className="text-[10px] font-bold text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-lg uppercase tracking-widest transition-colors relative z-10"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </main>

      {/* --- Modal Editor (ยกมาจากของเดิมเป๊ะๆ) --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-[#111] border border-white/10 w-full max-w-lg rounded-[40px] p-10 shadow-2xl">
              <h2 className="text-3xl font-black italic uppercase mb-8 text-indigo-500">Edit Agent</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Username</label>
                  <input type="text" value={editForm.username} onChange={(e) => setEditForm({...editForm, username: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Role</label>
                    <select value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none">
                      <option value="user" className="bg-[#111]">User</option>
                      <option value="admin" className="bg-[#111]">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Points</label>
                    <input type="number" value={editForm.total_points} onChange={(e) => setEditForm({...editForm, total_points: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block mb-2">New Password</label>
                  <input type="password" placeholder="ปล่อยว่างไว้หากไม่เปลี่ยน" value={editForm.new_password} onChange={(e) => setEditForm({...editForm, new_password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all" />
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button onClick={handleSave} className="flex-1 bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all">Save Changes</button>
                <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 rounded-2xl border border-white/10 font-bold text-slate-500 hover:bg-white/5 transition-all">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;