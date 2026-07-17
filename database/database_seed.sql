-- HR Management System (HRMS) Database Schema
-- Compatible with MySQL (phpMyAdmin)
-- Created: 2026-07-14

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `divisions`;
DROP TABLE IF EXISTS `positions`;
DROP TABLE IF EXISTS `employees`;
DROP TABLE IF EXISTS `attendance`;
DROP TABLE IF EXISTS `leaves`;
DROP TABLE IF EXISTS `payroll`;
DROP TABLE IF EXISTS `job_vacancies`;
DROP TABLE IF EXISTS `job_applicants`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. DIVISI
CREATE TABLE `divisions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. JABATAN
CREATE TABLE `positions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `base_salary` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. KARYAWAN
CREATE TABLE `employees` (
  `nik` VARCHAR(20) PRIMARY KEY,
  `photo` VARCHAR(255) DEFAULT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `phone` VARCHAR(20) NOT NULL,
  `address` TEXT NOT NULL,
  `gender` ENUM('Laki-laki', 'Perempuan') NOT NULL,
  `birth_date` DATE NOT NULL,
  `joining_date` DATE NOT NULL,
  `status` ENUM('Aktif', 'Nonaktif') NOT NULL DEFAULT 'Aktif',
  `division_id` INT,
  `position_id` INT,
  `base_salary` DECIMAL(12,2) NOT NULL,
  `remaining_leave` INT NOT NULL DEFAULT 12,
  `role` ENUM('Admin', 'HR', 'Manager', 'Employee') NOT NULL DEFAULT 'Employee',
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`division_id`) REFERENCES `divisions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. ABSENSI
CREATE TABLE `attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_nik` VARCHAR(20) NOT NULL,
  `date` DATE NOT NULL,
  `check_in` TIME DEFAULT NULL,
  `check_out` TIME DEFAULT NULL,
  `status` ENUM('Hadir', 'Terlambat', 'Absen', 'Cuti', 'Izin') NOT NULL DEFAULT 'Hadir',
  `notes` TEXT DEFAULT NULL,
  `overtime_hours` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_emp_date` (`employee_nik`, `date`),
  FOREIGN KEY (`employee_nik`) REFERENCES `employees` (`nik`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. PENGAJUAN CUTI
CREATE TABLE `leaves` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_nik` VARCHAR(20) NOT NULL,
  `leave_type` ENUM('Tahunan', 'Sakit', 'Melahirkan', 'Cuti Penting') NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `total_days` INT NOT NULL,
  `reason` TEXT NOT NULL,
  `status` ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  `approved_by` VARCHAR(20) DEFAULT NULL,
  `decision_date` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`employee_nik`) REFERENCES `employees` (`nik`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`approved_by`) REFERENCES `employees` (`nik`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. PENGGAJIAN
CREATE TABLE `payroll` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_nik` VARCHAR(20) NOT NULL,
  `month` VARCHAR(2) NOT NULL, -- '01' to '12'
  `year` VARCHAR(4) NOT NULL, -- '2026' etc
  `base_salary` DECIMAL(12,2) NOT NULL,
  `allowance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `bonus` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `overtime_pay` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `deduction` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `tax` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `bpjs` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_pay` DECIMAL(12,2) NOT NULL,
  `status` ENUM('Pending', 'Paid') NOT NULL DEFAULT 'Pending',
  `payment_date` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_emp_month_year` (`employee_nik`, `month`, `year`),
  FOREIGN KEY (`employee_nik`) REFERENCES `employees` (`nik`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. LOWONGAN REKRUTMEN
CREATE TABLE `job_vacancies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `division` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `requirements` TEXT NOT NULL,
  `status` ENUM('Buka', 'Tutup') NOT NULL DEFAULT 'Buka',
  `created_at` DATE NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. PELAMAR REKRUTMEN
CREATE TABLE `job_applicants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vacancy_id` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `cv_path` VARCHAR(255) NOT NULL,
  `selection_status` ENUM('Administrasi', 'Interview', 'HR Test', 'Diterima', 'Ditolak') NOT NULL DEFAULT 'Administrasi',
  `interview_schedule` DATETIME DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`vacancy_id`) REFERENCES `job_vacancies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- SEED DATA

-- Divisions
INSERT INTO `divisions` (`id`, `name`) VALUES
(1, 'Teknologi Informasi (IT)'),
(2, 'Human Resources (HR)'),
(3, 'Keuangan & Akuntansi'),
(4, 'Pemasaran & Penjualan');

-- Positions
INSERT INTO `positions` (`id`, `name`, `base_salary`) VALUES
(1, 'Senior Software Engineer', 15000000.00),
(2, 'HR Specialist', 8500000.00),
(3, 'Finance Controller', 11000000.00),
(4, 'Marketing Executive', 7500000.00),
(5, 'IT Support Specialist', 6000000.00);

-- Employees
-- Default password: '123456' for ease of testing
INSERT INTO `employees` (`nik`, `photo`, `name`, `email`, `phone`, `address`, `gender`, `birth_date`, `joining_date`, `status`, `division_id`, `position_id`, `base_salary`, `remaining_leave`, `role`, `password`) VALUES
('NIK-2026-001', 'avatar_admin.png', 'Budi Santoso', 'budi.admin@hrms.com', '081234567890', 'Jl. Sudirman No. 45, Jakarta Selatan', 'Laki-laki', '1990-05-15', '2020-01-10', 'Aktif', 1, 1, 15000000.00, 10, 'Admin', '$2b$10$9H1b6Ea.Y456eB7ZfSNo9eZ7f26d2eP8b8h2ZfX/bA8fSNo9eZ7f2'), -- bcrypt mock or raw '123456'
('NIK-2026-002', 'avatar_hr.png', 'Siti Rahma', 'siti.hr@hrms.com', '082345678901', 'Jl. Gatot Subroto No. 12, Jakarta Pusat', 'Perempuan', '1993-08-22', '2021-03-15', 'Aktif', 2, 2, 8500000.00, 12, 'HR', '123456'),
('NIK-2026-003', 'avatar_manager.png', 'Hendra Wijaya', 'hendra.manager@hrms.com', '083456789012', 'Jl. Rasuna Said Block B-4, Jakarta Selatan', 'Laki-laki', '1985-11-30', '2019-06-01', 'Aktif', 3, 3, 11000000.00, 12, 'Manager', '123456'),
('NIK-2026-004', 'avatar_emp1.png', 'Andi Pratama', 'andi.employee@hrms.com', '084567890123', 'Jl. Kebon Jeruk No. 8, Jakarta Barat', 'Laki-laki', '1995-02-14', '2023-09-01', 'Aktif', 1, 5, 6000000.00, 8, 'Employee', '123456'),
('NIK-2026-005', 'avatar_emp2.png', 'Dewi Lestari', 'dewi.employee@hrms.com', '085678901234', 'Jl. Margonda Raya No. 110, Depok', 'Perempuan', '1997-07-04', '2024-02-15', 'Aktif', 4, 4, 7500000.00, 11, 'Employee', '123456');

-- Attendance for July 14, 2026
INSERT INTO `attendance` (`employee_nik`, `date`, `check_in`, `check_out`, `status`, `notes`, `overtime_hours`) VALUES
('NIK-2026-001', '2026-07-14', '08:15:00', '17:30:00', 'Hadir', 'Tepat waktu', 0),
('NIK-2026-002', '2026-07-14', '08:25:00', '17:00:00', 'Hadir', 'Tepat waktu', 0),
('NIK-2026-003', '2026-07-14', '08:45:00', '18:15:00', 'Terlambat', 'Terlambat 15 menit', 0),
('NIK-2026-004', '2026-07-14', '08:10:00', '19:15:00', 'Hadir', 'Lembur pengerjaan rilis', 2),
('NIK-2026-005', '2026-07-14', NULL, NULL, 'Izin', 'Sakit dengan surat dokter', 0);

-- Leaves
INSERT INTO `leaves` (`id`, `employee_nik`, `leave_type`, `start_date`, `end_date`, `total_days`, `reason`, `status`, `approved_by`, `decision_date`) VALUES
(1, 'NIK-2026-001', 'Tahunan', '2026-07-20', '2026-07-22', 3, 'Acara keluarga di luar kota', 'Approved', 'NIK-2026-002', '2026-07-10'),
(2, 'NIK-2026-004', 'Tahunan', '2026-08-01', '2026-08-04', 4, 'Cuti tahunan pribadi', 'Pending', NULL, NULL),
(3, 'NIK-2026-005', 'Sakit', '2026-07-14', '2026-07-14', 1, 'Sakit demam', 'Approved', 'NIK-2026-002', '2026-07-14');

-- Payroll for June 2026
INSERT INTO `payroll` (`employee_nik`, `month`, `year`, `base_salary`, `allowance`, `bonus`, `overtime_pay`, `deduction`, `tax`, `bpjs`, `total_pay`, `status`, `payment_date`) VALUES
('NIK-2026-001', '06', '2026', 15000000.00, 1500000.00, 2000000.00, 0.00, 0.00, 850000.00, 450000.00, 17200000.00, 'Paid', '2026-06-25'),
('NIK-2026-002', '06', '2026', 8500000.00, 850000.00, 500000.00, 0.00, 0.00, 380000.00, 255000.00, 9215000.00, 'Paid', '2026-06-25'),
('NIK-2026-003', '06', '2026', 11000000.00, 1100000.00, 1000000.00, 150000.00, 100000.00, 550000.00, 330000.00, 12270000.00, 'Paid', '2026-06-25'),
('NIK-2026-004', '06', '2026', 6000000.00, 600000.00, 0.00, 500000.00, 0.00, 220000.00, 180000.00, 6700000.00, 'Paid', '2026-06-25');

-- Recruitment Job Openings
INSERT INTO `job_vacancies` (`id`, `title`, `division`, `description`, `requirements`, `status`, `created_at`) VALUES
(1, 'React Frontend Developer', 'Teknologi Informasi (IT)', 'Kami mencari developer Frontend React berbakat untuk membangun dashboard dan sistem internal HRMS perusahaan.', '- Berpengalaman dengan React, TypeScript, Tailwind CSS\n- Memahami State Management (Zustand/Redux)\n- Terbiasa integrasi REST API', 'Buka', '2026-07-01'),
(2, 'Senior Recruiter Specialist', 'Human Resources (HR)', 'Bertanggung jawab atas rekrutmen end-to-end karyawan baru di divisi teknologi dan sales.', '- Berpengalaman minimal 3 tahun di bidang Recruiter / Talent Acquisition\n- Memiliki komunikasi yang baik\n- Mampu menyusun jadwal interview dan tes', 'Buka', '2026-07-05');

-- Applicants
INSERT INTO `job_applicants` (`id`, `vacancy_id`, `name`, `email`, `phone`, `cv_path`, `selection_status`, `interview_schedule`, `notes`) VALUES
(1, 1, 'Rian Hidayat', 'rian.hidayat@gmail.com', '087812345678', 'cv_rian_hidayat.pdf', 'Interview', '2026-07-16 10:00:00', 'Kandidat memiliki portfolio yang kuat di React & Tailwind.'),
(2, 2, 'Siska Amelia', 'siska.amelia@gmail.com', '089612345678', 'cv_siska_amelia.pdf', 'Administrasi', NULL, 'Pendidikan S1 Psikologi, pengalaman HR Intern.');
