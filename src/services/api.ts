import axios from "axios";
import {
  Division,
  Position,
  Employee,
  Attendance,
  Leave,
  Payroll,
  JobVacancy,
  JobApplicant,
  AuthUser,
  DashboardStats
} from "../types";

// Base URL for API calls is relative to the client proxy
const API = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json"
  }
});

export const apiService = {
  // Authentication
  auth: {
    login: async (email: string, password: string): Promise<{ success: boolean; user: AuthUser }> => {
      const response = await API.post("/auth/login", { email, password });
      return response.data;
    },
    getProfile: async (nik: string): Promise<Employee> => {
      const response = await API.get(`/auth/profile/${nik}`);
      return response.data;
    },
    updateProfile: async (nik: string, data: Partial<Employee>): Promise<{ success: boolean; user: Employee }> => {
      const response = await API.put(`/auth/profile/${nik}`, data);
      return response.data;
    },
    register: async (data: { name: string; email: string; password: string }): Promise<{ success: boolean; message: string }> => {
      const response = await API.post("/auth/register", data);
      return response.data;
    }
  },

  // Divisions
  divisions: {
    getAll: async (): Promise<Division[]> => {
      const response = await API.get("/divisions");
      return response.data;
    },
    create: async (name: string): Promise<{ success: boolean; data: Division }> => {
      const response = await API.post("/divisions", { name });
      return response.data;
    },
    update: async (id: number, name: string): Promise<{ success: boolean; data: Division }> => {
      const response = await API.put(`/divisions/${id}`, { name });
      return response.data;
    },
    delete: async (id: number): Promise<{ success: boolean }> => {
      const response = await API.delete(`/divisions/${id}`);
      return response.data;
    }
  },

  // Positions
  positions: {
    getAll: async (): Promise<Position[]> => {
      const response = await API.get("/positions");
      return response.data;
    },
    create: async (name: string, base_salary: number): Promise<{ success: boolean; data: Position }> => {
      const response = await API.post("/positions", { name, base_salary });
      return response.data;
    },
    update: async (id: number, name: string, base_salary: number): Promise<{ success: boolean; data: Position }> => {
      const response = await API.put(`/positions/${id}`, { name, base_salary });
      return response.data;
    },
    delete: async (id: number): Promise<{ success: boolean }> => {
      const response = await API.delete(`/positions/${id}`);
      return response.data;
    }
  },

  // Employees
  employees: {
    getAll: async (): Promise<Employee[]> => {
      const response = await API.get("/employees");
      return response.data;
    },
    create: async (data: Partial<Employee>): Promise<{ success: boolean; data: Employee }> => {
      const response = await API.post("/employees", data);
      return response.data;
    },
    update: async (nik: string, data: Partial<Employee>): Promise<{ success: boolean; data: Employee }> => {
      const response = await API.put(`/employees/${nik}`, data);
      return response.data;
    },
    delete: async (nik: string): Promise<{ success: boolean }> => {
      const response = await API.delete(`/employees/${nik}`);
      return response.data;
    }
  },

  // Attendance
  attendance: {
    getAll: async (params?: { date?: string; nik?: string }): Promise<Attendance[]> => {
      const response = await API.get("/attendance", { params });
      return response.data;
    },
    checkIn: async (nik: string, notes?: string): Promise<{ success: boolean; data: Attendance }> => {
      const response = await API.post("/attendance/checkin", { nik, notes });
      return response.data;
    },
    checkOut: async (nik: string): Promise<{ success: boolean; data: Attendance }> => {
      const response = await API.post("/attendance/checkout", { nik });
      return response.data;
    },
    saveManual: async (data: Partial<Attendance>): Promise<{ success: boolean; data: Attendance }> => {
      const response = await API.post("/attendance/manual", data);
      return response.data;
    },
    delete: async (id: number): Promise<{ success: boolean }> => {
      const response = await API.delete(`/attendance/${id}`);
      return response.data;
    }
  },

  // Leaves
  leaves: {
    getAll: async (params?: { nik?: string }): Promise<Leave[]> => {
      const response = await API.get("/leaves", { params });
      return response.data;
    },
    apply: async (data: {
      employee_nik: string;
      leave_type: string;
      start_date: string;
      end_date: string;
      total_days: number;
      reason: string;
    }): Promise<{ success: boolean; data: Leave }> => {
      const response = await API.post("/leaves", data);
      return response.data;
    },
    approve: async (id: number, approver_nik: string): Promise<{ success: boolean; data: Leave }> => {
      const response = await API.post(`/leaves/${id}/approve`, { approver_nik });
      return response.data;
    },
    reject: async (id: number, approver_nik: string): Promise<{ success: boolean; data: Leave }> => {
      const response = await API.post(`/leaves/${id}/reject`, { approver_nik });
      return response.data;
    },
    delete: async (id: number): Promise<{ success: boolean }> => {
      const response = await API.delete(`/leaves/${id}`);
      return response.data;
    }
  },

  // Payroll
  payroll: {
    getAll: async (params?: { nik?: string; month?: string; year?: string }): Promise<Payroll[]> => {
      const response = await API.get("/payroll", { params });
      return response.data;
    },
    generate: async (data: {
      employee_nik: string;
      month: string;
      year: string;
      allowance?: number;
      bonus?: number;
      deduction?: number;
    }): Promise<{ success: boolean; data: Payroll }> => {
      const response = await API.post("/payroll", data);
      return response.data;
    },
    update: async (
      id: number,
      data: { status?: "Pending" | "Paid"; allowance?: number; bonus?: number; deduction?: number }
    ): Promise<{ success: boolean; data: Payroll }> => {
      const response = await API.put(`/payroll/${id}`, data);
      return response.data;
    },
    delete: async (id: number): Promise<{ success: boolean }> => {
      const response = await API.delete(`/payroll/${id}`);
      return response.data;
    }
  },

  // Recruitment
  recruitment: {
    // Vacancies
    getVacancies: async (): Promise<JobVacancy[]> => {
      const response = await API.get("/recruitment/vacancies");
      return response.data;
    },
    createVacancy: async (data: Partial<JobVacancy>): Promise<{ success: boolean; data: JobVacancy }> => {
      const response = await API.post("/recruitment/vacancies", data);
      return response.data;
    },
    updateVacancy: async (id: number, data: Partial<JobVacancy>): Promise<{ success: boolean; data: JobVacancy }> => {
      const response = await API.put(`/recruitment/vacancies/${id}`, data);
      return response.data;
    },
    deleteVacancy: async (id: number): Promise<{ success: boolean }> => {
      const response = await API.delete(`/recruitment/vacancies/${id}`);
      return response.data;
    },
    // Applicants
    getApplicants: async (): Promise<JobApplicant[]> => {
      const response = await API.get("/recruitment/applicants");
      return response.data;
    },
    createApplicant: async (data: Partial<JobApplicant>): Promise<{ success: boolean; data: JobApplicant }> => {
      const response = await API.post("/recruitment/applicants", data);
      return response.data;
    },
    updateApplicant: async (
      id: number,
      data: { selection_status: string; interview_schedule?: string | null; notes?: string }
    ): Promise<{ success: boolean; data: JobApplicant }> => {
      const response = await API.put(`/recruitment/applicants/${id}`, data);
      return response.data;
    },
    deleteApplicant: async (id: number): Promise<{ success: boolean }> => {
      const response = await API.delete(`/recruitment/applicants/${id}`);
      return response.data;
    }
  },

  // Dashboard Stats
  dashboard: {
    getStats: async (): Promise<DashboardStats> => {
      const response = await API.get("/dashboard-stats");
      return response.data;
    }
  },

  // Custom File Uploader helper (Sends Base64 string to `/api/upload` endpoint)
  upload: async (filename: string, fileData: string): Promise<{ success: boolean; filePath: string }> => {
    const response = await API.post("/upload", { filename, fileData });
    return response.data;
  }
};
