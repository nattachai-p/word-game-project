import { useState, useEffect, useMemo } from 'react';
import { History, Loader2, Users, BarChart3 } from 'lucide-react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';

interface LogRow {
  id: number;
  user_id: number | null;
  username: string;
  logged_at: string;
}
interface MonthlyRow {
  month: string;   // YYYY-MM
  username: string;
  count: number;
}

const LogPage = () => {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('ALL'); // ALL = ภาพรวม

  useEffect(() => {
    const load = async () => {
      try {
        const [logsRes, monthlyRes] = await Promise.all([
          api.get('/logs'),
          api.get('/logs/monthly'),
        ]);
        setLogs(logsRes.data);
        setMonthly(monthlyRes.data);
      } catch (err) {
        console.error('Failed to load logs', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // รายชื่อ user ที่เคย login (ไว้ทำ dropdown)
  const users = useMemo(
    () => Array.from(new Set(monthly.map((r) => r.username))).sort(),
    [monthly]
  );

  // ข้อมูลกราฟรายเดือน — ภาพรวม (รวมทุก user) หรือเฉพาะ user ที่เลือก
  const chartData = useMemo(() => {
    const map: Record<string, number> = {};
    monthly.forEach((r) => {
      if (selectedUser !== 'ALL' && r.username !== selectedUser) return;
      map[r.month] = (map[r.month] || 0) + r.count;
    });
    return Object.keys(map)
      .sort()
      .map((m) => ({ month: m, count: map[m] }));
  }, [monthly, selectedUser]);

  const maxCount = Math.max(1, ...chartData.map((d) => d.count));
  const totalInView = chartData.reduce((s, d) => s + d.count, 0);

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-['Inter']">
      <Sidebar role={localStorage.getItem('role') || undefined} initialCollapsed={false} />
      <div className="flex-1 min-w-0 p-8 md:p-12 overflow-y-auto">

        {/* Header */}
        <div className="max-w-6xl mx-auto flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <History className="w-8 h-8 text-indigo-500" />
            <h1 className="text-3xl font-black uppercase tracking-widest">Login Log</h1>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-indigo-500">{logs.length}</span>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Recent Logins</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-8">

            {/* ── Monthly Chart ── */}
            <div className="bg-white/[0.02] border border-white/5 rounded-[30px] p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Logins per Month
                  <span className="text-indigo-400 ml-2">· {totalInView} ครั้ง</span>
                </h2>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
                  <Users className="w-4 h-4 text-slate-500" />
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="bg-transparent text-sm text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL" className="bg-[#111]">ภาพรวม (ทุก User)</option>
                    {users.map((u) => (
                      <option key={u} value={u} className="bg-[#111]">{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {chartData.length === 0 ? (
                <p className="text-center text-slate-600 py-16 italic">ยังไม่มีข้อมูลการ login</p>
              ) : (
                <div className="flex items-end gap-4 h-64 overflow-x-auto pb-2">
                  {chartData.map((d) => (
                    <div key={d.month} className="flex flex-col items-center gap-2 flex-1 min-w-[48px]">
                      <span className="text-xs font-bold text-slate-300">{d.count}</span>
                      <div className="w-full flex items-end" style={{ height: '180px' }}>
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all"
                          style={{ height: `${(d.count / maxCount) * 100}%` }}
                          title={`${d.month}: ${d.count} ครั้ง`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">{d.month}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Recent Logins Table ── */}
            <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4 text-right">Date / Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((row) => (
                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3 font-bold text-white">{row.username}</td>
                      <td className="px-6 py-3 text-right text-slate-400 font-mono text-xs">
                        {new Date(row.logged_at).toLocaleString('th-TH')}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-6 py-16 text-center text-slate-500 italic">
                        ยังไม่มีประวัติการ login
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default LogPage;
