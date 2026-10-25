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
  Smartphone,
  Send,
  Info,
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

  // OTP Verification state for Admin Setup
  const [verifyChannel, setVerifyChannel] = useState<"WHATSAPP" | "EMAIL">("WHATSAPP");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

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
        const res = await fetch("/api/v1/setup/status?t=" + Date.now(), {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
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

  // Handler kirim kode OTP untuk verifikasi Super Admin
  const handleSendOtp = async () => {
    setOtpMessage(null);
    setDevOtpCode(null);

    const target = verifyChannel === "EMAIL" ? email.trim() : phoneNumber.trim();

    if (!target) {
      setOtpMessage({
        type: "error",
        text:
          verifyChannel === "EMAIL"
            ? "Harap isi alamat email resmi terlebih dahulu."
            : "Harap isi nomor WhatsApp terlebih dahulu.",
      });
      return;
    }

    if (verifyChannel === "EMAIL" && !target.includes("@")) {
      setOtpMessage({ type: "error", text: "Format alamat email tidak valid." });
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch("/api/v1/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target,
          channel: verifyChannel,
          purpose: "Inisialisasi Super Admin",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        if (data.devOtpCode) {
          setDevOtpCode(data.devOtpCode);
        }
        setOtpMessage({
          type: "info",
          text:
            data.message ||
            `Kode OTP berhasil dikirim ke ${target} via ${
              verifyChannel === "EMAIL" ? "Email" : "WhatsApp"
            }.`,
        });
      } else {
        setOtpMessage({
          type: "error",
          text: data.message || "Gagal mengirimkan kode OTP.",
        });
      }
    } catch (err: any) {
      setOtpMessage({
        type: "error",
        text: err.message || "Gagal menghubungi server untuk mengirim OTP.",
      });
    } finally {
      setSendingOtp(false);
    }
  };

  // Handler verifikasi kode OTP
  const handleVerifyOtp = async () => {
    setOtpMessage(null);
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setOtpMessage({ type: "error", text: "Masukkan 6 digit kode OTP verifikasi." });
      return;
    }

    const target = verifyChannel === "EMAIL" ? email.trim() : phoneNumber.trim();
    setVerifyingOtp(true);
    try {
      const res = await fetch("/api/v1/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target,
          code: otpCode.trim(),
          channel: verifyChannel,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (verifyChannel === "EMAIL") {
          setIsEmailVerified(true);
        } else {
          setIsPhoneVerified(true);
        }
        if (data.data?.verificationToken) {
          setVerificationToken(data.data.verificationToken);
        }
        setOtpMessage({
          type: "success",
          text: `✓ ${
            verifyChannel === "EMAIL" ? "Alamat email" : "Nomor WhatsApp"
          } berhasil diverifikasi! Akun siap dipulihkan jika lupa kata sandi.`,
        });
      } else {
        setOtpMessage({
          type: "error",
          text: data.message || "Kode OTP salah atau telah kedaluwarsa.",
        });
      }
    } catch (err: any) {
      setOtpMessage({
        type: "error",
        text: err.message || "Gagal memverifikasi OTP.",
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanNik = nik.replace(/\D/g, "");
    if (cleanNik.length !== 16) {
      setErrorMsg("NIK Super Admin wajib terdiri dari 16 digit angka sesuai KTP.");
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMsg("Nomor WhatsApp wajib diisi.");
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

    // Wajibkan verifikasi setidaknya salah satu kontak pemulihan (WhatsApp atau Email)
    if (!isPhoneVerified && !isEmailVerified) {
      setErrorMsg(
        "Harap verifikasi Nomor WhatsApp atau Alamat Email Anda terlebih dahulu menggunakan kode OTP agar akun Super Admin memiliki kontak pemulihan aktif jika terjadi lupa kata sandi."
      );
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
            isPhoneVerified,
            isEmailVerified,
            verificationToken,
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
      <div
        className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-900 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg-desktop.jpeg')" }}
      >
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
            onClick={() => (window.location.href = "/")}
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
        </div>

        {/* Stepper Wizard Indicator */}
        <div className="flex items-center justify-between px-2 pt-1 border-b border-slate-200 pb-3">
          <div
            className={`flex items-center gap-1.5 text-xs font-bold ${
              step >= 1 ? "text-emerald-700" : "text-slate-400"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step >= 1 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              1
            </span>
            <span>Super Admin</span>
          </div>

          <div className="w-8 h-0.5 bg-slate-200" />

          <div
            className={`flex items-center gap-1.5 text-xs font-bold ${
              step >= 2 ? "text-emerald-700" : "text-slate-400"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step >= 2 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              2
            </span>
            <span>Wilayah RW</span>
          </div>

          <div className="w-8 h-0.5 bg-slate-200" />

          <div
            className={`flex items-center gap-1.5 text-xs font-bold ${
              step >= 3 ? "text-emerald-700" : "text-slate-400"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step >= 3 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              3
            </span>
            <span>Aktivasi</span>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 shadow-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: FORM ADMIN DENGAN VERIFIKASI WA/EMAIL */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-3.5">
            <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
              <strong>Langkah 1:</strong> Buat akun <strong>Super Administrator</strong> pertama dan verifikasi kontak (WhatsApp atau Email) agar akun dapat dipulihkan jika sewaktu-waktu lupa kata sandi.
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
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setIsPhoneVerified(false);
                    setOtpSent(false);
                  }}
                  placeholder="08xxxxxxxxxx"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Alamat Email Resmi (Opsional namun direkomendasikan)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setIsEmailVerified(false);
                    setOtpSent(false);
                  }}
                  placeholder="admin@simrw.web.id"
                  className="w-full text-xs p-2.5 pl-9 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* BOX VERIFIKASI KONTAK PEMULIHAN */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                isPhoneVerified || isEmailVerified
                  ? "bg-emerald-50/90 border-emerald-300"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck
                    className={`w-4 h-4 ${
                      isPhoneVerified || isEmailVerified
                        ? "text-emerald-700"
                        : "text-slate-600"
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-900">
                    Verifikasi Kontak Pemulihan Sandi
                  </span>
                </div>
                {(isPhoneVerified || isEmailVerified) && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Terverifikasi
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                Pilih salah satu kontak aktif Anda di bawah untuk diverifikasi dengan kode OTP. Jika Anda lupa kata sandi nanti, sistem akan menggunakan kontak ini untuk verifikasi identitas:
              </p>

              {/* Pilihan Kanal Verifikasi */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setVerifyChannel("WHATSAPP");
                    setOtpSent(false);
                    setOtpMessage(null);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    verifyChannel === "WHATSAPP"
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  WhatsApp {isPhoneVerified && "✓"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVerifyChannel("EMAIL");
                    setOtpSent(false);
                    setOtpMessage(null);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    verifyChannel === "EMAIL"
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email {isEmailVerified && "✓"}
                </button>
              </div>

              {/* Status & Kontrol Pengiriman OTP */}
              <div className="space-y-2">
                {!otpSent ? (
                  <button
                    type="button"
                    disabled={sendingOtp || (verifyChannel === "WHATSAPP" ? isPhoneVerified : isEmailVerified)}
                    onClick={handleSendOtp}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {sendingOtp ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Mengirim Kode OTP...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Kirim Kode OTP ({verifyChannel === "EMAIL" ? email || "Email" : phoneNumber || "WhatsApp"})
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="6 Digit OTP"
                        className="w-1/2 text-center text-sm font-mono font-black tracking-widest p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                      <button
                        type="button"
                        disabled={verifyingOtp || otpCode.length < 6}
                        onClick={handleVerifyOtp}
                        className="w-1/2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {verifyingOtp ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Memeriksa...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Verifikasi OTP
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                      <span>Tidak menerima kode?</span>
                      <button
                        type="button"
                        disabled={sendingOtp}
                        onClick={handleSendOtp}
                        className="text-emerald-700 hover:underline font-bold"
                      >
                        Kirim Ulang OTP
                      </button>
                    </div>
                  </div>
                )}

                {/* Pesan Feedback OTP */}
                {otpMessage && (
                  <div
                    className={`p-2.5 rounded-xl text-[11px] leading-relaxed flex items-start gap-1.5 ${
                      otpMessage.type === "success"
                        ? "bg-emerald-100/90 text-emerald-900 border border-emerald-300 font-semibold"
                        : otpMessage.type === "error"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : "bg-blue-50 text-blue-800 border border-blue-200"
                    }`}
                  >
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{otpMessage.text}</span>
                  </div>
                )}

                {/* Info Helper Dev/Simulasi jika belum ada gateway aktif */}
                {devOtpCode && (
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                    <strong>Mode Simulasi:</strong> Kode OTP Anda adalah{" "}
                    <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-300">
                      {devOtpCode}
                    </code>{" "}
                    (Gateway pesan belum disetup di server).
                  </div>
                )}
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
                  placeholder="Contoh: Desa Ciheulang"
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
                  placeholder="Contoh: Ciparay"
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
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="font-extrabold text-slate-900 border-b pb-1.5 flex items-center justify-between">
                <span>Ringkasan Setup Server Produksi:</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Siap Aktivasi
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Super Administrator:</span>
                  <strong className="text-slate-800">{fullName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Nomor WhatsApp:</span>
                  <span className="text-slate-800 font-bold">
                    {phoneNumber}{" "}
                    {isPhoneVerified && (
                      <span className="text-emerald-700 font-bold text-[10px]">(✓ Terverifikasi)</span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Email Pemulihan:</span>
                  <span className="text-slate-800 font-bold">
                    {email || "-"}{" "}
                    {isEmailVerified && (
                      <span className="text-emerald-700 font-bold text-[10px]">(✓ Terverifikasi)</span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status Pemulihan Sandi:</span>
                  <strong className="text-emerald-700 font-extrabold">Aktif via OTP</strong>
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
                  <strong className="text-slate-800">
                    {district}, {city}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Unit RT Perdana:</span>
                  <strong className="text-slate-800">
                    {rtCount} Satuan RT (RT 01 s/d {String(rtCount).padStart(2, "0")})
                  </strong>
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
                    Konfirmasi & Aktivasi Sistem
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* SUKSES INISIALISASI */}
        {successDone && (
          <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Inisialisasi Sistem Berhasil!
              </h2>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-sm mx-auto">
                Akun Super Administrator dan wilayah <strong>RW {rwNumber.padStart(2, "0")} {village}</strong> telah berhasil didaftarkan. Kontak pemulihan Anda telah terverifikasi untuk fitur Lupa Kata Sandi.
              </p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 text-left space-y-1">
              <div>
                Akun Admin: <strong>{phoneNumber}</strong>
              </div>
              {email && (
                <div>
                  Email Terverifikasi: <strong>{email}</strong>
                </div>
              )}
              <div className="text-[11px] text-emerald-700">
                Silakan masuk menggunakan nomor WhatsApp dan kata sandi yang telah Anda buat.
              </div>
            </div>

            <button
              onClick={() => (window.location.href = "/")}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              Masuk ke Aplikasi SIM-RW
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
