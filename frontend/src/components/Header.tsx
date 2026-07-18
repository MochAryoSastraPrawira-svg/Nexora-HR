import React, { useEffect, useState } from "react";
import { Clock, CheckCircle, Menu, Moon, Sun } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { apiService } from "../services/api";
import { toast } from "react-hot-toast";

type HeaderProps = {
  onOpenMobileNav?: () => void;
};

export default function Header({ onOpenMobileNav }: HeaderProps) {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [time, setTime] = useState(new Date().toLocaleTimeString("id-ID"));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString("id-ID"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodayAttendance = async () => {
    if (!user) return;
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await apiService.attendance.getAll({ nik: user.nik, date: todayStr });
      setTodayAttendance(res && res.length > 0 ? res[0] : null);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
  }, [user]);

  const handleCheckIn = async () => {
    if (!user) return;
    const promise = apiService.attendance.checkIn(user.nik, "Absen via Header");
    await toast.promise(promise, {
      loading: "Melakukan Check In...",
      success: (res) => {
        fetchTodayAttendance();
        return `Berhasil Check In jam ${res.data.check_in}! Status: ${res.data.status}`;
      },
      error: (err: any) => err.response?.data?.error || "Gagal melakukan check-in"
    });
  };

  const handleCheckOut = async () => {
    if (!user) return;
    const promise = apiService.attendance.checkOut(user.nik);
    await toast.promise(promise, {
      loading: "Melakukan Check Out...",
      success: (res) => {
        fetchTodayAttendance();
        return `Berhasil Check Out jam ${res.data.check_out}! Lembur: ${res.data.overtime_hours} jam`;
      },
      error: (err: any) => err.response?.data?.error || "Gagal melakukan check-out"
    });
  };

  if (!user) return null;

  return (
    <header className="min-h-16 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-40 px-4 py-3 md:px-6 flex flex-wrap items-center justify-between gap-3 shadow-sm backdrop-blur transition-colors duration-300">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={onOpenMobileNav}
          className="md:hidden p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0">
          <span className="text-[11px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider block truncate">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric"
            })}
          </span>
          <h1 className="text-sm sm:text-base font-semibold text-slate-800 truncate">
            Halo, {user.name} <span className="font-normal text-slate-500">({user.position})</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        <button
          type="button"
          onClick={toggleTheme}
          className="app-button-secondary flex items-center gap-2 px-3 py-2 rounded-xl"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          <span className="text-xs font-semibold uppercase tracking-wide">{theme === "dark" ? "Light" : "Dark"}</span>
        </button>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-sm text-slate-700 dark:text-slate-200 font-semibold shadow-inner">
          <Clock size={16} className="text-slate-400 animate-pulse" />
          <span>{time}</span>
        </div>

        <div className="flex items-center gap-2">
          {!todayAttendance ? (
            <button
              onClick={handleCheckIn}
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-xs px-3 sm:px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/10 cursor-pointer"
            >
              Check In
            </button>
          ) : !todayAttendance.check_out ? (
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-xl font-medium whitespace-nowrap">
                Masuk ({todayAttendance.check_in})
              </span>
              <button
                onClick={handleCheckOut}
                className="bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white font-semibold text-xs px-3 sm:px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                Check Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl whitespace-nowrap">
              <CheckCircle size={14} />
              <span className="truncate">Hari ini Selesai</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

