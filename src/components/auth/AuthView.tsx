"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getFriendlyErrorMessage } from "@/lib/network-error";
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
  Mail,
  MessageSquare,
  KeyRound,
  Phone,
  RefreshCw,
  ArrowLeft,
  Send,
  Info,
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

  // Top-Level Navigation: MASUK, DAFTAR, ATAU LUPA PASSWORD
  const [authTab, setAuthTab] = useState<"login" | "register" | "forgot">("login");

  // Sub-Option on Register: WARGA ATAU KEPENGURUSAN
  const [registerType, setRegisterType] = useState<"resident" | "officer">("resident");

  // Organizations list for dropdown
  const [organizations, setOrganizations] = useState<any[]>([]);

  // Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSystemInitialized, setIsSystemInitialized] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkInit() {
      try {
        const res = await fetch("/api/v1/setup/status?t=" + Date.now(), {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        const json = await res.json();
        if (json.success) {
          setIsSystemInitialized(json.initialized);
        }
      } catch (e) {}
    }
    checkInit();
  }, []);

  // 1. LOGIN STATE
  const [loginNik, setLoginNik] = useState("");
  const [password, setPassword] = useState("");

  // FORGOT PASSWORD STATE
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3 | 4>(1);
  const [forgotNik, setForgotNik] = useState("");
  const [forgotContact, setForgotContact] = useState("");
  const [forgotOtpCode, setForgotOtpCode] = useState("");
  const [forgotDevOtp, setForgotDevOtp] = useState<string | null>(null);
  const [forgotChannel, setForgotChannel] = useState<"WHATSAPP" | "EMAIL">("WHATSAPP");
  const [forgotTargetMasked, setForgotTargetMasked] = useState("");
  const [forgotToken, setForgotToken] = useState("");
  const [forgotVerifiedUser, setForgotVerifiedUser] = useState<{ fullName: string; maskedNik: string } | null>(null);
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotAdminContact, setForgotAdminContact] = useState<{
    name: string;
    phoneNumber: string;
    waLink: string;
  } | null>(null);

  // 2. REGISTER RESIDENT (WARGA) STATE
  const [resRwId, setResRwId] = useState("");
  const [resRtId, setResRtId] = useState("");
  const [resNik, setResNik] = useState("");
  const [resKk, setResKk] = useState("");
  const [resName, setResName] = useState("");
  const [resPhone, setResPhone] = useState("");
  const [resEmail, setResEmail] = useState("");
  const [resVerificationMethod, setResVerificationMethod] = useState<"WHATSAPP" | "EMAIL">("WHATSAPP");
  const [resPassword, setResPassword] = useState("");
  const [resConfirmPassword, setResConfirmPassword] = useState("");
  const [resAddress, setResAddress] = useState("");
  const [resKtpFile, setResKtpFile] = useState<File | null>(null);
  const [resKtpPreview, setResKtpPreview] = useState<string | null>(null);
  const ktpCameraRef = useRef<HTMLInputElement>(null);
  const ktpGalleryRef = useRef<HTMLInputElement>(null);
  const [resNikValidation, setResNikValidation] = useState<string | null>(null);

  // OTP Verification for Resident (Warga)
  const [resOtpSent, setResOtpSent] = useState(false);
  const [resOtpCode, setResOtpCode] = useState("");
  const [resSendingOtp, setResSendingOtp] = useState(false);
  const [resVerifyingOtp, setResVerifyingOtp] = useState(false);
  const [resOtpMessage, setResOtpMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [resDevOtp, setResDevOtp] = useState<string | null>(null);
  const [resIsVerified, setResIsVerified] = useState(false);
  const [resVerificationToken, setResVerificationToken] = useState<string | null>(null);

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
  const [offConfirmPassword, setOffConfirmPassword] = useState("");
  const [offAddress, setOffAddress] = useState("");
  const [offTermPeriod, setOffTermPeriod] = useState("2026-2031");
  const [offSkFile, setOffSkFile] = useState<File | null>(null);
  const [offNikValidation, setOffNikValidation] = useState<string | null>(null);

  // OTP Verification for Officer (Pengurus)
  const [offOtpSent, setOffOtpSent] = useState(false);
  const [offOtpCode, setOffOtpCode] = useState("");
  const [offSendingOtp, setOffSendingOtp] = useState(false);
  const [offVerifyingOtp, setOffVerifyingOtp] = useState(false);
  const [offOtpMessage, setOffOtpMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [offDevOtp, setOffDevOtp] = useState<string | null>(null);
  const [offIsVerified, setOffIsVerified] = useState(false);
  const [offVerificationToken, setOffVerificationToken] = useState<string | null>(null);

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
      setIsNewRt(false);
    } else {
      setOffRtId("");
      setIsNewRt(true);
    }
  };

  // Switch officer level and auto-select appropriate default role
  const handleOfficerLevelChange = (level: "RW" | "RT") => {
    setOfficerLevel(level);
    if (level === "RW") {
      setOfficerRole("RW_CHAIR");
      const found = organizations.find((o) => o.id === offRwId);
      if (!found || !found.rtUnits || found.rtUnits.length === 0) {
        setIsNewRt(true);
      }
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

  // FORGOT PASSWORD HANDLERS
  const handleVerifyForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotDevOtp(null);

    const cleanNik = forgotNik.replace(/\D/g, "");
    const cleanContact = forgotContact.trim();

    if (cleanNik.length !== 16 || !cleanContact) {
      setForgotError("Harap isi 16 Digit NIK dan Nomor WhatsApp atau Email terdaftar.");
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/v1/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nik: cleanNik,
          identifier: cleanContact,
          channel: forgotChannel,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setForgotVerifiedUser({
          fullName: data.data.fullName,
          maskedNik: data.data.maskedNik,
        });
        setForgotChannel(data.data.channel || forgotChannel || "WHATSAPP");
        setForgotTargetMasked(data.data.targetMasked || cleanContact);
        if (data.data.devOtpCode) {
          setForgotDevOtp(data.data.devOtpCode);
        }
        setForgotStep(2);
      } else {
        setForgotError(data.message || "Data NIK dan Kontak tidak cocok.");
        const waLink =
          data.adminHelp?.whatsappLink ||
          "https://wa.me/6281200000001?text=Halo%20Admin%2FPengurus%20SIM-RW%2C%20saya%20ingin%20meminta%20bantuan%20pemulihan%20akun%20karena%20lupa%20kata%20sandi.";
        setForgotAdminContact({
          name: "Admin Pengurus SIM-RW",
          phoneNumber: "081200000001",
          waLink,
        });
      }
    } catch (err: any) {
      setForgotError(getFriendlyErrorMessage(err, "Gagal menghubungi server"));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotOtpCode || forgotOtpCode.trim().length < 6) {
      setForgotError("Harap masukkan 6 digit kode OTP yang telah dikirim.");
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/v1/auth/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nik: forgotNik.replace(/\D/g, ""),
          identifier: forgotContact.trim(),
          otpCode: forgotOtpCode.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.resetToken) {
        setForgotToken(data.data.resetToken);
        setForgotStep(3);
      } else {
        setForgotError(data.message || "Kode OTP salah atau telah kedaluwarsa.");
      }
    } catch (err: any) {
      setForgotError(getFriendlyErrorMessage(err, "Gagal menghubungi server"));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (forgotNewPassword.length < 6) {
      setForgotError("Kata sandi baru minimal 6 karakter.");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("Kata sandi tidak sama! Harap pastikan kedua kata sandi cocok.");
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/v1/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetToken: forgotToken,
          newPassword: forgotNewPassword,
          confirmPassword: forgotConfirmPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setForgotStep(4);
        setLoginNik(forgotNik);
        setPassword(forgotNewPassword);
      } else {
        setForgotError(data.message || "Gagal memperbarui kata sandi.");
      }
    } catch (err: any) {
      setForgotError(getFriendlyErrorMessage(err, "Gagal menghubungi server"));
    } finally {
      setForgotLoading(false);
    }
  };

  // 1. SUBMIT LOGIN
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const cleanNik = loginNik.replace(/\D/g, "");
    if (cleanNik.length < 10 && !loginNik.includes("@")) {
      setErrorMessage("Nomor NIK (16 digit) atau Nomor HP (minimal 10 digit) tidak valid.");
      setIsSubmitting(false);
      return;
    }

    const result = await login(cleanNik || loginNik.trim(), password);
    if (!result.success) {
      setErrorMessage(getFriendlyErrorMessage(result.message, "Nomor NIK / HP atau kata sandi tidak cocok."));
    }
    setIsSubmitting(false);
  };

  // Handler Kirim OTP Warga
  const handleSendResOtp = async () => {
    setResOtpMessage(null);
    setResDevOtp(null);
    const target = resVerificationMethod === "EMAIL" ? resEmail.trim() : resPhone.trim();
    if (!target) {
      setResOtpMessage({
        type: "error",
        text: resVerificationMethod === "EMAIL" ? "Harap isi alamat email terlebih dahulu." : "Harap isi nomor WhatsApp terlebih dahulu.",
      });
      return;
    }
    setResSendingOtp(true);
    try {
      const res = await fetch("/api/v1/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target,
          channel: resVerificationMethod,
          purpose: "Pendaftaran Warga",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResOtpSent(true);
        if (data.devOtpCode) setResDevOtp(data.devOtpCode);
        setResOtpMessage({
          type: "info",
          text: data.message || `Kode OTP telah dikirim ke ${target}.`,
        });
      } else {
        setResOtpMessage({ type: "error", text: data.message || "Gagal mengirimkan OTP." });
      }
    } catch (err: any) {
      setResOtpMessage({ type: "error", text: getFriendlyErrorMessage(err, "Terjadi kesalahan jaringan.") });
    } finally {
      setResSendingOtp(false);
    }
  };

  // Handler Verifikasi OTP Warga
  const handleVerifyResOtp = async () => {
    setResOtpMessage(null);
    if (!resOtpCode.trim() || resOtpCode.trim().length < 6) {
      setResOtpMessage({ type: "error", text: "Masukkan 6 digit kode OTP." });
      return;
    }
    const target = resVerificationMethod === "EMAIL" ? resEmail.trim() : resPhone.trim();
    setResVerifyingOtp(true);
    try {
      const res = await fetch("/api/v1/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target,
          code: resOtpCode.trim(),
          channel: resVerificationMethod,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResIsVerified(true);
        if (data.data?.verificationToken) {
          setResVerificationToken(data.data.verificationToken);
        }
        setResOtpMessage({
          type: "success",
          text: "✓ Kontak berhasil diverifikasi dengan kode OTP!",
        });
      } else {
        setResOtpMessage({ type: "error", text: data.message || "Kode OTP salah atau kedaluwarsa." });
      }
    } catch (err: any) {
      setResOtpMessage({ type: "error", text: getFriendlyErrorMessage(err, "Gagal memverifikasi OTP.") });
    } finally {
      setResVerifyingOtp(false);
    }
  };

  // Handler Kirim OTP Pengurus
  const handleSendOffOtp = async () => {
    setOffOtpMessage(null);
    setOffDevOtp(null);
    const target = offPhone.trim();
    if (!target) {
      setOffOtpMessage({ type: "error", text: "Harap isi nomor WhatsApp terlebih dahulu." });
      return;
    }
    setOffSendingOtp(true);
    try {
      const res = await fetch("/api/v1/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target,
          channel: "WHATSAPP",
          purpose: "Pendaftaran Pengurus",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOffOtpSent(true);
        if (data.devOtpCode) setOffDevOtp(data.devOtpCode);
        setOffOtpMessage({
          type: "info",
          text: data.message || `Kode OTP telah dikirim ke ${target}.`,
        });
      } else {
        setOffOtpMessage({ type: "error", text: data.message || "Gagal mengirimkan OTP." });
      }
    } catch (err: any) {
      setOffOtpMessage({ type: "error", text: getFriendlyErrorMessage(err, "Terjadi kesalahan jaringan.") });
    } finally {
      setOffSendingOtp(false);
    }
  };

  // Handler Verifikasi OTP Pengurus
  const handleVerifyOffOtp = async () => {
    setOffOtpMessage(null);
    if (!offOtpCode.trim() || offOtpCode.trim().length < 6) {
      setOffOtpMessage({ type: "error", text: "Masukkan 6 digit kode OTP." });
      return;
    }
    const target = offPhone.trim();
    setOffVerifyingOtp(true);
    try {
      const res = await fetch("/api/v1/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target,
          code: offOtpCode.trim(),
          channel: "WHATSAPP",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOffIsVerified(true);
        if (data.data?.verificationToken) {
          setOffVerificationToken(data.data.verificationToken);
        }
        setOffOtpMessage({
          type: "success",
          text: "✓ Nomor WhatsApp pejabat berhasil diverifikasi!",
        });
      } else {
        setOffOtpMessage({ type: "error", text: data.message || "Kode OTP salah atau kedaluwarsa." });
      }
    } catch (err: any) {
      setOffOtpMessage({ type: "error", text: getFriendlyErrorMessage(err, "Gagal memverifikasi OTP.") });
    } finally {
      setOffVerifyingOtp(false);
    }
  };

  // 2. SUBMIT REGISTER RESIDENT (WARGA)
  const handleRegisterResidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resNik.length !== 16) {
      setErrorMessage("NIK wajib terdiri dari 16 digit angka sesuai KTP.");
      return;
    }

    if (resVerificationMethod === "EMAIL" && !resEmail) {
      setErrorMessage("Alamat email wajib diisi jika memilih verifikasi melalui Email.");
      return;
    }

    if (resPassword.length < 6) {
      setErrorMessage("Kata sandi minimal 6 karakter.");
      return;
    }

    if (resPassword !== resConfirmPassword) {
      setErrorMessage("Kata sandi dan konfirmasi kata sandi tidak sama. Harap pastikan kedua kata sandi cocok.");
      return;
    }

    if (!resIsVerified) {
      setErrorMessage("Harap verifikasi nomor WhatsApp atau Email Anda dengan kode OTP terlebih dahulu sebelum mendaftar.");
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
      formData.append("email", resEmail);
      formData.append("verificationMethod", resVerificationMethod);
      formData.append("password", resPassword);
      formData.append("rwId", resRwId);
      formData.append("rtId", resRtId);
      formData.append("addressBlock", resAddress);
      formData.append("verificationToken", resVerificationToken || "");
      formData.append("isPhoneVerified", String(resVerificationMethod === "WHATSAPP"));
      formData.append("isEmailVerified", String(resVerificationMethod === "EMAIL"));
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
          setLoginNik(resNik);
          setPassword(resPassword);
        }, 2500);
      } else {
        setErrorMessage(json.message || "Gagal melakukan pendaftaran warga.");
      }
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err, "Terjadi kesalahan koneksi."));
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

    if (offPassword.length < 6) {
      setErrorMessage("Kata sandi minimal 6 karakter.");
      return;
    }

    if (offPassword !== offConfirmPassword) {
      setErrorMessage("Kata sandi dan konfirmasi kata sandi tidak sama. Harap pastikan kedua kata sandi cocok.");
      return;
    }

    if (!offIsVerified) {
      setErrorMessage("Harap verifikasi nomor WhatsApp Anda dengan kode OTP terlebih dahulu sebelum mendaftar kepengurusan.");
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
      formData.append("verificationToken", offVerificationToken || "");
      formData.append("isPhoneVerified", "true");
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
          setLoginNik(offNik);
          setPassword(offPassword);
        }, 3000);
      } else {
        setErrorMessage(json.message || "Gagal mendaftarkan kepengurusan.");
      }
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err, "Terjadi kesalahan koneksi jaringan."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentResRw = organizations.find((o) => o.id === resRwId);
  const currentOffRw = organizations.find((o) => o.id === offRwId);

  return (
    <div className="w-full h-full overflow-y-auto py-6 px-3 sm:px-6 flex flex-col justify-start md:justify-center">
      {/* Brand Header */}
      <div className="text-center space-y-2 mb-4 bg-slate-900/85 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-700/60 shadow-xl max-w-lg mx-auto w-full text-white">
        <div className="flex justify-center mb-1">
          <img
            src="/logo.png"
            alt="Logo SIM-RW Digital"
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-xl transition-transform hover:scale-105"
          />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-sm">
          SIM-RW Digital
        </h1>
        <p className="text-xs font-bold text-emerald-300 max-w-sm mx-auto">
          Sistem Informasi Manajemen & Pelayanan Rukun Warga Mandiri
        </p>
        <p className="text-[11px] text-slate-200 font-semibold drop-shadow-sm max-w-sm mx-auto">
          Sistem Pelayanan Warga & Kepengurusan RT/RW Terintegrasi Terproteksi UU PDP No. 27/2022
        </p>
      </div>

      {/* Main Container Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-white/60 shadow-2xl p-5 sm:p-6 space-y-4 max-w-lg mx-auto w-full">
        {isSystemInitialized === false && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <div className="text-xs font-black text-amber-900">Sistem Belum Diinisialisasi</div>
                <div className="text-[11px] text-amber-800">
                  Setup awal akun Super Administrator dan Wilayah belum dilakukan.
                </div>
              </div>
            </div>
            <a
              href="/setup"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 shadow-sm transition-all"
            >
              Mulai Setup
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

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
            MENU UTAMA: CUKUP 'MASUK' ATAU 'DAFTAR' SAJA (atau Mode Pemulihan Sandi)
            ========================================================================= */}
        {authTab !== "forgot" ? (
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
        ) : (
          <div className="flex items-center justify-between p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setAuthTab("login");
                setForgotError(null);
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Masuk
            </button>
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-white px-3 py-1.5 rounded-xl shadow-xs border border-emerald-200 mr-1">
              <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
              Pemulihan Sandi
            </div>
          </div>
        )}

        {/* =========================================================================
            1. TAB: MASUK AKUN
            ========================================================================= */}
        {authTab === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nomor Induk Kependudukan (NIK) / No. WhatsApp
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={16}
                  required
                  value={loginNik}
                  onChange={(e) => setLoginNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                  placeholder="16 digit NIK KTP atau Nomor WhatsApp (08xx)"
                  className="w-full text-xs p-3 pr-14 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500 tracking-wider font-mono"
                />
                <span className="absolute right-3 top-3 text-[10px] font-semibold text-slate-400">
                  {loginNik.length}/16
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3 text-emerald-600 shrink-0" />
                Masuk dengan 16 digit NIK atau Nomor WhatsApp terdaftar. 1 nomor HP dapat dipakai bersama dalam 1 KK.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("forgot");
                    setForgotStep(1);
                    setForgotError(null);
                    setForgotNik(loginNik || "");
                    setForgotContact("");
                    setForgotAdminContact(null);
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  Lupa Kata Sandi?
                </button>
              </div>
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
                      Nomor WhatsApp / HP
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

                {/* Email (Opsional / Tergantung Verifikasi) */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Alamat Email {resVerificationMethod === "EMAIL" && <span className="text-rose-500 font-bold">* (Wajib)</span>}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required={resVerificationMethod === "EMAIL"}
                      value={resEmail}
                      onChange={(e) => setResEmail(e.target.value)}
                      placeholder="contoh: warga@gmail.com"
                      className="w-full text-xs p-2.5 pl-9 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Opsi Metode Verifikasi Utama */}
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                  <label className="text-[11px] font-bold text-emerald-950 block mb-1.5 uppercase tracking-wider">
                    Pilihan Kanal Verifikasi OTP
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setResVerificationMethod("WHATSAPP");
                        setResOtpSent(false);
                        setResIsVerified(false);
                        setResOtpMessage(null);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all ${
                        resVerificationMethod === "WHATSAPP"
                          ? "border-emerald-600 bg-white shadow-xs ring-1 ring-emerald-500"
                          : "border-slate-200 bg-white/70 hover:bg-white"
                      }`}
                    >
                      <MessageSquare className={`w-4 h-4 mt-0.5 shrink-0 ${resVerificationMethod === "WHATSAPP" ? "text-emerald-600" : "text-slate-400"}`} />
                      <div>
                        <div className="text-xs font-bold text-slate-800">WhatsApp</div>
                        <div className="text-[10px] text-slate-500">Kirim kode ke WhatsApp</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResVerificationMethod("EMAIL");
                        setResOtpSent(false);
                        setResIsVerified(false);
                        setResOtpMessage(null);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all ${
                        resVerificationMethod === "EMAIL"
                          ? "border-emerald-600 bg-white shadow-xs ring-1 ring-emerald-500"
                          : "border-slate-200 bg-white/70 hover:bg-white"
                      }`}
                    >
                      <Mail className={`w-4 h-4 mt-0.5 shrink-0 ${resVerificationMethod === "EMAIL" ? "text-emerald-600" : "text-slate-400"}`} />
                      <div>
                        <div className="text-xs font-bold text-slate-800">Email</div>
                        <div className="text-[10px] text-slate-500">Kirim kode ke Email</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Box Verifikasi OTP Warga */}
                <div
                  className={`p-3 rounded-2xl border transition-all ${
                    resIsVerified
                      ? "bg-emerald-50/90 border-emerald-300"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck
                        className={`w-4 h-4 ${
                          resIsVerified ? "text-emerald-700" : "text-slate-600"
                        }`}
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Verifikasi Kode OTP ({resVerificationMethod === "EMAIL" ? "Email" : "WhatsApp"})
                      </span>
                    </div>
                    {resIsVerified && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Terverifikasi
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 mb-2.5 leading-relaxed">
                    Verifikasi kontak diperlukan agar akun Anda aktif dan dapat memulihkan kata sandi jika lupa:
                  </p>

                  {!resOtpSent ? (
                    <button
                      type="button"
                      disabled={resSendingOtp || resIsVerified}
                      onClick={handleSendResOtp}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {resSendingOtp ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Mengirim Kode OTP...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Kirim Kode OTP ({resVerificationMethod === "EMAIL" ? resEmail || "Email" : resPhone || "WhatsApp"})
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={resOtpCode}
                          onChange={(e) => setResOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="6 Digit OTP"
                          className="w-1/2 text-center text-sm font-mono font-black tracking-widest p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                        <button
                          type="button"
                          disabled={resVerifyingOtp || resOtpCode.length < 6}
                          onClick={handleVerifyResOtp}
                          className="w-1/2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          {resVerifyingOtp ? (
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
                        <span>Belum menerima kode?</span>
                        <button
                          type="button"
                          disabled={resSendingOtp}
                          onClick={handleSendResOtp}
                          className="text-emerald-700 hover:underline font-bold"
                        >
                          Kirim Ulang OTP
                        </button>
                      </div>
                    </div>
                  )}

                  {resOtpMessage && (
                    <div
                      className={`mt-2 p-2 rounded-xl text-[11px] leading-relaxed flex items-start gap-1.5 ${
                        resOtpMessage.type === "success"
                          ? "bg-emerald-100/90 text-emerald-900 border border-emerald-300 font-semibold"
                          : resOtpMessage.type === "error"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-blue-50 text-blue-800 border border-blue-200"
                      }`}
                    >
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{resOtpMessage.text}</span>
                    </div>
                  )}

                  {resDevOtp && (
                    <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                      <strong>Mode Simulasi:</strong> Kode OTP Anda:{" "}
                      <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-300">
                        {resDevOtp}
                      </code>
                    </div>
                  )}
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

                {/* Kata Sandi & Konfirmasi Kata Sandi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Ulangi Kata Sandi
                    </label>
                    <input
                      type="password"
                      required
                      value={resConfirmPassword}
                      onChange={(e) => setResConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi"
                      className={`w-full text-xs p-2.5 rounded-xl border transition-all ${
                        resConfirmPassword && resPassword !== resConfirmPassword
                          ? "border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-500"
                          : resConfirmPassword && resPassword === resConfirmPassword
                          ? "border-emerald-500 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-500"
                          : "border-slate-300 focus:ring-2 focus:ring-emerald-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Notifikasi Realtime Kecocokan Password Warga */}
                {resConfirmPassword && resPassword !== resConfirmPassword && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold flex items-center gap-1.5 animate-shake">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Kata sandi tidak sama! Harap pastikan kedua kata sandi cocok.</span>
                  </div>
                )}
                {resConfirmPassword && resPassword === resConfirmPassword && (
                  <div className="p-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Kata sandi cocok!</span>
                  </div>
                )}

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
                        <Upload className="w-4 h-4 text-slate-700" />
                        <span>Pilih Berkas KTP</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    Boolean(resConfirmPassword && resPassword !== resConfirmPassword) ||
                    resPassword.length < 6
                  }
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
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
                  <p className="text-[11px] text-slate-700 font-medium mt-1">
                    {officerLevel === "RW"
                      ? RW_POSITIONS.find((p) => p.value === officerRole)?.desc
                      : RT_POSITIONS.find((p) => p.value === officerRole)?.desc}
                  </p>
                </div>

                {/* WILAYAH RW & RT TERKAIT */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  {/* WILAYAH RW */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">
                        {officerLevel === "RW" ? "Wilayah RW Pengurus" : "Pilih RW Induk Terdaftar"}
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

                  {/* WILAYAH RT (WAJIB ADA UNTUK PENGURUS RW MAUPUN RT) */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">
                        Satuan Unit RT Domisili Pengurus:
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

                    {!isNewRt && currentOffRw?.rtUnits && currentOffRw.rtUnits.length > 0 ? (
                      <select
                        value={offRtId}
                        onChange={(e) => setOffRtId(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                      >
                        {currentOffRw.rtUnits.map((rt: any) => (
                          <option key={rt.id} value={rt.id}>
                            RT {rt.number}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="space-y-1">
                        <input
                          type="text"
                          required
                          placeholder="Nomor Unit RT (Contoh: 01, 02, atau 05)"
                          value={newRtNumber}
                          onChange={(e) => setNewRtNumber(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-teal-400 font-bold bg-white text-slate-800"
                        />
                        <p className="text-[10px] text-teal-700">
                          *Unit RT ini akan otomatis terdaftar aktif di sistem SIM-RW.
                        </p>
                      </div>
                    )}
                  </div>
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

                  {/* WhatsApp */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Nomor WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="08xxxxxxxx"
                      value={offPhone}
                      onChange={(e) => {
                        setOffPhone(e.target.value);
                        setOffIsVerified(false);
                        setOffOtpSent(false);
                      }}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>

                  {/* Box Verifikasi OTP WhatsApp Pengurus */}
                  <div
                    className={`p-3 rounded-2xl border transition-all ${
                      offIsVerified
                        ? "bg-emerald-50/90 border-emerald-300"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck
                          className={`w-4 h-4 ${
                            offIsVerified ? "text-emerald-700" : "text-slate-600"
                          }`}
                        />
                        <span className="text-xs font-bold text-slate-800">
                          Verifikasi WhatsApp Pejabat (Kode OTP)
                        </span>
                      </div>
                      {offIsVerified && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Terverifikasi
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 mb-2.5 leading-relaxed">
                      Nomor WhatsApp wajib diverifikasi untuk koordinasi warga dan pemulihan kata sandi akun pejabat:
                    </p>

                    {!offOtpSent ? (
                      <button
                        type="button"
                        disabled={offSendingOtp || offIsVerified}
                        onClick={handleSendOffOtp}
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      >
                        {offSendingOtp ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Mengirim Kode OTP...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            Kirim Kode OTP ({offPhone || "Nomor WhatsApp"})
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={offOtpCode}
                            onChange={(e) => setOffOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="6 Digit OTP"
                            className="w-1/2 text-center text-sm font-mono font-black tracking-widest p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                          />
                          <button
                            type="button"
                            disabled={offVerifyingOtp || offOtpCode.length < 6}
                            onClick={handleVerifyOffOtp}
                            className="w-1/2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                          >
                            {offVerifyingOtp ? (
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
                          <span>Belum menerima kode?</span>
                          <button
                            type="button"
                            disabled={offSendingOtp}
                            onClick={handleSendOffOtp}
                            className="text-emerald-700 hover:underline font-bold"
                          >
                            Kirim Ulang OTP
                          </button>
                        </div>
                      </div>
                    )}

                    {offOtpMessage && (
                      <div
                        className={`mt-2 p-2 rounded-xl text-[11px] leading-relaxed flex items-start gap-1.5 ${
                          offOtpMessage.type === "success"
                            ? "bg-emerald-100/90 text-emerald-900 border border-emerald-300 font-semibold"
                            : offOtpMessage.type === "error"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : "bg-blue-50 text-blue-800 border border-blue-200"
                        }`}
                      >
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{offOtpMessage.text}</span>
                      </div>
                    )}

                    {offDevOtp && (
                      <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                        <strong>Mode Simulasi:</strong> Kode OTP Anda:{" "}
                        <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-300">
                          {offDevOtp}
                        </code>
                      </div>
                    )}
                  </div>

                  {/* Kata Sandi & Konfirmasi Kata Sandi Pengurus */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Ulangi Kata Sandi
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Ketik ulang kata sandi"
                        value={offConfirmPassword}
                        onChange={(e) => setOffConfirmPassword(e.target.value)}
                        className={`w-full text-xs p-2.5 rounded-xl border transition-all ${
                          offConfirmPassword && offPassword !== offConfirmPassword
                            ? "border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-500"
                            : offConfirmPassword && offPassword === offConfirmPassword
                            ? "border-emerald-500 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-500"
                            : "border-slate-300 focus:ring-2 focus:ring-emerald-500"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Notifikasi Realtime Kecocokan Password Pengurus */}
                  {offConfirmPassword && offPassword !== offConfirmPassword && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold flex items-center gap-1.5 animate-shake">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Kata sandi tidak sama! Harap pastikan kedua kata sandi cocok.</span>
                    </div>
                  )}
                  {offConfirmPassword && offPassword === offConfirmPassword && (
                    <div className="p-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Kata sandi cocok!</span>
                    </div>
                  )}

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
                  disabled={
                    isSubmitting ||
                    Boolean(offConfirmPassword && offPassword !== offConfirmPassword) ||
                    offPassword.length < 6
                  }
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  {isSubmitting ? "Mengajukan Pengurus..." : "Kirim Pendaftaran Kepengurusan"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* =========================================================================
            3. TAB: LUPA KATA SANDI (TERINTEGRASI DI DALAM CARD TANPA TERPOTONG)
            ========================================================================= */}
        {authTab === "forgot" && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center justify-center gap-1.5">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                Pemulihan Kata Sandi Akun
              </h3>
              <p className="text-[11px] text-slate-500">
                Verifikasi identitas warga terproteksi UU PDP No. 27/2022
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-2xl border border-slate-200">
              <div className={`flex items-center gap-1 text-[11px] font-bold ${forgotStep >= 1 ? "text-emerald-700" : "text-slate-400"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${forgotStep >= 1 ? "bg-emerald-600 text-white font-black" : "bg-slate-200 text-slate-600"}`}>
                  1
                </span>
                Identitas
              </div>
              <div className="h-0.5 w-3 bg-slate-200" />
              <div className={`flex items-center gap-1 text-[11px] font-bold ${forgotStep >= 2 ? "text-emerald-700" : "text-slate-400"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${forgotStep >= 2 ? "bg-emerald-600 text-white font-black" : "bg-slate-200 text-slate-600"}`}>
                  2
                </span>
                Kode OTP
              </div>
              <div className="h-0.5 w-3 bg-slate-200" />
              <div className={`flex items-center gap-1 text-[11px] font-bold ${forgotStep >= 3 ? "text-emerald-700" : "text-slate-400"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${forgotStep >= 3 ? "bg-emerald-600 text-white font-black" : "bg-slate-200 text-slate-600"}`}>
                  3
                </span>
                Sandi Baru
              </div>
              <div className="h-0.5 w-3 bg-slate-200" />
              <div className={`flex items-center gap-1 text-[11px] font-bold ${forgotStep >= 4 ? "text-emerald-700" : "text-slate-400"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${forgotStep >= 4 ? "bg-emerald-600 text-white font-black" : "bg-slate-200 text-slate-600"}`}>
                  4
                </span>
                Selesai
              </div>
            </div>

            {/* Error Message */}
            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{forgotError}</div>
              </div>
            )}

            {/* STEP 1: VERIFIKASI NIK & KONTAK (WA / EMAIL) */}
            {forgotStep === 1 && (
              <form onSubmit={handleVerifyForgotPassword} className="space-y-3.5">
                <p className="text-xs text-slate-600 leading-relaxed bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/80">
                  Masukkan <strong>16 Digit NIK KTP</strong> dan <strong>Nomor WhatsApp atau Email terdaftar</strong> Anda. Sistem akan mengirimkan kode OTP untuk verifikasi kepemilikan akun.
                </p>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nomor Induk Kependudukan (NIK)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={forgotNik}
                    onChange={(e) => setForgotNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                    placeholder="16 Digit NIK KTP Anda"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Pilihan Kanal Pengiriman OTP */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Kirim Kode OTP Melalui:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForgotChannel("WHATSAPP")}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        forgotChannel === "WHATSAPP"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      WhatsApp OTP
                    </button>
                    <button
                      type="button"
                      onClick={() => setForgotChannel("EMAIL")}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        forgotChannel === "EMAIL"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Mail className="w-4 h-4 text-emerald-600" />
                      Email OTP
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {forgotChannel === "EMAIL" ? "Alamat Email Terdaftar" : "Nomor WhatsApp Terdaftar"}
                  </label>
                  <input
                    type={forgotChannel === "EMAIL" ? "email" : "tel"}
                    required
                    value={forgotContact}
                    onChange={(e) => setForgotContact(e.target.value)}
                    placeholder={
                      forgotChannel === "EMAIL"
                        ? "Contoh: warga@email.com atau admin@simrw.web.id"
                        : "Contoh: 0812xxxxxxxx"
                    }
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {forgotLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Memeriksa & Mengirim OTP...
                    </>
                  ) : (
                    <>
                      Kirim Kode OTP Pemulihan
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Fallback Box: Hubungi Admin RT/RW jika lupa/tidak ada keduanya */}
                <div className="mt-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    Lupa NIK atau Kontak Sudah Tidak Aktif?
                  </div>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    Jika Anda tidak memiliki akses ke NIK atau nomor telepon/email telah berganti, silakan hubungi Pengurus / Admin RT & RW setempat melalui WhatsApp untuk bantuan verifikasi akun secara langsung:
                  </p>
                  <a
                    href={forgotAdminContact?.waLink || "https://wa.me/6281200000001?text=Halo%20Admin%2FPengurus%20SIM-RW%2C%20saya%20ingin%20meminta%20bantuan%20pemulihan%20akun%20karena%20lupa%20kata%20sandi."}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Hubungi Admin RT/RW via WhatsApp
                  </a>
                </div>
              </form>
            )}

            {/* STEP 2: VERIFIKASI KODE OTP */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOtpSubmit} className="space-y-3.5">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    Kode OTP Telah Dikirim!
                  </div>
                  Kode verifikasi 6-digit telah dikirimkan ke <strong>{forgotTargetMasked}</strong> via <strong>{forgotChannel === "EMAIL" ? "Email" : "WhatsApp"}</strong>.
                </div>

                {forgotDevOtp && (
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                    <strong>Mode Simulasi:</strong> Kode OTP Anda adalah{" "}
                    <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-300">
                      {forgotDevOtp}
                    </code>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Masukkan 6 Digit Kode OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={forgotOtpCode}
                    onChange={(e) => setForgotOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Contoh: 123456"
                    className="w-full text-center text-base p-3 rounded-xl border border-slate-300 font-mono font-extrabold tracking-widest focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="w-1/3 py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || forgotOtpCode.length < 6}
                    className="w-2/3 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Memverifikasi...
                      </>
                    ) : (
                      <>
                        Verifikasi Kode
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: MASUKKAN KATA SANDI BARU */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Identitas Berhasil Diverifikasi!
                  </div>
                  <div className="mt-1 text-slate-700">
                    Pengguna: <strong>{forgotVerifiedUser?.fullName}</strong> ({forgotVerifiedUser?.maskedNik})
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    required
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Ulangi Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    required
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru"
                    className={`w-full text-xs p-3 rounded-xl border font-medium transition-all ${
                      forgotConfirmPassword && forgotNewPassword !== forgotConfirmPassword
                        ? "border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-500"
                        : forgotConfirmPassword && forgotNewPassword === forgotConfirmPassword
                        ? "border-emerald-500 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-500"
                        : "border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    }`}
                  />
                </div>

                {/* Notifikasi Realtime Kecocokan Password Pemulihan */}
                {forgotConfirmPassword && forgotNewPassword !== forgotConfirmPassword && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold flex items-center gap-1.5 animate-shake">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Kata sandi tidak sama! Harap pastikan kedua kata sandi cocok.</span>
                  </div>
                )}
                {forgotConfirmPassword && forgotNewPassword === forgotConfirmPassword && (
                  <div className="p-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Kata sandi cocok!</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    forgotLoading ||
                    Boolean(forgotConfirmPassword && forgotNewPassword !== forgotConfirmPassword) ||
                    forgotNewPassword.length < 6
                  }
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {forgotLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Menyimpan Kata Sandi...
                    </>
                  ) : (
                    <>
                      Simpan Kata Sandi Baru
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 4: SUKSES */}
            {forgotStep === 4 && (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    Kata Sandi Berhasil Diperbarui!
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Kata sandi baru Anda telah aktif. Silakan masuk kembali menggunakan akun Anda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("login");
                    setForgotStep(1);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  Masuk Sekarang
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
