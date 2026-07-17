import React, { useEffect, useState } from "react";
import { apiService } from "../services/api";
import { Payroll, Employee } from "../types";
import { useAuthStore } from "../store/authStore";
import {
  DollarSign,
  Search,
  Plus,
  Printer,
  Trash2,
  CheckCircle,
  Clock,
  Calculator,
  Building,
  Check
} from "lucide-react";
import { toast } from "react-hot-toast";
import { formatIDR } from "../utils/exportHelpers";
import { NexoraLogo } from "../components/NexoraLogo";
import { ConfirmDialog } from "../components/ConfirmDialog";

export default function PayrollManagement() {
  const { user } = useAuthStore();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("2026");

  // Payroll Modals
  const [showGenModal, setShowGenModal] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState<{ title: string; description: string; confirmText?: string; onConfirm: () => void } | null>(null);

  // Generate payroll form inputs
  const [formData, setFormData] = useState({
    employee_nik: "",
    month: "07",
    year: "2026",
    allowance: "",
    bonus: "",
    deduction: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      if (user?.role === "Employee") {
        const myPayrolls = await apiService.payroll.getAll({ nik: user.nik });
        setPayrolls(myPayrolls);
      } else {
        const [allPays, allEmps] = await Promise.all([
          apiService.payroll.getAll(),
          apiService.employees.getAll()
        ]);
        setPayrolls(allPays);
        setEmployees(allEmps);
      }
    } catch (e) {
      toast.error("Gagal memuat slip gaji");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleOpenGenModal = () => {
    setFormData({
      employee_nik: employees[0]?.nik || "",
      month: "07",
      year: "2026",
      allowance: "",
      bonus: "0",
      deduction: "0"
    });
    setShowGenModal(true);
  };

  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        employee_nik: formData.employee_nik,
        month: formData.month,
        year: formData.year,
        allowance: formData.allowance ? parseFloat(formData.allowance) : undefined,
        bonus: formData.bonus ? parseFloat(formData.bonus) : undefined,
        deduction: formData.deduction ? parseFloat(formData.deduction) : undefined
      };

      await apiService.payroll.generate(payload);
      toast.success("Slip Gaji berhasil digenerasi!");
      setShowGenModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal menggenerasi gaji");
    }
  };

  const handleMarkAsPaid = (id: number) => {
    setConfirmPayload({
      title: "Konfirmasi Pembayaran Gaji",
      description: "Yakin ingin mengubah status slip gaji ini menjadi 'Paid' (Sudah Terbayar)?",
      confirmText: "Bayar",
      onConfirm: async () => {
        try {
          await apiService.payroll.update(id, { status: "Paid" });
          toast.success("Gaji berhasil dibayarkan!");
          fetchData();
        } catch (e) {
          toast.error("Gagal mengubah status penggajian");
        } finally {
          setShowConfirmDialog(false);
          setConfirmPayload(null);
        }
      }
    });
    setShowConfirmDialog(true);
  };

  const handleDeletePayroll = (id: number) => {
    setConfirmPayload({
      title: "Hapus Slip Gaji",
      description: "Yakin ingin menghapus slip penggajian ini? Data tidak dapat dikembalikan.",
      confirmText: "Hapus",
      onConfirm: async () => {
        try {
          await apiService.payroll.delete(id);
          toast.success("Catatan slip gaji terhapus.");
          fetchData();
        } catch (e) {
          toast.error("Gagal menghapus penggajian");
        } finally {
          setShowConfirmDialog(false);
          setConfirmPayload(null);
        }
      }
    });
    setShowConfirmDialog(true);
  };

  const handleOpenSlip = (p: Payroll) => {
    setSelectedPayroll(p);
    setShowSlipModal(true);
  };

  const handlePrintSlip = () => {
    const printContent = document.getElementById("payslip-container")?.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow || !printContent) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Slip Gaji HRMS</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: white; }
            .border-double { border-style: double; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            td, th { padding: 8px 12px; font-size: 13px; text-align: left; }
            .text-right { text-align: right; }
            .font-mono { font-family: monospace; }
            .font-semibold { font-weight: 600; }
            .border-t { border-top: 1px solid #cbd5e1; }
            .border-b { border-bottom: 1px solid #cbd5e1; }
            .text-xl { font-size: 1.25rem; font-weight: 700; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter Logic
  const filteredPayrolls = payrolls.filter(pay => {
    const matchesSearch = user?.role === "Employee" ? true : (
      pay.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pay.employee_nik.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const matchesMonth = filterMonth ? pay.month === filterMonth : true;
    const matchesYear = filterYear ? pay.year === filterYear : true;

    return matchesSearch && matchesMonth && matchesYear;
  });

  const months = [
    { value: "01", name: "Januari" },
    { value: "02", name: "Februari" },
    { value: "03", name: "Maret" },
    { value: "04", name: "April" },
    { value: "05", name: "Mei" },
    { value: "06", name: "Juni" },
    { value: "07", name: "Juli" },
    { value: "08", name: "Agustus" },
    { value: "09", name: "September" },
    { value: "10", name: "Oktober" },
    { value: "11", name: "November" },
    { value: "12", name: "Desember" }
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight">Kompensasi & Penggajian</h2>
          <p className="text-slate-500 text-sm">
            {user?.role === "Employee"
              ? "Lihat riwayat dan cetak slip gaji bulanan Anda."
              : "Generasi payroll bulanan, edit allowances/deductions, dan kelola status pembayaran."}
          </p>
        </div>

        {/* Generate payroll only for HR / Admin */}
        {user?.role !== "Employee" && (
          <button
            onClick={handleOpenGenModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer self-start"
          >
            <Plus size={16} />
            <span>Generasi Gaji Baru</span>
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

        {/* Month Filter */}
        <div>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-hidden focus:border-blue-500"
          >
            <option value="">Semua Bulan</option>
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Year Filter */}
        <div>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-hidden focus:border-blue-500"
          >
            <option value="2026">Tahun 2026</option>
            <option value="2025">Tahun 2025</option>
          </select>
        </div>
      </div>

      {/* Payroll Records List */}
      {loading ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-96" />
      ) : filteredPayrolls.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <DollarSign size={48} className="mx-auto stroke-1 text-slate-300 mb-3" />
          <p className="text-sm font-medium">Data gaji belum digenerasi</p>
          <span className="text-xs">Sistem belum mendeteksi slip penggajian untuk filter pencarian ini.</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-150">
                  <th className="p-4">Karyawan</th>
                  <th className="p-4">Periode</th>
                  <th className="p-4">Gaji Pokok</th>
                  <th className="p-4">Tunjangan & Bonus</th>
                  <th className="p-4">Pajak & BPJS</th>
                  <th className="p-4">Gaji Bersih</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{p.employee_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{p.employee_nik}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-600">
                      {months.find(m => m.value === p.month)?.name} {p.year}
                    </td>
                    <td className="p-4 font-mono text-slate-700 text-xs">{formatIDR(p.base_salary)}</td>
                    <td className="p-4">
                      <div className="flex flex-col font-mono text-[11px] text-slate-500">
                        <span>Tjn: {formatIDR(p.allowance)}</span>
                        <span>Bns: {formatIDR(p.bonus)}</span>
                        {p.overtime_pay > 0 && <span className="text-blue-500">Lbr: {formatIDR(p.overtime_pay)}</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col font-mono text-[11px] text-red-400">
                        <span>Pph: {formatIDR(p.tax)}</span>
                        <span>Bpjs: {formatIDR(p.bpjs)}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-800 font-mono text-xs">{formatIDR(p.total_pay)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase border ${
                        p.status === "Paid"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-amber-50 text-amber-600 border-amber-100"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-1.5 justify-end">
                        {/* Print Receipt button */}
                        <button
                          onClick={() => handleOpenSlip(p)}
                          className="p-1.5 hover:bg-slate-100 rounded border border-slate-200 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                          title="Cetak Slip Gaji"
                        >
                          <Printer size={13} />
                          <span>Payslip</span>
                        </button>

                        {/* Mark Paid button for HR */}
                        {user?.role !== "Employee" && p.status === "Pending" && (
                          <button
                            onClick={() => handleMarkAsPaid(p.id)}
                            className="p-1.5 hover:bg-emerald-50 rounded border border-slate-200 text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                            title="Bayarkan"
                          >
                            <Check size={13} />
                            <span>Bayar</span>
                          </button>
                        )}

                        {/* Delete payroll (HR only) */}
                        {user?.role !== "Employee" && (
                          <button
                            onClick={() => handleDeletePayroll(p.id)}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Hapus Gaji"
                          >
                            <Trash2 size={13} />
                          </button>
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

      {/* GENERATE PAYROLL MODAL (HR ONLY) */}
      {showGenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <h3 className="font-semibold text-slate-800 text-sm">Generasi Slip Gaji Karyawan</h3>
              <button
                onClick={() => setShowGenModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                Tutup
              </button>
            </div>
            <form onSubmit={handleGeneratePayroll} className="p-4 space-y-4">
              
              {/* Select Employee */}
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Karyawan Penerima *</label>
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

              {/* Month & Year Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Bulan Gaji *</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                  >
                    {months.map(m => (
                      <option key={m.value} value={m.value}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Tahun Gaji *</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>

              {/* Allowance and Bonus fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Tunjangan Tambahan (IDR)</label>
                  <input
                    type="number"
                    placeholder="Kosongkan untuk 10% default"
                    value={formData.allowance}
                    onChange={(e) => setFormData(prev => ({ ...prev, allowance: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Bonus Khusus (IDR)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 1000000"
                    value={formData.bonus}
                    onChange={(e) => setFormData(prev => ({ ...prev, bonus: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Deductions input */}
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Potongan Tambahan (IDR)</label>
                <input
                  type="number"
                  placeholder="Contoh: Kasbon / Pinjaman"
                  value={formData.deduction}
                  onChange={(e) => setFormData(prev => ({ ...prev, deduction: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500 font-mono"
                />
              </div>

              {/* Helper disclaimer */}
              <div className="flex gap-2 p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-slate-600 text-[11px] items-start">
                <Calculator size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <span>
                  Sistem akan otomatis menghitung <strong>BPJS (2% Gaji Pokok)</strong>, <strong>Pajak PPh21 (5% jika gaji pokok &gt; 5jt)</strong>, serta merangkum <strong>Upah Lembur</strong> yang bersumber dari log kehadiran periode bersangkutan secara akurat.
                </span>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Generasi Gaji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYSLIP PRINT PREVIEW MODAL */}
      {showSlipModal && selectedPayroll && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
            
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50 rounded-t-2xl">
              <h3 className="font-semibold text-slate-800 text-sm">Pratinjau Slip Gaji (Payslip)</h3>
              <div className="flex gap-2">
                <button
                  onClick={handlePrintSlip}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  onClick={() => setShowSlipModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm px-2 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Payslip Document container */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center">
              <div
                id="payslip-container"
                className="bg-white p-8 w-full max-w-[600px] shadow-lg border border-slate-200 rounded-lg text-slate-800"
              >
                {/* Payslip Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-slate-100 shadow-sm">
                      <NexoraLogo className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm tracking-tight text-slate-800">Nexora <span className="text-indigo-600">HR</span> Management</h4>
                      <p className="text-[10px] text-slate-400">Jl. Sudirman Block H-4, Kavling 10-11, Jakarta Selatan</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h4 className="font-bold text-sm text-blue-600">SLIP GAJI KARYAWAN</h4>
                    <p className="text-[10px] text-slate-500 font-mono">ID: PAY-{selectedPayroll.id}-{selectedPayroll.year}</p>
                  </div>
                </div>

                {/* Employee / Meta details */}
                <div className="grid grid-cols-2 gap-4 my-4 text-xs">
                  <div>
                    <table>
                      <tbody>
                        <tr>
                          <td className="p-0 font-medium text-slate-400">Nama</td>
                          <td className="p-0 pl-2 font-semibold text-slate-700">: {selectedPayroll.employee_name}</td>
                        </tr>
                        <tr>
                          <td className="p-0 font-medium text-slate-400">NIK</td>
                          <td className="p-0 pl-2 font-mono font-semibold text-slate-700">: {selectedPayroll.employee_nik}</td>
                        </tr>
                        <tr>
                          <td className="p-0 font-medium text-slate-400">Jabatan</td>
                          <td className="p-0 pl-2 text-slate-700">: {selectedPayroll.position}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <table>
                      <tbody>
                        <tr>
                          <td className="p-0 font-medium text-slate-400">Divisi</td>
                          <td className="p-0 pl-2 text-slate-700">: {selectedPayroll.division}</td>
                        </tr>
                        <tr>
                          <td className="p-0 font-medium text-slate-400">Periode</td>
                          <td className="p-0 pl-2 font-semibold text-slate-700">
                            : {months.find(m => m.value === selectedPayroll.month)?.name} {selectedPayroll.year}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-0 font-medium text-slate-400">Metode</td>
                          <td className="p-0 pl-2 text-slate-700">: Bank Transfer</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Earnings and Deductions table breakdowns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t border-slate-200 pt-4">
                  
                  {/* Earnings (Penerimaan) */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-xs text-slate-800 border-b border-slate-200 pb-1">I. PENERIMAAN</h5>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr>
                          <td className="p-1">Gaji Pokok</td>
                          <td className="p-1 text-right font-mono">{formatIDR(selectedPayroll.base_salary)}</td>
                        </tr>
                        <tr>
                          <td className="p-1">Tunjangan Jabatan</td>
                          <td className="p-1 text-right font-mono">{formatIDR(selectedPayroll.allowance)}</td>
                        </tr>
                        {selectedPayroll.bonus > 0 && (
                          <tr>
                            <td className="p-1">Bonus Insentif</td>
                            <td className="p-1 text-right font-mono">{formatIDR(selectedPayroll.bonus)}</td>
                          </tr>
                        )}
                        {selectedPayroll.overtime_pay > 0 && (
                          <tr>
                            <td className="p-1">Upah Lemburan</td>
                            <td className="p-1 text-right font-mono">{formatIDR(selectedPayroll.overtime_pay)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Deductions (Potongan) */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-xs text-slate-800 border-b border-slate-200 pb-1">II. POTONGAN</h5>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr>
                          <td className="p-1">Pajak Penghasilan (PPh21)</td>
                          <td className="p-1 text-right font-mono text-red-500">({formatIDR(selectedPayroll.tax)})</td>
                        </tr>
                        <tr>
                          <td className="p-1">Iuran BPJS Ketenagakerjaan</td>
                          <td className="p-1 text-right font-mono text-red-500">({formatIDR(selectedPayroll.bpjs)})</td>
                        </tr>
                        {selectedPayroll.deduction > 0 && (
                          <tr>
                            <td className="p-1">Potongan Pinjaman</td>
                            <td className="p-1 text-right font-mono text-red-500">({formatIDR(selectedPayroll.deduction)})</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>

                {/* Summary Net Salary */}
                <div className="mt-8 border-t-2 border-dashed border-slate-300 pt-4 flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                  <span className="text-xs font-bold text-slate-700">GAJI BERSIH (NET SALARY)</span>
                  <span className="text-base font-extrabold text-blue-600 font-mono">
                    {formatIDR(selectedPayroll.total_pay)}
                  </span>
                </div>

                {/* Footnotes */}
                <div className="grid grid-cols-2 gap-4 mt-8 pt-4 text-[10px] text-slate-400">
                  <div>
                    <p>Status: <strong className="text-emerald-500">{selectedPayroll.status}</strong></p>
                    <p>Tgl Bayar: {selectedPayroll.payment_date || "-"}</p>
                  </div>
                  <div className="text-right">
                    <p>Penerima,</p>
                    <p className="mt-12 font-semibold text-slate-700 border-t border-slate-300 inline-block min-w-[120px] pt-1">
                      {selectedPayroll.employee_name}
                    </p>
                  </div>
                </div>

              </div>
            </div>

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
