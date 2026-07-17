import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { apiService } from "../services/api";
import { Employee, Attendance } from "../types";
import {
  User,
  Key,
  Calendar,
  ShieldAlert,
  Award,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  Briefcase
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  // Change password fields
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fetchProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await apiService.auth.getProfile(user.nik);
      setProfile(res);
    } catch (e) {
      toast.error("Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Semua field kata sandi wajib diisi");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password baru tidak cocok");
      return;
    }

    try {
      await apiService.auth.updateProfile(user.nik, { password: newPassword });
      toast.success("Password Anda berhasil diperbarui!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal memperbarui password");
    }
  };

  if (loading || !profile) {
    return (
      <div className="p-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight">Akun Saya</h2>
        <p className="text-slate-500 text-sm">Lihat profil kepegawaian Anda, verifikasi penugasan, dan kelola keamanan password portal.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Card: Profile Display (7 Columns) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm lg:col-span-7 p-6 space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar frame */}
            <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-400 text-3xl">
              {profile.photo ? (
                <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                profile.name.split(" ").slice(0, 2).map(n => n[0]).join("")
              )}
            </div>

            <div className="text-center md:text-left space-y-1">
              <span className="text-xs text-blue-600 font-mono font-semibold uppercase bg-blue-50 px-2 py-0.5 rounded">
                NIK: {profile.nik}
              </span>
              <h3 className="text-lg font-bold text-slate-800 mt-1">{profile.name}</h3>
              <p className="text-sm text-slate-500 font-medium">{profile.position}</p>
              <p className="text-xs text-slate-400 font-mono">{profile.division}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <Mail size={16} className="text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase">Email Kantor</p>
                <span className="font-semibold text-slate-700">{profile.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone size={16} className="text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase">No Handphone</p>
                <span className="font-semibold text-slate-700">{profile.phone}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Calendar size={16} className="text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase">Tanggal Masuk</p>
                <span className="font-semibold text-slate-700 font-mono">{profile.joining_date}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Briefcase size={16} className="text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase">Hak Akses Portal</p>
                <span className="font-semibold text-blue-600 uppercase">{profile.role}</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 md:col-span-2">
              <MapPin size={16} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase">Alamat Domisili</p>
                <span className="font-semibold text-slate-700">{profile.address || "-"}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="border-t border-slate-100 pt-6 grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Sisa Jatah Cuti</span>
                <p className="text-2xl font-bold font-mono text-blue-600 mt-1">{profile.remaining_leave} hari</p>
              </div>
              <CheckCircle size={24} className="text-blue-500/20" />
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Status Akun</span>
                <p className="text-lg font-extrabold text-emerald-500 mt-1 uppercase">{profile.status}</p>
              </div>
              <Clock size={24} className="text-emerald-500/20 animate-pulse" />
            </div>
          </div>

        </div>

        {/* Right Card: Security / Password (5 Columns) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm lg:col-span-5 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Key size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-slate-800 text-sm">Ganti Password Portal</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1">Password Lama Anda</label>
              <input
                type="password"
                placeholder="Masukkan kata sandi lama"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1">Password Baru</label>
              <input
                type="password"
                placeholder="Masukkan kata sandi baru"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1">Konfirmasi Password Baru</label>
              <input
                type="password"
                placeholder="Ketik ulang kata sandi baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-indigo-500"
                required
              />
            </div>

            <div className="flex gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-slate-600 text-[10px] items-start">
              <ShieldAlert size={16} className="text-indigo-500 shrink-0 mt-0.5" />
              <span>
                Kata sandi Anda digunakan untuk mengakses seluruh data presensi, kompensasi gaji, dan pengajuan cuti. Harap jangan pernah membagikan password ini ke orang lain.
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/10 cursor-pointer transition-colors"
            >
              Simpan Kata Sandi Baru
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
