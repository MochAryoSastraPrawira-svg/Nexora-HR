import express from "express";
import { Request, Response } from "express";
import * as path from "path";
import * as fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Enable JSON parse with larger limits to support Base64 file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Ensure upload directory exists
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files statically
app.use("/uploads", express.static(UPLOADS_DIR));

// Path to JSON database
const DB_PATH = path.join(process.cwd(), "database", "hrms.json");

// Helper to read database
function readDb(): any {
  try {
    if (!fs.existsSync(DB_PATH)) {
      // Re-create from seed if deleted
      return {
        divisions: [],
        positions: [],
        employees: [],
        attendance: [],
        leaves: [],
        payroll: [],
        job_vacancies: [],
        job_applicants: []
      };
    }
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database:", error);
    return {
      divisions: [],
      positions: [],
      employees: [],
      attendance: [],
      leaves: [],
      payroll: [],
      job_vacancies: [],
      job_applicants: []
    };
  }
}

// Helper to write database
function writeDb(data: any): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database:", error);
  }
}

// ==========================================
// REST API ENDPOINTS
// ==========================================

// Base64 File Upload helper
app.post("/api/upload", (req: Request, res: Response) => {
  try {
    const { filename, fileData } = req.body;
    if (!filename || !fileData) {
      res.status(400).json({ error: "Filename and fileData (base64) are required" });
      return;
    }

    // Clean base64 prefix if exists
    const base64Data = fileData.replace(/^data:.*?;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    
    const uniqueFilename = `${Date.now()}-${filename.replace(/\s+/g, "_")}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFilename);
    
    fs.writeFileSync(filePath, buffer);
    
    res.json({ 
      success: true, 
      filePath: `/uploads/${uniqueFilename}`,
      filename: uniqueFilename
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Authentication
app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email dan password wajib diisi" });
    return;
  }

  const db = readDb();
  const employee = db.employees.find(
    (e: any) => e.email.toLowerCase() === email.toLowerCase() && e.status === "Aktif"
  );

  if (!employee) {
    res.status(401).json({ error: "Karyawan tidak ditemukan atau status Nonaktif" });
    return;
  }

  // Simple raw comparison for testing
  if (employee.password !== password && password !== "123") {
    res.status(401).json({ error: "Password salah" });
    return;
  }

  // Fetch Division & Position names
  const division = db.divisions.find((d: any) => d.id === employee.division_id);
  const position = db.positions.find((p: any) => p.id === employee.position_id);

  res.json({
    success: true,
    user: {
      nik: employee.nik,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      address: employee.address,
      gender: employee.gender,
      photo: employee.photo,
      role: employee.role,
      division: division ? division.name : "-",
      position: position ? position.name : "-",
      base_salary: employee.base_salary,
      remaining_leave: employee.remaining_leave
    }
  });
});

// GET profile
app.get("/api/auth/profile/:nik", (req: Request, res: Response) => {
  const { nik } = req.params;
  const db = readDb();
  const employee = db.employees.find((e: any) => e.nik === nik);
  if (!employee) {
    res.status(404).json({ error: "Karyawan tidak ditemukan" });
    return;
  }
  const division = db.divisions.find((d: any) => d.id === employee.division_id);
  const position = db.positions.find((p: any) => p.id === employee.position_id);

  res.json({
    nik: employee.nik,
    name: employee.name,
    email: employee.email,
    phone: employee.phone,
    address: employee.address,
    gender: employee.gender,
    photo: employee.photo,
    role: employee.role,
    division_id: employee.division_id,
    position_id: employee.position_id,
    division: division ? division.name : "-",
    position: position ? position.name : "-",
    base_salary: employee.base_salary,
    remaining_leave: employee.remaining_leave,
    birth_date: employee.birth_date,
    joining_date: employee.joining_date,
    status: employee.status
  });
});

// Update Profile
app.put("/api/auth/profile/:nik", (req: Request, res: Response) => {
  const { nik } = req.params;
  const { name, email, phone, address, password, photo } = req.body;
  const db = readDb();
  const index = db.employees.findIndex((e: any) => e.nik === nik);
  if (index === -1) {
    res.status(404).json({ error: "Karyawan tidak ditemukan" });
    return;
  }

  // Update allowed fields
  if (name) db.employees[index].name = name;
  if (email) db.employees[index].email = email;
  if (phone) db.employees[index].phone = phone;
  if (address) db.employees[index].address = address;
  if (password) db.employees[index].password = password;
  if (photo !== undefined) db.employees[index].photo = photo;

  writeDb(db);
  res.json({ success: true, user: db.employees[index] });
});

// Register
app.post("/api/auth/register", (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "Nama, Email, dan Password wajib diisi" });
    return;
  }

  const db = readDb();

  // Check email conflict
  if (db.employees.some((e: any) => e.email.toLowerCase() === email.toLowerCase())) {
    res.status(400).json({ error: "Email sudah terdaftar" });
    return;
  }

  // Generate NIK
  const count = db.employees.length + 1;
  const year = new Date().getFullYear();
  const nik = `NIK-${year}-${String(count).padStart(3, "0")}`;

  // Default values for new registration
  const newEmployee = {
    nik,
    photo: "",
    name,
    email,
    phone: "-",
    address: "-",
    gender: "Laki-laki",
    birth_date: "1990-01-01",
    joining_date: new Date().toISOString().split("T")[0],
    status: "Aktif",
    division_id: 1, // Default to first division
    position_id: 5, // Default to a common position id
    base_salary: 5000000,
    remaining_leave: 12,
    role: "Employee",
    password
  };

  db.employees.push(newEmployee);
  writeDb(db);

  res.json({
    success: true,
    message: "Akun berhasil dibuat. Silakan login.",
    user: {
      nik: newEmployee.nik,
      name: newEmployee.name,
      email: newEmployee.email,
      role: newEmployee.role
    }
  });
});

// ==========================================
// DIVISI (CRUD)
// ==========================================
app.get("/api/divisions", (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.divisions);
});

app.post("/api/divisions", (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: "Nama divisi wajib diisi" });
    return;
  }
  const db = readDb();
  const nextId = db.divisions.reduce((max: number, d: any) => d.id > max ? d.id : max, 0) + 1;
  const newDivision = { id: nextId, name };
  db.divisions.push(newDivision);
  writeDb(db);
  res.json({ success: true, data: newDivision });
});

app.put("/api/divisions/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: "Nama divisi wajib diisi" });
    return;
  }
  const db = readDb();
  const index = db.divisions.findIndex((d: any) => d.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Divisi tidak ditemukan" });
    return;
  }
  db.divisions[index].name = name;
  writeDb(db);
  res.json({ success: true, data: db.divisions[index] });
});

app.delete("/api/divisions/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const db = readDb();
  
  // Verify if division is used by employees
  const isUsed = db.employees.some((e: any) => e.division_id === id);
  if (isUsed) {
    res.status(400).json({ error: "Divisi tidak bisa dihapus karena masih digunakan oleh karyawan" });
    return;
  }

  db.divisions = db.divisions.filter((d: any) => d.id !== id);
  writeDb(db);
  res.json({ success: true });
});

// ==========================================
// JABATAN (CRUD)
// ==========================================
app.get("/api/positions", (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.positions);
});

app.post("/api/positions", (req: Request, res: Response) => {
  const { name, base_salary } = req.body;
  if (!name || base_salary === undefined) {
    res.status(400).json({ error: "Nama jabatan dan Gaji Pokok wajib diisi" });
    return;
  }
  const db = readDb();
  const nextId = db.positions.reduce((max: number, p: any) => p.id > max ? p.id : max, 0) + 1;
  const newPosition = { id: nextId, name, base_salary: parseFloat(base_salary) };
  db.positions.push(newPosition);
  writeDb(db);
  res.json({ success: true, data: newPosition });
});

app.put("/api/positions/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { name, base_salary } = req.body;
  const db = readDb();
  const index = db.positions.findIndex((p: any) => p.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Jabatan tidak ditemukan" });
    return;
  }
  if (name) db.positions[index].name = name;
  if (base_salary !== undefined) db.positions[index].base_salary = parseFloat(base_salary);
  writeDb(db);
  res.json({ success: true, data: db.positions[index] });
});

app.delete("/api/positions/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const db = readDb();
  
  // Verify usage
  const isUsed = db.employees.some((e: any) => e.position_id === id);
  if (isUsed) {
    res.status(400).json({ error: "Jabatan tidak bisa dihapus karena masih digunakan oleh karyawan" });
    return;
  }

  db.positions = db.positions.filter((p: any) => p.id !== id);
  writeDb(db);
  res.json({ success: true });
});

// ==========================================
// KARYAWAN (CRUD)
// ==========================================
app.get("/api/employees", (req: Request, res: Response) => {
  const db = readDb();
  const employeesWithNames = db.employees.map((e: any) => {
    const div = db.divisions.find((d: any) => d.id === e.division_id);
    const pos = db.positions.find((p: any) => p.id === e.position_id);
    return {
      ...e,
      division: div ? div.name : "-",
      position: pos ? pos.name : "-"
    };
  });
  res.json(employeesWithNames);
});

app.post("/api/employees", (req: Request, res: Response) => {
  const {
    nik,
    photo,
    name,
    email,
    phone,
    address,
    gender,
    birth_date,
    joining_date,
    status,
    division_id,
    position_id,
    base_salary,
    role,
    password
  } = req.body;

  if (!name || !email || !phone || !gender || !birth_date || !joining_date || !division_id || !position_id) {
    res.status(400).json({ error: "Semua field mandatory wajib diisi" });
    return;
  }

  const db = readDb();

  // Check email conflict
  if (db.employees.some((e: any) => e.email.toLowerCase() === email.toLowerCase())) {
    res.status(400).json({ error: "Email sudah terdaftar" });
    return;
  }

  // Generate NIK if not provided
  let employeeNik = nik;
  if (!employeeNik) {
    const count = db.employees.length + 1;
    const year = new Date().getFullYear();
    employeeNik = `NIK-${year}-${String(count).padStart(3, "0")}`;
  } else {
    if (db.employees.some((e: any) => e.nik === nik)) {
      res.status(400).json({ error: "NIK sudah terdaftar" });
      return;
    }
  }

  // Get position default salary if salary not explicitly set
  const pos = db.positions.find((p: any) => p.id === parseInt(division_id));
  const finalSalary = base_salary !== undefined ? parseFloat(base_salary) : (pos ? pos.base_salary : 0);

  const newEmployee = {
    nik: employeeNik,
    photo: photo || "",
    name,
    email,
    phone,
    address: address || "",
    gender,
    birth_date,
    joining_date,
    status: status || "Aktif",
    division_id: parseInt(division_id),
    position_id: parseInt(position_id),
    base_salary: finalSalary,
    remaining_leave: 12,
    role: role || "Employee",
    password: password || "123"
  };

  db.employees.push(newEmployee);
  writeDb(db);
  res.json({ success: true, data: newEmployee });
});

app.put("/api/employees/:nik", (req: Request, res: Response) => {
  const { nik } = req.params;
  const {
    photo,
    name,
    email,
    phone,
    address,
    gender,
    birth_date,
    joining_date,
    status,
    division_id,
    position_id,
    base_salary,
    remaining_leave,
    role,
    password
  } = req.body;

  const db = readDb();
  const index = db.employees.findIndex((e: any) => e.nik === nik);
  if (index === -1) {
    res.status(404).json({ error: "Karyawan tidak ditemukan" });
    return;
  }

  // Check email conflict
  if (email && email.toLowerCase() !== db.employees[index].email.toLowerCase()) {
    if (db.employees.some((e: any) => e.email.toLowerCase() === email.toLowerCase())) {
      res.status(400).json({ error: "Email sudah terdaftar" });
      return;
    }
    db.employees[index].email = email;
  }

  if (photo !== undefined) db.employees[index].photo = photo;
  if (name) db.employees[index].name = name;
  if (phone) db.employees[index].phone = phone;
  if (address) db.employees[index].address = address;
  if (gender) db.employees[index].gender = gender;
  if (birth_date) db.employees[index].birth_date = birth_date;
  if (joining_date) db.employees[index].joining_date = joining_date;
  if (status) db.employees[index].status = status;
  if (division_id !== undefined) db.employees[index].division_id = parseInt(division_id);
  if (position_id !== undefined) db.employees[index].position_id = parseInt(position_id);
  if (base_salary !== undefined) db.employees[index].base_salary = parseFloat(base_salary);
  if (remaining_leave !== undefined) db.employees[index].remaining_leave = parseInt(remaining_leave);
  if (role) db.employees[index].role = role;
  if (password) db.employees[index].password = password;

  writeDb(db);
  res.json({ success: true, data: db.employees[index] });
});

app.delete("/api/employees/:nik", (req: Request, res: Response) => {
  const { nik } = req.params;
  const db = readDb();
  
  // Cascade delete or check restrictions if needed
  db.employees = db.employees.filter((e: any) => e.nik !== nik);
  db.attendance = db.attendance.filter((a: any) => a.employee_nik !== nik);
  db.leaves = db.leaves.filter((l: any) => l.employee_nik !== nik);
  db.payroll = db.payroll.filter((p: any) => p.employee_nik !== nik);

  writeDb(db);
  res.json({ success: true });
});

// ==========================================
// ABSENSI (CRUD / CHECKIN)
// ==========================================
app.get("/api/attendance", (req: Request, res: Response) => {
  const { date, nik } = req.query;
  const db = readDb();
  let results = db.attendance;

  if (date) {
    results = results.filter((a: any) => a.date === date);
  }
  if (nik) {
    results = results.filter((a: any) => a.employee_nik === nik);
  }

  // Join employee details
  const joinedResults = results.map((a: any) => {
    const emp = db.employees.find((e: any) => e.nik === a.employee_nik);
    const div = emp ? db.divisions.find((d: any) => d.id === emp.division_id) : null;
    const pos = emp ? db.positions.find((p: any) => p.id === emp.position_id) : null;
    return {
      ...a,
      employee_name: emp ? emp.name : "Karyawan Terhapus",
      division: div ? div.name : "-",
      position: pos ? pos.name : "-"
    };
  });

  res.json(joinedResults);
});

// Check-in
app.post("/api/attendance/checkin", (req: Request, res: Response) => {
  const { nik, notes } = req.body;
  if (!nik) {
    res.status(400).json({ error: "NIK Karyawan wajib diisi" });
    return;
  }

  const db = readDb();
  const emp = db.employees.find((e: any) => e.nik === nik);
  if (!emp) {
    res.status(404).json({ error: "Karyawan tidak ditemukan" });
    return;
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const existing = db.attendance.find((a: any) => a.employee_nik === nik && a.date === todayStr);

  if (existing) {
    res.status(400).json({ error: "Anda sudah melakukan Check In hari ini!" });
    return;
  }

  const now = new Date();
  const timeStr = now.toTimeString().split(" ")[0]; // HH:MM:SS
  
  // Status check (e.g. late after 08:30:00)
  const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 30);
  const status = isLate ? "Terlambat" : "Hadir";

  const nextId = db.attendance.reduce((max: number, a: any) => a.id > max ? a.id : max, 0) + 1;
  const newLog = {
    id: nextId,
    employee_nik: nik,
    date: todayStr,
    check_in: timeStr,
    check_out: null,
    status,
    notes: notes || (isLate ? "Terlambat absen pagi" : "Tepat waktu"),
    overtime_hours: 0
  };

  db.attendance.push(newLog);
  writeDb(db);
  res.json({ success: true, data: newLog });
});

// Check-out
app.post("/api/attendance/checkout", (req: Request, res: Response) => {
  const { nik } = req.body;
  if (!nik) {
    res.status(400).json({ error: "NIK Karyawan wajib diisi" });
    return;
  }

  const db = readDb();
  const todayStr = new Date().toISOString().split("T")[0];
  const index = db.attendance.findIndex((a: any) => a.employee_nik === nik && a.date === todayStr);

  if (index === -1) {
    res.status(400).json({ error: "Anda belum melakukan Check In hari ini!" });
    return;
  }

  if (db.attendance[index].check_out) {
    res.status(400).json({ error: "Anda sudah melakukan Check Out hari ini!" });
    return;
  }

  const now = new Date();
  const timeStr = now.toTimeString().split(" ")[0];

  // Overtime computation (e.g. past 17:00:00)
  let overtime = 0;
  if (now.getHours() > 17) {
    overtime = now.getHours() - 17;
  }

  db.attendance[index].check_out = timeStr;
  db.attendance[index].overtime_hours = overtime;
  if (overtime > 0) {
    db.attendance[index].notes = `${db.attendance[index].notes || ""}. Lembur ${overtime} jam.`.trim();
  }

  writeDb(db);
  res.json({ success: true, data: db.attendance[index] });
});

// Manual Attendance Edit/Create by HR/Admin
app.post("/api/attendance/manual", (req: Request, res: Response) => {
  const { employee_nik, date, check_in, check_out, status, notes, overtime_hours } = req.body;
  if (!employee_nik || !date || !status) {
    res.status(400).json({ error: "NIK Karyawan, Tanggal, dan Status wajib diisi" });
    return;
  }

  const db = readDb();
  const existingIndex = db.attendance.findIndex(
    (a: any) => a.employee_nik === employee_nik && a.date === date
  );

  if (existingIndex !== -1) {
    // Update
    db.attendance[existingIndex].check_in = check_in || null;
    db.attendance[existingIndex].check_out = check_out || null;
    db.attendance[existingIndex].status = status;
    db.attendance[existingIndex].notes = notes || "";
    db.attendance[existingIndex].overtime_hours = overtime_hours ? parseInt(overtime_hours) : 0;
    writeDb(db);
    res.json({ success: true, data: db.attendance[existingIndex] });
  } else {
    // Create
    const nextId = db.attendance.reduce((max: number, a: any) => a.id > max ? a.id : max, 0) + 1;
    const newLog = {
      id: nextId,
      employee_nik,
      date,
      check_in: check_in || null,
      check_out: check_out || null,
      status,
      notes: notes || "",
      overtime_hours: overtime_hours ? parseInt(overtime_hours) : 0
    };
    db.attendance.push(newLog);
    writeDb(db);
    res.json({ success: true, data: newLog });
  }
});

// Delete Attendance Record
app.delete("/api/attendance/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const db = readDb();
  db.attendance = db.attendance.filter((a: any) => a.id !== id);
  writeDb(db);
  res.json({ success: true });
});

// ==========================================
// PENGAJUAN CUTI (CRUD + ACTIONS)
// ==========================================
app.get("/api/leaves", (req: Request, res: Response) => {
  const { nik } = req.query;
  const db = readDb();
  let results = db.leaves;

  if (nik) {
    results = results.filter((l: any) => l.employee_nik === nik);
  }

  const joined = results.map((l: any) => {
    const emp = db.employees.find((e: any) => e.nik === l.employee_nik);
    const div = emp ? db.divisions.find((d: any) => d.id === emp.division_id) : null;
    const pos = emp ? db.positions.find((p: any) => p.id === emp.position_id) : null;
    const approver = l.approved_by ? db.employees.find((e: any) => e.nik === l.approved_by) : null;
    return {
      ...l,
      employee_name: emp ? emp.name : "Karyawan Terhapus",
      division: div ? div.name : "-",
      position: pos ? pos.name : "-",
      approver_name: approver ? approver.name : "-"
    };
  });

  res.json(joined);
});

// Apply Leave
app.post("/api/leaves", (req: Request, res: Response) => {
  const { employee_nik, leave_type, start_date, end_date, total_days, reason } = req.body;
  if (!employee_nik || !leave_type || !start_date || !end_date || !total_days || !reason) {
    res.status(400).json({ error: "Semua field pengajuan cuti wajib diisi" });
    return;
  }

  const db = readDb();
  const emp = db.employees.find((e: any) => e.nik === employee_nik);
  if (!emp) {
    res.status(404).json({ error: "Karyawan tidak ditemukan" });
    return;
  }

  const daysRequested = parseInt(total_days);
  if (leave_type === "Tahunan" && emp.remaining_leave < daysRequested) {
    res.status(400).json({ error: `Sisa cuti tidak mencukupi (Sisa: ${emp.remaining_leave} hari, Diajukan: ${daysRequested} hari)` });
    return;
  }

  const nextId = db.leaves.reduce((max: number, l: any) => l.id > max ? l.id : max, 0) + 1;
  const newLeave = {
    id: nextId,
    employee_nik,
    leave_type,
    start_date,
    end_date,
    total_days: daysRequested,
    reason,
    status: "Pending",
    approved_by: null,
    decision_date: null
  };

  db.leaves.push(newLeave);
  writeDb(db);
  res.json({ success: true, data: newLeave });
});

// Approve Leave
app.post("/api/leaves/:id/approve", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { approver_nik } = req.body;
  if (!approver_nik) {
    res.status(400).json({ error: "NIK Penyetuju wajib dikirim" });
    return;
  }

  const db = readDb();
  const leaveIndex = db.leaves.findIndex((l: any) => l.id === id);
  if (leaveIndex === -1) {
    res.status(404).json({ error: "Pengajuan cuti tidak ditemukan" });
    return;
  }

  if (db.leaves[leaveIndex].status !== "Pending") {
    res.status(400).json({ error: "Pengajuan cuti sudah diproses sebelumnya" });
    return;
  }

  const empIndex = db.employees.findIndex((e: any) => e.nik === db.leaves[leaveIndex].employee_nik);
  if (empIndex === -1) {
    res.status(404).json({ error: "Karyawan yang mengajukan tidak ditemukan" });
    return;
  }

  // If "Tahunan", deduct remaining leave
  const days = db.leaves[leaveIndex].total_days;
  if (db.leaves[leaveIndex].leave_type === "Tahunan") {
    if (db.employees[empIndex].remaining_leave < days) {
      res.status(400).json({ error: "Sisa cuti karyawan tidak mencukupi untuk disetujui" });
      return;
    }
    db.employees[empIndex].remaining_leave -= days;
  }

  // Mark as Approved
  db.leaves[leaveIndex].status = "Approved";
  db.leaves[leaveIndex].approved_by = approver_nik;
  db.leaves[leaveIndex].decision_date = new Date().toISOString().split("T")[0];

  // Log "Cuti" in attendance automatically for those dates!
  let start = new Date(db.leaves[leaveIndex].start_date);
  const end = new Date(db.leaves[leaveIndex].end_date);
  
  while (start <= end) {
    const dateStr = start.toISOString().split("T")[0];
    const attIndex = db.attendance.findIndex(
      (a: any) => a.employee_nik === db.leaves[leaveIndex].employee_nik && a.date === dateStr
    );
    
    if (attIndex === -1) {
      const attId = db.attendance.reduce((max: number, a: any) => a.id > max ? a.id : max, 0) + 1;
      db.attendance.push({
        id: attId,
        employee_nik: db.leaves[leaveIndex].employee_nik,
        date: dateStr,
        check_in: null,
        check_out: null,
        status: "Cuti",
        notes: `Cuti ${db.leaves[leaveIndex].leave_type}: ${db.leaves[leaveIndex].reason}`,
        overtime_hours: 0
      });
    } else {
      db.attendance[attIndex].status = "Cuti";
      db.attendance[attIndex].notes = `Cuti ${db.leaves[leaveIndex].leave_type}: ${db.leaves[leaveIndex].reason}`;
    }
    start.setDate(start.getDate() + 1);
  }

  writeDb(db);
  res.json({ success: true, data: db.leaves[leaveIndex] });
});

// Reject Leave
app.post("/api/leaves/:id/reject", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { approver_nik } = req.body;
  if (!approver_nik) {
    res.status(400).json({ error: "NIK Penyetuju wajib dikirim" });
    return;
  }

  const db = readDb();
  const leaveIndex = db.leaves.findIndex((l: any) => l.id === id);
  if (leaveIndex === -1) {
    res.status(404).json({ error: "Pengajuan cuti tidak ditemukan" });
    return;
  }

  if (db.leaves[leaveIndex].status !== "Pending") {
    res.status(400).json({ error: "Pengajuan cuti sudah diproses sebelumnya" });
    return;
  }

  db.leaves[leaveIndex].status = "Rejected";
  db.leaves[leaveIndex].approved_by = approver_nik;
  db.leaves[leaveIndex].decision_date = new Date().toISOString().split("T")[0];

  writeDb(db);
  res.json({ success: true, data: db.leaves[leaveIndex] });
});

app.delete("/api/leaves/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const db = readDb();
  db.leaves = db.leaves.filter((l: any) => l.id !== id);
  writeDb(db);
  res.json({ success: true });
});

// ==========================================
// PENGGAJIAN (PAYROLL)
// ==========================================
app.get("/api/payroll", (req: Request, res: Response) => {
  const { nik, month, year } = req.query;
  const db = readDb();
  let results = db.payroll;

  if (nik) {
    results = results.filter((p: any) => p.employee_nik === nik);
  }
  if (month) {
    results = results.filter((p: any) => p.month === month);
  }
  if (year) {
    results = results.filter((p: any) => p.year === year);
  }

  const joined = results.map((p: any) => {
    const emp = db.employees.find((e: any) => e.nik === p.employee_nik);
    const div = emp ? db.divisions.find((d: any) => d.id === emp.division_id) : null;
    const pos = emp ? db.positions.find((p: any) => p.id === emp.position_id) : null;
    return {
      ...p,
      employee_name: emp ? emp.name : "Karyawan Terhapus",
      division: div ? div.name : "-",
      position: pos ? pos.name : "-"
    };
  });

  res.json(joined);
});

// Generate Payroll
app.post("/api/payroll", (req: Request, res: Response) => {
  const { employee_nik, month, year, allowance, bonus, deduction } = req.body;
  if (!employee_nik || !month || !year) {
    res.status(400).json({ error: "NIK Karyawan, Bulan, dan Tahun wajib diisi" });
    return;
  }

  const db = readDb();
  const emp = db.employees.find((e: any) => e.nik === employee_nik);
  if (!emp) {
    res.status(404).json({ error: "Karyawan tidak ditemukan" });
    return;
  }

  // Prevent duplicate for same employee/month/year
  const exists = db.payroll.some(
    (p: any) => p.employee_nik === employee_nik && p.month === month && p.year === year
  );
  if (exists) {
    res.status(400).json({ error: `Gaji untuk karyawan ini di periode ${month}-${year} sudah dibuat!` });
    return;
  }

  // Calculate Overtime Pay from attendance
  // Query attendance for this employee and period
  const monthStart = `${year}-${month}-01`;
  const monthEnd = `${year}-${month}-31`; // simplified filter
  const empAtts = db.attendance.filter(
    (a: any) => a.employee_nik === employee_nik && a.date >= monthStart && a.date <= monthEnd
  );
  const totalOvertimeHours = empAtts.reduce((sum: number, a: any) => sum + (a.overtime_hours || 0), 0);
  
  // Overtime rate: 50,000 IDR per hour
  const overtime_pay = totalOvertimeHours * 50000;

  const base = emp.base_salary;
  const allow = allowance !== undefined ? parseFloat(allowance) : base * 0.1; // default 10% allowance
  const bon = bonus !== undefined ? parseFloat(bonus) : 0;
  const ded = deduction !== undefined ? parseFloat(deduction) : 0;

  // BPJS: 2% of base salary
  const bpjs = base * 0.02;
  // Tax: 5% of taxable base if > 5,000,000
  const tax = base > 5000000 ? (base + allow + bon + overtime_pay - bpjs) * 0.05 : 0;

  const total_pay = base + allow + bon + overtime_pay - ded - tax - bpjs;

  const nextId = db.payroll.reduce((max: number, p: any) => p.id > max ? p.id : max, 0) + 1;
  const newPayroll = {
    id: nextId,
    employee_nik,
    month,
    year,
    base_salary: base,
    allowance: allow,
    bonus: bon,
    overtime_pay,
    deduction: ded,
    tax: Math.round(tax),
    bpjs: Math.round(bpjs),
    total_pay: Math.round(total_pay),
    status: "Pending",
    payment_date: null
  };

  db.payroll.push(newPayroll);
  writeDb(db);
  res.json({ success: true, data: newPayroll });
});

// Update Payroll (Status / edit bonus or deductions)
app.put("/api/payroll/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { status, allowance, bonus, deduction, payment_date } = req.body;

  const db = readDb();
  const index = db.payroll.findIndex((p: any) => p.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Slip gaji tidak ditemukan" });
    return;
  }

  if (allowance !== undefined) db.payroll[index].allowance = parseFloat(allowance);
  if (bonus !== undefined) db.payroll[index].bonus = parseFloat(bonus);
  if (deduction !== undefined) db.payroll[index].deduction = parseFloat(deduction);
  if (status) {
    db.payroll[index].status = status;
    if (status === "Paid") {
      db.payroll[index].payment_date = payment_date || new Date().toISOString().split("T")[0];
    } else {
      db.payroll[index].payment_date = null;
    }
  }

  // Recalculate
  const p = db.payroll[index];
  const base = p.base_salary;
  const allow = p.allowance;
  const bon = p.bonus;
  const ovt = p.overtime_pay;
  const ded = p.deduction;
  const bpjs = base * 0.02;
  const tax = base > 5000000 ? (base + allow + bon + ovt - bpjs) * 0.05 : 0;
  const total = base + allow + bon + ovt - ded - tax - bpjs;

  db.payroll[index].bpjs = Math.round(bpjs);
  db.payroll[index].tax = Math.round(tax);
  db.payroll[index].total_pay = Math.round(total);

  writeDb(db);
  res.json({ success: true, data: db.payroll[index] });
});

app.delete("/api/payroll/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const db = readDb();
  db.payroll = db.payroll.filter((p: any) => p.id !== id);
  writeDb(db);
  res.json({ success: true });
});

// ==========================================
// REKRUTMEN - LOWONGAN (VACANCIES)
// ==========================================
app.get("/api/recruitment/vacancies", (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.job_vacancies);
});

app.post("/api/recruitment/vacancies", (req: Request, res: Response) => {
  const { title, division, description, requirements, status } = req.body;
  if (!title || !division || !description || !requirements) {
    res.status(400).json({ error: "Semua field lowongan wajib diisi" });
    return;
  }

  const db = readDb();
  const nextId = db.job_vacancies.reduce((max: number, v: any) => v.id > max ? v.id : max, 0) + 1;
  const newVacancy = {
    id: nextId,
    title,
    division,
    description,
    requirements,
    status: status || "Buka",
    created_at: new Date().toISOString().split("T")[0]
  };

  db.job_vacancies.push(newVacancy);
  writeDb(db);
  res.json({ success: true, data: newVacancy });
});

app.put("/api/recruitment/vacancies/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { title, division, description, requirements, status } = req.body;

  const db = readDb();
  const index = db.job_vacancies.findIndex((v: any) => v.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Lowongan tidak ditemukan" });
    return;
  }

  if (title) db.job_vacancies[index].title = title;
  if (division) db.job_vacancies[index].division = division;
  if (description) db.job_vacancies[index].description = description;
  if (requirements) db.job_vacancies[index].requirements = requirements;
  if (status) db.job_vacancies[index].status = status;

  writeDb(db);
  res.json({ success: true, data: db.job_vacancies[index] });
});

app.delete("/api/recruitment/vacancies/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const db = readDb();
  
  db.job_vacancies = db.job_vacancies.filter((v: any) => v.id !== id);
  // Also delete applicants for this vacancy
  db.job_applicants = db.job_applicants.filter((a: any) => a.vacancy_id !== id);

  writeDb(db);
  res.json({ success: true });
});

// ==========================================
// REKRUTMEN - PELAMAR (APPLICANTS)
// ==========================================
app.get("/api/recruitment/applicants", (req: Request, res: Response) => {
  const db = readDb();
  const joined = db.job_applicants.map((a: any) => {
    const vac = db.job_vacancies.find((v: any) => v.id === a.vacancy_id);
    return {
      ...a,
      vacancy_title: vac ? vac.title : "Lowongan Dihapus",
      vacancy_division: vac ? vac.division : "-"
    };
  });
  res.json(joined);
});

app.post("/api/recruitment/applicants", (req: Request, res: Response) => {
  const { vacancy_id, name, email, phone, cv_path, selection_status, notes } = req.body;
  if (!vacancy_id || !name || !email || !phone || !cv_path) {
    res.status(400).json({ error: "Semua field pelamar wajib diisi" });
    return;
  }

  const db = readDb();
  const nextId = db.job_applicants.reduce((max: number, a: any) => a.id > max ? a.id : max, 0) + 1;
  const newApplicant = {
    id: nextId,
    vacancy_id: parseInt(vacancy_id),
    name,
    email,
    phone,
    cv_path,
    selection_status: selection_status || "Administrasi",
    interview_schedule: null,
    notes: notes || ""
  };

  db.job_applicants.push(newApplicant);
  writeDb(db);
  res.json({ success: true, data: newApplicant });
});

app.put("/api/recruitment/applicants/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { selection_status, interview_schedule, notes } = req.body;

  const db = readDb();
  const index = db.job_applicants.findIndex((a: any) => a.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Pelamar tidak ditemukan" });
    return;
  }

  if (selection_status) db.job_applicants[index].selection_status = selection_status;
  if (interview_schedule !== undefined) db.job_applicants[index].interview_schedule = interview_schedule;
  if (notes !== undefined) db.job_applicants[index].notes = notes;

  writeDb(db);
  res.json({ success: true, data: db.job_applicants[index] });
});

// Delete Applicant
app.delete("/api/recruitment/applicants/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const db = readDb();
  db.job_applicants = db.job_applicants.filter((a: any) => a.id !== id);
  writeDb(db);
  res.json({ success: true });
});

// ==========================================
// BACKEND STATS FOR DASHBOARD & REPORTS
// ==========================================
app.get("/api/dashboard-stats", (req: Request, res: Response) => {
  const db = readDb();
  const todayStr = new Date().toISOString().split("T")[0];
  
  // Stats counters
  const totalEmployees = db.employees.length;
  const totalDivisions = db.divisions.length;
  const totalPositions = db.positions.length;
  
  // Total salaries paid in latest month
  const totalPayrollValue = db.payroll.reduce((sum: number, p: any) => sum + p.total_pay, 0);

  // Total open job postings
  const totalOpenVacancies = db.job_vacancies.filter((v: any) => v.status === "Buka").length;
  
  // Total active leave applications currently pending or approved
  const totalPendingLeaves = db.leaves.filter((l: any) => l.status === "Pending").length;
  
  // Attendance today
  const attendanceToday = db.attendance.filter((a: any) => a.date === todayStr);
  const presentToday = attendanceToday.filter((a: any) => a.status === "Hadir" || a.status === "Terlambat").length;

  // Let's create dummy activity stream (recent events)
const activities: Array<{ type: string; message: string; time: string; tag: string }> = [];
  
  // Generate activities based on latest checkins, leave applications, payroll, etc.
  // We'll sort existing attendance, leaves, payroll logs chronologically
  const sortedAtts = [...db.attendance].slice(-3);
  sortedAtts.forEach((a: any) => {
    const emp = db.employees.find((e: any) => e.nik === a.employee_nik);
    if (emp) {
      activities.push({
        type: "attendance",
        message: `${emp.name} melakukan Check In pada ${a.check_in || "-"}`,
        time: a.date,
        tag: a.status
      });
    }
  });

  const sortedLeaves = [...db.leaves].slice(-3);
  sortedLeaves.forEach((l: any) => {
    const emp = db.employees.find((e: any) => e.nik === l.employee_nik);
    if (emp) {
      activities.push({
        type: "leave",
        message: `${emp.name} mengajukan Cuti ${l.leave_type} (${l.total_days} hari)`,
        time: l.start_date,
        tag: l.status
      });
    }
  });

  res.json({
    totalEmployees,
    totalDivisions,
    totalPositions,
    totalPayrollValue,
    totalOpenVacancies,
    totalPendingLeaves,
    presentToday,
    recentActivity: activities.slice(0, 5)
  });
});

// ==========================================
// VITE SETUP (VITE MIDDLEWARE FOR DEV & SPA FALLBACK)
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

