"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  UserPlus,
  Send,
  Home,
  Phone,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";

export default function KkReconciliationTab() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<"MATCHED" | "UNREGISTERED_APP" | "NOT_IN_MASTER">("MATCHED");
  const [unmaskedKks, setUnmaskedKks] = useState<Record<string, boolean>>({});
  const [expandedKk, setExpandedKk] = useState<string | null>(null);
  const [copiedKk, setCopiedKk] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Quick Census Form Modal for Category 3 (Adopting unlisted KK to Master Census)
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [adoptTarget, setAdoptTarget] = useState<any | null>(null);
  const [adoptNik, setAdoptNik] = useState("");
  const [adoptGender, setAdoptGender] = useState<"LAKI_LAKI" | "PEREMPUAN">("LAKI_LAKI");
  const [adoptBirthDate, setAdoptBirthDate] = useState("1990-01-01");
  const [adoptRelation, setAdoptRelation] = useState("KEPALA_KELUARGA");
  const [adoptResidenceStatus, setAdoptResidenceStatus] = useState("TETAP");
  const [isSubmittingAdopt, setIsSubmittingAdopt] = useState(false);

  const fetchReconciliation = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/residents/reconciliation");
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Gagal memuat data rekonsiliasi KK:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliation();
  }, []);

  const toggleKkVisibility = (kkNumber: string) => {
    setUnmaskedKks((prev) => ({
      ...prev,
      [kkNumber]: !prev[kkNumber],
    }));
  };

  const handleCopyInvite = (kk: any) => {
    const text = `Halo Bapak/Ibu ${kk.headOfFamily}, pengurus RT mengundang keluarga Anda untuk mengaktifkan akun di aplikasi SIM-RW Digital agar dapat mengakses layanan surat pengantar dan iuran secara online. Silakan unduh atau buka aplikasi SIM-RW dan daftar dengan No. KK Anda.`;
    navigator.clipboard.writeText(text);
    setCopiedKk(kk.kkNumber);
    setTimeout(() => setCopiedKk(null), 3000);
  };

  const handleOpenAdoptModal = (item: any) => {
    setAdoptTarget(item);
    setAdoptNik("");
    setAdoptGender("LAKI_LAKI");
    setAdoptBirthDate("1990-01-01");
    setAdoptRelation("KEPALA_KELUARGA");
    setAdoptResidenceStatus("TETAP");
    setShowAdoptModal(true);
  };

  const handleAdoptToCensus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adoptTarget) return;

    if (!adoptNik || adoptNik.length !== 16) {
      alert("NIK harus terdiri dari 16 digit angka.");
      return;
    }

    setIsSubmittingAdopt(true);
    try {
      const payload = {
        kk_number: adoptTarget.kkNumber,
        nik: adoptNik,
        full_name: adoptTarget.userName,
        gender: adoptGender,
        birth_date: adoptBirthDate,
        birth_place: "Kota Bandung",
        religion: "ISLAM",
        occupation: "Wiraswasta",
        family_relation: adoptRelation,
        residence_status: adoptResidenceStatus,
        address_street: adoptTarget.address || "RT Setempat",
        phone_number: adoptTarget.userPhone,
      };

      const res = await fetch("/api/v1/residents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setActionSuccessMessage(`Berhasil mendaftarkan ${adoptTarget.userName} ke Buku Induk Kependudukan RT!`);
        setShowAdoptModal(false);
        setAdoptTarget(null);
        fetchReconciliation();
        setTimeout(() => setActionSuccessMessage(null), 5000);
      } else {
        alert(json.message || "Gagal memasukkan ke sensus RT.");
      }
    } catch (err) {
      console.error("Gagal adopt warga:", err);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmittingAdopt(false);
    }
  };

  const summary = data?.summary || {
    totalMasterKk: 0,
    totalMatchedKk: 0,
    totalUnregisteredAppKk: 0,
    totalUnregisteredMasterKk: 0,
    digitalAdoptionRate: 0,
  };

  const matchedKks = (data?.matchedKks || []).filter((item: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.headOfFamily.toLowerCase().includes(q) ||
      item.kkNumber.includes(q) ||
      item.address.toLowerCase().includes(q)
    );
  });

  const unregisteredAppKks = (data?.unregisteredAppKks || []).filter((item: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.headOfFamily.toLowerCase().includes(q) ||
      item.kkNumber.includes(q) ||
      item.address.toLowerCase().includes(q)
    );
  });

  const unregisteredMasterKks = (data?.unregisteredMasterKks || []).filter((item: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.userName.toLowerCase().includes(q) ||
      item.kkNumber.includes(q) ||
      (item.address && item.address.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Alert Banner if any */}
      {actionSuccessMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/50 rounded-2xl flex items-center justify-between text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <p className="text-sm font-medium">{actionSuccessMessage}</p>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 text-sm font-semibold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl border-2 border-indigo-900 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-900 border border-indigo-500 text-indigo-200 text-xs font-bold rounded-full uppercase tracking-wider">
                Sinkronisasi Kependudukan & Akun
              </span>
              <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-500 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> Terproteksi UU PDP
              </span>
            </div>
            <h2 className="text-2xl font-bold">Rekonsiliasi KK vs Akun Warga SIM-RW</h2>
            <p className="text-sm text-slate-200 font-medium mt-1 max-w-2xl">
              Membandingkan data Kartu Keluarga (KK) di Buku Induk Sensus Kepengurusan dengan kepemilikan akun aktif warga di aplikasi SIM-RW.
            </p>
          </div>

          <button
            onClick={fetchReconciliation}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 transition rounded-2xl text-sm font-bold border-2 border-slate-600 self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Perbarui Rekonsiliasi
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Master KK */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Total KK di Sensus</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-2">
            {summary.totalMasterKk} <span className="text-xs font-bold text-slate-700">Keluarga</span>
          </p>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">Tercatat di Buku Induk RT</p>
        </div>

        {/* KK Terhubung */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">KK Punya Akun (Min. 1)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-2">
            {summary.totalMatchedKk} <span className="text-xs font-normal text-emerald-600">KK Terhubung</span>
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{ width: `${summary.digitalAdoptionRate}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {summary.digitalAdoptionRate}%
            </span>
          </div>
        </div>

        {/* KK Belum Punya Akun */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-300 dark:border-amber-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Belum Punya Akun</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-2">
            {summary.totalUnregisteredAppKk} <span className="text-xs font-normal text-amber-600">KK</span>
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Perlu sosialisasi / jemput bola</p>
        </div>

        {/* Akun Belum di Sensus */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-purple-300 dark:border-purple-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Akun Belum di Sensus</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-2">
            {summary.totalUnregisteredMasterKk} <span className="text-xs font-normal text-purple-600">Akun</span>
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Warga daftar belum dicatat RT</p>
        </div>
      </div>

      {/* Tabs Filter Bar & Search */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Navigation Category Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveCategory("MATCHED")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeCategory === "MATCHED"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              KK Terhubung Aplikasi
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  activeCategory === "MATCHED"
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold"
                }`}
              >
                {summary.totalMatchedKk}
              </span>
            </button>

            <button
              onClick={() => setActiveCategory("UNREGISTERED_APP")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeCategory === "UNREGISTERED_APP"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              KK Belum Punya Akun SIM-RW
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  activeCategory === "UNREGISTERED_APP"
                    ? "bg-amber-700 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold"
                }`}
              >
                {summary.totalUnregisteredAppKk}
              </span>
            </button>

            <button
              onClick={() => setActiveCategory("NOT_IN_MASTER")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeCategory === "NOT_IN_MASTER"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Akun Belum di Sensus RT
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  activeCategory === "NOT_IN_MASTER"
                    ? "bg-purple-700 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold"
                }`}
              >
                {summary.totalUnregisteredMasterKk}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              placeholder="Cari nama atau No. KK..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Menghubungkan data kependudukan dan basis data akun...</p>
        </div>
      )}

      {/* CATEGORY 1: MATCHED KKs */}
      {!isLoading && activeCategory === "MATCHED" && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Keluarga berikut telah terhubung secara digital. Minimal 1 anggota keluarga telah memiliki akun aktif di aplikasi SIM-RW.
              </span>
            </div>
            <span className="font-semibold">{matchedKks.length} Kartu Keluarga</span>
          </div>

          {matchedKks.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Tidak ada data KK yang sesuai pencarian.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchedKks.map((item: any) => {
                const isUnmasked = !!unmaskedKks[item.kkNumber];
                const isExpanded = expandedKk === item.kkNumber;

                return (
                  <div
                    key={item.kkNumber}
                    className="p-5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700/50 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-slate-800 dark:text-white">
                              {item.headOfFamily}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              RT {item.rtNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                              No. KK: {isUnmasked ? item.kkNumber : item.maskedKk}
                            </span>
                            <button
                              onClick={() => toggleKkVisibility(item.kkNumber)}
                              className="text-slate-600 hover:text-slate-900 font-bold p-0.5 rounded"
                              title={isUnmasked ? "Sembunyikan No. KK" : "Tampilkan No. KK"}
                            >
                              {isUnmasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1 flex items-center gap-1">
                            <Home className="w-3.5 h-3.5 shrink-0 text-slate-600" /> {item.address}
                          </p>
                        </div>

                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 whitespace-nowrap">
                          {item.registeredUsersCount} Akun Terhubung
                        </span>
                      </div>

                      {/* Registered Users List */}
                      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                          Akun SIM-RW Terdaftar di Keluarga Ini:
                        </p>
                        <div className="space-y-1.5">
                          {item.registeredUsers.map((u: any) => (
                            <div
                              key={u.id}
                              className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="font-bold text-slate-800 dark:text-slate-100">{u.name}</span>
                                {u.phone && <span className="text-slate-600 dark:text-slate-300 font-mono font-medium text-[11px]">({u.phone})</span>}
                              </div>
                              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-200">
                                {u.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Expandable Family Members */}
                      {isExpanded && (
                        <div className="mt-3 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40 animate-in fade-in duration-200">
                          <p className="text-[11px] font-bold text-indigo-800 dark:text-indigo-200 uppercase tracking-wider mb-2">
                            Seluruh Jiwa Sensus ({item.totalMembers} Orang):
                          </p>
                          <div className="space-y-1">
                            {item.familyMembers.map((m: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                                <span className="text-slate-800 dark:text-slate-100 font-medium">
                                  {m.name} <span className="text-slate-700 dark:text-slate-300 font-medium">({m.relation})</span>
                                </span>
                                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 font-semibold">{m.maskedNik}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                        Total {item.totalMembers} Anggota Keluarga
                      </span>
                      <button
                        onClick={() => setExpandedKk(isExpanded ? null : item.kkNumber)}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            Tutup Rincian <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            Lihat Jiwa Sensus <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CATEGORY 2: UNREGISTERED IN APP (PERLU SOSIALISASI) */}
      {!isLoading && activeCategory === "UNREGISTERED_APP" && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Kartu Keluarga di bawah ini tercatat resmi di Buku Induk Sensus RT, namun belum ada satupun anggota keluarga yang mengaktifkan akun aplikasi SIM-RW.
              </span>
            </div>
            <span className="font-semibold">{unregisteredAppKks.length} Kartu Keluarga</span>
          </div>

          {unregisteredAppKks.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Luar biasa! Seluruh KK di Sensus RT sudah memiliki akun aplikasi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unregisteredAppKks.map((item: any) => {
                const isUnmasked = !!unmaskedKks[item.kkNumber];
                const isCopied = copiedKk === item.kkNumber;

                return (
                  <div
                    key={item.kkNumber}
                    className="p-5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-300 dark:hover:border-amber-700/50 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-slate-800 dark:text-white">
                              {item.headOfFamily}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              RT {item.rtNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                              No. KK: {isUnmasked ? item.kkNumber : item.maskedKk}
                            </span>
                            <button
                              onClick={() => toggleKkVisibility(item.kkNumber)}
                              className="text-slate-600 hover:text-slate-900 font-bold p-0.5 rounded"
                              title={isUnmasked ? "Sembunyikan No. KK" : "Tampilkan No. KK"}
                            >
                              {isUnmasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1 flex items-center gap-1">
                            <Home className="w-3.5 h-3.5 shrink-0 text-slate-600" /> {item.address}
                          </p>
                          {item.phone && item.phone !== "-" && (
                            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5 flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 shrink-0 text-slate-600" /> {item.phone}
                            </p>
                          )}
                        </div>

                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 whitespace-nowrap">
                          Belum Aktif
                        </span>
                      </div>

                      <div className="mt-4 p-3 bg-amber-50/80 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/30">
                        <p className="text-xs text-amber-900 dark:text-amber-300 font-bold">
                          Rekomendasi Tindakan:
                        </p>
                        <p className="text-xs text-slate-700 dark:text-slate-200 font-medium mt-0.5">
                          Kunjungi atau hubungi keluarga ini untuk sosialisasi pendaftaran akun SIM-RW secara mandiri.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                        {item.totalMembers} Jiwa dalam KK
                      </span>
                      <button
                        onClick={() => handleCopyInvite(item)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                          isCopied
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Tersalin ke Clipboard
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Salin Pesan Sosialisasi
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CATEGORY 3: NOT IN MASTER CENSUS (AKUN ADA, SENSUS BELUM) */}
      {!isLoading && activeCategory === "NOT_IN_MASTER" && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 rounded-2xl text-xs text-purple-800 dark:text-purple-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                Warga berikut telah mendaftar di aplikasi SIM-RW, namun data Nomor KK belum tercatat pada Buku Induk Sensus Kependudukan RT. Pengurus dapat memverifikasi dan memasukkannya ke sensus.
              </span>
            </div>
            <span className="font-semibold">{unregisteredMasterKks.length} Akun Warga</span>
          </div>

          {unregisteredMasterKks.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Seluruh akun warga yang terdaftar sudah sinkron dengan Buku Induk Sensus RT.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unregisteredMasterKks.map((item: any) => {
                const isUnmasked = !!unmaskedKks[item.kkNumber];

                return (
                  <div
                    key={item.userId}
                    className="p-5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-700/50 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-slate-800 dark:text-white">
                              {item.userName}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                              RT {item.rtNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                              No. KK Terinput: {isUnmasked ? item.kkNumber : item.maskedKk}
                            </span>
                            <button
                              onClick={() => toggleKkVisibility(item.kkNumber)}
                              className="text-slate-600 hover:text-slate-900 font-bold p-0.5 rounded"
                              title={isUnmasked ? "Sembunyikan No. KK" : "Tampilkan No. KK"}
                            >
                              {isUnmasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 shrink-0 text-slate-600" /> {item.userPhone}
                          </p>
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5 flex items-center gap-1">
                            <Home className="w-3.5 h-3.5 shrink-0 text-slate-600" /> {item.address}
                          </p>
                        </div>

                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 whitespace-nowrap">
                          {item.userStatus}
                        </span>
                      </div>

                      <div className="mt-4 p-3 bg-purple-50/80 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/30">
                        <p className="text-xs text-purple-900 dark:text-purple-300 font-bold">
                          Status Anomali:
                        </p>
                        <p className="text-xs text-slate-700 dark:text-slate-200 font-medium mt-0.5">
                          {item.actionNote}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                        Daftar: {new Date(item.registeredAt).toLocaleDateString("id-ID")}
                      </span>
                      <button
                        onClick={() => handleOpenAdoptModal(item)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition flex items-center gap-1.5 shadow-sm shadow-indigo-500/20"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Masukkan ke Sensus RT
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADOPT UNLISTED KK / CITIZEN TO MASTER RESIDENTS */}
      {showAdoptModal && adoptTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  Daftarkan ke Sensus Buku Induk RT
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                  Menambahkan KK dan Warga terdaftar ke database resmi RT 02
                </p>
              </div>
              <button
                onClick={() => setShowAdoptModal(false)}
                className="text-slate-600 hover:text-slate-900 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdoptToCensus} className="space-y-4 mt-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700 font-bold">Nama Warga:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{adoptTarget.userName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700 font-bold">No. Kartu Keluarga:</span>
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">{adoptTarget.kkNumber}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700 font-bold">Telepon / WhatsApp:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{adoptTarget.userPhone}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Nomor Induk Kependudukan (NIK 16 Digit) *
                </label>
                <input
                  type="text"
                  maxLength={16}
                  required
                  placeholder="Contoh: 3273012509180001"
                  value={adoptNik}
                  onChange={(e) => setAdoptNik(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Jenis Kelamin *
                  </label>
                  <select
                    value={adoptGender}
                    onChange={(e: any) => setAdoptGender(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                  >
                    <option value="LAKI_LAKI">Laki-laki</option>
                    <option value="PEREMPUAN">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Hubungan Keluarga *
                  </label>
                  <select
                    value={adoptRelation}
                    onChange={(e) => setAdoptRelation(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                  >
                    <option value="KEPALA_KELUARGA">Kepala Keluarga</option>
                    <option value="ISTRI">Istri</option>
                    <option value="ANAK">Anak</option>
                    <option value="FAMILI_LAIN">Famili Lain</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Tanggal Lahir *
                  </label>
                  <input
                    type="date"
                    required
                    value={adoptBirthDate}
                    onChange={(e) => setAdoptBirthDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                  >
                  </input>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Status Tempat Tinggal *
                  </label>
                  <select
                    value={adoptResidenceStatus}
                    onChange={(e) => setAdoptResidenceStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                  >
                    <option value="TETAP">Warga Tetap</option>
                    <option value="KONTRAK">Kontrak</option>
                    <option value="KOST">Kost</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdoptModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdopt}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition rounded-xl flex items-center gap-2 shadow-md shadow-indigo-500/20"
                >
                  {isSubmittingAdopt ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Konfirmasi ke Sensus RT
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

