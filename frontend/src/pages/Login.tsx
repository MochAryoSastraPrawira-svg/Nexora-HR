import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { apiService } from "../services/api";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, Key, Sparkles, Building, AlertCircle, User } from "lucide-react";
import { toast } from "react-hot-toast";
import { NexoraLogo } from "../components/NexoraLogo";

export default function Login() {
  const { user, login } = useAuthStore();
  const navigate = useNavigate();

  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Login form fields
  const [username, setUsername] = useState(""); // NIK or Email
  const [password, setPassword] = useState("");

  // Register form fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [loading, setLoading] = useState(false);

  // If already logged in, skip login page
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Silakan isi semua bidang input.");
      return;
    }

    try {
      setLoading(true);
      const res = await apiService.auth.login(username, password);
      
      // Update store
      login(res.user);
      toast.success(`Selamat datang kembali, ${res.user.name}!`);
      
      // Navigate
      navigate("/");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Kredensial salah atau akun dinonaktifkan.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      toast.error("Silakan isi semua bidang input pendaftaran.");
      return;
    }

    try {
      setLoading(true);
      const res = await apiService.auth.register({
        name: regName,
        email: regEmail,
        password: regPassword
      });
      toast.success(res.message || "Pendaftaran sukses! Silakan gunakan email untuk masuk.");

      // Auto fill and toggle back to login mode
      setUsername(regEmail);
      setPassword(regPassword);
      setIsRegisterMode(false);

      // Clear register inputs
      setRegName("");
      setRegEmail("");
      setRegPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal membuat akun.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Container holding Login / Register Panel */}
      <div className="w-full max-w-md bg-white border border-slate-200/80 shadow-2xl rounded-3xl p-8 space-y-6 relative overflow-hidden animate-fade-in">
        
        {/* Decorative backdrop glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />

        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-xl shadow-indigo-500/10 border border-slate-100">
            <NexoraLogo className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-slate-800 tracking-tight flex items-center justify-center gap-1.5">
              <span>Nexora <span className="text-indigo-600">HR</span> Portal</span>
              <Sparkles size={14} className="text-indigo-500" />
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Nexora HR Management - Dashboard Karyawan Terintegrasi</p>
          </div>
        </div>

        {!isRegisterMode ? (
          <>
            {/* Credentials Form (Login) */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Identitas Pengguna</label>
                <div className="relative">
                  <Mail size={16} className="text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="NIK (NIK-2026-001) atau Email Kerja"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-sm pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 transition-colors bg-slate-50/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Kata Sandi</label>
                <div className="relative">
                  <Key size={16} className="text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    placeholder="Masukkan password portal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 transition-colors bg-slate-50/50"
                    required
                  />
                </div>
              </div>

              {/* Trigger button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-lg shadow-indigo-500/15 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? "Menautkan Kunci..." : "Masuk ke Dashboard"}
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-150"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-400 uppercase tracking-widest font-semibold font-mono">Atau</span>
              <div className="flex-grow border-t border-slate-150"></div>
            </div>

            <button
              onClick={() => setIsRegisterMode(true)}
              className="w-full border border-slate-200 hover:bg-slate-50 text-slate-650 font-semibold text-xs uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              Buat Akun Identitas Baru
            </button>
          </>
        ) : (
          <>
            {/* Registration Form */}
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Nama Lengkap</label>
                <div className="relative">
                  <User size={16} className="text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="Masukkan nama lengkap Anda"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full text-sm pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 transition-colors bg-slate-50/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Alamat Email</label>
                <div className="relative">
                  <Mail size={16} className="text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    placeholder="nama.email@domain.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full text-sm pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 transition-colors bg-slate-50/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Kata Sandi Baru</label>
                <div className="relative">
                  <Key size={16} className="text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    placeholder="Buat sandi minimal 6 karakter"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full text-sm pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 transition-colors bg-slate-50/50"
                    required
                  />
                </div>
              </div>

              {/* Trigger button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-650 hover:bg-indigo-750 disabled:bg-indigo-400 text-white font-semibold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-lg shadow-indigo-500/15 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? "Menyimpan Data..." : "Daftarkan Identitas Baru"}
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-150"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-400 uppercase tracking-widest font-semibold font-mono">Atau</span>
              <div className="flex-grow border-t border-slate-150"></div>
            </div>

            <button
              onClick={() => setIsRegisterMode(false)}
              className="w-full border border-slate-200 hover:bg-slate-50 text-slate-650 font-semibold text-xs uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              Kembali ke Login
            </button>
          </>
        )}

        {/* Footer info */}
        <div className="text-center text-[10px] text-slate-400 font-mono">
          Nexora HR © 2026. SECURE GATEWAY
        </div>

      </div>
    </div>
  );
}

