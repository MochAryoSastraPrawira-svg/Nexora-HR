import React, { useEffect, useState } from "react";
import { apiService } from "../services/api";
import { Employee, Attendance, Payroll } from "../types";
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Calendar,
  Users,
  TrendingUp,
  Award,
  Clock,
  Download
} from "lucide-react";
import { toast } from "react-hot-toast";
import { exportToCSV, formatIDR } from "../utils/exportHelpers";

import { NexoraLogo } from "../components/NexoraLogo";

export default function Reports() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [emps, atts, pays] = await Promise.all([
        apiService.employees.getAll(),
        apiService.attendance.getAll(),
        apiService.payroll.getAll()
      ]);
      setEmployees(emps);
      setAttendance(atts);
      setPayroll(pays);
    } catch (e) {
      toast.error("Gagal menarik berkas laporan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // EXPORT UTILITIES
  const handleExportEmployees = () => {
    if (employees.length === 0) {
      toast.error("Data karyawan kosong.");
      return;
    }
    const headers = ["NIK", "Nama", "Email", "Telepon", "Gender", "Tanggal Masuk", "Divisi", "Jabatan", "Gaji Pokok", "Status"];
    const rows = employees.map(e => [
      e.nik,
      e.name,
      e.email,
      e.phone,
      e.gender,
      e.joining_date,
      e.division || "",
      e.position || "",
      e.base_salary.toString(),
      e.status
    ]);
    exportToCSV("Laporan_Karyawan_HRMS", headers, rows);
    toast.success("Spreadsheet Karyawan terunduh!");
  };

  const handleExportAttendance = () => {
    if (attendance.length === 0) {
      toast.error("Data absensi kosong.");
      return;
    }
    const headers = ["NIK", "Nama", "Tanggal", "Check In", "Check Out", "Status", "Lembur (Jam)", "Notes"];
    const rows = attendance.map(a => [
      a.employee_nik,
      a.employee_name || "",
      a.date,
      a.check_in || "-",
      a.check_out || "-",
      a.status,
      a.overtime_hours.toString(),
      a.notes || ""
    ]);
    exportToCSV("Laporan_Absensi_HRMS", headers, rows);
    toast.success("Spreadsheet Kehadiran terunduh!");
  };

  const handleExportPayroll = () => {
    if (payroll.length === 0) {
      toast.error("Data penggajian kosong.");
      return;
    }
    const headers = [
      "NIK", "Nama", "Bulan", "Tahun", "Gaji Pokok", "Tunjangan", "Bonus", 
      "Lembur", "Potongan", "Pajak", "BPJS", "Gaji Bersih (Net)", "Status", "Tgl Bayar"
    ];
    const rows = payroll.map(p => [
      p.employee_nik,
      p.employee_name || "",
      p.month,
      p.year,
      p.base_salary.toString(),
      p.allowance.toString(),
      p.bonus.toString(),
      p.overtime_pay.toString(),
      p.deduction.toString(),
      p.tax.toString(),
      p.bpjs.toString(),
      p.total_pay.toString(),
      p.status,
      p.payment_date || "-"
    ]);
    exportToCSV("Laporan_Penggajian_HRMS", headers, rows);
    toast.success("Spreadsheet Penggajian terunduh!");
  };

  const handlePrintSummary = () => {
    const printContent = document.getElementById("reports-summary-print")?.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow || !printContent) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Ringkasan HRMS Executive</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: white; }
            h2 { border-bottom: 2px solid #3b82f6; padding-bottom: 8px; color: #1e3a8a; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
            .card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; }
            .font-bold { font-weight: 700; }
            .font-mono { font-family: monospace; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            td, th { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: left; }
            th { background-color: #f8fafc; font-weight: 600; }
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

  // Metrics computation helper
  const totalSalarySpent = payroll.filter(p => p.status === "Paid").reduce((acc, curr) => acc + curr.total_pay, 0);
  const totalLateIn = attendance.filter(a => a.status === "Terlambat").length;
  const totalLeavesTaken = attendance.filter(a => a.status === "Cuti").length;
  const activeEmpRatio = employees.length > 0
    ? Math.round((employees.filter(e => e.status === "Aktif").length / employees.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight">Pusat Laporan & Ekspor</h2>
          <p className="text-slate-500 text-sm">Konsolidasikan data kepegawaian, download excel (CSV) dan print out laporan eksekutif.</p>
        </div>
        <button
          onClick={handlePrintSummary}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer self-start"
        >
          <Printer size={16} />
          <span>Cetak Summary Report</span>
        </button>
      </div>

      {/* Grid of Report Download panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Report 1: Karyawan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between h-48 hover:border-blue-500 transition-colors">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={18} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Laporan Kepegawaian</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Ekspor seluruh file data karyawan aktif, gender, penugasan divisi, jabatan, dan biodata pribadi.</p>
          </div>
          <button
            onClick={handleExportEmployees}
            className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1.5 pt-3 border-t border-slate-100 cursor-pointer"
          >
            <Download size={14} />
            <span>Download CSV (Excel)</span>
          </button>
        </div>

        {/* Report 2: Absensi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between h-48 hover:border-emerald-500 transition-colors">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Laporan Presensi Bulanan</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Ekspor total record jam masuk, jam keluar, jam lembur harian, status mangkir, cuti, serta catatan koreksi.</p>
          </div>
          <button
            onClick={handleExportAttendance}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1.5 pt-3 border-t border-slate-100 cursor-pointer"
          >
            <Download size={14} />
            <span>Download CSV (Excel)</span>
          </button>
        </div>

        {/* Report 3: Payroll */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between h-48 hover:border-amber-500 transition-colors">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Laporan Penggajian & PPh21</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Ekspor rincian pengeluaran gaji bersih, bonus, tunjangan fungsional, BPJS, potongan utang, dan PPh21 pajak.</p>
          </div>
          <button
            onClick={handleExportPayroll}
            className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1.5 pt-3 border-t border-slate-100 cursor-pointer"
          >
            <Download size={14} />
            <span>Download CSV (Excel)</span>
          </button>
        </div>

      </div>

      {/* VISUALLY HIDDEN CONTENT DEDICATED FOR PRINT OVERRIDES */}
      <div id="reports-summary-print" className="hidden">
        <div className="flex justify-between items-center pb-4 border-b-2 border-slate-950">
          <div className="flex items-center gap-2">
            <NexoraLogo className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold">Nexora HR Management</h1>
              <p style={{ fontSize: "11px", color: "#64748b" }}>Sistem Manajemen Sumber Daya Manusia Terintegrasi</p>
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "11px" }}>
            <p>Tanggal Laporan: {new Date().toLocaleDateString("id-ID")}</p>
            <p>Status Data: Live & Verified</p>
          </div>
        </div>

        <h2 style={{ marginTop: "20px" }}>RINGKASAN EKSEKUTIF SUMBER DAYA MANUSIA</h2>
        
        <div className="grid">
          <div className="card">
            <p className="font-bold" style={{ fontSize: "12px", color: "#475569" }}>I. METRIK STAF</p>
            <table style={{ margin: "5px 0" }}>
              <tbody>
                <tr>
                  <td>Total Karyawan Terdaftar</td>
                  <td className="font-bold text-right">{employees.length} staf</td>
                </tr>
                <tr>
                  <td>Rasio Keaktifan Kerja</td>
                  <td className="font-bold text-right">{activeEmpRatio}% Aktif</td>
                </tr>
                <tr>
                  <td>Rata-rata Kuota Cuti Tersisa</td>
                  <td className="font-bold text-right">
                    {Math.round(employees.reduce((acc, curr) => acc + curr.remaining_leave, 0) / (employees.length || 1))} hari
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card">
            <p className="font-bold" style={{ fontSize: "12px", color: "#475569" }}>II. METRIK OPERASIONAL</p>
            <table style={{ margin: "5px 0" }}>
              <tbody>
                <tr>
                  <td>Jumlah Kas Terbayarkan (Paid)</td>
                  <td className="font-bold text-right font-mono" style={{ color: "#16a34a" }}>
                    {formatIDR(totalSalarySpent)}
                  </td>
                </tr>
                <tr>
                  <td>Total Pelanggaran Terlambat</td>
                  <td className="font-bold text-right" style={{ color: "#d97706" }}>{totalLateIn} kasus</td>
                </tr>
                <tr>
                  <td>Hari Cuti Terealisasi</td>
                  <td className="font-bold text-right">{totalLeavesTaken} hari cuti</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <h2>DAFTAR PEGAWAI STRUKTUR PENUGASAN AKTIF</h2>
        <table>
          <thead>
            <tr>
              <th>NIK</th>
              <th>Nama Karyawan</th>
              <th>Divisi</th>
              <th>Jabatan</th>
              <th>Tanggal Masuk</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.slice(0, 15).map(e => (
              <tr key={e.nik}>
                <td className="font-mono">{e.nik}</td>
                <td className="font-bold">{e.name}</td>
                <td>{e.division}</td>
                <td>{e.position}</td>
                <td>{e.joining_date}</td>
                <td>{e.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {employees.length > 15 && (
          <p style={{ fontSize: "10px", color: "#94a3b8", marginTop: "10px", fontStyle: "italic" }}>
            * Menampilkan 15 dari total {employees.length} karyawan terdaftar. Unduh laporan kepegawaian CSV untuk detail lengkap.
          </p>
        )}
      </div>

      {/* Display Card reflecting Live Analytics metrics in UI */}
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-1.5">
          <Award size={16} className="text-blue-400" />
          <span>Statistik HR Teragregasi</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="border-r border-slate-800 last:border-0 pr-4">
            <span className="text-xs text-slate-500">Karyawan Terdaftar</span>
            <p className="text-2xl font-bold font-mono text-white mt-1">{employees.length} <span className="text-xs font-normal text-slate-400">staf</span></p>
          </div>
          <div className="border-r border-slate-800 last:border-0 pr-4">
            <span className="text-xs text-slate-500">Rasio Keaktifan</span>
            <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{activeEmpRatio}% <span className="text-xs font-normal text-slate-400">aktif</span></p>
          </div>
          <div className="border-r border-slate-800 last:border-0 pr-4">
            <span className="text-xs text-slate-500">Total Keterlambatan</span>
            <p className="text-2xl font-bold font-mono text-amber-400 mt-1">{totalLateIn} <span className="text-xs font-normal text-slate-400">kasus</span></p>
          </div>
          <div className="border-r border-slate-800 last:border-0 pr-4">
            <span className="text-xs text-slate-500">Total Kas Terbayar</span>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-1 truncate">{formatIDR(totalSalarySpent)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
