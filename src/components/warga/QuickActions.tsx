"use client";

import React from "react";
import {
  FileText,
  CreditCard,
  AlertCircle,
  Siren,
  Info,
  PhoneCall,
} from "lucide-react";

interface QuickActionsProps {
  onActionClick: (actionKey: string) => void;
}

export default function QuickActions({ onActionClick }: QuickActionsProps) {
  const actions = [
    {
      key: "surat",
      label: "Pengajuan Surat",
      desc: "Pengantar RT & RW",
      icon: FileText,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      badge: null,
    },
    {
      key: "iuran",
      label: "Bayar Iuran",
      desc: "Kas & Kebersihan",
      icon: CreditCard,
      color: "bg-blue-50 text-blue-700 border-blue-200",
      badge: null,
    },
    {
      key: "lapor",
      label: "Lapor Masalah",
      desc: "Aduan Lingkungan",
      icon: AlertCircle,
      color: "bg-amber-50 text-amber-700 border-amber-200",
      badge: null,
    },
    {
      key: "darurat",
      label: "Tombol Darurat",
      desc: "Panic SOS Satpam",
      icon: Siren,
      color: "bg-rose-50 text-rose-700 border-rose-200",
      badge: "Siaga",
    },
    {
      key: "inforw",
      label: "Info RW & RT",
      desc: "Struktur Organisasi",
      icon: Info,
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
      badge: null,
    },
    {
      key: "kontak",
      label: "Kontak Pengurus",
      desc: "Nomor Penting Lingkungan",
      icon: PhoneCall,
      color: "bg-teal-50 text-teal-700 border-teal-200",
      badge: null,
    },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-white drop-shadow-sm bg-slate-900/80 px-2.5 py-1 rounded-lg backdrop-blur-xs border border-white/10 shadow-sm">
          Layanan Cepat Warga
        </h3>
        <span className="text-[11px] font-bold text-emerald-300 drop-shadow-xs bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/30">
          Digital SIM-RW
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {actions.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onActionClick(item.key)}
              className="group relative flex flex-col items-center justify-center p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-md hover:shadow-lg hover:border-emerald-300 transition-all duration-200 text-center active:scale-95"
            >
              {item.badge && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-amber-500 text-white shadow-xs">
                  {item.badge}
                </span>
              )}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2 border transition-transform group-hover:scale-105 ${item.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-extrabold text-slate-900 leading-tight">
                {item.label}
              </span>
              <span className="text-[10px] text-slate-600 font-semibold mt-0.5 line-clamp-1">
                {item.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

