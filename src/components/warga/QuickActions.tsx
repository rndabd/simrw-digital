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
      badge: "1 Tagihan",
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
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Layanan Cepat Warga
        </h3>
        <span className="text-[11px] font-semibold text-emerald-700">Digital SIM-RW</span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {actions.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onActionClick(item.key)}
              className="group relative flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 text-center active:scale-95"
            >
              {item.badge && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-white shadow-xs">
                  {item.badge}
                </span>
              )}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2 border transition-transform group-hover:scale-105 ${item.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {item.label}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                {item.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

