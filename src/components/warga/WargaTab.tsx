"use client";

import React, { useState } from "react";
import {
  Users,
  Phone,
  MessageCircle,
  Siren,
  Home,
  Shield,
  HeartHandshake,
  Building,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles,
  Flame,
  Stethoscope,
  Zap,
  MapPin,
  ExternalLink,
} from "lucide-react";

export default function WargaTab() {
  const [viewMode, setViewMode] = useState<"BAGAN" | "DAFTAR">("BAGAN");
  const [selectedTupoksi, setSelectedTupoksi] = useState<string | null>(null);

  // Struktur Hierarki Organisasi RW 15 Komplek Giri Ciheulang
  const pimpinanRw = {
    name: "Budi Santoso",
    role: "Ketua RW 15",
    subrole: "Penanggung Jawab Wilayah & Kebijakan Lingkungan",
    phone: "081200000001",
    address: "Komplek Giri Ciheulang Blok A1 No. 01",
    tupoksi: "Memimpin penyelenggaraan urusan kerukunan warga, menjembatani hubungan dengan pemerintah desa/kelurahan, dan mengoordinasikan pelaksanaan program kerja seluruh RT di RW 15.",
  };

  const wakilRw = {
    name: "H. Rachmat Hidayat",
    role: "Wakil Ketua RW 15",
    subrole: "Membidangi Operasional & Pengawasan RT",
    phone: "081223344551",
    address: "Komplek Giri Ciheulang Blok A2 No. 05",
    tupoksi: "Membantu Ketua RW dalam pengawasan lapangan, perumusan kebijakan teknis, dan mewakili pimpinan saat berhalangan hadir.",
  };

  const sekretariatKeuangan = [
    {
      name: "Bambang Soedirman",
      role: "Sekretaris RW 15",
      subrole: "Administrasi & Persuratan Warga",
      phone: "081200000099",
      address: "Komplek Giri Ciheulang Blok A3 No. 12",
      tupoksi: "Pengelolaan surat pengantar, data sensus kependudukan, arsip BAST rollover, dan notulensi musyawarah warga.",
    },
    {
      name: "Ahmad Dahlan, S.E.",
      role: "Bendahara RW 15",
      subrole: "Pengelolaan Kas & Pembukuan",
      phone: "081200000088",
      address: "Komplek Giri Ciheulang Blok B1 No. 02",
      tupoksi: "Pencatatan buku kas RW, verifikasi pengajuan dana kegiatan RT, rekonsiliasi iuran lingkungan, dan laporan transparansi berkala.",
    },
  ];

  const seksiOperasional = [
    {
      name: "Sutisna & Regu Ronda",
      role: "Seksi Keamanan & Ketertiban",
      subrole: "Koordinator Satpam Gerbang & Portal",
      phone: "081200000099",
      address: "Pos Satpam Utama Gerbang Timur",
      icon: Shield,
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300",
      tupoksi: "Patroli ronda malam 24 jam, pengawasan portal masuk tamu, respon cepat sinyal darurat SOS, dan koordinasi Babinsa/Bhabinkamtibmas.",
    },
    {
      name: "Ir. Dedi Mulyadi",
      role: "Seksi Pembangunan & Sarpras",
      subrole: "Pemeliharaan CCTV & Fasilitas Umum",
      phone: "081311223344",
      address: "Komplek Giri Ciheulang Blok B3 No. 08",
      icon: Building,
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
      tupoksi: "Pemeliharaan lampu penerangan jalan, saluran drainase air hujan, perbaikan jalan paving, dan instalasi fasilitas publik warga.",
    },
    {
      name: "dr. Linda Permata",
      role: "Seksi Kesehatan & Posyandu",
      subrole: "Koordinator Posbindu & Bidan RW",
      phone: "081388884433",
      address: "Balai Warga RW 15 Giri Ciheulang",
      icon: Stethoscope,
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
      tupoksi: "Pemeriksaan kesehatan lansia berkala, penimbangan balita Posyandu, program sanitasi lingkungan, dan penanganan kegawatdaruratan warga.",
    },
    {
      name: "Cecep Supriatna",
      role: "Seksi Kebersihan & Lingkungan",
      subrole: "Pengangkutan Sampah & Drainase",
      phone: "081566778899",
      address: "Komplek Giri Ciheulang Blok C2 No. 10",
      icon: Sparkles,
      badgeColor: "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300",
      tupoksi: "Jadwal rit pengangkutan sampah, kerja bakti berkala, pemilahan bank sampah organik/anorganik, dan perawatan taman penghijauan.",
    },
    {
      name: "Rian Firmansyah",
      role: "Seksi Karang Taruna & Pemuda",
      subrole: "Kegiatan Olahraga & Kepemudaan",
      phone: "081788990011",
      address: "Komplek Giri Ciheulang Blok D1 No. 03",
      icon: Award,
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300",
      tupoksi: "Penyelenggaraan turnamen olahraga warga, kepanitiaan HUT RI, bakti sosial kepemudaan, dan digitalisasi media informasi warga.",
    },
  ];

  const jajaranRt = [
    {
      rt: "RT 01",
      name: "Drs. Agus Supriyadi",
      role: "Ketua RT 01",
      address: "Blok A1 - A4 (Warga 42 KK)",
      phone: "081211110001",
    },
    {
      rt: "RT 02",
      name: "Hendra Gunawan",
      role: "Ketua RT 02",
      address: "Blok B1 - B4 (Warga 38 KK)",
      phone: "081200000002",
    },
    {
      rt: "RT 03",
      name: "Iwan Setiawan",
      role: "Ketua RT 03",
      address: "Blok C1 - C4 (Warga 45 KK)",
      phone: "081233330003",
    },
    {
      rt: "RT 04",
      name: "Asep Hidayat",
      role: "Ketua RT 04",
      address: "Blok D1 - D3 (Warga 35 KK)",
      phone: "081244440004",
    },
  ];

  const layananDarurat = [
    {
      name: "Pos Keamanan / Ronda Satpam 24 Jam",
      category: "KAMTIBMAS KOMPLEK",
      phone: "081200000099",
      notes: "Gerbang Utama Komplek Giri Ciheulang • Siaga HT Channel 4",
      icon: Siren,
      color: "bg-rose-600 text-white",
      bgLight: "bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900",
      textColor: "text-rose-900 dark:text-rose-200",
    },
    {
      name: "Bripka Mulyadi (Bhabinkamtibmas)",
      category: "POLSEK CIPARAY",
      phone: "081299991122",
      notes: "Polsek Ciparay • Pembina Keamanan & Mediasi Wilayah",
      icon: Shield,
      color: "bg-blue-600 text-white",
      bgLight: "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900",
      textColor: "text-blue-900 dark:text-blue-200",
    },
    {
      name: "Posko Damkar Ciparay / Majalaya",
      category: "PEMADAM KEBAKARAN",
      phone: "0225950113",
      notes: "Penyelamatan & Pemadaman Kebakaran 24 Jam",
      icon: Flame,
      color: "bg-orange-600 text-white",
      bgLight: "bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-900",
      textColor: "text-orange-900 dark:text-orange-200",
    },
    {
      name: "Puskesmas DTP Ciparay & Bidan Siaga",
      category: "MEDIS & AMBULANS",
      phone: "0225950045",
      notes: "Layanan Gawat Darurat Medis & Ambulans Desa",
      icon: Stethoscope,
      color: "bg-emerald-600 text-white",
      bgLight: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900",
      textColor: "text-emerald-900 dark:text-emerald-200",
    },
    {
      name: "PLN Gangguan & Pelayanan Ciparay",
      category: "LISTRIK / SARPRAS",
      phone: "123",
      notes: "Kabel Putus, Trafo Meledak, & Pemadaman Tidak Terjadwal",
      icon: Zap,
      color: "bg-amber-600 text-white",
      bgLight: "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900",
      textColor: "text-amber-900 dark:text-amber-200",
    },
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white shadow-xl border border-emerald-500/20 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-semibold rounded-full uppercase tracking-wider">
                Struktur Kepengurusan & Direktori
              </span>
              <span className="text-xs text-slate-200 font-semibold">Resmi Periode Berjalan</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Bagan Organisasi RW 15 Komplek Giri Ciheulang
            </h1>
            <p className="text-xs md:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed font-medium">
              Kecamatan Ciparay, Kabupaten Bandung • Susunan pengurus lingkungan, pimpinan RT, koordinator seksi, dan layanan tanggap darurat 24 jam.
            </p>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-2xl border border-slate-700 self-start md:self-auto shrink-0">
            <button
              onClick={() => setViewMode("BAGAN")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "BAGAN"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/50"
                  : "text-slate-200 hover:text-white font-bold"
              }`}
            >
              Bagan Hirarki
            </button>
            <button
              onClick={() => setViewMode("DAFTAR")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "DAFTAR"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/50"
                  : "text-slate-200 hover:text-white font-bold"
              }`}
            >
              Daftar Kontak
            </button>
          </div>
        </div>
      </div>

      {/* QUICK EMERGENCY DIALER BOX */}
      <div className="p-5 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-rose-300/60 dark:border-rose-900/60 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-900/30 shrink-0">
              <Siren className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Pos Keamanan Utama Komplek Giri Ciheulang (24 Jam)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
                  SIAGA SOS
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold mt-0.5">
                Petugas Satpam & Ronda Gerbang Utama • Terhubung langsung dengan sirene darurat aplikasi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <a
              href="tel:081200000099"
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              <Phone className="w-4 h-4" /> Telepon Darurat
            </a>
            <a
              href="https://wa.me/6281200000099?text=Halo%20Pos%20Satpam%20Komplek%20Giri%20Ciheulang,%20saya%20butuh%20bantuan%20segera."
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: BAGAN ORGANISASI STRUKTURAL */}
      {viewMode === "BAGAN" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* LEVEL 1: PIMPINAN RW 15 */}
          <div className="space-y-4">
            <div className="text-center">
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
                Tingkat 1: Pimpinan Rukun Warga (RW 15)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {/* Ketua RW */}
              <div className="p-5 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-2 border-emerald-500 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white uppercase tracking-wider">
                        {pimpinanRw.role}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5">
                        {pimpinanRw.name}
                      </h3>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        {pimpinanRw.subrole}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-lg border border-emerald-300">
                      RW
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 font-bold dark:text-slate-200 mt-2 flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 shrink-0 text-slate-600" /> {pimpinanRw.address}
                  </p>

                  <p className="text-xs text-slate-800 font-medium dark:text-slate-200 mt-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed italic">
                    "{pimpinanRw.tupoksi}"
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <a
                    href={`https://wa.me/62${pimpinanRw.phone.slice(1)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Hubungi Ketua RW
                  </a>
                  <a
                    href={`tel:${pimpinanRw.phone}`}
                    className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Wakil Ketua RW */}
              <div className="p-5 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-800 text-slate-200 uppercase tracking-wider">
                        {wakilRw.role}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5">
                        {wakilRw.name}
                      </h3>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {wakilRw.subrole}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-center font-black text-lg border border-slate-300">
                      W.RW
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 font-bold dark:text-slate-200 mt-2 flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 shrink-0 text-slate-600" /> {wakilRw.address}
                  </p>

                  <p className="text-xs text-slate-800 font-medium dark:text-slate-200 mt-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed italic">
                    "{wakilRw.tupoksi}"
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <a
                    href={`https://wa.me/62${wakilRw.phone.slice(1)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Hubungi Wakil RW
                  </a>
                  <a
                    href={`tel:${wakilRw.phone}`}
                    className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* LEVEL 2: SEKRETARIAT & KEUANGAN RW */}
          <div className="space-y-4">
            <div className="text-center">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 rounded-full text-xs font-bold uppercase tracking-wider">
                Tingkat 2: Sekretariat & Manajemen Keuangan RW 15
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {sekretariatKeuangan.map((officer, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200">
                          {officer.role}
                        </span>
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white mt-1">
                          {officer.name}
                        </h4>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {officer.subrole}
                        </p>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold text-xs">
                        {officer.role.includes("Sekretaris") ? "SEK" : "BEN"}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 font-bold mt-2 flex items-center gap-1">
                      <Home className="w-3.5 h-3.5 text-slate-600" /> {officer.address}
                    </p>

                    <p className="text-xs text-slate-800 font-medium dark:text-slate-200 mt-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] leading-relaxed">
                      {officer.tupoksi}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <a
                      href={`https://wa.me/62${officer.phone.slice(1)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                    <a
                      href={`tel:${officer.phone}`}
                      className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LEVEL 3: SEKSI-SEKSI OPERASIONAL LINGKUNGAN */}
          <div className="space-y-4">
            <div className="text-center">
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 rounded-full text-xs font-bold uppercase tracking-wider">
                Tingkat 3: Koordinator Seksi Pelayanan Lingkungan RW 15
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {seksiOperasional.map((seksi, idx) => {
                const IconComponent = seksi.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-md flex flex-col justify-between hover:border-emerald-300 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${seksi.badgeColor}`}>
                          {seksi.role}
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-center shrink-0">
                          <IconComponent className="w-4 h-4" />
                        </div>
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-2">
                        {seksi.name}
                      </h4>
                      <p className="text-xs text-slate-800 font-bold">{seksi.subrole}</p>

                      <p className="text-xs text-slate-700 font-bold mt-2 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" /> {seksi.address}
                      </p>

                      <p className="text-[11px] text-slate-800 font-medium dark:text-slate-200 mt-2 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                        {seksi.tupoksi}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <a
                        href={`https://wa.me/62${seksi.phone.slice(1)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Hubungi
                      </a>
                      <a
                        href={`tel:${seksi.phone}`}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                        title="Telepon"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LEVEL 4: JAJARAN RUKUN TETANGGA (RT BINAAN RW 15) */}
          <div className="space-y-4">
            <div className="text-center">
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 rounded-full text-xs font-bold uppercase tracking-wider">
                Tingkat 4: Jajaran Rukun Tetangga (RT 01 s/d RT 04)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {jajaranRt.map((rt, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border shadow-sm flex flex-col justify-between ${
                    rt.rt === "RT 02"
                      ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                      : "border-slate-200/90 dark:border-slate-800"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-600 text-white">
                        {rt.rt}
                      </span>
                      {rt.rt === "RT 02" && (
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">
                          RT Anda
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2">
                      {rt.name}
                    </h4>
                    <p className="text-xs text-slate-800 font-bold mt-0.5">{rt.role}</p>
                    <p className="text-[11px] text-slate-700 font-semibold mt-1 flex items-center gap-1">
                      <Home className="w-3 h-3 text-slate-600 shrink-0" /> {rt.address}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                    <a
                      href={`https://wa.me/62${rt.phone.slice(1)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold text-center flex items-center justify-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </a>
                    <a
                      href={`tel:${rt.phone}`}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      <Phone className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LEVEL 5: DAFTAR LAYANAN DARURAT & TANGGAP BENCANA */}
          <div className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-rose-800 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
                <Siren className="w-4 h-4 text-rose-600 animate-pulse" />
                Layanan Tanggap Darurat & Fast Response Wilayah Ciparay
              </h3>
              <p className="text-xs text-slate-700 font-medium">
                Kontak siaga keamanan, mediasi kepolisian, ambulans, pemadam kebakaran, dan darurat kelistrikan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {layananDarurat.map((layanan, idx) => {
                const IconComp = layanan.icon;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-3xl border shadow-sm flex flex-col justify-between ${layanan.bgLight}`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                          {layanan.category}
                        </span>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${layanan.color}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                      </div>

                      <h4 className={`font-extrabold text-sm mt-1.5 ${layanan.textColor}`}>
                        {layanan.name}
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-200 font-medium mt-1 leading-relaxed">
                        {layanan.notes}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                      <a
                        href={`tel:${layanan.phone}`}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" /> Panggil: {layanan.phone}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: DAFTAR KONTAK CEPAT (DIREKTORI TABLE/CARDS) */}
      {viewMode === "DAFTAR" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Menampilkan seluruh kontak pengurus RW 15 Giri Ciheulang & kontak darurat
            </span>
            <span className="text-xs font-bold text-emerald-600">Total 15 Kontak Siaga</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Pimpinan & Sekretariat */}
            {[pimpinanRw, wakilRw, ...sekretariatKeuangan, ...seksiOperasional, ...jajaranRt].map((person: any, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                      {person.role}
                    </span>
                    <span className="text-[11px] font-mono text-slate-700 font-bold">{person.phone}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2">
                    {person.name}
                  </h4>
                  <p className="text-xs text-slate-700 font-medium flex items-center gap-1 mt-1">
                    <Home className="w-3.5 h-3.5 text-slate-600 shrink-0" /> {person.address}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <a
                    href={`https://wa.me/62${person.phone.slice(1)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                  <a
                    href={`tel:${person.phone}`}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
