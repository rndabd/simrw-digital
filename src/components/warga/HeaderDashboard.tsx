"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Shield, Bell, CheckCircle2, Clock, AlertTriangle, ArrowRightLeft, LogOut } from "lucide-react";
import { formatRoleList } from "@/lib/formatters";

interface HeaderDashboardProps {
  onOpenNotifications?: () => void;
}

export default function HeaderDashboard({ onOpenNotifications }: HeaderDashboardProps) {
  const { user, isOfficerMode, setOfficerMode, logout } = useAuth();

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 11) return "Selamat Pagi";
    if (hours < 15) return "Selamat Siang";
    if (hours < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  const getStatusBadge = () => {
    if (!user) return null;
    if (user.status === "VERIFIED_ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          RT {user.rt?.number || "-"} / RW {user.rw?.number || "-"} • Warga Tetap
        </span>
      );
    }
    if (user.status === "PENDING_VERIFICATION") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-950 border border-amber-300">
          <Clock className="w-3.5 h-3.5 text-amber-700" />
          Menunggu Verifikasi RT
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-900 border border-rose-300">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
        {user.status}
      </span>
    );
  };

  return (
    <header
      className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 pb-3 shadow-xs select-none"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 0.75rem))" }}
    >
      {/* Officer mode toggle bar if user has officer privileges */}
      {user?.isOfficer && (
        <div className="mb-2.5 py-1.5 px-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold text-emerald-900">
              Akses Pengurus: {formatRoleList(user.roles)}
            </span>
          </div>
          <button
            onClick={() => setOfficerMode(!isOfficerMode)}
            className={`text-xs px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              isOfficerMode
                ? "bg-emerald-700 text-white hover:bg-emerald-800"
                : "bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50"
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            {isOfficerMode ? "Mode Pengurus Aktif" : "Ke Mode Pengurus"}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Logo SIM-RW"
            className="w-11 h-11 object-contain drop-shadow-sm shrink-0"
          />
          <div>
            <div className="text-xs text-slate-700 font-bold">
              {getGreeting()}, {user?.fullName?.split(" ")[0] || "Warga"} 👋
            </div>
            <div className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
              <span>{user?.fullName || "Tamu"}</span>
            </div>
            <div className="mt-1">{getStatusBadge()}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <div className="relative">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-9 h-9 rounded-full object-cover border-2 border-emerald-600 shadow-xs"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-300 shadow-xs">
                  {user.fullName?.charAt(0) || "W"}
                </div>
              )}
              {user.isOfficer && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-600 rounded-full border-2 border-white flex items-center justify-center" title="Pengurus RT/RW">
                  <Shield className="w-2 h-2 text-white" />
                </span>
              )}
            </div>
          )}

          <button
            onClick={onOpenNotifications}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center relative transition-colors"
            title="Pemberitahuan Warga"
          >
            <Bell className="w-4.5 h-4.5 text-slate-700" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
          </button>

          <button
            onClick={logout}
            className="w-9 h-9 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-colors shadow-sm"
            title="Keluar Sesi"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

