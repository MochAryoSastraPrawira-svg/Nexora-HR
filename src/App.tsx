import React, { useState } from "react";

import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";

// Component imports
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

// Page imports
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DivisionsPositions from "./pages/DivisionsPositions";
import EmployeeManagement from "./pages/EmployeeManagement";
import AttendanceManagement from "./pages/AttendanceManagement";
import LeaveManagement from "./pages/LeaveManagement";
import PayrollManagement from "./pages/PayrollManagement";
import RecruitmentManagement from "./pages/RecruitmentManagement";
import Reports from "./pages/Reports";
import ProfilePage from "./pages/ProfilePage";

// 1. Authenticated Route Guard
function ProtectedLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Desktop sidebar + Mobile drawer */}
      <Sidebar
        isMobileDrawerOpen={isMobileNavOpen}
        onMobileDrawerClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Control Bar (Header) */}
        <Header onOpenMobileNav={() => setIsMobileNavOpen(true)} />

        {/* Dynamic Nested Content */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-slate-50 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// 2. Role-Based Permission Guard
interface RoleGuardProps {
  allowedRoles: string[];
}

function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // If not allowed, redirect to personal profile page with safety fallback
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Floating real-time notification toaster */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: "text-xs font-semibold text-slate-800 bg-white border border-slate-100 rounded-xl shadow-lg p-3",
          duration: 3500,
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#ffffff"
            }
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff"
            }
          }
        }}
      />

      <Routes>
        {/* Public Login Gateway */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Frame */}
        <Route element={<ProtectedLayout />}>
          {/* Default entrypoint */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Self-service tools accessible to ALL employees */}
          <Route path="/attendance" element={<AttendanceManagement />} />
          <Route path="/leaves" element={<LeaveManagement />} />
          <Route path="/recruitment" element={<RecruitmentManagement />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin & HR Specialists only consoles */}
          <Route element={<RoleGuard allowedRoles={["Admin", "HR", "Manager"]} />}>
            <Route path="/divisions" element={<DivisionsPositions />} />
            <Route path="/employees" element={<EmployeeManagement />} />
            <Route path="/payroll" element={<PayrollManagement />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Route>

        {/* Global Fallback Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
