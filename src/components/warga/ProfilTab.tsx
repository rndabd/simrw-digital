"use client";

import React, { useState, useRef } from "react";
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
  Camera,
  Mail,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Phone,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function ProfilTab() {
  const { user, isOfficerMode, setOfficerMode, quickLogin, logout, refreshProfile } = useAuth();

  // State for Avatar Upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [avatarUploadSuccess, setAvatarUploadSuccess] = useState<string | null>(null);

  // State for OTP Verification Modal
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpChannel, setOtpChannel] = useState<"WHATSAPP" | "EMAIL">("WHATSAPP");
  const [otpTarget, setOtpTarget] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);

  // State for Officer Application Form
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyRole, setApplyRole] = useState("RT_STAFF");
  const [skDocName, setSkDocName] = useState("SK-Kepengurusan-RT.pdf");
  const [isApplying, setIsApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  const handleAvatarFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarUploadError("Format berkas harus berupa gambar (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarUploadError("Ukuran foto maksimal 5 MB.");
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarUploadError(null);
    setAvatarUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/user/avatar", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setAvatarUploadSuccess("Foto profil berhasil diperbarui!");
        await refreshProfile();
        setTimeout(() => setAvatarUploadSuccess(null), 3000);
      } else {
        setAvatarUploadError(json.message || "Gagal mengunggah foto profil.");
      }
    } catch (err: any) {
      setAvatarUploadError(err.message || "Koneksi terputus saat mengunggah foto.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const openOtpVerification = (channel: "WHATSAPP" | "EMAIL") => {
    setOtpChannel(channel);
    setOtpTarget(channel === "WHATSAPP" ? user?.phoneNumber || "" : user?.email || "");
    setOtpStep(1);
    setOtpCode("");
    setOtpError(null);
    setOtpSuccess(null);
    setShowOtpModal(true);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpTarget) {
      setOtpError(`Harap masukkan ${otpChannel === "EMAIL" ? "alamat email" : "nomor WhatsApp"} tujuan.`);
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/v1/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: otpTarget,
          channel: otpChannel,
          purpose: `Verifikasi ${otpChannel === "EMAIL" ? "Email" : "Nomor WhatsApp"} Akun SIM-RW`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setOtpStep(2);
        setOtpSuccess(json.message || `Kode OTP telah dikirimkan ke ${otpTarget}.`);
      } else {
        setOtpError(json.message || "Gagal mengirimkan kode OTP.");
      }
    } catch (err: any) {
      setOtpError(err.message || "Koneksi bermasalah.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setOtpError("Harap masukkan kode OTP yang diterima.");
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/v1/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: otpTarget, code: otpCode, channel: otpChannel }),
      });
      const json = await res.json();
      if (json.success) {
        setOtpSuccess(json.message || "Verifikasi berhasil!");
        await refreshProfile();
        setTimeout(() => {
          setShowOtpModal(false);
        }, 1500);
      } else {
        setOtpError(json.message || "Kode OTP tidak valid atau telah kedaluwarsa.");
      }
    } catch (err: any) {
      setOtpError(err.message || "Koneksi bermasalah.");
    } finally {
      setOtpLoading(false);
    }
  };

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
      {/* 1. Header Profil & Foto Avatar */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Avatar Container with Upload overlay */}
          <div className="relative group shrink-0">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileSelected}
            />
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500/30 bg-emerald-50 shadow-md flex items-center justify-center">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-extrabold text-emerald-800">
                  {user?.fullName?.charAt(0) || "W"}
                </span>
              )}
            </div>

            {/* Camera / Edit button */}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-70"
              title="Ubah Foto Profil"
            >
              {isUploadingAvatar ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* User Profile Info */}
          <div className="text-center sm:text-left flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {user?.fullName || "Warga SIM-RW"}
              </h2>
              {user?.isOfficer && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Pengurus Lingkungan
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-2">
              <span>{user?.addressBlock || "Alamat Terdata"}</span>
              <span>•</span>
              <span>RT {user?.rt?.number || "02"} / RW {user?.rw?.number || "05"}</span>
            </p>

            <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                📱 {user?.phoneNumber || "-"}
              </span>
              {user?.email && (
                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  ✉️ {user.email}
                </span>
              )}
            </div>

            {avatarUploadSuccess && (
              <div className="text-xs text-emerald-700 font-bold flex items-center justify-center sm:justify-start gap-1 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {avatarUploadSuccess}
              </div>
            )}
            {avatarUploadError && (
              <div className="text-xs text-rose-600 font-bold flex items-center justify-center sm:justify-start gap-1 pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {avatarUploadError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Grid Informasi Kartu & Verifikasi Kontak */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: E-KTP Card, Status Verifikasi & Security Badges */}
        <div className="lg:col-span-5 space-y-4">
          <EKtpMiniCard />

          {/* STATUS VERIFIKASI KONTAK (WHATSAPP & EMAIL) */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5">
            <div className="space-y-0.5">
              <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Status Verifikasi Kontak Akun
              </div>
              <p className="text-[11px] text-slate-500">
                Pilih kanal verifikasi terdaftar untuk keamanan akses & notifikasi
              </p>
            </div>

            {/* WhatsApp Verification Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  user?.isPhoneVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>
                  <MessageSquare className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    WhatsApp
                    {user?.isPhoneVerified ? (
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        ✓ Terverifikasi
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        ⚠ Belum Verif
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {user?.phoneNumber || "Nomor belum disetel"}
                  </div>
                </div>
              </div>

              {!user?.isPhoneVerified && (
                <button
                  type="button"
                  onClick={() => openOtpVerification("WHATSAPP")}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs shrink-0"
                >
                  Verifikasi
                </button>
              )}
            </div>

            {/* Email Verification Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  user?.isEmailVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    Email
                    {user?.isEmailVerified ? (
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        ✓ Terverifikasi
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        ⚠ Belum Verif
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {user?.email || "Email belum ditambahkan"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openOtpVerification("EMAIL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 ${
                  user?.isEmailVerified
                    ? "bg-slate-200 hover:bg-slate-300 text-slate-700"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {user?.isEmailVerified ? "Ubah" : "Verifikasi"}
              </button>
            </div>
          </div>

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

      {/* 3. MODAL VERIFIKASI OTP (WHATSAPP ATAU EMAIL) */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  otpChannel === "EMAIL" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                }`}>
                  {otpChannel === "EMAIL" ? <Mail className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Verifikasi {otpChannel === "EMAIL" ? "Alamat Email" : "Nomor WhatsApp"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pastikan kepemilikan akun Anda terverifikasi resmi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error & Success alerts */}
            {otpError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{otpError}</div>
              </div>
            )}
            {otpSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <div>{otpSuccess}</div>
              </div>
            )}

            {/* STEP 1: KIRIM KODE OTP */}
            {otpStep === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {otpChannel === "EMAIL" ? "Alamat Email Anda" : "Nomor WhatsApp / HP Terdaftar"}
                  </label>
                  <input
                    type={otpChannel === "EMAIL" ? "email" : "tel"}
                    required
                    value={otpTarget}
                    onChange={(e) => setOtpTarget(e.target.value)}
                    placeholder={otpChannel === "EMAIL" ? "contoh@domain.com" : "08xxxxxxxxxx"}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {otpLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Mengirimkan Kode OTP...
                    </>
                  ) : (
                    <>
                      Kirim Kode OTP (6 Digit)
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: INPUT KODE OTP & VERIFIKASI */}
            {otpStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Masukkan 6 Digit Kode OTP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Contoh: 123456"
                    className="w-full text-center text-lg tracking-widest font-mono font-extrabold p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                    Kode dikirim ke <strong>{otpTarget}</strong>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep(1);
                      setOtpError(null);
                    }}
                    className="w-1/3 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Kirim Ulang
                  </button>
                  <button
                    type="submit"
                    disabled={otpLoading || otpCode.length < 6}
                    className="w-2/3 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {otpLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Verifikasi Kode
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
