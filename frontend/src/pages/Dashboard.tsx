import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Building,
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Activity,
  UserCheck,
  Zap
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { apiService } from "../services/api";
import { formatIDR } from "../utils/exportHelpers";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await apiService.dashboard.getStats();
        setStats(res);

        // Fetch support data for charts
        const [employees, attendance, payroll, applicants] = await Promise.all([
          apiService.employees.getAll(),
          apiService.attendance.getAll(),
          apiService.payroll.getAll(),
          apiService.recruitment.getApplicants()
        ]);

        // Process Attendance Chart (Hadir vs Terlambat vs Absen vs Cuti vs Izin)
        const attCounts: Record<string, number> = { Hadir: 0, Terlambat: 0, Absen: 0, Cuti: 0, Izin: 0 };
        attendance.forEach((a: any) => {
          if (attCounts[a.status] !== undefined) attCounts[a.status]++;
        });
        const processedAttendance = Object.keys(attCounts).map(status => ({
          status,
          Jumlah: attCounts[status]
        }));

        // Process Payroll Chart by month
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
        const payrollByMonth: Record<string, number> = {};
        payroll.forEach((p: any) => {
          const monthIdx = parseInt(p.month) - 1;
          const monthLabel = monthNames[monthIdx] || `Bln ${p.month}`;
          payrollByMonth[monthLabel] = (payrollByMonth[monthLabel] || 0) + p.total_pay;
        });
        const processedPayroll = Object.keys(payrollByMonth).map(month => ({
          month,
          Pengeluaran: payrollByMonth[month]
        }));

        // Process Recruitment Chart by Selection Status
        const stageCounts: Record<string, number> = { Administrasi: 0, Interview: 0, "HR Test": 0, Diterima: 0, Ditolak: 0 };
        applicants.forEach((a: any) => {
          if (stageCounts[a.selection_status] !== undefined) stageCounts[a.selection_status]++;
        });
        const COLORS = ["#3b82f6", "#6366f1", "#a855f7", "#10b981", "#ef4444"];
        const processedApplicants = Object.keys(stageCounts).map((stage, idx) => ({
          name: stage,
          value: stageCounts[stage],
          color: COLORS[idx]
        }));

        setChartData({
          attendance: processedAttendance,
          payroll: processedPayroll.length > 0 ? processedPayroll : [{ month: "Jun", Pengeluaran: 45000000 }],
          applicants: processedApplicants
        });

      } catch (e) {
        console.error("Gagal mengambil data dashboard:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-3 sm:p-4 lg:p-5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="app-card p-6 animate-pulse h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          <div className="app-card p-6 animate-pulse h-80 xl:col-span-2" />
          <div className="app-card p-6 animate-pulse h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-5 lg:h-[calc(100vh-64px)] flex flex-col gap-3 animate-fade-in bg-slate-50 dark:bg-slate-950 overflow-x-hidden overflow-y-auto transition-colors duration-300">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 shrink-0">
        <div>
          <span className="text-[10px] text-indigo-650 font-bold uppercase tracking-widest block">Portal Utama</span>
          <h2 className="text-lg lg:text-xl font-display font-bold text-slate-800 tracking-tight leading-tight">Executive Dashboard</h2>
        </div>
        <div className="flex items-center gap-2 mt-1 md:mt-0">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-slate-500 font-mono">Ringkasan Nexora HR</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 shrink-0">
        {/* BLOCK 1: Stats Karyawan */}
        <div className="app-card p-3 flex items-center justify-between group hover:border-indigo-500/50 transition-all duration-300">
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Karyawan Aktif</span>
            <span className="text-xl font-bold font-display text-slate-800 tracking-tight mt-0.5 block">
              {stats.totalEmployees?.toLocaleString("id-ID")}
            </span>
            <span className="text-[8px] text-emerald-650 font-semibold block mt-0.5">▲ 100% Aktif</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center transition-transform group-hover:scale-105 duration-300 shrink-0">
            <Users size={15} />
          </div>
        </div>

        {/* BLOCK 2: Stats Divisi */}
        <div className="app-card p-3 flex items-center justify-between group hover:border-indigo-500/50 transition-all duration-300">
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Divisi & Jabatan</span>
            <div className="flex items-baseline gap-1 mt-0.5 text-slate-855">
              <span className="text-xl font-bold font-display tracking-tight">
                {stats.totalDivisions?.toLocaleString("id-ID")}
              </span>
              <span className="text-[8px] text-slate-450 font-bold uppercase tracking-wider">Divisi</span>
              <span className="text-slate-300">/</span>
              <span className="text-lg font-bold font-display text-slate-605 tracking-tight">
                {stats.totalPositions?.toLocaleString("id-ID")}
              </span>
              <span className="text-[8px] text-slate-455 font-bold uppercase tracking-wider">Jabatan</span>
            </div>
            <span className="text-[8px] text-slate-400 block mt-0.5">Struktur Terpetakan</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-105 duration-300 shrink-0">
            <Building size={15} />
          </div>
        </div>

        {/* BLOCK 3: Stats Kehadiran */}
        <div className="app-card p-3 flex items-center justify-between group hover:border-indigo-500/50 transition-all duration-300">
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Hadir Hari Ini</span>
            <span className="text-xl font-bold font-display text-slate-800 tracking-tight mt-0.5 block">
              {stats.presentToday?.toLocaleString("id-ID")}
            </span>
            <span className="text-[8px] text-emerald-655 font-semibold block mt-0.5">Excellent Attendance</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-105 duration-300 shrink-0">
            <UserCheck size={15} />
          </div>
        </div>

        {/* BLOCK 4: Stats Penggajian */}
        <div className="app-card p-3 flex items-center justify-between group hover:border-indigo-500/50 transition-all duration-300">
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Total Kas Gaji</span>
            <span className="text-lg font-bold font-display text-slate-800 tracking-tight mt-0.5 block truncate">
              {formatIDR(stats.totalPayrollValue)}
            </span>
            <span className="text-[8px] text-slate-400 block mt-0.5">Anggaran Berjalan</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center transition-transform group-hover:scale-105 duration-300 shrink-0">
            <DollarSign size={15} />
          </div>
        </div>
      </div>

      {/* Charts and Details Section */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-3">
        {/* Left Side (col-span-8) - Payroll Chart and Bottom Charts */}
        <div className="xl:col-span-8 flex flex-col gap-3 min-h-0">
          {/* Payroll Trend Chart */}
          <div className="app-card h-56 sm:h-64 lg:h-[220px] p-3 flex flex-col justify-between shrink-0">
            <div className="flex items-center justify-between mb-1 shrink-0">
              <div>
                <span className="text-[9px] font-bold text-indigo-650 uppercase tracking-widest block">Statistik Keuangan</span>
                <h3 className="text-xs font-bold text-slate-850">Tren Pengeluaran Penggajian</h3>
              </div>
              <TrendingUp size={14} className="text-slate-400" />
            </div>
            <div className="flex-1 min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData?.payroll} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGaji" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} tickFormatter={(val) => `Rp ${val/1000000}jt`} />
                  <Tooltip formatter={(value) => formatIDR(Number(value))} />
                  <Area type="monotone" dataKey="Pengeluaran" stroke="#6366f1" strokeWidth={1.5} fillOpacity={1} fill="url(#colorGaji)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Row - Recruitment & Attendance (h-36 lg:h-[160px]) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[14rem] lg:min-h-[16rem] shrink-0">
            {/* Recruitment */}
            <div className="app-card p-3 flex flex-col justify-between overflow-hidden">
              <div className="shrink-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Sumber Daya Manusia</span>
                <h3 className="text-xs font-bold text-slate-855 mt-0.5">Status Seleksi Pelamar</h3>
              </div>
              
              <div className="flex-1 min-h-0 flex items-center justify-between gap-3 mt-1">
                {/* Pie Chart */}
                <div className="w-20 h-20 relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData?.applicants?.filter((d: any) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={28}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {chartData?.applicants?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-855 font-mono">
                      {chartData?.applicants?.reduce((acc: number, d: any) => acc + d.value, 0)}
                    </span>
                    <span className="text-[7px] text-slate-400 uppercase font-semibold">Total</span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-2 gap-y-0.5 overflow-y-auto max-h-[70px] pr-1">
                  {chartData?.applicants?.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-[9px] text-slate-650 border-b border-slate-50 pb-0.5 last:border-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="truncate">{entry.name}</span>
                      </div>
                      <strong className="font-mono text-slate-855 shrink-0 ml-1">{entry.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Attendance Histogram */}
            <div className="app-card p-3 flex flex-col justify-between overflow-hidden">
              <div className="shrink-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Analitik Presensi</span>
                <h3 className="text-xs font-bold text-slate-855 mt-0.5">Rekapitulasi Absensi</h3>
              </div>
              <div className="flex-1 min-h-0 w-full mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData?.attendance} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="status" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="Jumlah" fill="#6366f1" radius={[2, 2, 0, 0]}>
                      {chartData?.attendance?.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.status === "Hadir"
                              ? "#10b981"
                              : entry.status === "Terlambat"
                              ? "#f59e0b"
                              : entry.status === "Cuti"
                              ? "#3b82f6"
                              : entry.status === "Izin"
                              ? "#a855f7"
                              : "#ef4444"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side (col-span-4) - Activities Feed and Quick Actions */}
        <div className="xl:col-span-4 flex flex-col gap-3 min-h-0">
          {/* Activities Feed */}
          <div className="app-card h-56 sm:h-64 lg:h-[220px] p-3 flex flex-col justify-between overflow-hidden shrink-0">
            <div className="flex items-center justify-between mb-1.5 border-b border-slate-100 pb-1 shrink-0">
              <div>
                <span className="text-[10px] font-bold text-slate-455 uppercase tracking-widest block">Log Real-Time</span>
                <h3 className="text-xs font-bold text-slate-855 mt-0.5">Aktivitas Terbaru</h3>
              </div>
              <Activity size={14} className="text-indigo-600" />
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0">
              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((act: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-[10px] border-b border-slate-50 pb-1.5 last:border-0 last:pb-0">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      act.type === "attendance" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                    }`}>
                      {act.type === "attendance" ? <Clock size={10} /> : <Calendar size={10} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 font-medium leading-relaxed text-xs break-words">{act.message}</p>
                      <p className="text-slate-455 font-mono text-[8px] mt-0.5">{act.time}</p>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-full font-semibold text-[8px] uppercase border shrink-0 ${
                      act.tag === "Approved" || act.tag === "Hadir"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : act.tag === "Pending" || act.tag === "Terlambat"
                        ? "bg-amber-50 text-amber-600 border-amber-100"
                        : "bg-slate-50 text-slate-500 border-slate-100"
                    }`}>
                      {act.tag}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Activity size={24} className="stroke-1 animate-pulse text-slate-300 mb-1" />
                  <span className="text-[10px]">Belum ada aktivitas tercatat</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions (Mini Grid) */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-3 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-950/20 flex flex-col justify-between shrink-0 min-h-[10rem] lg:min-h-[12rem] text-white">
            <div className="shrink-0">
              <h3 className="text-[10px] font-bold flex items-center gap-1.5">
                <Zap size={12} className="text-amber-355 animate-pulse" />
                <span className="tracking-widest uppercase text-[9px] font-bold text-white">Akses Cepat</span>
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1.5 flex-1 items-center">
              <button
                onClick={() => navigate("/employees")}
                className="py-1.5 px-2 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-lg text-[10px] font-semibold text-center transition-all cursor-pointer border border-white/10 shadow-xs text-white"
              >
                Tambah Karyawan
              </button>
              <button
                onClick={() => navigate("/payroll")}
                className="py-1.5 px-2 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-lg text-[10px] font-semibold text-center transition-all cursor-pointer border border-white/10 shadow-xs text-white"
              >
                Proses Gaji
              </button>
              <button
                onClick={() => navigate("/reports")}
                className="py-1.5 px-2 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-lg text-[10px] font-semibold text-center transition-all cursor-pointer border border-white/10 shadow-xs text-white"
              >
                Cetak Laporan
              </button>
              <button
                onClick={() => navigate("/attendance")}
                className="py-1.5 px-2 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-lg text-[10px] font-semibold text-center transition-all cursor-pointer border border-white/10 shadow-xs text-white"
              >
                Log Absensi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
