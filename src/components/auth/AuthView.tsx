"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  UserCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  PlusCircle,
  FileText,
  User,
  Crown,
  Briefcase,
  HelpCircle,
  Camera,
  Upload,
  X,
} from "lucide-react";

const RW_POSITIONS = [
  { value: "RW_CHAIR", label: "Ketua RW (Ketua Rukun Warga)", desc: "Pemimpin tertinggi lembaga RW & koordinator RT" },
  { value: "RW_VICE_CHAIR", label: "Wakil Ketua RW", desc: "Membantu Ketua RW & koordinasi kewilayahan" },
  { value: "RW_SECRETARY", label: "Sekretaris RW", desc: "Administrasi persuratan, notulen, & pendataan wilayah" },
  { value: "RW_TREASURER", label: "Bendahara RW", desc: "Pengelolaan keuangan, kas RW & validasi dana RT" },
  { value: "RW_SECURITY", label: "Seksi Keamanan & Ketertiban RW", desc: "Koordinasi pos kamling & siskamling lingkungan" },
  { value: "RW_ENVIRONMENT", label: "Seksi Kebersihan & Lingkungan Hidup RW", desc: "Pengelolaan TPS, kebersihan lingkungan & penghijauan" },
  { value: "RW_DEVELOPMENT", label: "Seksi Pembangunan & Sarpras RW", desc: "Perawatan jalan gang, drainase, penerangan & fasilitas umum" },
  { value: "RW_RELATIONS", label: "Seksi Hubungan Masyarakat (Humas) RW", desc: "Komunikasi publik & pengumuman ke seluruh warga" },
  { value: "RW_YOUTH", label: "Seksi Pemuda & Karang Taruna RW", desc: "Kegiatan kepemudaan, keolahragaan & kreativitas pemuda" },
  { value: "RW_SOCIAL", label: "Seksi Sosial & Kesejahteraan RW", desc: "Bantuan sosial, santunan, & pelayanan masyarakat" },
  { value: "RW_STAFF", label: "Pengurus / Staf RW Lainnya", desc: "Anggota pelaksana operasional RW" },
];

const RT_POSITIONS = [
  { value: "RT_CHAIR", label: "Ketua RT (Ketua Rukun Tetangga)", desc: "Penanggung jawab utama pelayanan warga lingkungan RT" },
  { value: "RT_VICE_CHAIR", label: "Wakil Ketua RT", desc: "Mendampingi Ketua RT dalam operasional tetangga" },
  { value: "RT_SECRETARY", label: "Sekretaris RT", desc: "Surat pengantar warga, pendataan KK, & verifikasi berkas" },
  { value: "RT_TREASURER", label: "Bendahara RT", desc: "Penerimaan & validasi iuran warga serta pembukuan kas RT" },
  { value: "RT_SECURITY", label: "Seksi Keamanan Lingkungan RT", desc: "Petugas ronda malam, portal gang, & tanggap darurat SOS" },
  { value: "RT_ENVIRONMENT", label: "Seksi Kebersihan & Sampah RT", desc: "Pengawasan gerobak sampah, got, & kerja bakti warga" },
  { value: "RT_SOCIAL", label: "Seksi Sosial & Kerohanian RT", desc: "Kegiatan keagamaan, takziah, & kerukunan tetangga" },
  { value: "RT_YOUTH", label: "Seksi Pemuda / Karang Taruna RT", desc: "Kepanitiaan peringatan hari besar & olahraga pemuda" },
  { value: "RT_WOMEN", label: "Seksi Pemberdayaan Perempuan & PKK RT", desc: "Posyandu, arisan warga, & kesejahteraan keluarga" },
  { value: "RT_STAFF", label: "Pengurus / Staf RT Lainnya", desc: "Anggota pelaksana kepengurusan RT" },
];

export default function AuthView() {
  const { login, quickLogin } = useAuth();

  // Top-Level Navigation: CUKUP MASUK ATAU DAFTAR SAJA
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  // Sub-Option on Register: WARGA ATAU KEPENGURUSAN
  const [registerType, setRegisterType] = useState<"resident" | "officer">("resident");

  // Organizations list for dropdown
  const [organizations, setOrganizations] = useState<any[]>([]);

  // Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1. LOGIN STATE
  const [phone, setPhone] = useState("081200000003"); // Default Siti Aminah
  const [password, setPassword] = useState("password123");

  // 2. REGISTER RESIDENT (WARGA) STATE
  const [resRwId, setResRwId] = useState("");
  const [resRtId, setResRtId] = useState("");
  const [resNik, setResNik] = useState("");
  const [resKk, setResKk] = useState("");
  const [resName, setResName] = useState("");
  const [resPhone, setResPhone] = useState("");
  const [resPassword, setResPassword] = useState("");
  const [resAddress, setResAddress] = useState("");
  const [resKtpFile, setResKtpFile] = useState<File | null>(null);
  const [resKtpPreview, setResKtpPreview] = useState<string | null>(null);
  const ktpCameraRef = useRef<HTMLInputElement>(null);
  const ktpGalleryRef = useRef<HTMLInputElement>(null);
  const [resNikValidation, setResNikValidation] = useState<string | null>(null);

  const handleKtpFileChange = (file: File | null) => {
    setResKtpFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setResKtpPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setResKtpPreview(null);
    }
  };

  // 3. REGISTER OFFICER (KEPENGURUSAN) STATE
  const [officerLevel, setOfficerLevel] = useState<"RW" | "RT">("RW");
  const [officerRole, setOfficerRole] = useState("RW_CHAIR");
  const [offRwId, setOffRwId] = useState("");
  const [offRtId, setOffRtId] = useState("");
  const [isNewRw, setIsNewRw] = useState(false);
  const [newRwNumber, setNewRwNumber] = useState("");
  const [newRwVillage, setNewRwVillage] = useState("Sukamaju");
  const [newRwDistrict, setNewRwDistrict] = useState("Coblong");
  const [newRwCity, setNewRwCity] = useState("Kota Bandung");
  const [newRwRtCount, setNewRwRtCount] = useState(3);
  const [isNewRt, setIsNewRt] = useState(false);
  const [newRtNumber, setNewRtNumber] = useState("");
  const [offNik, setOffNik] = useState("");
  const [offKk, setOffKk] = useState("");
  const [offName, setOffName] = useState("");
  const [offPhone, setOffPhone] = useState("");
  const [offPassword, setOffPassword] = useState("");
  const [offAddress, setOffAddress] = useState("");
  const [offTermPeriod, setOffTermPeriod] = useState("2026-2031");
  const [offSkFile, setOffSkFile] = useState<File | null>(null);
  const [offNikValidation, setOffNikValidation] = useState<string | null>(null);

  // Load public organizations on mount
  useEffect(() => {
    async function loadOrgs() {
      try {
        const res = await fetch("/api/v1/organizations/public");
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setOrganizations(json.data);
          const firstRw = json.data[0];
          setResRwId(firstRw.id);
          setOffRwId(firstRw.id);
          if (firstRw.rtUnits?.length > 0) {
            setResRtId(firstRw.rtUnits[0].id);
            setOffRtId(firstRw.rtUnits[0].id);
          }
        }
      } catch (e) {
        console.error("Gagal memuat data RW/RT publik:", e);
      }
    }
    loadOrgs();
  }, []);

  // Update available RTs when RW dropdown changes (Resident)
  const handleResRwChange = (rwId: string) => {
    setResRwId(rwId);
    const found = organizations.find((o) => o.id === rwId);
    if (found && found.rtUnits?.length > 0) {
      setResRtId(found.rtUnits[0].id);
    } else {
      setResRtId("");
    }
  };

  // Update available RTs when RW dropdown changes (Officer)
  const handleOffRwChange = (rwId: string) => {
    setOffRwId(rwId);
    const found = organizations.find((o) => o.id === rwId);
    if (found && found.rtUnits?.length > 0) {
      setOffRtId(found.rtUnits[0].id);
    } else {
      setOffRtId("");
    }
  };

  // Switch officer level and auto-select appropriate default role
  const handleOfficerLevelChange = (level: "RW" | "RT") => {
    setOfficerLevel(level);
    if (level === "RW") {
      setOfficerRole("RW_CHAIR");
      setIsNewRt(false);
    } else {
      setOfficerRole("RT_CHAIR");
      setIsNewRw(false);
    }
  };

  // NIK Input Handler with 16-Digit UU PDP Realtime feedback
  const handleNikInput = (val: string, target: "resident" | "officer") => {
    const cleaned = val.replace(/\D/g, "").slice(0, 16);
    if (target === "resident") {
      setResNik(cleaned);
      setResNikValidation(cleaned.length === 16 ? "Format 16 Digit Valid (UU PDP Compliant)" : null);
    } else {
      setOffNik(cleaned);
      setOffNikValidation(cleaned.length === 16 ? "Format 16 Digit Valid (UU PDP Compliant)" : null);
    }
  };

  // 1. SUBMIT LOGIN
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await login(phone, password);
    if (!result.success) {
      setErrorMessage(result.message || "Nomor WhatsApp atau kata sandi tidak cocok.");
    }
    setIsSubmitting(false);
  };

  // 2. SUBMIT REGISTER RESIDENT (WARGA)
  const handleRegisterResidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resNik.length !== 16) {
      setErrorMessage("NIK wajib terdiri dari 16 digit angka sesuai KTP.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("nik", resNik);
      formData.append("kk", resKk);
      formData.append("fullName", resName);
      formData.append("phoneNumber", resPhone);
      formData.append("password", resPassword);
      formData.append("rwId", resRwId);
      formData.append("rtId", resRtId);
      formData.append("addressBlock", resAddress);
      if (resKtpFile) {
        formData.append("ktpFile", resKtpFile);
      }

      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMessage("Pendaftaran akun warga berhasil! Menunggu verifikasi berkas oleh Pengurus RT setempat.");
        setTimeout(() => {
          setAuthTab("login");
          setSuccessMessage(null);
          setPhone(resPhone);
          setPassword(resPassword);
        }, 2500);
      } else {
        setErrorMessage(json.message || "Gagal melakukan pendaftaran warga.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. SUBMIT REGISTER OFFICER (KEPENGURUSAN)
  const handleRegisterOfficerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (offNik.length !== 16) {
      setErrorMessage("NIK Calon Pengurus wajib 16 digit angka.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("role", officerRole);
      formData.append("roleLevel", officerLevel);
      formData.append("rwId", offRwId);
      formData.append("rtId", offRtId);
      formData.append("isNewRw", String(isNewRw));
      formData.append("newRwNumber", newRwNumber);
      formData.append("newRwVillage", newRwVillage);
      formData.append("newRwDistrict", newRwDistrict);
      formData.append("newRwCity", newRwCity);
      formData.append("newRwRtCount", String(newRwRtCount));
      formData.append("isNewRt", String(isNewRt));
      formData.append("newRtNumber", newRtNumber);
      formData.append("nik", offNik);
      formData.append("kk", offKk);
      formData.append("fullName", offName);
      formData.append("phoneNumber", offPhone);
      formData.append("password", offPassword);
      formData.append("addressBlock", offAddress);
      formData.append("termPeriod", offTermPeriod);
      if (offSkFile) {
        formData.append("skFile", offSkFile);
      }

      const res = await fetch("/api/v1/auth/register-officer", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMessage(json.message || "Pendaftaran kepengurusan berhasil diajukan!");
        setTimeout(() => {
          setAuthTab("login");
          setSuccessMessage(null);
          setPhone(offPhone);
          setPassword(offPassword);
        }, 3000);
      } else {
        setErrorMessage(json.message || "Gagal mendaftarkan kepengurusan.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan koneksi jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentResRw = organizations.find((o) => o.id === resRwId);
  const currentOffRw = organizations.find((o) => o.id === offRwId);

  return (
    <div className="min-h-full py-8 px-3 sm:px-6 flex flex-col justify-center">
      {/* Brand Header */}
      <div className="text-center space-y-1.5 mb-5">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          SIM-RW Digital
        </h1>
        <p className="text-xs font-bold text-emerald-800 max-w-sm mx-auto">
          Inisiasi RW 15 Komplek Giri Ciheulang, Kec. Ciparay Kab. Bandung
        </p>
        <p className="text-[11px] text-slate-600 font-medium max-w-sm mx-auto">
          Sistem Pelayanan Warga & Kepengurusan RT/RW Terintegrasi Terproteksi UU PDP No. 27/2022
        </p>
      </div>

      {/* Main Container Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-white/60 shadow-2xl p-5 sm:p-6 space-y-4 max-w-lg mx-auto w-full">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {successMessage}
          </div>
        )}

        {/* =========================================================================
            MENU UTAMA: CUKUP 'MASUK' ATAU 'DAFTAR' SAJA
            ========================================================================= */}
        <div className="grid grid-cols-2 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => {
              setAuthTab("login");
              setErrorMessage(null);
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authTab === "login"
                ? "bg-white text-emerald-800 shadow-sm font-extrabold"
                : "hover:text-slate-900"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab("register");
              setErrorMessage(null);
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authTab === "register"
                ? "bg-white text-emerald-800 shadow-sm font-extrabold"
                : "hover:text-slate-900"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Daftar Akun Baru
          </button>
        </div>

        {/* =========================================================================
            1. TAB: MASUK AKUN
            ========================================================================= */}
        {authTab === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nomor WhatsApp / HP
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxx"
                className="w-full text-xs p-3 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Kata Sandi
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-3 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {isSubmitting ? "Memverifikasi Kriptografi..." : "Masuk ke Aplikasi SIM-RW"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* =========================================================================
            2. TAB: DAFTAR (PILIH: WARGA ATAU KEPENGURUSAN)
            ========================================================================= */}
        {authTab === "register" && (
          <div className="space-y-4">
            {/* SUB-PILIHAN: WARGA vs KEPENGURUSAN */}
            <div className="p-1 bg-emerald-50/70 border border-emerald-100 rounded-xl">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 px-2 py-1">
                Daftar Sebagai:
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setRegisterType("resident");
                    setErrorMessage(null);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    registerType === "resident"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-emerald-100/50"
                  }`}
                >
                  <User className="w-4 h-4" />
                  Warga (Penduduk)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegisterType("officer");
                    setErrorMessage(null);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    registerType === "officer"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-emerald-100/50"
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  Kepengurusan (RT / RW)
                </button>
              </div>
            </div>

            {/* -------------------------------------------------------------------
                2A. FORMULIR DAFTAR WARGA (RESIDENT)
                ------------------------------------------------------------------- */}
            {registerType === "resident" && (
              <form onSubmit={handleRegisterResidentSubmit} className="space-y-3">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Pendaftaran warga akan diverifikasi oleh <strong>Pengurus RT setempat</strong>.
                  </span>
                </div>

                {/* Pilih RW & RT */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Pilih Wilayah RW
                    </label>
                    <select
                      value={resRwId}
                      onChange={(e) => handleResRwChange(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                    >
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          RW {org.number} ({org.village})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Pilih Satuan RT
                    </label>
                    <select
                      value={resRtId}
                      onChange={(e) => setResRtId(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                    >
                      {currentResRw?.rtUnits?.map((rt: any) => (
                        <option key={rt.id} value={rt.id}>
                          RT {rt.number}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* NIK */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Nomor Induk Kependudukan (NIK)
                    </label>
                    {resNikValidation && (
                      <span className="text-[10px] font-bold text-emerald-700">
                        {resNikValidation}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={resNik}
                    onChange={(e) => handleNikInput(e.target.value, "resident")}
                    placeholder="16 Digit NIK KTP (Terproteksi UU PDP)"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* No KK & Phone */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      No. Kartu Keluarga (KK)
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={resKk}
                      onChange={(e) => setResKk(e.target.value.replace(/\D/g, ""))}
                      placeholder="16 Digit No. KK"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Nomor WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      value={resPhone}
                      onChange={(e) => setResPhone(e.target.value)}
                      placeholder="08xxxxxxxx"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nama Lengkap Sesuai KTP
                  </label>
                  <input
                    type="text"
                    required
                    value={resName}
                    onChange={(e) => setResName(e.target.value)}
                    placeholder="Nama lengkap warga"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                {/* Alamat Blok */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Alamat Blok & Nomor Rumah
                  </label>
                  <input
                    type="text"
                    required
                    value={resAddress}
                    onChange={(e) => setResAddress(e.target.value)}
                    placeholder="Contoh: Blok B2 No. 11"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                {/* Kata Sandi */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    required
                    value={resPassword}
                    onChange={(e) => setResPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                {/* Foto KTP */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Foto Fisik KTP (Kamera Langsung / File)
                  </label>
                  <input
                    ref={ktpCameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleKtpFileChange(e.target.files?.[0] || null)}
                  />
                  <input
                    ref={ktpGalleryRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleKtpFileChange(e.target.files?.[0] || null)}
                  />

                  {resKtpPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
                      <img
                        src={resKtpPreview}
                        alt="Pratinjau KTP"
                        className="w-full h-36 object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => handleKtpFileChange(null)}
                        className="absolute top-4 right-4 w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md text-xs transition"
                        title="Hapus Foto KTP"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="mt-1 text-center">
                        <span className="text-[10px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Foto KTP Berhasil Diambil
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => ktpCameraRef.current?.click()}
                        className="py-2.5 px-3 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-xs"
                      >
                        <Camera className="w-4 h-4 text-emerald-600" />
                        <span>Foto KTP via Kamera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => ktpGalleryRef.current?.click()}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95"
                      >
                        <Upload className="w-4 h-4 text-slate-500" />
                        <span>Pilih Berkas KTP</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {isSubmitting ? "Mengenkripsi & Mengunggah..." : "Kirim Pendaftaran Warga"}
                </button>
              </form>
            )}

            {/* -------------------------------------------------------------------
                2B. FORMULIR DAFTAR KEPENGURUSAN (LENGKAP: RW, RT & SELURUH SEKSI)
                ------------------------------------------------------------------- */}
            {registerType === "officer" && (
              <form onSubmit={handleRegisterOfficerSubmit} className="space-y-3">
                {/* PILIHAN TINGKAT: RW ATAU RT */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Tingkat Kepengurusan:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOfficerLevelChange("RW")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        officerLevel === "RW"
                          ? "bg-amber-500 border-amber-600 text-white shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      Tingkat RW (Rukun Warga)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOfficerLevelChange("RT")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        officerLevel === "RT"
                          ? "bg-teal-600 border-teal-700 text-white shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Briefcase className="w-4 h-4" />
                      Tingkat RT (Rukun Tetangga)
                    </button>
                  </div>
                </div>

                {/* PILIHAN JABATAN LENGKAP */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Pilih Jabatan Kepengurusan:
                  </label>
                  <select
                    value={officerRole}
                    onChange={(e) => setOfficerRole(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    {officerLevel === "RW" ? (
                      <optgroup label="Struktur Pengurus Rukun Warga (RW)">
                        {RW_POSITIONS.map((pos) => (
                          <option key={pos.value} value={pos.value}>
                            {pos.label}
                          </option>
                        ))}
                      </optgroup>
                    ) : (
                      <optgroup label="Struktur Pengurus Rukun Tetangga (RT)">
                        {RT_POSITIONS.map((pos) => (
                          <option key={pos.value} value={pos.value}>
                            {pos.label}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1 italic">
                    {officerLevel === "RW"
                      ? RW_POSITIONS.find((p) => p.value === officerRole)?.desc
                      : RT_POSITIONS.find((p) => p.value === officerRole)?.desc}
                  </p>
                </div>

                {/* WILAYAH RW & RT TERKAIT */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {/* WILAYAH TINGKAT RW */}
                  {officerLevel === "RW" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700">
                          Wilayah RW Induk
                        </label>
                        <label className="text-[11px] text-emerald-800 font-semibold cursor-pointer flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={isNewRw}
                            onChange={(e) => setIsNewRw(e.target.checked)}
                            className="rounded text-emerald-600"
                          />
                          Daftarkan Unit RW Baru
                        </label>
                      </div>

                      {!isNewRw ? (
                        <select
                          value={offRwId}
                          onChange={(e) => handleOffRwChange(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                        >
                          {organizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              RW {org.number} ({org.village}, {org.city})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                          <div className="text-[11px] font-bold text-amber-900">
                            Formulir Satuan RW Baru (Akan disahkan Kelurahan):
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              required
                              placeholder="Nomor RW (Contoh: 15)"
                              value={newRwNumber}
                              onChange={(e) => setNewRwNumber(e.target.value)}
                              className="text-xs p-2 rounded-lg border border-amber-300 font-bold bg-white"
                            />
                            <input
                              type="text"
                              required
                              placeholder="Kelurahan"
                              value={newRwVillage}
                              onChange={(e) => setNewRwVillage(e.target.value)}
                              className="text-xs p-2 rounded-lg border border-amber-300 bg-white"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              required
                              placeholder="Kecamatan"
                              value={newRwDistrict}
                              onChange={(e) => setNewRwDistrict(e.target.value)}
                              className="text-xs p-2 rounded-lg border border-amber-300 bg-white"
                            />
                            <input
                              type="text"
                              required
                              placeholder="Kota / Kabupaten"
                              value={newRwCity}
                              onChange={(e) => setNewRwCity(e.target.value)}
                              className="text-xs p-2 rounded-lg border border-amber-300 bg-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* WILAYAH TINGKAT RT */}
                  {officerLevel === "RT" && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Pilih RW Induk Terdaftar
                        </label>
                        <select
                          value={offRwId}
                          onChange={(e) => handleOffRwChange(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                        >
                          {organizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              RW {org.number} ({org.village})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700">
                          Satuan Unit RT
                        </label>
                        <label className="text-[11px] text-teal-800 font-semibold cursor-pointer flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={isNewRt}
                            onChange={(e) => setIsNewRt(e.target.checked)}
                            className="rounded text-teal-600"
                          />
                          Daftarkan Unit RT Baru
                        </label>
                      </div>

                      {!isNewRt ? (
                        <select
                          value={offRtId}
                          onChange={(e) => setOffRtId(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                        >
                          {currentOffRw?.rtUnits?.map((rt: any) => (
                            <option key={rt.id} value={rt.id}>
                              RT {rt.number}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          placeholder="Nomor RT Baru (Contoh: 05)"
                          value={newRtNumber}
                          onChange={(e) => setNewRtNumber(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-teal-300 font-bold bg-white"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* BIODATA CALON PENGURUS */}
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                    Data Pribadi Calon Pengurus:
                  </div>

                  {/* NIK */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        NIK Calon Pengurus (16 Digit)
                      </label>
                      {offNikValidation && (
                        <span className="text-[10px] font-bold text-emerald-700">
                          {offNikValidation}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      value={offNik}
                      onChange={(e) => handleNikInput(e.target.value, "officer")}
                      placeholder="327301xxxxxxxxxx"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                    />
                  </div>

                  {/* Nama Lengkap & No KK */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Nama Lengkap Sesuai SK
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nama lengkap pejabat"
                        value={offName}
                        onChange={(e) => setOffName(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        No. Kartu Keluarga (KK)
                      </label>
                      <input
                        type="text"
                        maxLength={16}
                        placeholder="16 Digit KK"
                        value={offKk}
                        onChange={(e) => setOffKk(e.target.value.replace(/\D/g, ""))}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                  </div>

                  {/* WhatsApp & Password */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Nomor WhatsApp
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="08xxxxxxxx"
                        value={offPhone}
                        onChange={(e) => setOffPhone(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Kata Sandi Akun
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Minimal 6 karakter"
                        value={offPassword}
                        onChange={(e) => setOffPassword(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>

                  {/* Alamat & Masa Bakti */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Alamat Blok Rumah
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Blok A1 No. 5"
                        value={offAddress}
                        onChange={(e) => setOffAddress(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Masa Bakti (5 Tahun)
                      </label>
                      <input
                        type="text"
                        required
                        value={offTermPeriod}
                        onChange={(e) => setOffTermPeriod(e.target.value)}
                        placeholder="2026-2031"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                      />
                    </div>
                  </div>

                  {/* Upload SK Dokumen */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      SK Pengangkatan / Berita Acara Pemilihan (PDF/Foto)
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setOffSkFile(e.target.files?.[0] || null)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-slate-50 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-emerald-600 file:text-white"
                    />
                  </div>
                </div>

                {/* APPROVAL HIERARCHY BANNER */}
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900 mb-0.5">
                      Alur Pengesahan Berjenjang:
                    </div>
                    {officerLevel === "RW" || isNewRw ? (
                      <p className="text-[11px] text-slate-600">
                        Pendaftaran pengurus tingkat RW ini akan ditinjau dan disahkan langsung oleh{" "}
                        <strong className="text-indigo-900">Super Admin Kelurahan (Lurah)</strong>.
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-600">
                        Pendaftaran pengurus tingkat RT ini akan ditinjau dan disahkan oleh{" "}
                        <strong className="text-teal-900">Ketua & Pengurus RW Induk</strong>.
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  {isSubmitting ? "Mengajukan Pengurus..." : "Kirim Pendaftaran Kepengurusan"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* =========================================================================
            3. PINTASAN UJI COBA AKUN DEMO (1-CLICK)
            ========================================================================= */}
        <div className="pt-3 border-t border-slate-200">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2">
            Pintasan Uji Coba Cepat (1-Click Demo):
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => quickLogin("ADMIN")}
              className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-left border border-indigo-200 transition-colors col-span-2 md:col-span-3"
            >
              <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
                Ibu Lurah Ratna Dewi (Super Admin)
              </div>
              <div className="text-[10px] text-indigo-700 font-medium">
                Kelola Seluruh RW, Approval Pengurus RW Baru, dan Rollover 5 Tahun
              </div>
            </button>

            <button
              type="button"
              onClick={() => quickLogin("RW")}
              className="p-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-left border border-teal-200 transition-colors"
            >
              <div className="text-xs font-bold text-teal-900">Pak RW Budi</div>
              <div className="text-[10px] text-teal-700">Ketua RW 05 (Approval RT & Kas)</div>
            </button>

            <button
              type="button"
              onClick={() => quickLogin("RT")}
              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-left border border-emerald-200 transition-colors"
            >
              <div className="text-xs font-bold text-emerald-900">Pak RT Hendra</div>
              <div className="text-[10px] text-emerald-700">Ketua RT 02 (Validasi Iuran)</div>
            </button>

            <button
              type="button"
              onClick={() => quickLogin("RESIDENT")}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-left border border-slate-200 transition-colors"
            >
              <div className="text-xs font-bold text-slate-800">Ibu Siti Aminah</div>
              <div className="text-[10px] text-slate-500">Warga Aktif (Bayar Iuran)</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
