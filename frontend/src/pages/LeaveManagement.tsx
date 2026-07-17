import React, { useEffect, useState } from "react";
import { apiService } from "../services/api";
import { Leave, Employee } from "../types";
import { useAuthStore } from "../store/authStore";
import {
  CalendarDays,
  FileText,
  Check,
  X,
  Plus,
  History,
  Trash2,
  Calendar
} from "lucide-react";
import { toast } from "react-hot-toast";
import { ConfirmDialog } from "../components/ConfirmDialog";

export default function LeaveManagement() {
  const { user } = useAuthStore();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  // Leave Form Fields
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: "Tahunan",
    start_date: "",
    end_date: "",
    total_days: "1",
    reason: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      if (user?.role === "Employee") {
        const [empLeaves, empProf] = await Promise.all([
          apiService.leaves.getAll({ nik: user.nik }),
          apiService.auth.getProfile(user.nik)
        ]);
        setLeaves(empLeaves);
        setEmployeeProfile(empProf);
      } else {
        const allLeaves = await apiService.leaves.getAll();
        setLeaves(allLeaves);
      }
    } catch (e) {
      toast.error("Gagal memuat data cuti");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Count requested days automatically based on start and end dates
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      if (!isNaN(diffDays) && diffDays > 0) {
        setFormData(prev => ({ ...prev, total_days: diffDays.toString() }));
      }
    }
  }, [formData.start_date, formData.end_date]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const days = parseInt(formData.total_days);
    if (isNaN(days) || days <= 0) {
      toast.error("Tanggal mulai dan selesai tidak valid.");
      return;
    }

    if (formData.leave_type === "Tahunan" && employeeProfile && employeeProfile.remaining_leave < days) {
      toast.error(`Sisa cuti tahunan Anda tidak mencukupi (Sisa: ${employeeProfile.remaining_leave} hari, Diajukan: ${days} hari)`);
      return;
    }

    try {
      const payload = {
        employee_nik: user.nik,
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        total_days: days,
        reason: formData.reason
      };

      await apiService.leaves.apply(payload);
      toast.success("Pengajuan cuti berhasil dikirim! Menunggu persetujuan.");
      setShowApplyModal(false);
      setFormData({
        leave_type: "Tahunan",
        start_date: "",
        end_date: "",
        total_days: "1",
        reason: ""
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal mengajukan cuti.");
    }
  };

  const handleApprove = async (id: number) => {
    if (!user) return;
    setConfirmPayload({
      title: "Setujui Pengajuan Cuti",
      description: "Yakin ingin menyetujui pengajuan cuti ini? Status akan berubah menjadi disetujui.",
      confirmText: "Setuju",
      onConfirm: async () => {
        try {
          await apiService.leaves.approve(id, user.nik);
          toast.success("Pengajuan cuti berhasil disetujui!");
          fetchData();
        } catch (err: any) {
          toast.error(err.response?.data?.error || "Gagal memproses persetujuan");
        } finally {
          setShowConfirmDialog(false);
          setConfirmPayload(null);
        }
      }
    });
    setShowConfirmDialog(true);
  };

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState<{ title: string; description: string; confirmText?: string; onConfirm: () => void } | null>(null);

  const handleReject = async (id: number) => {
    if (!user) return;
    setConfirmPayload({
      title: "Tolak Pengajuan Cuti",
      description: "Yakin ingin menolak pengajuan cuti ini? Status akan berubah menjadi ditolak.",
      confirmText: "Tolak",
      onConfirm: async () => {
        try {
          await apiService.leaves.reject(id, user.nik);
          toast.success("Pengajuan cuti ditolak.");
          fetchData();
        } catch (err: any) {
          toast.error("Gagal memproses penolakan");
        } finally {
          setShowConfirmDialog(false);
          setConfirmPayload(null);
        }
      }
    });
    setShowConfirmDialog(true);
  };

  const handleDelete = async (id: number) => {
    setConfirmPayload({
      title: "Hapus Arsip Cuti",
      description: "Yakin ingin menghapus arsip pengajuan cuti ini? Data tidak dapat dikembalikan.",
      confirmText: "Hapus",
      onConfirm: async () => {
        try {
          await apiService.leaves.delete(id);
          toast.success("Arsip cuti terhapus.");
          fetchData();
        } catch (e) {
          toast.error("Gagal menghapus arsip");
        } finally {
          setShowConfirmDialog(false);
          setConfirmPayload(null);
        }
      }
    });
    setShowConfirmDialog(true);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight">Manajemen Cuti Karyawan</h2>
          <p className="text-slate-500 text-sm">
            {user?.role === "Employee"
              ? "Ajukan dispensasi cuti tahunan, sakit, atau bersalin beserta rekap sisa cuti Anda."
              : "Verifikasi, setujui, atau tolak antrean pengajuan cuti dari seluruh karyawan."}
          </p>
        </div>

        {/* Apply Leave button for Employee */}
        {user?.role === "Employee" && (
          <button
            onClick={() => setShowApplyModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer self-start"
          >
            <Plus size={16} />
            <span>Ajukan Cuti Baru</span>
          </button>
        )}
      </div>

      {/* Stats Board for Employee (Sisa Cuti) */}
      {user?.role === "Employee" && employeeProfile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sisa Cuti Tahunan</span>
              <p className="text-3xl font-bold text-blue-600 font-mono">{employeeProfile.remaining_leave} <span className="text-sm font-normal text-slate-500">hari</span></p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarDays size={20} />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Cuti Disetujui</span>
              <p className="text-3xl font-bold text-emerald-600 font-mono">
                {leaves.filter(l => l.status === "Approved").length} <span className="text-sm font-normal text-slate-500">kali</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Check size={20} />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Menunggu Review</span>
              <p className="text-3xl font-bold text-amber-500 font-mono">
                {leaves.filter(l => l.status === "Pending").length} <span className="text-sm font-normal text-slate-500">kali</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <History size={20} />
            </div>
          </div>
        </div>
      )}

      {/* Main Leave Queue table */}
      {loading ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-96" />
      ) : leaves.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <CalendarDays size={48} className="mx-auto stroke-1 text-slate-300 mb-3" />
          <p className="text-sm font-medium">Tidak ada riwayat pengajuan cuti</p>
          <span className="text-xs">
            {user?.role === "Employee"
              ? "Anda belum pernah mengajukan dispensasi cuti."
              : "Antrean bersih! Seluruh pengajuan cuti karyawan telah ditindaklanjuti."}
          </span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <History size={16} className="text-slate-400" />
            <h3 className="font-semibold text-slate-800 text-sm">Log & Antrean Pengajuan Cuti</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-150">
                  <th className="p-4">Karyawan</th>
                  <th className="p-4">Jenis Cuti</th>
                  <th className="p-4">Rentang Tanggal</th>
                  <th className="p-4">Hari</th>
                  <th className="p-4">Alasan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Reviewer</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{leave.employee_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{leave.employee_nik}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{leave.leave_type}</td>
                    <td className="p-4 text-xs font-mono text-slate-500">
                      {leave.start_date} <span className="text-slate-300">s/d</span> {leave.end_date}
                    </td>
                    <td className="p-4 font-bold text-slate-700 font-mono">{leave.total_days} hari</td>
                    <td className="p-4 text-xs text-slate-500 max-w-xs truncate" title={leave.reason}>
                      {leave.reason}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase border ${
                        leave.status === "Approved"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : leave.status === "Rejected"
                          ? "bg-red-50 text-red-600 border-red-100"
                          : "bg-amber-50 text-amber-600 border-amber-100"
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-600">
                      {leave.status !== "Pending" ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{leave.approver_name || "-"}</span>
                          <span className="text-[9px] text-slate-400 font-mono">{leave.decision_date}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono italic">Waiting</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        {/* Action buttons for HR/Admin/Manager when status is Pending */}
                        {user?.role !== "Employee" && leave.status === "Pending" ? (
                          <>
                            <button
                              onClick={() => handleApprove(leave.id)}
                              className="p-1 hover:bg-emerald-50 hover:text-emerald-600 rounded border border-slate-150 transition-colors cursor-pointer text-slate-500"
                              title="Setujui Cuti"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleReject(leave.id)}
                              className="p-1 hover:bg-red-50 hover:text-red-600 rounded border border-slate-150 transition-colors cursor-pointer text-slate-500"
                              title="Tolak Cuti"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : null}

                        {/* Always support delete records for HR */}
                        {user?.role !== "Employee" ? (
                          <button
                            onClick={() => handleDelete(leave.id)}
                            className="p-1 hover:bg-slate-100 hover:text-red-600 rounded text-slate-400 transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : (
                          // Employees can only delete their own pending request to cancel it
                          leave.status === "Pending" ? (
                            <button
                              onClick={() => handleDelete(leave.id)}
                              className="p-1 hover:bg-red-50 hover:text-red-600 rounded border border-slate-150 transition-colors cursor-pointer text-slate-500"
                              title="Batalkan Pengajuan"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <span className="text-slate-300 font-mono">-</span>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPLY LEAVE FORM MODAL (EMPLOYEE ONLY) */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <h3 className="font-semibold text-slate-800 text-sm">Form Pengajuan Cuti Baru</h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                Tutup
              </button>
            </div>
            <form onSubmit={handleApplyLeave} className="p-4 space-y-4">
              
              {/* Type of leave */}
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Kategori Dispensasi Cuti</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, leave_type: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                >
                  <option value="Tahunan">Tahunan (Mengurangi Sisa Cuti)</option>
                  <option value="Sakit">Sakit (Dengan Keterangan)</option>
                  <option value="Melahirkan">Cuti Melahirkan / Bersalin</option>
                  <option value="Cuti Penting">Dispensasi Acara / Cuti Penting</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                  required
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Tanggal Selesai</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                  required
                />
              </div>

              {/* Total Days calculated */}
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Total Hari Dispensasi</label>
                <input
                  type="number"
                  value={formData.total_days}
                  disabled
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden bg-slate-50 text-slate-500 font-mono font-semibold"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Alasan Pengambilan Cuti</label>
                <textarea
                  placeholder="Isi detail alasan, contoh: Rencana pernikahan adik kandung..."
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  rows={2}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Ajukan Cuti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmPayload && (
        <ConfirmDialog
          isOpen={showConfirmDialog}
          title={confirmPayload.title}
          description={confirmPayload.description}
          confirmText={confirmPayload.confirmText}
          onConfirm={confirmPayload.onConfirm}
          onCancel={() => {
            setShowConfirmDialog(false);
            setConfirmPayload(null);
          }}
        />
      )}
    </div>
  );
}
