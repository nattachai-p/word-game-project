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
interface PeriodRow {
  username: string;
  count: number;
  [key: string]: any; // month (YYYY-MM) หรือ day (YYYY-MM-DD)
}

type Granularity = 'day' | 'month';

const LogPage = () => {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [monthly, setMonthly] = useState<PeriodRow[]>([]);
  const [daily, setDaily] = useState<PeriodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('ALL'); // ALL = ภาพรวม
  const [granularity, setGranularity] = useState<Granularity>('day'); // ดีฟอลต์รายวัน

  useEffect(() => {
    const load = async () => {
      try {
        const [logsRes, monthlyRes, dailyRes] = await Promise.all([
          api.get('/logs'),
          api.get('/logs/monthly'),
          api.get('/logs/daily'),
        ]);
        setLogs(logsRes.data);
        setMonthly(monthlyRes.data);
        setDaily(dailyRes.data);
      } catch (err) {
        console.error('Failed to load logs', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // รายชื่อ user ที่เคย login (รวมจากทั้งรายเดือน+รายวัน)
  const users = useMemo(
    () => Array.from(new Set([...monthly, ...daily].map((r) => r.username))).sort(),
    [monthly, daily]
  );

  // ข้อมูลกราฟ — เลือกรายวัน/รายเดือน + ภาพรวมหรือเฉพาะ user
  const chartData = useMemo(() => {
    const src = granularity === 'day' ? daily : monthly;
    const key = granularity === 'day' ? 'day' : 'month';
    const map: Record<string, number> = {};
    src.forEach((r) => {
      if (selectedUser !== 'ALL' && r.username !== selectedUser) return;
      const p = r[key];
      map[p] = (map[p] || 0) + r.count;
    });
    return Object.keys(map)
      .sort()
      .map((p) => ({ period: p, count: map[p] }));
  }, [daily, monthly, granularity, selectedUser]);

  const maxCount = Math.max(1, ...chartData.map((d) => d.count));
  const totalInView = chartData.reduce((s, d) => s + d.count, 0);
  const unitLabel = granularity === 'day' ? 'Day' : 'Month';

  const tabBtn = (g: Granularity, label: string) => (
    <button
      onClick={() => setGranularity(g)}
      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
        granularity === g ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

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

            {/* ── Chart ── */}
            <div className="bg-white/[0.02] border border-white/5 rounded-[30px] p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Logins per {unitLabel}
                  <span className="text-indigo-400 ml-2">· {totalInView} ครั้ง</span>
                </h2>
                <div className="flex items-center gap-3">
                  {/* Toggle รายวัน/รายเดือน */}
                  <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
                    {tabBtn('day', 'รายวัน')}
                    {tabBtn('month', 'รายเดือน')}
                  </div>
                  {/* เลือก User */}
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
              </div>

              {chartData.length === 0 ? (
                <p className="text-center text-slate-600 py-16 italic">
                  {granularity === 'day' ? 'ยังไม่มีข้อมูลการ login ใน 60 วันล่าสุด' : 'ยังไม่มีข้อมูลการ login'}
                </p>
              ) : (
                <div className="flex items-end gap-2 h-64 overflow-x-auto pb-2">
                  {chartData.map((d) => (
                    <div key={d.period} className="flex flex-col items-center gap-2 flex-1 min-w-[34px]">
                      <span className="text-[11px] font-bold text-slate-300">{d.count}</span>
                      <div className="w-full flex items-end" style={{ height: '180px' }}>
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all"
                          style={{ height: `${(d.count / maxCount) * 100}%` }}
                          title={`${d.period}: ${d.count} ครั้ง`}
                        />
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono whitespace-nowrap">
                        {granularity === 'day' ? d.period.slice(5) : d.period}
                      </span>
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
