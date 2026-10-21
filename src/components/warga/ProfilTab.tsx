"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import EKtpMiniCard from "./EKtpMiniCard";
import {
  Shield,
  Award,
  ArrowRightLeft,
  LogOut,
  UserCheck,
  FileUp,
  AlertTriangle,
  Lock,
} from "lucide-react";

export default function ProfilTab() {
  const { user, isOfficerMode, setOfficerMode, quickLogin, logout, refreshProfile } = useAuth();

  // State for Officer Application Form
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyRole, setApplyRole] = useState("RT_STAFF");
  const [skDocName, setSkDocName] = useState("SK-Kepengurusan-RT.pdf");
  const [isApplying, setIsApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  const handleApplyOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsApplying(true);
    setApplyMessage(null);

    try {
      const res = await fetch("/api/v1/officer-requests/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedRole: applyRole,
          skDocumentUrl: `/uploads/${skDocName}`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setApplyMessage("Pengajuan berhasil dikirim! Menunggu persetujuan berjenjang dari Ketua RW.");
        refreshProfile();
      } else {
        alert(json.message || "Gagal mengajukan kepengurusan");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: E-KTP Card & UU PDP Badges */}
        <div className="lg:col-span-5 space-y-4">
          <EKtpMiniCard />

          {/* Mode Pengurus Switcher (if officer) */}
          {user?.isOfficer && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white shadow-md flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold flex items-center gap-1.5 text-emerald-200">
                  <Shield className="w-4 h-4 text-emerald-300" />
                  Mode Pengurus Lingkungan
                </div>
                <div className="text-[11px] text-emerald-100">
                  Beralih untuk verifikasi warga, kirim pengumuman, dan transparansi data.
                </div>
              </div>
              <button
                onClick={() => setOfficerMode(!isOfficerMode)}
                className="px-3.5 py-2 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                {isOfficerMode ? "Warga Mode" : "Buka Panel"}
              </button>
            </div>
          )}

          {/* UU PDP Security Information Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-700" />
              Pelindungan Data Pribadi (UU PDP No. 27/2022)
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Data NIK dan No. KK Anda dilindungi secara ketat dengan enkripsi tingkat tinggi sesuai amanat UU Perlindungan Data Pribadi. Setiap kali data dibuka oleh pengurus, log audit otomatis tercatat dengan alamat IP dan waktu akses.
            </p>
          </div>
        </div>

        {/* Right Column: Pengajuan Kepengurusan & Demo Switcher */}
        <div className="lg:col-span-7 space-y-4">
          {/* Pengajuan Kepengurusan Lingkungan (Modul 4) */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Pengajuan Kepengurusan Lingkungan
                </div>
                <div className="text-[11px] text-slate-700 font-medium">
                  Ajukan peran baru (Sekretaris/Bendahara RT, Satpam, dll.)
                </div>
              </div>
              <button
                disabled={user?.status !== "VERIFIED_ACTIVE" || user?.hasPendingOfficerRequest}
                onClick={() => setShowApplyModal(!showApplyModal)}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:bg-slate-100 disabled:text-slate-600 text-xs font-bold border border-emerald-300"
              >
                {user?.hasPendingOfficerRequest ? "Sedang Ditinjau" : "Ajukan Peran"}
              </button>
            </div>

            {user?.status !== "VERIFIED_ACTIVE" && (
              <div className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-300 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                Syarat Mutlak: Akun wajib berstatus Warga Terverifikasi Aktif.
              </div>
            )}

            {showApplyModal && (
              <form onSubmit={handleApplyOfficer} className="pt-3 border-t border-slate-100 space-y-3">
                {applyMessage && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-200">
                    {applyMessage}
                  </div>
                )}
                <div>
                  <label className="text-[11px] font-bold text-slate-800 block mb-1">
                    Pilih Jabatan Yang Diajukan
                  </label>
                  <select
                    value={applyRole}
                    onChange={(e) => setApplyRole(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="RT_STAFF">Sekretaris / Pengurus RT (Tinjau oleh RW)</option>
                    <option value="RT_CHAIR">Ketua RT (Tinjau oleh RW)</option>
                    <option value="SECURITY">Petugas Keamanan / Satpam (Tinjau oleh RW)</option>
                    <option value="RW_STAFF">Pengurus RW (Tinjau oleh Super Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-800 block mb-1">
                    Unggah Dokumen SK / Bukti Berita Acara
                  </label>
                  <div className="p-3 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-700 bg-slate-50 flex items-center justify-center gap-2 font-medium">
                    <FileUp className="w-4 h-4 text-emerald-600" />
                    <span>{skDocName} (Terlampir)</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isApplying}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all shadow-sm"
                >
                  {isApplying ? "Mengirim..." : "Kirimkan Pengajuan ke Ketua RW"}
                </button>
              </form>
            )}
          </div>

          {/* Demo Credentials Switcher */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5">
            <div className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Beralih Cepat Akun Demo (1-Click Switcher)
            </div>
            <p className="text-[11px] text-slate-700 font-medium">
              Uji seluruh alur sistem dengan berganti peran pengguna secara instan:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickLogin("RT")}
                className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-left transition-all"
              >
                <div className="text-xs font-bold text-slate-900">Pak RT Hendra</div>
                <div className="text-[10px] text-emerald-700 font-semibold">Ketua RT 02 (Verifikator)</div>
              </button>

              <button
                onClick={() => quickLogin("RW")}
                className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-left transition-all"
              >
                <div className="text-xs font-bold text-slate-900">Pak RW Budi</div>
                <div className="text-[10px] text-emerald-700 font-semibold">Ketua RW 05 (Approver)</div>
              </button>

              <button
                onClick={() => quickLogin("RESIDENT")}
                className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-left transition-all"
              >
                <div className="text-xs font-bold text-slate-900">Ibu Siti Aminah</div>
                <div className="text-[10px] text-emerald-700 font-semibold">Warga Aktif Terverifikasi</div>
              </button>

              <button
                onClick={() => quickLogin("PENDING")}
                className="p-3 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50 text-left transition-all"
              >
                <div className="text-xs font-bold text-slate-900">Ahmad Hidayat</div>
                <div className="text-[10px] text-amber-700 font-semibold">Warga Baru (Pending)</div>
              </button>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-950/30"
          >
            <LogOut className="w-4 h-4" />
            Keluar dari Sesi Aplikasi
          </button>
        </div>
      </div>
    </div>
  );
}
