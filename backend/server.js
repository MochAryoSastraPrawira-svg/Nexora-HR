const http = require('http');
const { readFileSync, writeFileSync, mkdirSync, existsSync } = require('fs');
const { parse } = require('url');
const { join, resolve } = require('path');

const PORT = process.env.PORT || 3001;
const dataPath = resolve(__dirname, '..', 'database', 'hrms.json');
const uploadsDir = resolve(__dirname, '..', 'frontend', 'public', 'uploads');

function loadData() {
  console.log('Loading data from:', dataPath);
  
  if (!existsSync(dataPath)) {
    const error = new Error(`Database file not found at: ${dataPath}`);
    console.error('========== DATABASE ERROR ==========');
    console.error(error.stack);
    throw error;
  }

  try {
    const content = readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(content);
    console.log('Data loaded successfully. Employees count:', (data.employees || []).length);
    return data;
  } catch (error) {
    console.error('========== JSON PARSE ERROR ==========');
    console.error('Failed to parse database file:', error.message);
    console.error(error.stack);
    throw new Error(`Invalid JSON in database file: ${error.message}`);
  }
}

function saveData(data) {
  try {
    writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log('Data saved successfully');
  } catch (error) {
    console.error('========== SAVE DATA ERROR ==========');
    console.error('Failed to save data:', error.message);
    console.error(error.stack);
    throw error;
  }
}

function sendJSON(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function nextId(items) {
  if (!items || items.length === 0) return 1;
  return Math.max(...items.map((item) => item.id || 0)) + 1;
}

function getDivisionName(data, divisionId) {
  return (data.divisions || []).find((d) => d.id === divisionId)?.name || '';
}

function getPositionName(data, positionId) {
  return (data.positions || []).find((p) => p.id === positionId)?.name || '';
}

function getEmployee(data, nik) {
  return (data.employees || []).find((emp) => emp.nik === nik);
}

function enrichEmployee(employee, data) {
  if (!employee) return null;
  const { password, ...rest } = employee;
  return {
    ...rest,
    division: getDivisionName(data, employee.division_id),
    position: getPositionName(data, employee.position_id),
  };
}

function enrichAttendance(record, data) {
  const employee = getEmployee(data, record.employee_nik);
  return {
    ...record,
    employee_name: employee?.name || '',
    division: employee ? getDivisionName(data, employee.division_id) : '',
    position: employee ? getPositionName(data, employee.position_id) : '',
  };
}

function enrichLeave(record, data) {
  const employee = getEmployee(data, record.employee_nik);
  const approver = record.approved_by ? getEmployee(data, record.approved_by) : null;
  return {
    ...record,
    employee_name: employee?.name || '',
    division: employee ? getDivisionName(data, employee.division_id) : '',
    position: employee ? getPositionName(data, employee.position_id) : '',
    approver_name: approver?.name || '',
  };
}

function enrichPayroll(record, data) {
  const employee = getEmployee(data, record.employee_nik);
  return {
    ...record,
    employee_name: employee?.name || '',
    division: employee ? getDivisionName(data, employee.division_id) : '',
    position: employee ? getPositionName(data, employee.position_id) : '',
  };
}

function enrichApplicant(record, data) {
  const vacancy = (data.job_vacancies || []).find((v) => v.id === record.vacancy_id);
  return {
    ...record,
    vacancy_title: vacancy?.title || '',
    vacancy_division: vacancy?.division || '',
  };
}

function formatAuthUser(employee, data) {
  return enrichEmployee(employee, data);
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function nowTimeStr() {
  const now = new Date();
  return now.toTimeString().split(' ')[0];
}

function calculatePayrollTotals(baseSalary, allowance, bonus, overtimePay, deduction) {
  const gross = baseSalary + allowance + bonus + overtimePay;
  const tax = Math.round(gross * 0.05);
  const bpjs = Math.round(baseSalary * 0.03);
  const totalPay = gross - deduction - tax - bpjs;
  return { tax, bpjs, total_pay: totalPay };
}

function getDashboardStats(data) {
  const employees = data.employees || [];
  const activeEmployees = employees.filter((e) => e.status === 'Aktif');
  const payroll = data.payroll || [];
  const leaves = data.leaves || [];
  const vacancies = data.job_vacancies || [];
  const attendance = data.attendance || [];
  const today = todayStr();

  const presentToday = attendance.filter(
    (a) => a.date === today && (a.status === 'Hadir' || a.status === 'Terlambat')
  ).length;

  const recentActivity = [];

  attendance.slice(-5).reverse().forEach((a) => {
    const employee = getEmployee(data, a.employee_nik);
    recentActivity.push({
      type: 'attendance',
      message: `${employee?.name || a.employee_nik} - ${a.status} (${a.date})`,
      time: a.check_in || a.date,
      tag: a.status,
    });
  });

  leaves.slice(-3).reverse().forEach((l) => {
    const employee = getEmployee(data, l.employee_nik);
    recentActivity.push({
      type: 'leave',
      message: `${employee?.name || l.employee_nik} mengajukan cuti ${l.leave_type}`,
      time: l.start_date,
      tag: l.status,
    });
  });

  return {
    totalEmployees: activeEmployees.length,
    totalDivisions: (data.divisions || []).length,
    totalPositions: (data.positions || []).length,
    totalPayrollValue: payroll.reduce((sum, p) => sum + (p.total_pay || 0), 0),
    totalOpenVacancies: vacancies.filter((v) => v.status === 'Buka').length,
    totalPendingLeaves: leaves.filter((l) => l.status === 'Pending').length,
    presentToday,
    recentActivity: recentActivity.slice(0, 8),
  };
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = parse(req.url || '', true);
  const pathname = parsedUrl.pathname || '';
  const query = parsedUrl.query || {};

  console.log('Incoming request:', req.method, pathname);

  if (req.method === 'OPTIONS') {
    return sendJSON(res, 204, {});
  }

  try {
    // ── Root Endpoint ───────────────────────────────────────────────────
    if (pathname === '/' && req.method === 'GET') {
      return sendJSON(res, 200, { success: true, message: 'HRMS Backend Running' });
    }

    // ── Health Endpoint ─────────────────────────────────────────────────
    if (pathname === '/health' && req.method === 'GET') {
      return sendJSON(res, 200, { status: 'ok' });
    }

    // ── Auth ──────────────────────────────────────────────────────────
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await parseBody(req);
      const { email, password } = body;
      
      console.log('Login attempt - Email:', email);
      console.log('Login attempt - Password provided:', !!password);
      
      const data = loadData();
      const employeeCount = (data.employees || []).length;
      console.log('Total employees in database:', employeeCount);

      if (!email || !email.trim()) {
        console.log('Login failed: Email is empty');
        return sendJSON(res, 400, { success: false, error: 'Email/NIK harus diisi.' });
      }

      if (!password || !password.trim()) {
        console.log('Login failed: Password is empty');
        return sendJSON(res, 400, { success: false, error: 'Password harus diisi.' });
      }

      const employee = (data.employees || []).find((emp) => {
        return (emp.email === email || emp.nik === email);
      });

      console.log('Employee found:', !!employee);

      if (!employee) {
        console.log('Login failed: Employee not found');
        return sendJSON(res, 401, { success: false, error: 'Email/NIK atau password salah.' });
      }

      if (employee.password !== password) {
        console.log('Login failed: Wrong password');
        return sendJSON(res, 401, { success: false, error: 'Email/NIK atau password salah.' });
      }

      console.log('Login successful for:', employee.email);
      return sendJSON(res, 200, { success: true, user: formatAuthUser(employee, data) });
    }

    if (pathname === '/api/auth/register' && req.method === 'POST') {
      const body = await parseBody(req);
      const { name, email, password } = body;
      const data = loadData();

      if (!name || !email || !password) {
        return sendJSON(res, 400, { success: false, error: 'Semua field harus diisi.' });
      }

      const exists = (data.employees || []).some((emp) => emp.email === email);
      if (exists) {
        return sendJSON(res, 409, { success: false, error: 'Email sudah terdaftar.' });
      }

      const nextNikNumber = (data.employees || []).reduce((max, emp) => {
        const match = emp.nik.match(/NIK-(\d+)/);
        const num = match ? parseInt(match[1], 10) : 0;
        return Math.max(max, num);
      }, 0) + 1;
      const newNik = `NIK-${String(nextNikNumber).padStart(6, '0')}`;
      const newEmployee = {
        nik: newNik,
        photo: '',
        name,
        email,
        phone: '',
        address: '',
        gender: 'Laki-laki',
        birth_date: '',
        joining_date: new Date().toISOString().split('T')[0],
        status: 'Aktif',
        division_id: 1,
        position_id: 1,
        base_salary: 0,
        remaining_leave: 12,
        role: 'Employee',
        password,
      };

      data.employees.push(newEmployee);
      saveData(data);

      return sendJSON(res, 201, { success: true, message: 'Pendaftaran berhasil.' });
    }

    if (pathname.startsWith('/api/auth/profile/') && req.method === 'GET') {
      const nik = pathname.replace('/api/auth/profile/', '');
      const data = loadData();
      const employee = getEmployee(data, nik);

      if (!employee) {
        return sendJSON(res, 404, { success: false, error: 'Pengguna tidak ditemukan.' });
      }

      return sendJSON(res, 200, enrichEmployee(employee, data));
    }

    if (pathname.startsWith('/api/auth/profile/') && req.method === 'PUT') {
      const nik = pathname.replace('/api/auth/profile/', '');
      const body = await parseBody(req);
      const data = loadData();
      const index = (data.employees || []).findIndex((emp) => emp.nik === nik);

      if (index === -1) {
        return sendJSON(res, 404, { success: false, error: 'Pengguna tidak ditemukan.' });
      }

      const employee = data.employees[index];
      Object.assign(employee, body);
      saveData(data);

      return sendJSON(res, 200, { success: true, user: enrichEmployee(employee, data) });
    }

    // ── Dashboard ─────────────────────────────────────────────────────
    if (pathname === '/api/dashboard-stats' && req.method === 'GET') {
      const data = loadData();
      return sendJSON(res, 200, getDashboardStats(data));
    }

    // ── Divisions ─────────────────────────────────────────────────────
    if (pathname === '/api/divisions' && req.method === 'GET') {
      const data = loadData();
      return sendJSON(res, 200, data.divisions || []);
    }

    if (pathname === '/api/divisions' && req.method === 'POST') {
      const body = await parseBody(req);
      const data = loadData();
      
      if (!body.name || !body.name.trim()) {
        return sendJSON(res, 400, { success: false, error: 'Nama divisi harus diisi.' });
      }
      
      const newDivision = { id: nextId(data.divisions), name: body.name };
      data.divisions.push(newDivision);
      saveData(data);
      return sendJSON(res, 201, { success: true, data: newDivision });
    }

    if (pathname.match(/^\/api\/divisions\/\d+$/) && req.method === 'PUT') {
      const id = parseInt(pathname.split('/').pop(), 10);
      const body = await parseBody(req);
      const data = loadData();
      const division = (data.divisions || []).find((d) => d.id === id);
      if (!division) return sendJSON(res, 404, { success: false, error: 'Divisi tidak ditemukan.' });
      
      if (!body.name || !body.name.trim()) {
        return sendJSON(res, 400, { success: false, error: 'Nama divisi harus diisi.' });
      }
      
      division.name = body.name;
      saveData(data);
      return sendJSON(res, 200, { success: true, data: division });
    }

    if (pathname.match(/^\/api\/divisions\/\d+$/) && req.method === 'DELETE') {
      const id = parseInt(pathname.split('/').pop(), 10);
      const data = loadData();
      data.divisions = (data.divisions || []).filter((d) => d.id !== id);
      saveData(data);
      return sendJSON(res, 200, { success: true });
    }

    // ── Positions ─────────────────────────────────────────────────────
    if (pathname === '/api/positions' && req.method === 'GET') {
      const data = loadData();
      return sendJSON(res, 200, data.positions || []);
    }

    if (pathname === '/api/positions' && req.method === 'POST') {
      const body = await parseBody(req);
      const data = loadData();
      
      if (!body.name || !body.name.trim()) {
        return sendJSON(res, 400, { success: false, error: 'Nama jabatan harus diisi.' });
      }
      
      const newPosition = {
        id: nextId(data.positions),
        name: body.name,
        base_salary: body.base_salary || 0,
      };
      data.positions.push(newPosition);
      saveData(data);
      return sendJSON(res, 201, { success: true, data: newPosition });
    }

    if (pathname.match(/^\/api\/positions\/\d+$/) && req.method === 'PUT') {
      const id = parseInt(pathname.split('/').pop(), 10);
      const body = await parseBody(req);
      const data = loadData();
      const position = (data.positions || []).find((p) => p.id === id);
      if (!position) return sendJSON(res, 404, { success: false, error: 'Jabatan tidak ditemukan.' });
      
      if (!body.name || !body.name.trim()) {
        return sendJSON(res, 400, { success: false, error: 'Nama jabatan harus diisi.' });
      }
      
      position.name = body.name;
      position.base_salary = body.base_salary;
      saveData(data);
      return sendJSON(res, 200, { success: true, data: position });
    }

    if (pathname.match(/^\/api\/positions\/\d+$/) && req.method === 'DELETE') {
      const id = parseInt(pathname.split('/').pop(), 10);
      const data = loadData();
      data.positions = (data.positions || []).filter((p) => p.id !== id);
      saveData(data);
      return sendJSON(res, 200, { success: true });
    }

    // ── Employees ─────────────────────────────────────────────────────
    if (pathname === '/api/employees' && req.method === 'GET') {
      const data = loadData();
      const employees = (data.employees || []).map((emp) => enrichEmployee(emp, data));
      return sendJSON(res, 200, employees);
    }

    if (pathname === '/api/employees' && req.method === 'POST') {
      const body = await parseBody(req);
      const data = loadData();

      const nextNikNumber = (data.employees || []).reduce((max, emp) => {
        const match = emp.nik.match(/NIK-(\d+)/);
        const num = match ? parseInt(match[1], 10) : 0;
        return Math.max(max, num);
      }, 0) + 1;
      const newNik = body.nik || `NIK-${String(nextNikNumber).padStart(6, '0')}`;

      const newEmployee = {
        nik: newNik,
        photo: body.photo || '',
        name: body.name,
        email: body.email,
        phone: body.phone || '',
        address: body.address || '',
        gender: body.gender || 'Laki-laki',
        birth_date: body.birth_date || '',
        joining_date: body.joining_date || todayStr(),
        status: body.status || 'Aktif',
        division_id: body.division_id,
        position_id: body.position_id,
        base_salary: body.base_salary || 0,
        remaining_leave: body.remaining_leave ?? 12,
        role: body.role || 'Employee',
        password: body.password || '123',
      };

      data.employees.push(newEmployee);
      saveData(data);
      return sendJSON(res, 201, { success: true, data: enrichEmployee(newEmployee, data) });
    }

    if (pathname.startsWith('/api/employees/') && req.method === 'PUT') {
      const nik = decodeURIComponent(pathname.replace('/api/employees/', ''));
      const body = await parseBody(req);
      const data = loadData();
      const index = (data.employees || []).findIndex((emp) => emp.nik === nik);
      if (index === -1) return sendJSON(res, 404, { success: false, error: 'Karyawan tidak ditemukan.' });

      const employee = data.employees[index];
      Object.assign(employee, {
        ...body,
        nik: employee.nik,
      });
      saveData(data);
      return sendJSON(res, 200, { success: true, data: enrichEmployee(employee, data) });
    }

    if (pathname.startsWith('/api/employees/') && req.method === 'DELETE') {
      const nik = decodeURIComponent(pathname.replace('/api/employees/', ''));
      const data = loadData();
      data.employees = (data.employees || []).filter((emp) => emp.nik !== nik);
      data.attendance = (data.attendance || []).filter((a) => a.employee_nik !== nik);
      data.leaves = (data.leaves || []).filter((l) => l.employee_nik !== nik);
      data.payroll = (data.payroll || []).filter((p) => p.employee_nik !== nik);
      saveData(data);
      return sendJSON(res, 200, { success: true });
    }

    // ── Attendance ────────────────────────────────────────────────────
    if (pathname === '/api/attendance' && req.method === 'GET') {
      const data = loadData();
      let records = data.attendance || [];
      if (query.nik) records = records.filter((a) => a.employee_nik === query.nik);
      if (query.date) records = records.filter((a) => a.date === query.date);
      return sendJSON(res, 200, records.map((r) => enrichAttendance(r, data)));
    }

    if (pathname === '/api/attendance/checkin' && req.method === 'POST') {
      const body = await parseBody(req);
      const { nik, notes } = body;
      
      if (!nik) {
        return sendJSON(res, 400, { success: false, error: 'NIK harus diisi.' });
      }
      
      const data = loadData();
      const today = todayStr();
      const checkIn = nowTimeStr();
      const isLate = checkIn > '08:30:00';
      const status = isLate ? 'Terlambat' : 'Hadir';

      const existing = (data.attendance || []).find((a) => a.employee_nik === nik && a.date === today);
      if (existing) {
        return sendJSON(res, 409, { success: false, error: 'Sudah check-in hari ini.' });
      }

      const record = {
        id: nextId(data.attendance),
        employee_nik: nik,
        date: today,
        check_in: checkIn,
        check_out: null,
        status,
        notes: notes || '',
        overtime_hours: 0,
      };

      data.attendance.push(record);
      saveData(data);
      return sendJSON(res, 201, { success: true, data: enrichAttendance(record, data) });
    }

    if (pathname === '/api/attendance/checkout' && req.method === 'POST') {
      const body = await parseBody(req);
      const { nik } = body;
      
      if (!nik) {
        return sendJSON(res, 400, { success: false, error: 'NIK harus diisi.' });
      }
      
      const data = loadData();
      const today = todayStr();
      const checkOut = nowTimeStr();

      const record = (data.attendance || []).find((a) => a.employee_nik === nik && a.date === today);
      if (!record) {
        return sendJSON(res, 404, { success: false, error: 'Belum check-in hari ini.' });
      }
      if (record.check_out) {
        return sendJSON(res, 409, { success: false, error: 'Sudah check-out hari ini.' });
      }

      record.check_out = checkOut;
      if (checkOut > '17:00:00') {
        const [h, m] = checkOut.split(':').map(Number);
        const overtimeMinutes = (h * 60 + m) - (17 * 60);
        record.overtime_hours = Math.max(0, Math.round((overtimeMinutes / 60) * 10) / 10);
      }

      saveData(data);
      return sendJSON(res, 200, { success: true, data: enrichAttendance(record, data) });
    }

    if (pathname === '/api/attendance/manual' && req.method === 'POST') {
      const body = await parseBody(req);
      const data = loadData();
      
      if (!body.employee_nik || !body.date) {
        return sendJSON(res, 400, { success: false, error: 'NIK dan tanggal harus diisi.' });
      }
      
      const existing = (data.attendance || []).find(
        (a) => a.employee_nik === body.employee_nik && a.date === body.date
      );

      if (existing) {
        Object.assign(existing, {
          check_in: body.check_in || null,
          check_out: body.check_out || null,
          status: body.status,
          notes: body.notes || '',
          overtime_hours: body.overtime_hours || 0,
        });
        saveData(data);
        return sendJSON(res, 200, { success: true, data: enrichAttendance(existing, data) });
      }

      const record = {
        id: nextId(data.attendance),
        employee_nik: body.employee_nik,
        date: body.date,
        check_in: body.check_in || null,
        check_out: body.check_out || null,
        status: body.status,
        notes: body.notes || '',
        overtime_hours: body.overtime_hours || 0,
      };

      data.attendance.push(record);
      saveData(data);
      return sendJSON(res, 201, { success: true, data: enrichAttendance(record, data) });
    }

    if (pathname.match(/^\/api\/attendance\/\d+$/) && req.method === 'DELETE') {
      const id = parseInt(pathname.split('/').pop(), 10);
      const data = loadData();
      data.attendance = (data.attendance || []).filter((a) => a.id !== id);
      saveData(data);
      return sendJSON(res, 200, { success: true });
    }

    // ── Leaves ────────────────────────────────────────────────────────
    if (pathname === '/api/leaves' && req.method === 'GET') {
      const data = loadData();
      let records = data.leaves || [];
      if (query.nik) records = records.filter((l) => l.employee_nik === query.nik);
      return sendJSON(res, 200, records.map((r) => enrichLeave(r, data)));
    }

    if (pathname === '/api/leaves' && req.method === 'POST') {
      const body = await parseBody(req);
      const data = loadData();
      
      if (!body.employee_nik || !body.leave_type || !body.start_date || !body.end_date || !body.total_days || !body.reason) {
        return sendJSON(res, 400, { success: false, error: 'Semua field harus diisi.' });
      }
      
      const record = {
        id: nextId(data.leaves),
        employee_nik: body.employee_nik,
        leave_type: body.leave_type,
        start_date: body.start_date,
        end_date: body.end_date,
        total_days: body.total_days,
        reason: body.reason,
        status: 'Pending',
        approved_by: null,
        decision_date: null,
      };

      data.leaves.push(record);
      saveData(data);
      return sendJSON(res, 201, { success: true, data: enrichLeave(record, data) });
    }

    if (pathname.match(/^\/api\/leaves\/\d+\/approve$/) && req.method === 'POST') {
      const id = parseInt(pathname.split('/')[3], 10);
      const body = await parseBody(req);
      const data = loadData();
      const record = (data.leaves || []).find((l) => l.id === id);
      if (!record) return sendJSON(res, 404, { success: false, error: 'Pengajuan cuti tidak ditemukan.' });

      record.status = 'Approved';
      record.approved_by = body.approver_nik;
      record.decision_date = todayStr();

      const employee = getEmployee(data, record.employee_nik);
      if (employee) {
        employee.remaining_leave = Math.max(0, (employee.remaining_leave || 0) - record.total_days);
      }

      saveData(data);
      return sendJSON(res, 200, { success: true, data: enrichLeave(record, data) });
    }

    if (pathname.match(/^\/api\/leaves\/\d+\/reject$/) && req.method === 'POST') {
      const id = parseInt(pathname.split('/')[3], 10);
      const body = await parseBody(req);
      const data = loadData();
      const record = (data.leaves || []).find((l) => l.id === id);
      if (!record) return sendJSON(res, 404, { success: false, error: 'Pengajuan cuti tidak ditemukan.' });

      record.status = 'Rejected';
      record.approved_by = body.approver_nik;
      record.decision_date = todayStr();
      saveData(data);
      return sendJSON(res, 200, { success: true, data: enrichLeave(record, data) });
    }

    if (pathname.match(/^\/api\/leaves\/\d+$/) && req.method === 'DELETE') {
      const id = parseInt(pathname.split('/').pop(), 10);
      const data = loadData();
      data.leaves = (data.leaves || []).filter((l) => l.id !== id);
      saveData(data);
      return sendJSON(res, 200, { success: true });
    }

    // ── Payroll ───────────────────────────────────────────────────────
    if (pathname === '/api/payroll' && req.method === 'GET') {
      const data = loadData();
      let records = data.payroll || [];
      if (query.nik) records = records.filter((p) => p.employee_nik === query.nik);
      if (query.month) records = records.filter((p) => p.month === query.month);
      if (query.year) records = records.filter((p) => p.year === query.year);
      return sendJSON(res, 200, records.map((r) => enrichPayroll(r, data)));
    }

    if (pathname === '/api/payroll' && req.method === 'POST') {
      const body = await parseBody(req);
      const data = loadData();
      
      if (!body.employee_nik || !body.month || !body.year) {
        return sendJSON(res, 400, { success: false, error: 'NIK, bulan, dan tahun harus diisi.' });
      }
      
      const employee = getEmployee(data, body.employee_nik);
      if (!employee) return sendJSON(res, 404, { success: false, error: 'Karyawan tidak ditemukan.' });

      const duplicate = (data.payroll || []).find(
        (p) =>
          p.employee_nik === body.employee_nik &&
          p.month === body.month &&
          p.year === body.year
      );
      if (duplicate) {
        return sendJSON(res, 409, { success: false, error: 'Slip gaji periode ini sudah ada.' });
      }

      const baseSalary = employee.base_salary;
      const allowance = body.allowance || Math.round(baseSalary * 0.1);
      const bonus = body.bonus || 0;
      const deduction = body.deduction || 0;

      const monthAttendance = (data.attendance || []).filter((a) => {
        const [year, month] = a.date.split('-');
        return (
          a.employee_nik === body.employee_nik &&
          month === body.month &&
          year === body.year
        );
      });
      const overtimePay = monthAttendance.reduce(
        (sum, a) => sum + (a.overtime_hours || 0) * Math.round(baseSalary / 173),
        0
      );

      const { tax, bpjs, total_pay } = calculatePayrollTotals(
        baseSalary,
        allowance,
        bonus,
        overtimePay,
        deduction
      );

      const record = {
        id: nextId(data.payroll),
        employee_nik: body.employee_nik,
        month: body.month,
        year: body.year,
        base_salary: baseSalary,
        allowance,
        bonus,
        overtime_pay: overtimePay,
        deduction,
        tax,
        bpjs,
        total_pay,
        status: 'Pending',
        payment_date: null,
      };

      data.payroll.push(record);
      saveData(data);
      return sendJSON(res, 201, { success: true, data: enrichPayroll(record, data) });
    }

    if (pathname.match(/^\/api\/payroll\/\d+$/) && req.method === 'PUT') {
      const id = parseInt(pathname.split('/').pop(), 10);
      const body = await parseBody(req);
      const data = loadData();
      const record = (data.payroll || []).find((p) => p.id === id);
      if (!record) return sendJSON(res, 404, { success: false, error: 'Slip gaji tidak ditemukan.' });

      if (body.status) {
        record.status = body.status;
        if (body.status === 'Paid') record.payment_date = todayStr();
      }
      if (body.allowance !== undefined) record.allowance = body.allowance;
      if (body.bonus !== undefined) record.bonus = body.bonus;
      if (body.deduction !== undefined) record.deduction = body.deduction;

      const { tax, bpjs, total_pay } = calculatePayrollTotals(
        record.base_salary,
        record.allowance,
        record.bonus,
        record.overtime_pay,
        record.deduction
      );
      record.tax = tax;
      record.bpjs = bpjs;
      record.total_pay = total_pay;

      saveData(data);
      return sendJSON(res, 200, { success: true, data: enrichPayroll(record, data) });
    }

    if (pathname.match(/^\/api\/payroll\/\d+$/) && req.method === 'DELETE') {
      const id = parseInt(pathname.split('/').pop(), 10);
      const data = loadData();
      data.payroll = (data.payroll || []).filter((p) => p.id !== id);
      saveData(data);
      return sendJSON(res, 200, { success: true });
    }

    // ── Recruitment ───────────────────────────────────────────────────
    if (pathname === '/api/recruitment/vacancies' && req.method === 'GET') {
      const data = loadData();
      return sendJSON(res, 200, data.job_vacancies || []);
    }

    if (pathname === '/api/recruitment/vacancies' && req.method === 'POST') {
      const body = await parseBody(req);
      const data = loadData();
      
      if (!body.title || !body.division) {
        return sendJSON(res, 400, { success: false, error: 'Judul dan divisi harus diisi.' });
      }
      
      const vacancy = {
        id: nextId(data.job_vacancies),
        title: body.title,
        division: body.division,
        description: body.description || '',
        requirements: body.requirements || '',
        status: body.status || 'Buka',
        created_at: todayStr(),
      };
      data.job_vacancies.push(vacancy);
      saveData(data);
      return sendJSON(res, 201, { success: true, data: vacancy });
    }

    if (pathname.match(/^\/api\/recruitment\/vacancies\/\d+$/) && req.method === 'PUT') {
      const id = parseInt(pathname.split('/').pop(), 10);
      const body = await parseBody(req);
      const data = loadData();
      const vacancy = (data.job_vacancies || []).find((v) => v.id === id);
      if (!vacancy) return sendJSON(res, 404, { success: false, error: 'Lowongan tidak ditemukan.' });
      Object.assign(vacancy, body);
      saveData(data);
      return sendJSON(res, 200, { success: true, data: vacancy });
    }

    if (pathname.match(/^\/api\/recruitment\/vacancies\/\d+$/) && req.method === 'DELETE') {
      const id = parseInt(pathname.split('/').pop(), 10);
      const data = loadData();
      data.job_vacancies = (data.job_vacancies || []).filter((v) => v.id !== id);
      data.job_applicants = (data.job_applicants || []).filter((a) => a.vacancy_id !== id);
      saveData(data);
      return sendJSON(res, 200, { success: true });
    }

    if (pathname === '/api/recruitment/applicants' && req.method === 'GET') {
      const data = loadData();
      return sendJSON(res, 200, (data.job_applicants || []).map((a) => enrichApplicant(a, data)));
    }

    if (pathname === '/api/recruitment/applicants' && req.method === 'POST') {
      const body = await parseBody(req);
      const data = loadData();
      
      if (!body.vacancy_id || !body.name || !body.email) {
        return sendJSON(res, 400, { success: false, error: 'Lowongan, nama, dan email harus diisi.' });
      }
      
      const applicant = {
        id: nextId(data.job_applicants),
        vacancy_id: body.vacancy_id,
        name: body.name,
        email: body.email,
        phone: body.phone || '',
        cv_path: body.cv_path || '',
        selection_status: body.selection_status || 'Administrasi',
        interview_schedule: body.interview_schedule || null,
        notes: body.notes || '',
      };
      data.job_applicants.push(applicant);
      saveData(data);
      return sendJSON(res, 201, { success: true, data: enrichApplicant(applicant, data) });
    }

    if (pathname.match(/^\/api\/recruitment\/applicants\/\d+$/) && req.method === 'PUT') {
      const id = parseInt(pathname.split('/').pop(), 10);
      const body = await parseBody(req);
      const data = loadData();
      const applicant = (data.job_applicants || []).find((a) => a.id === id);
      if (!applicant) return sendJSON(res, 404, { success: false, error: 'Pelamar tidak ditemukan.' });
      Object.assign(applicant, body);
      saveData(data);
      return sendJSON(res, 200, { success: true, data: enrichApplicant(applicant, data) });
    }

    if (pathname.match(/^\/api\/recruitment\/applicants\/\d+$/) && req.method === 'DELETE') {
      const id = parseInt(pathname.split('/').pop(), 10);
      const data = loadData();
      data.job_applicants = (data.job_applicants || []).filter((a) => a.id !== id);
      saveData(data);
      return sendJSON(res, 200, { success: true });
    }

    // ── Upload ────────────────────────────────────────────────────────
    if (pathname === '/api/upload' && req.method === 'POST') {
      const body = await parseBody(req);
      
      if (!body.filename) {
        return sendJSON(res, 400, { success: false, error: 'Filename harus diisi.' });
      }
      
      if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
      const filePath = `/uploads/${body.filename}`;
      if (body.fileData && body.fileData.startsWith('data:')) {
        const base64 = body.fileData.split(',')[1];
        writeFileSync(join(uploadsDir, body.filename), Buffer.from(base64, 'base64'));
      }
      return sendJSON(res, 200, { success: true, filePath });
    }

    sendJSON(res, 404, { success: false, error: 'Endpoint tidak ditemukan.' });
  } catch (error) {
    console.error('========== SERVER ERROR ==========');
    console.error('Request:', req.method, pathname);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    sendJSON(res, 500, {
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
});

server.listen(PORT, () => console.log('Backend running on port ' + PORT));