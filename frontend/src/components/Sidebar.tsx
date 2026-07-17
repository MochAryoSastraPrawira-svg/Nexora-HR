import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { NexoraLogo } from "./NexoraLogo";
import {
  LayoutDashboard,
  Users,
  Building,
  Clock,
  Calendar,
  DollarSign,
  Briefcase,
  FileText,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

type SidebarProps = {
  /** When true, renders mobile drawer overlay (visible) */
  isMobileDrawerOpen?: boolean;
  /** Close drawer (used on overlay click + after navigation) */
  onMobileDrawerClose?: () => void;
};

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const safeOnNavigate = onNavigate ?? (() => {});

  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => setIsCollapsed((v) => !v);

  const menuItems = useMemo(
    () => [
      { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["Admin", "HR", "Manager", "Employee"] },
      { id: "employees", label: "Karyawan", path: "/employees", icon: Users, roles: ["Admin", "HR", "Manager"] },
      { id: "divisions", label: "Divisi & Jabatan", path: "/divisions", icon: Building, roles: ["Admin", "HR"] },
      { id: "attendance", label: "Absensi & Lembur", path: "/attendance", icon: Clock, roles: ["Admin", "HR", "Manager", "Employee"] },
      { id: "leaves", label: "Pengajuan Cuti", path: "/leaves", icon: Calendar, roles: ["Admin", "HR", "Manager", "Employee"] },
      { id: "payroll", label: "Penggajian", path: "/payroll", icon: DollarSign, roles: ["Admin", "HR", "Manager", "Employee"] },
      { id: "recruitment", label: "Rekrutmen (Lowongan)", path: "/recruitment", icon: Briefcase, roles: ["Admin", "HR", "Manager", "Employee"] },
      { id: "reports", label: "Laporan HR", path: "/reports", icon: FileText, roles: ["Admin", "HR", "Manager"] },
      { id: "profile", label: "Profil Saya", path: "/profile", icon: User, roles: ["Admin", "HR", "Manager", "Employee"] }
    ],
    []
  );

  const allowedMenuItems = menuItems.filter((item) => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  return (
    <div
      className={`bg-white text-slate-900 flex flex-col h-screen transition-all duration-300 border-r border-slate-200 shrink-0 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <NexoraLogo />
            <span className="font-display font-bold text-lg tracking-tight text-slate-800">
              Nexora <span className="text-indigo-600 font-bold">HR</span>
            </span>
          </div>
        )}
        {isCollapsed && (
          <div className="mx-auto">
            <NexoraLogo />
          </div>
        )}

        <button
          onClick={toggleCollapse}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* User Quick Info */}
      {!isCollapsed && user && (
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/60">
          <div className="w-10 h-10 rounded-full border border-slate-200 bg-slate-150 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-700 text-sm">
            {user.photo ? (
              <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.name
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-slate-800">{user.name}</p>
            <p className="text-xs text-indigo-650 font-mono truncate">{user.role}</p>
          </div>
        </div>
      )}

      {/* Menu List */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">

        {allowedMenuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={safeOnNavigate}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative cursor-pointer ${
                isActive
                  ? "bg-slate-100 text-indigo-600 font-bold border-l-4 border-indigo-600 pl-2 rounded-l-none"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <IconComponent
                size={18}
                className={isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-700"}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}

              {isCollapsed && (
                <div className="absolute left-16 bg-slate-900 text-white text-xs py-1.5 px-2.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-md">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-2 border-t border-slate-100">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer group relative"
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Log Out</span>}
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ isMobileDrawerOpen = false, onMobileDrawerClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block sticky top-0 h-screen shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile drawer */}
      <div className={`md:hidden ${isMobileDrawerOpen ? "block" : "hidden"}`}>
        <div
          className="fixed inset-0 z-50 bg-slate-900/40"
          onClick={onMobileDrawerClose}
          aria-hidden
        />
        <div className="fixed inset-y-0 left-0 z-50 w-64">
          <div className="absolute top-3 right-3 z-60">
            <button
              onClick={onMobileDrawerClose}
              className="p-2 rounded-lg bg-white/90 border border-slate-200 text-slate-700 hover:bg-white shadow-sm"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
          <SidebarContent onNavigate={onMobileDrawerClose} />
        </div>
      </div>
    </>
  );
}

