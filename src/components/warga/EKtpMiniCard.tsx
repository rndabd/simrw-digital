"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, ShieldCheck, QrCode, Home, UserCheck, Lock } from "lucide-react";

export default function EKtpMiniCard() {
  const { user } = useAuth();
  const [showNik, setShowNik] = useState(false);

  if (!user) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white shadow-lg shadow-emerald-950/20 p-5 border border-emerald-600/40">
      {/* Decorative background shapes */}
      <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
      <div className="absolute -left-8 -bottom-8 w-36 h-36 rounded-full bg-teal-400/10 blur-xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-emerald-600/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-900/60 border border-emerald-500/40 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="text-[10px] tracking-wider text-emerald-200 uppercase font-semibold">
              Republik Indonesia
            </div>
            <div className="text-xs font-bold tracking-tight text-white">
              Kartu Warga Digital SIM-RW
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-[10px] text-emerald-300 font-medium">
          <Lock className="w-3 h-3 text-emerald-400" />
          UU PDP 27/2022
        </div>
      </div>

      {/* Main Identity Content */}
      <div className="mt-4 grid grid-cols-3 gap-3 items-center">
        <div className="col-span-2 space-y-2.5">
          {/* NIK row with masking toggle */}
          <div>
            <div className="text-[11px] text-emerald-100 font-bold flex items-center justify-between">
              <span>Nomor Induk Kependudukan (NIK)</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-sm tracking-wider font-extrabold text-white bg-emerald-950/70 px-2.5 py-0.5 rounded-lg border border-emerald-500/40 shadow-xs">
                {showNik ? user.maskedNik : "•••• •••• •••• " + user.maskedNik.slice(-4)}
              </span>
              <button
                type="button"
                onClick={() => setShowNik(!showNik)}
                className="p-1 rounded-md hover:bg-emerald-700/60 text-emerald-200 transition-colors"
                title={showNik ? "Sembunyikan NIK" : "Tampilkan NIK (Disensor)"}
              >
                {showNik ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <div className="text-[10px] text-emerald-200 uppercase tracking-wider font-extrabold">
              Nama Lengkap
            </div>
            <div className="text-base font-extrabold text-white leading-tight">
              {user.fullName}
            </div>
          </div>

          {/* Address & RT/RW */}
          <div className="flex items-center gap-3 text-xs text-white font-medium">
            <div className="flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-emerald-300" />
              <span>{user.addressBlock || "Blok C2 No. 14"}</span>
            </div>
            <span className="text-emerald-300">•</span>
            <div>
              RT {user.rt?.number || "02"} / RW {user.rw?.number || "05"}
            </div>
          </div>
        </div>

        {/* QR Code / Avatar Photo Verification Column */}
        <div className="col-span-1 flex flex-col items-center justify-center p-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="w-12 h-14 object-cover rounded-lg border border-white/30 shadow-xs"
            />
          ) : (
            <QrCode className="w-12 h-12 text-white" />
          )}
          <div className="mt-1 flex items-center gap-1 text-[9px] font-extrabold text-emerald-300">
            <UserCheck className="w-3 h-3 text-emerald-300" />
            <span>TERVERIFIKASI</span>
          </div>
        </div>
      </div>

      {/* Card Footer Micro Bar */}
      <div className="mt-4 pt-2.5 border-t border-emerald-600/40 flex items-center justify-between text-[10px] text-emerald-200 font-bold">
        <span>Kel. {user.rw?.village || "Sukamaju"}, Kec. Coblong</span>
        <span className="font-mono">ID: {user.id.substring(0, 8)}</span>
      </div>
    </div>
  );
}

