"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  TrendingUp,
  UserCheck,
  Home,
  RefreshCw,
  Baby,
  Smile,
  Briefcase,
  Heart,
  ArrowRightLeft,
  UserMinus,
  UserPlus,
  Activity,
  Calendar,
} from "lucide-react";

export default function PopulationStatsTab() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/residents/statistics");
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
      }
    } catch (err) {
      console.error("Gagal memuat statistik penduduk:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const data = stats || {
    totalKk: 0,
    totalJiwa: 0,
    maleCount: 0,
    femaleCount: 0,
    malePercent: 0,
    femalePercent: 0,
    ageGroups: { balita: 0, anak: 0, produktif: 0, lansia: 0 },
    residenceStats: { tetap: 0, kontrak: 0, kost: 0 },
    mutations: { pindahKeluar: 0, pindahMasuk: 0, meninggal: 0, lahir: 0 },
    recentMutations: [],
  };

  const getMutationBadge = (status: string) => {
    switch (status) {
      case "PINDAH_MASUK":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
            <UserPlus className="w-3 h-3" /> Pindah Masuk
          </span>
        );
      case "PINDAH_KELUAR":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
            <UserMinus className="w-3 h-3" /> Pindah Keluar
          </span>
        );
      case "MENINGGAL":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
            <Heart className="w-3 h-3" /> Wafat
          </span>
        );
      case "LAHIR":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-800 flex items-center gap-1">
            <Baby className="w-3 h-3" /> Kelahiran
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Aktif
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-xl border border-indigo-500/20 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-semibold rounded-full uppercase tracking-wider">
                Analitik Demografi & Mutasi
              </span>
              <span className="text-xs text-slate-300">Data Realtime Sensus RT/RW</span>
            </div>
            <h2 className="text-2xl font-bold">Statistik Kependudukan & Dinamika Warga</h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Pemantauan distribusi populasi, struktur usia, perbandingan gender, kepemilikan domisili, dan mutasi keluar-masuk.
            </p>
          </div>

          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 transition rounded-2xl text-sm font-medium border border-white/10 self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Perbarui Statistik
          </button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Jiwa */}
        <div className="p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Penduduk Aktif</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2">
            {data.totalJiwa} <span className="text-sm font-normal text-slate-500">Jiwa</span>
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            Tersebar di {data.totalKk} Kartu Keluarga (KK)
          </p>
        </div>

        {/* Gender Breakdown */}
        <div className="p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Proporsi Gender</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{data.maleCount}</p>
              <p className="text-[11px] text-slate-500">Laki-laki ({data.malePercent}%)</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-pink-500">{data.femaleCount}</p>
              <p className="text-[11px] text-slate-500">Perempuan ({data.femalePercent}%)</p>
            </div>
          </div>
          <div className="mt-2.5 flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
            <div style={{ width: `${data.malePercent}%` }} className="bg-blue-500" />
            <div style={{ width: `${data.femalePercent}%` }} className="bg-pink-500" />
          </div>
        </div>

        {/* Status Domisili */}
        <div className="p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Status Tempat Tinggal</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {data.residenceStats.tetap}
              </p>
              <p className="text-[11px] text-slate-500">Warga Tetap</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {data.residenceStats.kontrak + data.residenceStats.kost}
              </p>
              <p className="text-[11px] text-slate-500">Kontrak / Kost</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Stabilitas warga: {data.totalJiwa > 0 ? Math.round((data.residenceStats.tetap / data.totalJiwa) * 100) : 0}% tetap
          </p>
        </div>

        {/* Total Mutasi */}
        <div className="p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Riwayat Mutasi</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2">
            {data.mutations.pindahMasuk + data.mutations.pindahKeluar + data.mutations.lahir + data.mutations.meninggal}{" "}
            <span className="text-sm font-normal text-slate-500">Peristiwa</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Dinamika mutasi kependudukan</p>
        </div>
      </div>

      {/* Middle Section: Age Pyramid & Mutation Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Age Groups Breakdown */}
        <div className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Kelompok Usia Penduduk</h3>
              <p className="text-xs text-slate-500">Distribusi jenjang umur warga di lingkungan</p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="space-y-4">
            {/* Balita */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                  <Baby className="w-4 h-4 text-sky-500" /> Balita (0 - 5 Tahun)
                </span>
                <span className="font-semibold text-slate-800 dark:text-white">
                  {data.ageGroups.balita} Jiwa (
                  {data.totalJiwa > 0 ? Math.round((data.ageGroups.balita / data.totalJiwa) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${data.totalJiwa > 0 ? (data.ageGroups.balita / data.totalJiwa) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Anak & Remaja */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                  <Smile className="w-4 h-4 text-emerald-500" /> Anak & Pelajar (6 - 17 Tahun)
                </span>
                <span className="font-semibold text-slate-800 dark:text-white">
                  {data.ageGroups.anak} Jiwa (
                  {data.totalJiwa > 0 ? Math.round((data.ageGroups.anak / data.totalJiwa) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${data.totalJiwa > 0 ? (data.ageGroups.anak / data.totalJiwa) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Usia Produktif */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                  <Briefcase className="w-4 h-4 text-indigo-500" /> Usia Produktif & Kerja (18 - 59 Tahun)
                </span>
                <span className="font-semibold text-slate-800 dark:text-white">
                  {data.ageGroups.produktif} Jiwa (
                  {data.totalJiwa > 0 ? Math.round((data.ageGroups.produktif / data.totalJiwa) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${data.totalJiwa > 0 ? (data.ageGroups.produktif / data.totalJiwa) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Lansia */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                  <Heart className="w-4 h-4 text-purple-500" /> Lansia (60+ Tahun)
                </span>
                <span className="font-semibold text-slate-800 dark:text-white">
                  {data.ageGroups.lansia} Jiwa (
                  {data.totalJiwa > 0 ? Math.round((data.ageGroups.lansia / data.totalJiwa) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${data.totalJiwa > 0 ? (data.ageGroups.lansia / data.totalJiwa) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mutation Breakdown Cards */}
        <div className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Rekapitulasi Mutasi Penduduk</h3>
                <p className="text-xs text-slate-500">Peristiwa keluar, masuk, kelahiran, dan kematian</p>
              </div>
              <ArrowRightLeft className="w-5 h-5 text-amber-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Pindah Masuk */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  <UserPlus className="w-4 h-4" /> Pindah Masuk
                </div>
                <p className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-200 mt-2">
                  {data.mutations.pindahMasuk} <span className="text-xs font-normal">Jiwa</span>
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Warga baru bergabung</p>
              </div>

              {/* Pindah Keluar */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                  <UserMinus className="w-4 h-4" /> Pindah Keluar
                </div>
                <p className="text-2xl font-extrabold text-amber-800 dark:text-amber-200 mt-2">
                  {data.mutations.pindahKeluar} <span className="text-xs font-normal">Jiwa</span>
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">Pindah domisili luar</p>
              </div>

              {/* Kelahiran */}
              <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40">
                <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300 text-xs font-semibold">
                  <Baby className="w-4 h-4" /> Kelahiran
                </div>
                <p className="text-2xl font-extrabold text-sky-800 dark:text-sky-200 mt-2">
                  {data.mutations.lahir} <span className="text-xs font-normal">Bayi</span>
                </p>
                <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-0.5">Pertambahan keluarga</p>
              </div>

              {/* Wafat */}
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  <Heart className="w-4 h-4" /> Kematian / Wafat
                </div>
                <p className="text-2xl font-extrabold text-rose-800 dark:text-rose-200 mt-2">
                  {data.mutations.meninggal} <span className="text-xs font-normal">Jiwa</span>
                </p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">Tutup usia</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            Seluruh mutasi tercatat otomatis dan divalidasi oleh ketua RT setempat.
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Mutations Activity Table */}
      <div className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Log Riwayat Mutasi Kependudukan Terbaru
            </h3>
            <p className="text-xs text-slate-500">
              Daftar pencatatan mutasi warga yang telah diverifikasi oleh pengurus
            </p>
          </div>
          <Calendar className="w-5 h-5 text-slate-400" />
        </div>

        {data.recentMutations.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-sm text-slate-500">Belum ada catatan mutasi kependudukan di lingkungan ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">Nama Warga</th>
                  <th className="pb-3">Jenis Kelamin</th>
                  <th className="pb-3">Status Mutasi</th>
                  <th className="pb-3">Tanggal Efektif</th>
                  <th className="pb-3">Alamat Asal / Tujuan</th>
                  <th className="pb-3 pr-2">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.recentMutations.map((mut: any) => (
                  <tr key={mut.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 pl-2 font-semibold text-slate-800 dark:text-white">
                      {mut.fullName}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {mut.gender === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}
                    </td>
                    <td className="py-3">{getMutationBadge(mut.mutationStatus)}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {new Date(mut.mutationDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{mut.address}</td>
                    <td className="py-3 pr-2 text-slate-600 dark:text-slate-400 italic">
                      {mut.mutationNote}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

