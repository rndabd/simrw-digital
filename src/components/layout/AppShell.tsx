"use client";

import React, { ReactNode } from "react";
import { useViewMode } from "@/context/ViewModeContext";
import { useAuth } from "@/context/AuthContext";
import ViewModeToggle from "@/components/common/ViewModeToggle";
import {
  ShieldCheck,
  Home,
  FileText,
  CreditCard,
  Users,
  User,
  ArrowRightLeft,
  LogOut,
  Bell,
  Lock,
  Siren,
  Building2,
  RotateCw,
  MessageSquare,
} from "lucide-react";

interface AppShellProps {
  children: ReactNode;
  activeTab?: string;
  onChangeTab?: (tab: any) => void;
  onOpenSOS?: () => void;
  onOpenNotif?: () => void;
}

export default function AppShell({
  children,
  activeTab = "beranda",
  onChangeTab,
  onOpenSOS,
  onOpenNotif,
}: AppShellProps) {
  const { viewMode } = useViewMode();
  const { user, isOfficerMode, setOfficerMode, quickLogin, logout } = useAuth();

  const isDesktop = viewMode === "desktop";

  const navItems = [
    ...(user?.isSuperAdmin
      ? [{ key: "admin", label: "Portal Kelurahan (Admin)", icon: Building2 }]
      : []),
    { key: "beranda", label: "Beranda Utama", icon: Home },
    { key: "surat", label: "Layanan Surat", icon: FileText },
    { key: "iuran", label: "Iuran & Kas RT", icon: CreditCard },
    { key: "pengaduan", label: "Pengaduan Warga", icon: MessageSquare },
    { key: "warga", label: "Kontak & Direktori", icon: Users },
    { key: "profil", label: "Profil & E-KTP", icon: User },
  ];

  if (!isDesktop) {
    // MOBILE MODE (Phone Frame)
    return (
      <div
        className="min-h-screen bg-slate-900 md:py-6 flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: "url('/bg-desktop.jpeg')" }}
      >
        {/* Backdrop overlay on desktop display for mobile simulator */}
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md hidden md:block pointer-events-none" />

        {/* Top Control Bar on Desktop Screens */}
        <div className="hidden md:flex items-center justify-between w-full max-w-md px-4 py-2 mb-2 text-xs text-slate-200 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700/60 shadow-lg relative z-10">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Mode Simulasi Ponsel (PWA)
          </div>
          <ViewModeToggle />
        </div>

        {/* Mobile Mockup Device Container */}
        <div
          className="w-full max-w-md min-h-screen md:min-h-[840px] md:max-h-[90vh] flex flex-col shadow-2xl relative overflow-y-auto no-scrollbar md:rounded-[2.5rem] md:border-[8px] md:border-slate-800 bg-cover bg-top bg-no-repeat relative z-10"
          style={{ backgroundImage: "url('/bg-mobile.jpg')" }}
        >
          <div className="hidden md:block w-32 h-4 bg-slate-800 rounded-b-xl mx-auto absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none" />
          <div className="flex-1 flex flex-col bg-slate-900/10 backdrop-blur-[1.5px] min-h-full">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // DESKTOP MODE (Wide Responsive Civic Portal)
  return (
    <div
      className="min-h-screen text-slate-900 flex flex-col bg-cover bg-center bg-fixed bg-no-repeat relative"
      style={{ backgroundImage: "url('/bg-desktop.jpeg')" }}
    >
      {/* Light soft veil for contrast & readability */}
      <div className="absolute inset-0 bg-slate-900/15 pointer-events-none" />

      {/* Top Universal Civic Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md text-white border-b border-slate-800/80 sticky top-0 z-50 px-6 py-2.5 flex items-center justify-between shadow-md relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-900/50">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span>SIM-RW Digital</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-[10px] text-emerald-300 border border-emerald-500/30">
                Mode Desktop
              </span>
            </div>
            <div className="text-xs md:text-sm font-extrabold text-white tracking-tight">
              Inisiasi RW 15 Komplek Giri Ciheulang, Kec. Ciparay Kab. Bandung
            </div>
          </div>
        </div>

        {/* Center: UU PDP badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Kepatuhan UU PDP No. 27/2022 (Terproteksi Enkripsi)</span>
        </div>

        {/* Right actions: View mode switch, Emergency SOS, Notif */}
        <div className="flex items-center gap-3">
          {onOpenSOS && (
            <button
              onClick={onOpenSOS}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/30 transition-all active:scale-95"
            >
              <Siren className="w-3.5 h-3.5 animate-pulse" />
              <span>SOS Darurat</span>
            </button>
          )}

          <ViewModeToggle />

          {onOpenNotif && (
            <button
              onClick={onOpenNotif}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors relative"
              title="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
            </button>
          )}
        </div>
      </header>

      {/* Main Desktop Layout Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-12 gap-6 relative">
        {/* Left Sidebar (Desktop Navigation) */}
        {user && (
          <aside className="col-span-3 space-y-4">
            {/* User Identity Card */}
            <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-white/60 shadow-lg space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Pengguna Masuk:</div>
                  <div className="text-sm font-extrabold text-slate-900 mt-0.5 leading-tight">
                    {user.fullName}
                  </div>
                  <div className="text-xs font-semibold text-emerald-700 mt-0.5">
                    {user.isSuperAdmin
                      ? "Super Admin / Lurah"
                      : `RT ${user.rt?.number || "02"} / RW ${user.rw?.number || "05"}`}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {user.isSuperAdmin ? "Kelurahan" : user.status === "VERIFIED_ACTIVE" ? "Warga Tetap" : "Pending"}
                </span>
              </div>

              {/* Officer Mode Quick Switch */}
              {user.isOfficer && !user.isSuperAdmin && (
                <button
                  onClick={() => setOfficerMode(!isOfficerMode)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs ${
                    isOfficerMode
                      ? "bg-emerald-700 text-white hover:bg-emerald-800"
                      : "bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100"
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  {isOfficerMode ? "Tutup Mode Pengurus" : "Buka Mode Pengurus"}
                </button>
              )}
            </div>

            {/* Desktop Navigation Links */}
            <nav className="p-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/60 shadow-lg space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">
                Navigasi Sistem
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key && !isOfficerMode;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      if (isOfficerMode) setOfficerMode(false);
                      onChangeTab?.(item.key);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* 1-Click Fast Demo Switcher in Desktop Sidebar */}
            <div className="p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/60 shadow-lg space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Ganti Akun Demo (1-Click)
              </div>
              <div className="space-y-1.5 text-[11px]">
                <button
                  onClick={() => quickLogin("ADMIN")}
                  className="w-full p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-950 font-bold border border-indigo-200 text-left flex items-center justify-between"
                >
                  <span>Ibu Lurah Ratna</span>
                  <span className="text-[9px] bg-indigo-200 text-indigo-900 px-1.5 py-0.2 rounded font-extrabold">Super Admin</span>
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => quickLogin("RW")}
                    className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold border border-teal-200 text-left"
                  >
                    Pak RW Budi
                  </button>
                  <button
                    onClick={() => quickLogin("RT")}
                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold border border-emerald-200 text-left"
                  >
                    Pak RT Hendra
                  </button>
                  <button
                    onClick={() => quickLogin("RESIDENT")}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 text-left"
                  >
                    Bu Siti (Warga)
                  </button>
                  <button
                    onClick={() => quickLogin("PENDING")}
                    className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-200 text-left"
                  >
                    Ahmad (Pending)
                  </button>
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className="w-full py-2.5 px-3 rounded-xl bg-white/90 backdrop-blur-md border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Keluar Akun
            </button>
          </aside>
        )}

        {/* Main Content Viewport */}
        <main className={`${user ? "col-span-9" : "col-span-12"} space-y-4`}>
          <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-white/70 shadow-xl p-6 overflow-hidden min-h-[750px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
