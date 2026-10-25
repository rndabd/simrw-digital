"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Building2,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Lock,
  RefreshCw,
  Mail,
  Phone,
  KeyRound,
  Home,
  MapPin,
  Calendar,
} from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [alreadyInitialized, setAlreadyInitialized] = useState(false);

  // Stepper state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successDone, setSuccessDone] = useState(false);

  // Step 1: Admin Data
  const [fullName, setFullName] = useState("");
  const [nik, setNik] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2: Organization Data
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [rwNumber, setRwNumber] = useState("01");
  const [termPeriod, setTermPeriod] = useState("2026-2031");
  const [rtCount, setRtCount] = useState(2);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/v1/setup/status");
        const json = await res.json();
        if (json.success && json.initialized) {
          setAlreadyInitialized(true);
        }
      } catch (e) {
        console.error("Gagal memeriksa status setup:", e);
      } finally {
        setChecking(false);
      }
    }
    checkStatus();
  }, []);

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanNik = nik.replace(/\D/g, "");
    if (cleanNik.length !== 16) {
      setErrorMsg("NIK Super Admin wajib terdiri dari 16 digit angka sesuai KTP.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Kata sandi minimal 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!village.trim() || !district.trim() || !city.trim() || !rwNumber.trim()) {
      setErrorMsg("Seluruh data wilayah wajib diisi lengkap.");
      return;
    }

    setStep(3);
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/setup/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin: {
            fullName: fullName.trim(),
            nik: nik.replace(/\D/g, ""),
            phoneNumber: phoneNumber.trim(),
            email: email.trim() || undefined,
            password,
          },
          organization: {
            village: village.trim(),
            district: district.trim(),
            city: city.trim(),
            rwNumber: rwNumber.trim(),
            termPeriod: termPeriod.trim(),
            rtCount: Number(rtCount) || 1,
          },
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessDone(true);
      } else {
        setErrorMsg(json.message || "Gagal melakukan inisialisasi sistem.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400" />
          <p className="text-sm font-bold text-slate-300">Memeriksa status inisialisasi SIM-RW...</p>
        </div>
      </div>
    );
  }

  if (alreadyInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-900 bg-cover bg-center" style={{ backgroundImage: "url('/bg-desktop.jpeg')" }}>
        <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/60 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Sistem Telah Terinisialisasi
            </h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Setup awal akun Super Administrator dan Wilayah telah selesai dilakukan. Halaman inisialisasi ini dikunci secara otomatis demi keamanan sistem.
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            Buka Halaman Masuk
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-900 bg-cover bg-center"
      style={{ backgroundImage: "url('/bg-desktop.jpeg')" }}
    >
      <div className="max-w-lg w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/60 p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-emerald-400 mx-auto flex items-center justify-center shadow-md">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Inisialisasi Server Baru
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Setup Awal Akun Super Administrator & Wilayah Perdana
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            Terproteksi Kriptografi UU PDP No. 27/2022
          </div>
        </div>

        {/* Progress Step Bar */}
        <div className="flex items-center justify-between px-2 py-2.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? "text-emerald-700 font-extrabold" : "text-slate-400"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>
              1
            </span>
            Super Admin
          </div>
          <div className="h-0.5 w-6 bg-slate-300" />
          <div className={`flex items-center gap-1.5 ${step >= 2 ? "text-emerald-700 font-extrabold" : "text-slate-400"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>
              2
            </span>
            Data Wilayah
          </div>
          <div className="h-0.5 w-6 bg-slate-300" />
          <div className={`flex items-center gap-1.5 ${step >= 3 ? "text-emerald-700 font-extrabold" : "text-slate-400"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>
              3
            </span>
            Selesai
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* STEP 1: FORM SUPER ADMIN */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-3.5">
            <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
              <strong>Langkah 1:</strong> Buat akun <strong>Super Administrator</strong> pertama yang memiliki kewenangan tertinggi untuk mengelola seluruh RW, memverifikasi kepengurusan, dan mengatur sistem.
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nama Lengkap Super Admin <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Administrator Utama / Ibu Lurah"
                className="w-full text-xs p-3 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  16 Digit NIK KTP <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                  placeholder="3273xxxxxxxxxxxx"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nomor WhatsApp / HP <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Alamat Email Resmi (Opsional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@simrw.web.id"
                  className="w-full text-xs p-2.5 pl-9 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Ulangi Kata Sandi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang sandi"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              Lanjut ke Pengaturan Wilayah
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: FORM WILAYAH AWAL */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="space-y-3.5">
            <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-950 leading-relaxed">
              <strong>Langkah 2:</strong> Tentukan identitas administratif kelurahan/desa dan satuan <strong>Rukun Warga (RW) perdana</strong> untuk wilayah Anda.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Kelurahan / Desa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="Contoh: Sukamaju / Ciheulang"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Kecamatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Contoh: Coblong / Ciparay"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Kota / Kabupaten <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Contoh: Kota Bandung / Kab. Bandung"
                className="w-full text-xs p-3 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nomor RW <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={rwNumber}
                  onChange={(e) => setRwNumber(e.target.value)}
                  placeholder="01"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-center focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Masa Bakti <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={termPeriod}
                  onChange={(e) => setTermPeriod(e.target.value)}
                  placeholder="2026-2031"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-center font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Jml RT Awal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={rtCount}
                  onChange={(e) => setRtCount(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-center font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </button>
              <button
                type="submit"
                className="w-2/3 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                Tinjau & Konfirmasi
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: KONFIRMASI AKHIR */}
        {step === 3 && !successDone && (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="font-extrabold text-slate-900 border-b pb-1">
                Ringkasan Setup Server Produksi:
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Super Administrator:</span>
                  <strong className="text-slate-800">{fullName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">WhatsApp:</span>
                  <strong className="text-slate-800">{phoneNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Wilayah RW:</span>
                  <strong className="text-slate-800">RW {rwNumber.padStart(2, "0")}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Kelurahan / Desa:</span>
                  <strong className="text-slate-800">{village}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Kecamatan & Kota:</span>
                  <strong className="text-slate-800">{district}, {city}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Unit RT Perdana:</span>
                  <strong className="text-slate-800">{rtCount} Satuan RT (RT 01 s/d {String(rtCount).padStart(2, "0")})</strong>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Setelah tombol ditekan, akun Super Admin dan entitas wilayah awal akan disimpan secara permanen. Pengurus RT/RW lainnya dan warga dapat mendaftarkan diri secara mandiri melalui aplikasi.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setStep(2)}
                className="w-1/3 py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Ubah
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleFinalSubmit}
                className="w-2/3 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menyimpan Sistem...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Aktifkan SIM-RW Produksi
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUKSES */}
        {successDone && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Inisialisasi Berhasil!
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 max-w-sm mx-auto leading-relaxed">
                Akun Super Administrator dan wilayah perdana telah aktif. Anda sekarang dapat masuk ke aplikasi SIM-RW Digital.
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              Masuk ke Aplikasi Sekarang
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

