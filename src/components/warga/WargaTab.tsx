"use client";

import React from "react";
import { Phone, MessageSquare, Siren, Home, Users } from "lucide-react";

export default function WargaTab() {
  const officers = [
    {
      name: "Hendra Gunawan",
      role: "Ketua RT 02",
      phone: "081200000002",
      address: "Blok B1 No. 04",
      type: "RT",
    },
    {
      name: "Budi Santoso",
      role: "Ketua RW 05",
      phone: "081200000001",
      address: "Blok A3 No. 01",
      type: "RW",
    },
    {
      name: "Sutisna & Tim",
      role: "Koordinator Keamanan & Ronda",
      phone: "081200000099",
      address: "Pos Satpam Utama Gerbang Timur",
      type: "SECURITY",
    },
    {
      name: "Bripka Mulyadi",
      role: "Bhabinkamtibmas Kel. Sukamaju",
      phone: "081299991122",
      address: "Polsek Coblong",
      type: "POLICE",
    },
    {
      name: "dr. Linda Permata",
      role: "Koordinator Posyandu & Kesehatan",
      phone: "081388884433",
      address: "Balai RW 05",
      type: "HEALTH",
    },
    {
      name: "Posko Damkar Coblong",
      role: "Layanan Pemadam Kebakaran",
      phone: "0227207113",
      address: "Jl. Dago No. 120",
      type: "FIRE",
    },
  ];

  return (
    <div className="space-y-5 pb-20">
      <div>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-4 h-4 text-emerald-600" />
          Kontak Pengurus & Layanan Darurat Lingkungan
        </h2>
        <p className="text-xs text-slate-500">
          Hubungi pengurus lingkungan dan layanan keamanan bila memerlukan bantuan cepat.
        </p>
      </div>

      {/* Emergency Call Box */}
      <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-900/20">
            <Siren className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-rose-900">Pos Keamanan / Ronda Satpam 24 Jam</div>
            <div className="text-xs text-rose-700">Hubungi langsung via HT / Telepon Darurat Gerbang Utama</div>
          </div>
        </div>
        <a
          href="tel:081200000099"
          className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 active:scale-95 transition-all"
        >
          Hubungi Sekarang
        </a>
      </div>

      {/* Daftar Pengurus in Responsive Grid */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
          Susunan Pengurus Lingkungan RT 02 / RW 05
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {officers.map((officer, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900">{officer.name}</div>
                <div className="text-xs font-semibold text-emerald-700">{officer.role}</div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" /> {officer.address}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-mono text-xs text-slate-500 font-semibold">{officer.phone}</span>
                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/62${officer.phone.slice(1)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                    title="Kirim Pesan WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>
                  <a
                    href={`tel:${officer.phone}`}
                    className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    title="Hubungi Telepon"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
