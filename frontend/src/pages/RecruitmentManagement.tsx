import React, { useEffect, useState } from "react";
import { apiService } from "../services/api";
import { JobVacancy, JobApplicant } from "../types";
import { useAuthStore } from "../store/authStore";
import {
  Briefcase,
  Users,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  FileText,
  Bookmark,
  Building,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import { toast } from "react-hot-toast";
import { ConfirmDialog } from "../components/ConfirmDialog";

export default function RecruitmentManagement() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<JobVacancy[]>([]);
  const [applicants, setApplicants] = useState<JobApplicant[]>([]);
  const [activeTab, setActiveTab] = useState<"vacancies" | "candidates">("vacancies");
  const [loading, setLoading] = useState(true);

  // Vacancy Form States
  const [showJobModal, setShowJobModal] = useState(false);
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [jobForm, setJobForm] = useState({
    title: "",
    division: "Teknologi",
    description: "",
    requirements: "",
    status: "Buka" as "Buka" | "Tutup"
  });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState<{ title: string; description: string; confirmText?: string; onConfirm: () => void } | null>(null);

  // Applicant Pipeline states
  const [showAppModal, setShowAppModal] = useState(false);
  const [appForm, setAppForm] = useState({
    name: "",
    email: "",
    phone: "",
    vacancy_id: "",
    cv_path: "",
    selection_status: "Administrasi" as any,
    notes: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allJobs, allApps] = await Promise.all([
        apiService.recruitment.getVacancies(),
        apiService.recruitment.getApplicants()
      ]);
      setJobs(allJobs);
      setApplicants(allApps);
    } catch (e) {
      toast.error("Gagal memuat rekrutmen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // VACANCY CRUD
  const handleOpenCreateJob = () => {
    setIsEditingJob(false);
    setSelectedJobId(null);
    setJobForm({
      title: "",
      division: "Teknologi",
      description: "",
      requirements: "",
      status: "Buka"
    });
    setShowJobModal(true);
  };

  const handleOpenEditJob = (job: JobVacancy) => {
    setIsEditingJob(true);
    setSelectedJobId(job.id);
    setJobForm({
      title: job.title,
      division: job.division,
      description: job.description,
      requirements: job.requirements,
      status: job.status
    });
    setShowJobModal(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditingJob && selectedJobId) {
        await apiService.recruitment.updateVacancy(selectedJobId, jobForm);
        toast.success("Lowongan pekerjaan diperbarui");
      } else {
        await apiService.recruitment.createVacancy(jobForm);
        toast.success("Lowongan pekerjaan baru dipublikasikan!");
      }
      setShowJobModal(false);
      fetchData();
    } catch (err: any) {
      toast.error("Gagal memproses lowongan");
    }
  };

  const handleDeleteJob = (id: number) => {
    setConfirmPayload({
      title: "Hapus Lowongan Pekerjaan",
      description: "Yakin ingin menghapus lowongan ini beserta seluruh berkas pelamar terkait?",
      confirmText: "Hapus",
      onConfirm: async () => {
        try {
          await apiService.recruitment.deleteVacancy(id);
          toast.success("Lowongan berhasil dihapus.");
          fetchData();
        } catch (e) {
          toast.error("Gagal menghapus lowongan");
        } finally {
          setShowConfirmDialog(false);
          setConfirmPayload(null);
        }
      }
    });
    setShowConfirmDialog(true);
  };

  // CANDIDATES PIPELINE
  const handleOpenCreateApp = () => {
    if (jobs.length === 0) {
      toast.error("Silakan buat lowongan pekerjaan terlebih dahulu sebelum menambahkan pelamar!");
      return;
    }
    setAppForm({
      name: "",
      email: "",
      phone: "",
      vacancy_id: jobs[0]?.id.toString() || "",
      cv_path: "",
      selection_status: "Administrasi",
      notes: "Berkas awal diterima."
    });
    setShowAppModal(true);
  };

  const handleCVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file CV maksimal 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAppForm(prev => ({ ...prev, cv_path: reader.result as string }));
      toast.success("Dokumen CV berhasil terlampir!");
    };
    reader.readAsDataURL(file);
  };

  const handleCreateApplicant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...appForm,
        vacancy_id: parseInt(appForm.vacancy_id)
      };
      await apiService.recruitment.createApplicant(payload);
      toast.success("Kandidat baru berhasil didaftarkan ke sistem!");
      setShowAppModal(false);
      fetchData();
    } catch (err: any) {
      toast.error("Gagal mendaftarkan pelamar");
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await apiService.recruitment.updateApplicant(id, { selection_status: status });
      toast.success(`Status pelamar diupdate ke ${status}`);
      fetchData();
    } catch (e) {
      toast.error("Gagal memperbarui status seleksi");
    }
  };

  const handleDeleteApplicant = (id: number) => {
    setConfirmPayload({
      title: "Hapus Kandidat",
      description: "Yakin ingin menghapus data pelamar ini? Data tidak dapat dikembalikan.",
      confirmText: "Hapus",
      onConfirm: async () => {
        try {
          await apiService.recruitment.deleteApplicant(id);
          toast.success("Kandidat terhapus.");
          fetchData();
        } catch (e) {
          toast.error("Gagal menghapus pelamar");
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
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight">E-Recruitment Portal</h2>
          <p className="text-slate-500 text-sm">Kelola karir perusahaan, seleksi CV berkas, dan rekam jejak interview kandidat pelamar.</p>
        </div>

        {/* Action Triggers depending on Tab */}
        <div className="flex gap-2">
          {activeTab === "vacancies" ? (
            <button
              onClick={handleOpenCreateJob}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer"
            >
              <Plus size={16} />
              <span>Buat Lowongan Baru</span>
            </button>
          ) : (
            <button
              onClick={handleOpenCreateApp}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/10 cursor-pointer"
            >
              <Plus size={16} />
              <span>Daftarkan Pelamar Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Layout navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("vacancies")}
          className={`px-5 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === "vacancies"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Briefcase size={16} />
          <span>Lowongan Aktif ({jobs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("candidates")}
          className={`px-5 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === "candidates"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Users size={16} />
          <span>Pipeline Pelamar ({applicants.length})</span>
        </button>
      </div>

      {/* Content depending on selected Tab */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-80" />
          <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-80" />
        </div>
      ) : activeTab === "vacancies" ? (
        /* VACANCIES GRID view */
        jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <Briefcase size={48} className="mx-auto stroke-1 text-slate-300 mb-3" />
            <p className="text-sm font-medium">Belum ada lowongan dibuka</p>
            <span className="text-xs">Klik tombol di atas untuk menerbitkan kualifikasi lowongan pekerjaan baru.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-150 shadow-sm p-5 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md uppercase font-mono">
                      {job.division}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${job.status === "Buka" ? "bg-emerald-500" : "bg-slate-300"}`} />
                  </div>
                  
                  <h3 className="font-bold text-slate-800 text-sm truncate">{job.title}</h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>
                  
                  <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-start gap-1.5">
                      <Bookmark size={13} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2"><strong>Syarat:</strong> {job.requirements}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Dibuat: <strong className="font-mono">{job.created_at}</strong></span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenEditJob(job)}
                      className="p-1.5 rounded hover:bg-slate-50 hover:text-blue-600 text-slate-500 cursor-pointer"
                      title="Edit Lowongan"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="p-1.5 rounded hover:bg-slate-50 hover:text-red-600 text-slate-500 cursor-pointer"
                      title="Hapus Lowongan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* CANDIDATES PIPELINE LIST view */
        applicants.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <Users size={48} className="mx-auto stroke-1 text-slate-300 mb-3" />
            <p className="text-sm font-medium">Belum ada pelamar didaftarkan</p>
            <span className="text-xs">Sistem belum menerima lamaran kerja di kualifikasi manapun.</span>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-150">
                    <th className="p-4">Kandidat</th>
                    <th className="p-4">Posisi Dilamar</th>
                    <th className="p-4">Hubungi</th>
                    <th className="p-4">Lampiran CV</th>
                    <th className="p-4">Tahap Seleksi</th>
                    <th className="p-4">Review Catatan</th>
                    <th className="p-4 text-right">Tindakan Seleksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applicants.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{app.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                          <Building size={14} className="text-slate-400" />
                          <span>{app.vacancy_title || "Lowongan Umum"}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col text-xs text-slate-600 gap-0.5">
                          <div className="flex items-center gap-1">
                            <Mail size={12} className="text-slate-400" />
                            <span>{app.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone size={12} className="text-slate-400" />
                            <span>{app.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {app.cv_path ? (
                          <a
                            href={app.cv_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-red-50 text-red-600 border border-red-150 rounded px-2.5 py-1 font-semibold flex items-center gap-1 hover:bg-red-100 transition-colors inline-flex cursor-pointer"
                          >
                            <FileText size={12} />
                            <span>Buka Resume</span>
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No resume attached</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase border ${
                          app.selection_status === "Diterima"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : app.selection_status === "Ditolak"
                            ? "bg-red-50 text-red-600 border-red-100"
                            : app.selection_status === "Interview"
                            ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                            : app.selection_status === "HR Test"
                            ? "bg-purple-50 text-purple-600 border-purple-100"
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}>
                          {app.selection_status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-500 italic max-w-xs truncate" title={app.notes}>
                        {app.notes || "-"}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-1 justify-end items-center">
                          {/* Selector to update selection stage */}
                          <select
                            value={app.selection_status}
                            onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                            className="text-xs border border-slate-200 rounded p-1 outline-hidden bg-white focus:border-blue-500 mr-2"
                          >
                            <option value="Administrasi">Administrasi</option>
                            <option value="Interview">Interview</option>
                            <option value="HR Test">HR Test</option>
                            <option value="Diterima">Diterima (Hired)</option>
                            <option value="Ditolak">Ditolak (Reject)</option>
                          </select>
                          
                          {/* Delete candidate record */}
                          <button
                            onClick={() => handleDeleteApplicant(app.id)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Hapus Pelamar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
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

      {/* 1. JOB MODAL (VACANCY ADD/EDIT) */}
      {showJobModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <h3 className="font-semibold text-slate-800 text-sm">
                {isEditingJob ? "Edit Lowongan Karir" : "Buka Lowongan Kerja Baru"}
              </h3>
              <button
                onClick={() => setShowJobModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                Tutup
              </button>
            </div>
            <form onSubmit={handleSaveJob} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Judul Pekerjaan *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Flutter Mobile Developer"
                    value={jobForm.title}
                    onChange={(e) => setJobForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Departemen / Divisi *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Teknologi Informasi"
                    value={jobForm.division}
                    onChange={(e) => setJobForm(prev => ({ ...prev, division: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Deskripsi Pekerjaan *</label>
                <textarea
                  placeholder="Isi deskripsi tugas pekerjaan secara detail..."
                  value={jobForm.description}
                  onChange={(e) => setJobForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Kualifikasi & Persyaratan *</label>
                <textarea
                  placeholder="Kualifikasi yang dibutuhkan: Minimal 2 tahun pengalaman, menguasai Dart..."
                  value={jobForm.requirements}
                  onChange={(e) => setJobForm(prev => ({ ...prev, requirements: e.target.value }))}
                  rows={3}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Status Lowongan *</label>
                <select
                  value={jobForm.status}
                  onChange={(e) => setJobForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
                >
                  <option value="Buka">Buka (Bisa Dilamar)</option>
                  <option value="Tutup">Tutup (Ditutup)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Simpan Lowongan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. APPLICANT MODAL (REGISTER NEW CANDIDATE) */}
      {showAppModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <h3 className="font-semibold text-slate-800 text-sm">Registrasi Kandidat Pelamar Baru</h3>
              <button
                onClick={() => setShowAppModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                Tutup
              </button>
            </div>
            <form onSubmit={handleCreateApplicant} className="p-4 space-y-4">
              
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Nama Lengkap Kandidat *</label>
                <input
                  type="text"
                  placeholder="Contoh: Felicia Amanda"
                  value={appForm.name}
                  onChange={(e) => setAppForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Email Kandidat *</label>
                  <input
                    type="email"
                    placeholder="amanda@email.com"
                    value={appForm.email}
                    onChange={(e) => setAppForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">Telepon *</label>
                  <input
                    type="tel"
                    placeholder="08134567"
                    value={appForm.phone}
                    onChange={(e) => setAppForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Posisi Lowongan Kerja Dilamar *</label>
                <select
                  value={appForm.vacancy_id}
                  onChange={(e) => setAppForm(prev => ({ ...prev, vacancy_id: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-indigo-500"
                  required
                >
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>

              {/* Upload CV document */}
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Unggah Berkas Resume / CV (PDF/Image)</label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleCVUpload}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Catatan Awal HR</label>
                <textarea
                  placeholder="Catatan kualifikasi, skor screening awal, dsb..."
                  value={appForm.notes}
                  onChange={(e) => setAppForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAppModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Daftarkan Kandidat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
