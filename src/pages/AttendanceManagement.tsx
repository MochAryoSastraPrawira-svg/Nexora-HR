import React, { useEffect, useState } from "react";
import { apiService } from "../services/api";
import { Attendance, Employee } from "../types";
import { useAuthStore } from "../store/authStore";
import {
  Clock,
  Search,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Trash2,
  Plus,
  CheckCircle,
  Settings
} from "lucide-react";
import { toast } from "react-hot-toast";
import { ConfirmDialog } from "../components/ConfirmDialog";

export default function AttendanceManagement() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Manual Attendance Modal / Form states
  const [showManualModal, setShowManualModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);
  const [formData, setFormData] = useState({
    employee_nik: "",
    date: new Date().toISOString().split("T")[0],
    check_in: "08:00:00",
    check_out: "17:00:00",
    status: "Hadir" as "Hadir" | "Terlambat" | "Absen" | "Cuti" | "Izin",
    notes: "",
    overtime_hours: "0"
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allLogs, allEmps] = await Promise.all([
        apiService.attendance.getAll(),
        apiService.employees.getAll()
      ]);
      setLogs(allLogs);
      setEmployees(allEmps);
    } catch (e) {
      toast.error("Gagal memuat log absensi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenManualModal = () => {
    setFormData({
      employee_nik: employees[0]?.nik || "",
      date: new Date().toISOString().split("T")[0],
      check_in: "08:00:00",
      check_out: "17:00:00",
      status: "Hadir",
      notes: "Koreksi manual oleh HR",
      overtime_hours: "0"
    });
    setShowManualModal(true);
  };

  const handleSaveManualAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee_nik || !formData.date || !formData.status) {
      toast.error("Silakan lengkapi semua isian.");
      return;
    }

    try {
      const payload = {
        ...formData,
        overtime_hours: parseInt(formData.overtime_hours)
      };
      await apiService.attendance.saveManual(payload);
      toast.success("Log absensi berhasil diperbarui/disimpan!");
      setShowManualModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal menyimpan absensi");
    }
  };

  const handleDeleteLog = async (id: number) => {
    setConfirmPayload({
      title: "Hapus Catatan Absensi",
      description: "Yakin ingin menghapus catatan absensi ini? Tindakan ini tidak dapat dibatalkan.",
      onConfirm: async () => {
        try {
          await apiService.attendance.delete(id);
          toast.success("Log absensi terhapus.");
          fetchData();
        } catch (e) {
          toast.error("Gagal menghapus absensi");
        } finally {
          setShowConfirmDialog(false);
          setConfirmPayload(null);
        }
      }
    });
    setShowConfirmDialog(true);
  };

  // Filter Logic
  const filteredLogs = logs.filter(log => {
    // If current user is standard Employee, they should ONLY see their own attendance logs!
    const isEmployeeRole = user?.role === "Employee";
    const matchesUser = isEmployeeRole ? log.employee_nik === user?.nik : true;

    const matchesSearch = log.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.employee_nik.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = filterDate ? log.date === filterDate : true;
    const matchesStatus = filterStatus ? log.status === filterStatus : true;

    return matchesUser && matchesSearch && matchesDate && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight">Presensi & Lemburan</h2>
          <p className="text-slate-500 text-sm">
            {user?.role === "Employee"
              ? "Riwayat log pencatatan jam check-in dan lembur Anda."
              : "Verifikasi kartu kehadiran harian, lemburan, dan input absensi manual."}
          </p>
        </div>
        
        {/* Only HR and Admin can adjust logs manually */}
        {user?.role !== "Employee" && (
          <button
            onClick={handleOpenManualModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer self-start"
          >
            <Plus size={16} />
            <span>Koreksi Absensi Manual</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari NIK atau nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={user?.role === "Employee"}
            className="w-full text-sm pl-9 pr-4 py-2 border border-slate-200 rounded-lg outline-hidden focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>

        {/* Date Filter */}
        <div className="relative">
          <Calendar size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full text-sm pl-9 pr-4 py-2 border border-slate-200 rounded-lg outline-hidden focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-hidden focus:border-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="Hadir">Hadir</option>
            <option value="Terlambat">Terlambat</option>
            <option value="Cuti">Cuti</option>
            <option value="Izin">Izin</option>
            <option value="Absen">Mangkir (Absen)</option>
          </select>
        </div>
      </div>

      {/* Attendance Log Table */}
      {loading ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-96" />
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <Clock size={48} className="mx-auto stroke-1 text-slate-300 mb-3" />
          <p className="text-sm font-medium">Belum ada log absensi tercatat</p>
          <span className="text-xs">Sistem belum mendeteksi aktivitas check-in di filter terpilih.</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-150">
                  <th className="p-4">Karyawan</th>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Check In</th>
                  <th className="p-4">Check Out</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Lembur (Jam)</th>
                  <th className="p-4">Catatan</th>
                  {user?.role !== "Employee" && <th className="p-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{log.employee_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{log.employee_nik}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-mono text-xs">{log.date}</td>
                    <td className="p-4">
                      <span className="text-xs font-mono font-medium text-slate-700">
                        {log.check_in || "--:--"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-mono font-medium text-slate-700">
                        {log.check_out || "--:--"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase border ${
                        log.status === "Hadir"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : log.status === "Terlambat"
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : log.status === "Cuti"
                          ? "bg-blue-50 text-blue-600 border-blue-100"
                          : log.status === "Izin"
                          ? "bg-purple-50 text-purple-600 border-purple-100"
                          : "bg-red-50 text-red-600 border-red-100"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {log.overtime_hours > 0 ? (
                        <span className="text-xs bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded font-mono">
                          +{log.overtime_hours} jam
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-slate-500 italic max-w-xs truncate" title={log.notes}>
                      {log.notes || "-"}
                    </td>
                    {user?.role !== "Employee" && (
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Hapus Log"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MANUAL KOREKSI ABSENSI MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <h3 className="font-semibold text-slate-800 text-sm">Input / Koreksi Absensi Manual</h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                Tutup
              </button>
            </div>
            <form onSubmit={handleSaveManualAttendance} className="p-4 space-y-4">
              
              {/* Employee selection */}
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Pilih Karyawan</label>
                <select
                  value={formData.employee_nik}
                  onChange={(e) => setFormData(prev => ({ ...prev, employee_nik: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                  required
                >
                  {employees.map(e => (
                    <option key={e.nik} value={e.nik}>{e.name} ({e.nik})</option>
                  ))}
                </select>
              </div>

              {/* Date selection */}
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Tanggal Absensi</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                  required
                />
              </div>

              {/* Check in / Check out Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Jam Check In</label>
                  <input
                    type="text"
                    placeholder="Contoh: 08:15:00"
                    value={formData.check_in}
                    onChange={(e) => setFormData(prev => ({ ...prev, check_in: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Jam Check Out</label>
                  <input
                    type="text"
                    placeholder="Contoh: 17:30:00"
                    value={formData.check_out}
                    onChange={(e) => setFormData(prev => ({ ...prev, check_out: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Status and Overtime Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Status Kehadiran</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Terlambat">Terlambat</option>
                    <option value="Cuti">Cuti</option>
                    <option value="Izin">Izin</option>
                    <option value="Absen">Absen</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Lemburan (Jam)</label>
                  <input
                    type="number"
                    value={formData.overtime_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, overtime_hours: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Catatan Kehadiran</label>
                <textarea
                  placeholder="Contoh: Lupa check-in, surat sakit dilampirkan..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Simpan Presensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={showConfirmDialog && confirmPayload !== null}
        title={confirmPayload?.title || "Konfirmasi"}
        description={confirmPayload?.description || "Apakah Anda yakin ingin melanjutkan?"}
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={() => confirmPayload?.onConfirm()}
        onCancel={() => {
          setShowConfirmDialog(false);
          setConfirmPayload(null);
        }}
      />
    </div>
  );
}
