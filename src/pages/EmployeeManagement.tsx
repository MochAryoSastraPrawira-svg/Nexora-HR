import React, { useEffect, useState } from "react";
import { apiService } from "../services/api";
import { Employee, Division, Position, UserRole } from "../types";
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Camera,
  CheckCircle,
  XCircle,
  Award
} from "lucide-react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { toast } from "react-hot-toast";
import { formatIDR } from "../utils/exportHelpers";

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDivision, setFilterDivision] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modal and form states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedNik, setSelectedNik] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState<{ title: string; description: string; confirmText?: string; onConfirm: () => void } | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    nik: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    gender: "Laki-laki" as "Laki-laki" | "Perempuan",
    birth_date: "",
    joining_date: "",
    status: "Aktif" as "Aktif" | "Nonaktif",
    division_id: "",
    position_id: "",
    base_salary: "",
    role: "Employee" as UserRole,
    password: "",
    photo: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [emps, divs, posts] = await Promise.all([
        apiService.employees.getAll(),
        apiService.divisions.getAll(),
        apiService.positions.getAll()
      ]);
      setEmployees(emps);
      setDivisions(divs);
      setPositions(posts);
    } catch (e) {
      toast.error("Gagal mengambil data karyawan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Profile Picture Base64 conversion
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, photo: reader.result as string }));
      toast.success("Foto berhasil diunggah!");
    };
    reader.readAsDataURL(file);
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setSelectedNik("");
    setFormData({
      nik: "",
      name: "",
      email: "",
      phone: "",
      address: "",
      gender: "Laki-laki",
      birth_date: "",
      joining_date: "",
      status: "Aktif",
      division_id: divisions[0]?.id.toString() || "",
      position_id: positions[0]?.id.toString() || "",
      base_salary: positions[0]?.base_salary.toString() || "",
      role: "Employee",
      password: "123",
      photo: ""
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setIsEditing(true);
    setSelectedNik(emp.nik);
    setFormData({
      nik: emp.nik,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      address: emp.address,
      gender: emp.gender,
      birth_date: emp.birth_date,
      joining_date: emp.joining_date,
      status: emp.status,
      division_id: emp.division_id.toString(),
      position_id: emp.position_id.toString(),
      base_salary: emp.base_salary.toString(),
      role: emp.role,
      password: emp.password || "123",
      photo: emp.photo || ""
    });
    setShowModal(true);
  };

  const handlePositionChange = (posIdStr: string) => {
    const posId = parseInt(posIdStr);
    const posObj = positions.find(p => p.id === posId);
    setFormData(prev => ({
      ...prev,
      position_id: posIdStr,
      base_salary: posObj ? posObj.base_salary.toString() : prev.base_salary
    }));
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Quick validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.birth_date || !formData.joining_date) {
      toast.error("Silakan isi semua field yang diwajibkan");
      return;
    }

    const payload = {
      ...formData,
      division_id: parseInt(formData.division_id),
      position_id: parseInt(formData.position_id),
      base_salary: parseFloat(formData.base_salary)
    };

    try {
      if (isEditing) {
        await apiService.employees.update(selectedNik, payload);
        toast.success("Biodata Karyawan berhasil diperbarui");
      } else {
        await apiService.employees.create(payload);
        toast.success("Karyawan baru berhasil ditambahkan!");
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal menyimpan data karyawan");
    }
  };

  const handleDeleteEmployee = async (nik: string) => {
    setConfirmPayload({
      title: "Hapus Karyawan",
      description: `Yakin ingin menghapus Karyawan dengan NIK: ${nik}? Seluruh data absensi, cuti, dan gaji juga akan terhapus secara otomatis.`,
      confirmText: "Hapus",
      onConfirm: async () => {
        try {
          await apiService.employees.delete(nik);
          toast.success("Data karyawan berhasil dihapus.");
          fetchData();
        } catch (err: any) {
          toast.error("Gagal menghapus karyawan.");
        } finally {
          setShowConfirmDialog(false);
          setConfirmPayload(null);
        }
      }
    });
    setShowConfirmDialog(true);
  };

  // Filter logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.nik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDivision = filterDivision ? emp.division_id === parseInt(filterDivision) : true;
    const matchesPosition = filterPosition ? emp.position_id === parseInt(filterPosition) : true;
    const matchesStatus = filterStatus ? emp.status === filterStatus : true;

    return matchesSearch && matchesDivision && matchesPosition && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight">Manajemen Karyawan</h2>
          <p className="text-slate-500 text-sm">Kelola file kepegawaian, verifikasi biodata, kelayakan status, dan mutasi jabatan.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer self-start"
        >
          <UserPlus size={16} />
          <span>Tambah Karyawan Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar Panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari NIK, nama, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm pl-9 pr-4 py-2 border border-slate-200 rounded-lg outline-hidden focus:border-blue-500"
          />
        </div>

        {/* Division Filter */}
        <div>
          <select
            value={filterDivision}
            onChange={(e) => setFilterDivision(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-hidden focus:border-blue-500"
          >
            <option value="">Semua Divisi</option>
            {divisions.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Position Filter */}
        <div>
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-hidden focus:border-blue-500"
          >
            <option value="">Semua Jabatan</option>
            {positions.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-hidden focus:border-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Employee List Directory Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-80" />
          ))}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <UserPlus size={48} className="mx-auto stroke-1 text-slate-300 mb-3" />
          <p className="text-sm font-medium">Karyawan tidak ditemukan</p>
          <span className="text-xs">Coba bersihkan filter pencarian atau buat akun baru.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.nik}
              className="bg-white rounded-2xl border border-slate-150 shadow-sm p-5 hover:shadow-md transition-all duration-300 relative overflow-hidden group flex flex-col justify-between"
            >
              {/* Top Row: Quick info & Action Buttons */}
              <div className="flex items-start gap-4">
                {/* Photo frame */}
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-400 text-xl relative">
                  {emp.photo ? (
                    <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" />
                  ) : (
                    emp.name.split(" ").slice(0, 2).map(n => n[0]).join("")
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-blue-600 font-semibold font-mono">{emp.nik}</span>
                    <span className={`w-2 h-2 rounded-full ${emp.status === "Aktif" ? "bg-emerald-500" : "bg-red-400"}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 truncate">{emp.name}</h3>
                  <p className="text-xs text-slate-500 font-medium truncate">{emp.position}</p>
                  <p className="text-xs text-slate-400 font-mono truncate">{emp.division}</p>
                </div>
              </div>

              {/* Details and Metrics */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-slate-400" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-slate-400" />
                  <span>{emp.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-slate-400" />
                  <span className="truncate">{emp.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award size={13} className="text-slate-400" />
                  <span>Role Akses: <strong className="text-blue-600 font-semibold">{emp.role}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign size={13} className="text-slate-400" />
                  <span>Gaji Pokok: <strong className="font-mono">{formatIDR(emp.base_salary)}</strong></span>
                </div>
              </div>

              {/* Action trigger area */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[10px] text-slate-400">
                  Masuk: {emp.joining_date}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEditModal(emp)}
                    className="p-1.5 rounded-lg border border-slate-150 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer text-slate-500"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteEmployee(emp.nik)}
                    className="p-1.5 rounded-lg border border-slate-150 hover:bg-slate-50 hover:text-red-600 transition-colors cursor-pointer text-slate-500"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE & EDIT EMPLOYEE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50 rounded-t-2xl">
              <h3 className="font-semibold text-slate-800 text-sm">
                {isEditing ? `Edit Biodata Karyawan - ${formData.nik}` : "Tambah Karyawan Baru"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                Tutup
              </button>
            </div>

            {/* Scrollable Form body */}
            <form onSubmit={handleSaveEmployee} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Photo Upload area */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 relative overflow-hidden group flex items-center justify-center">
                  {formData.photo ? (
                    <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={32} className="text-slate-400" />
                  )}
                  <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera size={16} />
                    <span>Upload Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <span className="text-[10px] text-slate-400 mt-2">Format: PNG, JPG (Maks 2MB)</span>
              </div>

              {/* Grid 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* NIK (Optional or auto) */}
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">
                    NIK Karyawan {!isEditing && <span className="text-slate-400">(Kosongkan untuk auto-generate)</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: NIK-2026-009"
                    value={formData.nik}
                    onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value }))}
                    disabled={isEditing}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500 font-mono disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Raymond Sastra"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Email Perusahaan *</label>
                  <input
                    type="email"
                    placeholder="Contoh: raymond@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                    required
                  />
                </div>

                {/* Telepon */}
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Nomor Telepon *</label>
                  <input
                    type="tel"
                    placeholder="Contoh: 0812345678"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                    required
                  />
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Jenis Kelamin *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                {/* Tanggal Lahir */}
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Tanggal Lahir *</label>
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                    required
                  />
                </div>

                {/* Tanggal Masuk */}
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Tanggal Masuk Kerja *</label>
                  <input
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, joining_date: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                    required
                  />
                </div>

                {/* Divisi */}
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Divisi Penugasan *</label>
                  <select
                    value={formData.division_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, division_id: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                    required
                  >
                    {divisions.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Jabatan */}
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Jabatan *</label>
                  <select
                    value={formData.position_id}
                    onChange={(e) => handlePositionChange(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                    required
                  >
                    {positions.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Gaji Pokok */}
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Gaji Pokok (IDR) *</label>
                  <input
                    type="number"
                    placeholder="Contoh: 8500000"
                    value={formData.base_salary}
                    onChange={(e) => setFormData(prev => ({ ...prev, base_salary: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500 font-mono"
                    required
                  />
                </div>

                {/* Role Akses Portal */}
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Role Akses Portal *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                  >
                    <option value="Admin">Admin</option>
                    <option value="HR">HR Specialist</option>
                    <option value="Manager">Line Manager</option>
                    <option value="Employee">Staff Employee</option>
                  </select>
                </div>

                {/* Status Karyawan */}
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Status Keaktifan *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>

                {/* Password Portal */}
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Password Portal *</label>
                  <input
                    type="password"
                    placeholder="Contoh: 123456"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                    required
                  />
                </div>

                {/* Alamat Lengkap (span-2) */}
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-500 font-medium mb-1">Alamat Domisili</label>
                  <textarea
                    placeholder="Isi alamat lengkap..."
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    rows={2}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                  />
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Simpan Karyawan
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
