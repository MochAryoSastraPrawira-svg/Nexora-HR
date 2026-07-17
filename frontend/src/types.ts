/**
 * HR Management System (HRMS) Type Definitions
 * Created: 2026-07-14
 */

export type UserRole = "Admin" | "HR" | "Manager" | "Employee";

export interface Division {
  id: number;
  name: string;
}

export interface Position {
  id: number;
  name: string;
  base_salary: number;
}

export interface Employee {
  nik: string;
  photo: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gender: "Laki-laki" | "Perempuan";
  birth_date: string; // YYYY-MM-DD
  joining_date: string; // YYYY-MM-DD
  status: "Aktif" | "Nonaktif";
  division_id: number;
  position_id: number;
  division?: string;
  position?: string;
  base_salary: number;
  remaining_leave: number;
  role: UserRole;
  password?: string;
}

export interface Attendance {
  id: number;
  employee_nik: string;
  employee_name?: string;
  division?: string;
  position?: string;
  date: string; // YYYY-MM-DD
  check_in: string | null; // HH:MM:SS
  check_out: string | null; // HH:MM:SS
  status: "Hadir" | "Terlambat" | "Absen" | "Cuti" | "Izin";
  notes: string;
  overtime_hours: number;
}

export interface Leave {
  id: number;
  employee_nik: string;
  employee_name?: string;
  division?: string;
  position?: string;
  leave_type: "Tahunan" | "Sakit" | "Melahirkan" | "Cuti Penting";
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  approved_by: string | null;
  approver_name?: string;
  decision_date: string | null;
}

export interface Payroll {
  id: number;
  employee_nik: string;
  employee_name?: string;
  division?: string;
  position?: string;
  month: string; // '01' to '12'
  year: string; // YYYY
  base_salary: number;
  allowance: number;
  bonus: number;
  overtime_pay: number;
  deduction: number;
  tax: number;
  bpjs: number;
  total_pay: number;
  status: "Pending" | "Paid";
  payment_date: string | null;
}

export interface JobVacancy {
  id: number;
  title: string;
  division: string;
  description: string;
  requirements: string;
  status: "Buka" | "Tutup";
  created_at: string;
}

export interface JobApplicant {
  id: number;
  vacancy_id: number;
  vacancy_title?: string;
  vacancy_division?: string;
  name: string;
  email: string;
  phone: string;
  cv_path: string; // URL or base64 data
  selection_status: "Administrasi" | "Interview" | "HR Test" | "Diterima" | "Ditolak";
  interview_schedule: string | null; // YYYY-MM-DD HH:MM
  notes: string;
}

export interface AuthUser {
  nik: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gender: "Laki-laki" | "Perempuan";
  photo: string;
  role: UserRole;
  division: string;
  position: string;
  base_salary: number;
  remaining_leave: number;
}

export interface DashboardStats {
  totalEmployees: number;
  totalDivisions: number;
  totalPositions: number;
  totalPayrollValue: number;
  totalOpenVacancies: number;
  totalPendingLeaves: number;
  presentToday: number;
  recentActivity: Array<{
    type: string;
    message: string;
    time: string;
    tag: string;
  }>;
}
