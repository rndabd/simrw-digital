"use client";

import React, { useState } from "react";
import { FileText, Send, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SuratTab() {
  const { user } = useAuth();
  const [letterType, setLetterType] = useState("Surat Pengantar Pembuatan KTP / KK");
  const [purpose, setPurpose] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [myLetters, setMyLetters] = useState([
    {
      id: "srt-01",
      type: "Surat Pengantar Domisili Tinggal",
      purpose: "Keperluan pembuatan rekening bank syariah",
      status: "SELESAI",
      date: "12 Okt 2026",
      number: "470/012/RT.02-RW.05/2026",
    },
    {
      id: "srt-02",
      type: "Surat Pengantar SKCK",
      purpose: "Persyaratan melamar pekerjaan",
      status: "DIPROSES_RT",
      date: "Kemarin",
      number: "Menunggu Penomoran",
    },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newLetter = {
        id: `srt-${Date.now()}`,
        type: letterType,
        purpose,
        status: "DIPROSES_RT",
        date: "Hari ini",
        number: "Menunggu Penomoran RT",
      };
      setMyLetters([newLetter, ...myLetters]);
      setPurpose("");
      setIsSubmitting(false);
      setSuccessMessage("Pengajuan surat berhasil dikirim ke Ketua RT 02!");
      setTimeout(() => setSuccessMessage(null), 4000);
    }, 600);
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white">Layanan Surat Pengantar Online</h2>
            <p className="text-[11px] text-slate-200 font-medium">
              Urus administrasi kependudukan tanpa antre fisik ke rumah pengurus RT.
            </p>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {successMessage}
        </div>
      )}

      {/* Responsive Dual Column for Desktop / Single Column for Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Pengajuan Surat Baru */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-md space-y-3">
          <div className="text-xs font-extrabold text-slate-900">Ajukan Surat Pengantar Baru</div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Jenis Surat Pengantar
            </label>
            <select
              value={letterType}
              onChange={(e) => setLetterType(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Surat Pengantar Pembuatan KTP / KK">Surat Pengantar Pembuatan KTP / KK</option>
              <option value="Surat Keterangan Domisili Warga">Surat Keterangan Domisili Warga</option>
              <option value="Surat Pengantar SKCK Kepolisian">Surat Pengantar SKCK Kepolisian</option>
              <option value="Surat Keterangan Belum Menikah">Surat Keterangan Belum Menikah</option>
              <option value="Surat Keterangan Usaha (SKU) Mikro">Surat Keterangan Usaha (SKU) Mikro</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Keperluan Pengajuan
            </label>
            <textarea
              required
              rows={3}
              placeholder="Contoh: Untuk keperluan pembukaan rekening payroll kantor..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || user?.status !== "VERIFIED_ACTIVE"}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            {user?.status !== "VERIFIED_ACTIVE"
              ? "Akun Perlu Diverifikasi RT Terlebih Dahulu"
              : isSubmitting
              ? "Mengirim Pengajuan..."
              : "Kirim Pengajuan Surat"}
          </button>
        </form>

        {/* Daftar Riwayat Surat */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-1.5 px-1">
            <div className="text-xs font-extrabold text-white uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-xs border border-white/10 shadow-sm">
              Riwayat Pengajuan Surat Saya
            </div>
          </div>

          {myLetters.map((letter) => (
            <div
              key={letter.id}
              className="p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-md space-y-2"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-slate-900">{letter.type}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    letter.status === "SELESAI"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}
                >
                  {letter.status === "SELESAI" ? "Selesai Ditandatangani" : "Menunggu RT"}
                </span>
              </div>

              <p className="text-xs text-slate-700 font-medium">{letter.purpose}</p>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-700 font-bold">
                <span className="font-mono text-[10px]">No: {letter.number}</span>
                <span>{letter.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
