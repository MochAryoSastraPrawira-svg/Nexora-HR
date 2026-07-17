import React, { useEffect, useState } from "react";
import { apiService } from "../services/api";
import { Division, Position } from "../types";
import { Plus, Edit3, Trash2, ShieldCheck, CreditCard } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatIDR } from "../utils/exportHelpers";
import { ConfirmDialog } from "../components/ConfirmDialog";

export default function DivisionsPositions() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal forms states
  const [showDivModal, setShowDivModal] = useState(false);
  const [divId, setDivId] = useState<number | null>(null);
  const [divName, setDivName] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState<{ title: string; description: string; confirmText?: string; onConfirm: () => void } | null>(null);

  const [showPosModal, setShowPosModal] = useState(false);
  const [posId, setPosId] = useState<number | null>(null);
  const [posName, setPosName] = useState("");
  const [posSalary, setPosSalary] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [divs, posts] = await Promise.all([
        apiService.divisions.getAll(),
        apiService.positions.getAll()
      ]);
      setDivisions(divs);
      setPositions(posts);
    } catch (e) {
      toast.error("Gagal memuat data master");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // DIVISION CRUD
  const handleOpenDivModal = (div?: Division) => {
    if (div) {
      setDivId(div.id);
      setDivName(div.name);
    } else {
      setDivId(null);
      setDivName("");
    }
    setShowDivModal(true);
  };

  const handleSaveDivision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!divName.trim()) {
      toast.error("Nama divisi wajib diisi");
      return;
    }

    try {
      if (divId) {
        await apiService.divisions.update(divId, divName);
        toast.success("Berhasil memperbarui divisi");
      } else {
        await apiService.divisions.create(divName);
        toast.success("Berhasil menambahkan divisi");
      }
      setShowDivModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal menyimpan divisi");
    }
  };

  const handleDeleteDivision = async (id: number) => {
    setConfirmPayload({
      title: "Hapus Divisi",
      description: "Yakin ingin menghapus divisi ini? Semua data terkait mungkin juga terpengaruh.",
      confirmText: "Hapus",
      onConfirm: async () => {
        try {
          await apiService.divisions.delete(id);
          toast.success("Divisi berhasil dihapus");
          fetchData();
        } catch (err: any) {
          toast.error(err.response?.data?.error || "Gagal menghapus divisi");
        } finally {
          setShowConfirmDialog(false);
          setConfirmPayload(null);
        }
      }
    });
    setShowConfirmDialog(true);
  };

  // POSITION CRUD
  const handleOpenPosModal = (pos?: Position) => {
    if (pos) {
      setPosId(pos.id);
      setPosName(pos.name);
      setPosSalary(pos.base_salary.toString());
    } else {
      setPosId(null);
      setPosName("");
      setPosSalary("");
    }
    setShowPosModal(true);
  };

  const handleSavePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posName.trim() || !posSalary.trim()) {
      toast.error("Semua kolom jabatan wajib diisi");
      return;
    }

    const salaryNum = parseFloat(posSalary);
    if (isNaN(salaryNum) || salaryNum <= 0) {
      toast.error("Gaji pokok harus bernilai positif");
      return;
    }

    try {
      if (posId) {
        await apiService.positions.update(posId, posName, salaryNum);
        toast.success("Berhasil memperbarui jabatan");
      } else {
        await apiService.positions.create(posName, salaryNum);
        toast.success("Berhasil menambahkan jabatan");
      }
      setShowPosModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal menyimpan jabatan");
    }
  };

  const handleDeletePosition = async (id: number) => {
    setConfirmPayload({
      title: "Hapus Jabatan",
      description: "Yakin ingin menghapus jabatan ini? Semua karyawan yang memakai jabatan tersebut mungkin terpengaruh.",
      confirmText: "Hapus",
      onConfirm: async () => {
        try {
          await apiService.positions.delete(id);
          toast.success("Jabatan berhasil dihapus");
          fetchData();
        } catch (err: any) {
          toast.error(err.response?.data?.error || "Gagal menghapus jabatan");
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
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight">Struktur Organisasi</h2>
          <p className="text-slate-500 text-sm">Kelola divisi operasional dan tingkatan jabatan struktur karir perusahaan.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-96" />
          <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-96" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Panel 1: DIVISI (4 Columns) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm lg:col-span-5 flex flex-col h-[500px]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-600" />
                <h3 className="font-semibold text-slate-800 text-sm">Daftar Divisi</h3>
              </div>
              <button
                onClick={() => handleOpenDivModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Divisi</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {divisions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <ShieldCheck size={32} className="stroke-1 mb-2 text-slate-300" />
                  <span className="text-xs">Belum ada divisi dibuat</span>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-slate-400 text-xs font-semibold border-b border-slate-100 pb-2">
                      <th className="py-2">No</th>
                      <th className="py-2">Nama Divisi</th>
                      <th className="py-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {divisions.map((div, idx) => (
                      <tr key={div.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="py-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 font-medium text-slate-700">{div.name}</td>
                        <td className="py-3 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => handleOpenDivModal(div)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteDivision(div.id)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-red-600 transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Panel 2: JABATAN (7 Columns) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm lg:col-span-7 flex flex-col h-[500px]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-indigo-600" />
                <h3 className="font-semibold text-slate-800 text-sm">Daftar Jabatan & Gaji</h3>
              </div>
              <button
                onClick={() => handleOpenPosModal()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Jabatan</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {positions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <CreditCard size={32} className="stroke-1 mb-2 text-slate-300" />
                  <span className="text-xs">Belum ada tingkatan jabatan dibuat</span>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-slate-400 text-xs font-semibold border-b border-slate-100 pb-2">
                      <th className="py-2">No</th>
                      <th className="py-2">Nama Jabatan</th>
                      <th className="py-2">Gaji Pokok Default</th>
                      <th className="py-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos, idx) => (
                      <tr key={pos.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="py-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 font-medium text-slate-700">{pos.name}</td>
                        <td className="py-3 text-slate-600 font-mono text-xs">{formatIDR(pos.base_salary)}</td>
                        <td className="py-3 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => handleOpenPosModal(pos)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeletePosition(pos.id)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-red-600 transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      )}

      {/* 1. Divisi Modal */}
      {showDivModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm">
                {divId ? "Edit Divisi" : "Tambah Divisi Baru"}
              </h3>
              <button
                onClick={() => setShowDivModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                Tutup
              </button>
            </div>
            <form onSubmit={handleSaveDivision} className="p-4 space-y-4">
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Nama Divisi</label>
                <input
                  type="text"
                  placeholder="Contoh: Divisi Keuangan"
                  value={divName}
                  onChange={(e) => setDivName(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDivModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Jabatan Modal */}
      {showPosModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm">
                {posId ? "Edit Jabatan" : "Tambah Jabatan Baru"}
              </h3>
              <button
                onClick={() => setShowPosModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                Tutup
              </button>
            </div>
            <form onSubmit={handleSavePosition} className="p-4 space-y-4">
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Nama Jabatan</label>
                <input
                  type="text"
                  placeholder="Contoh: Senior Business Analyst"
                  value={posName}
                  onChange={(e) => setPosName(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Gaji Pokok Default (IDR)</label>
                <input
                  type="number"
                  placeholder="Contoh: 12000000"
                  value={posSalary}
                  onChange={(e) => setPosSalary(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-indigo-500 font-mono"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPosModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={showConfirmDialog && confirmPayload !== null}
        title={confirmPayload?.title || "Konfirmasi"}
        description={confirmPayload?.description || "Apakah Anda yakin ingin melanjutkan aksi ini?"}
        confirmText={confirmPayload?.confirmText || "Ya"}
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
