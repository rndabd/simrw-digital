"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
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
  Award,
  Sparkles,
  Flame,
  Stethoscope,
  Zap,
  MapPin,
  Plus,
  X,
  AlertTriangle,
  CheckCircle2,
  LifeBuoy,
} from "lucide-react";

interface WargaTabProps {
  initialTab?: "BAGAN" | "KONTAK" | "DARURAT";
}

export default function WargaTab({ initialTab = "BAGAN" }: WargaTabProps) {
  const [activeTab, setActiveTab] = useState<"BAGAN" | "KONTAK" | "DARURAT">(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Dynamic Officer Structure State (Menghubungkan ke database riil SIM-RW)
  const [structureData, setStructureData] = useState<any>(null);
  const [isLoadingStructure, setIsLoadingStructure] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStructure = async () => {
      try {
        const res = await fetch("/api/v1/officer/structure");
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setStructureData(json.data);
        }
      } catch (err) {
        console.error("Gagal memuat struktur pengurus:", err);
      } finally {
        if (isMounted) setIsLoadingStructure(false);
      }
    };
    fetchStructure();
    return () => {
      isMounted = false;
    };
  }, []);

  const rwInfo = structureData?.rw;
  const pimpinanRw = structureData?.pimpinanRw;
  const wakilRw = structureData?.wakilRw;
  const sekretariatKeuangan = structureData?.sekretariatKeuangan || [];
  const seksiOperasional = structureData?.seksiOperasional || [];
  const jajaranRt = structureData?.jajaranRt || [];
  const allContacts = structureData?.allContacts || [];

  const getSeksiIcon = (iconType: string) => {
    switch (iconType) {
      case "SHIELD":
        return Shield;
      case "BUILDING":
        return Building;
      case "STETHOSCOPE":
        return Stethoscope;
      case "SPARKLES":
        return Sparkles;
      case "AWARD":
        return Award;
      case "HEART":
        return HeartHandshake;
      default:
        return Shield;
    }
  };

  const { user } = useAuth();
  const isOfficer = user?.isOfficer || user?.isSuperAdmin;

  // 1. Nomor Darurat Nasional di Indonesia
  const nomorDaruratNasional = [
    {
      number: "112",
      name: "Layanan Panggilan Darurat Terintegrasi (NTE 112)",
      desc: "Layanan panggilan darurat terintegrasi (gratis, 24 jam, dapat diakses meski ponsel terkunci)",
      badge: "BEBAS PULSA • 24 JAM",
      icon: Siren,
      color: "bg-red-600 text-white",
      bgLight: "bg-red-50/95 dark:bg-red-950/40 border-red-300 dark:border-red-800",
      textColor: "text-red-950 dark:text-red-100",
      dials: [{ label: "Panggil 112", tel: "112" }],
    },
    {
      number: "110",
      name: "Kepolisian Republik Indonesia (Polri)",
      desc: "Layanan kepolisian, penindakan kriminalitas, pengaduan gangguan keamanan & kamtibmas",
      badge: "POLRI • 24 JAM",
      icon: Shield,
      color: "bg-blue-600 text-white",
      bgLight: "bg-blue-50/95 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800",
      textColor: "text-blue-950 dark:text-blue-100",
      dials: [{ label: "Panggil 110", tel: "110" }],
    },
    {
      number: "113",
      altNumber: "022-113",
      name: "Pemadam Kebakaran (Damkar)",
      desc: "Pencegahan & pemadaman kebakaran, penyelamatan korban darurat, dan evakuasi satwa/sarang tawon",
      badge: "DAMKAR • 24 JAM",
      icon: Flame,
      color: "bg-orange-600 text-white",
      bgLight: "bg-orange-50/95 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800",
      textColor: "text-orange-950 dark:text-orange-100",
      dials: [
        { label: "Panggil 113", tel: "113" },
        { label: "022-113", tel: "022113" },
      ],
    },
    {
      number: "118 / 119",
      altNumber: "119",
      name: "Ambulans dan Layanan Darurat Medis",
      desc: "Pertolongan pertama gawat darurat medis, penjemputan armada ambulans, dan rujukan IGD rumah sakit",
      badge: "MEDIS • 24 JAM",
      icon: Stethoscope,
      color: "bg-emerald-600 text-white",
      bgLight: "bg-emerald-50/95 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800",
      textColor: "text-emerald-950 dark:text-emerald-100",
      dials: [
        { label: "118 (PMI)", tel: "118" },
        { label: "119 (Kemenkes)", tel: "119" },
      ],
    },
    {
      number: "115",
      name: "Badan Nasional Pencarian dan Pertolongan (BASARNAS / SAR)",
      desc: "Operasi pencarian dan penyelamatan musibah kecelakaan, orang hilang/hanyut & tanggap bencana",
      badge: "BASARNAS • 24 JAM",
      icon: LifeBuoy,
      color: "bg-amber-600 text-white",
      bgLight: "bg-amber-50/95 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800",
      textColor: "text-amber-950 dark:text-amber-100",
      dials: [{ label: "Panggil 115", tel: "115" }],
    },
    {
      number: "123",
      altNumber: "022-123",
      name: "PLN (Gangguan dan kerusakan listrik)",
      desc: "Kabel putus, korsleting tegangan tinggi, trafo meledak, bahaya sengatan & pemadaman listrik",
      badge: "PLN 123 • 24 JAM",
      icon: Zap,
      color: "bg-yellow-600 text-white",
      bgLight: "bg-yellow-50/95 dark:bg-yellow-950/40 border-yellow-300 dark:border-yellow-800",
      textColor: "text-yellow-950 dark:text-yellow-100",
      dials: [
        { label: "Panggil 123", tel: "123" },
        { label: "022-123", tel: "022123" },
      ],
    },
    {
      number: "129",
      name: "Posko Bencana Alam",
      desc: "Pusdalops penanggulangan bencana alam, peringatan dini, evakuasi banjir, tanah longsor, dan gempa bumi",
      badge: "BNPB / BPBD • 24 JAM",
      icon: AlertTriangle,
      color: "bg-rose-600 text-white",
      bgLight: "bg-rose-50/95 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800",
      textColor: "text-rose-950 dark:text-rose-100",
      dials: [{ label: "Panggil 129", tel: "129" }],
    },
  ];

  // 2. Instansi Tanggap Darurat Wilayah Ciparay & Kab. Bandung
  const layananDaruratWajib = [
    {
      name: "Ambulans Siaga & Puskesmas DTP Ciparay",
      category: "MEDIS & AMBULANS",
      phone: "0225950045",
      altPhone: "119",
      notes: "Pelayanan Medis Darurat 24 Jam, Bidan Siaga & Rujukan Ambulans Kecamatan",
      icon: Stethoscope,
      color: "bg-emerald-600 text-white",
      bgLight: "bg-emerald-50/95 border-emerald-300 dark:bg-emerald-950/40",
      textColor: "text-emerald-950 dark:text-emerald-100",
    },
    {
      name: "Polsek Ciparay (SPKT Siaga 24 Jam)",
      category: "KEPOLISIAN / KAMTIBMAS",
      phone: "0225950110",
      altPhone: "110",
      notes: "Pengaduan Kriminalitas, Penindakan Keamanan, Mediasi & Call Center 110",
      icon: Shield,
      color: "bg-blue-600 text-white",
      bgLight: "bg-blue-50/95 border-blue-300 dark:bg-blue-950/40",
      textColor: "text-blue-950 dark:text-blue-100",
    },
    {
      name: "Bhabinkamtibmas Polsek Setempat",
      category: "BHABINKAMTIBMAS POLRI",
      phone: "110",
      notes: "Pembina Kamtibmas Wilayah & Kemitraan Kepolisian",
      icon: UserCheck,
      color: "bg-indigo-600 text-white",
      bgLight: "bg-indigo-50/95 border-indigo-300 dark:bg-indigo-950/40",
      textColor: "text-indigo-950 dark:text-indigo-100",
    },
    {
      name: "Pemadam Kebakaran Pos Ciparay / Majalaya",
      category: "PEMADAM KEBAKARAN (DAMKAR)",
      phone: "0225950113",
      altPhone: "113",
      notes: "Diskar PB: Penyelamatan Api, Evakuasi Satwa Berbahaya & Bencana Darurat",
      icon: Flame,
      color: "bg-orange-600 text-white",
      bgLight: "bg-orange-50/95 border-orange-300 dark:bg-orange-950/40",
      textColor: "text-orange-950 dark:text-orange-100",
    },
    {
      name: "PLN Gangguan & Bahaya Listrik Ciparay",
      category: "GANGGUAN LISTRIK",
      phone: "123",
      altPhone: "022123",
      notes: "Kabel Putus, Trafo Meledak, Korsleting Bahaya & Padam Tidak Terjadwal",
      icon: Zap,
      color: "bg-amber-600 text-white",
      bgLight: "bg-amber-50/95 border-amber-300 dark:bg-amber-950/40",
      textColor: "text-amber-950 dark:text-amber-100",
    },
    {
      name: "Koramil 2408/Ciparay & Babinsa (TNI AD)",
      category: "BABINSA KORAMIL",
      phone: "0225950220",
      notes: "Mitra Kamtibmas Teritorial & Bantuan Tanggap Bencana Koramil Ciparay",
      icon: Shield,
      color: "bg-teal-600 text-white",
      bgLight: "bg-teal-50/95 border-teal-300 dark:bg-teal-950/40",
      textColor: "text-teal-950 dark:text-teal-100",
    },
    {
      name: "BPBD Kab. Bandung (Pusdalops Bencana)",
      category: "TANGGAP BENCANA BPBD",
      phone: "02285872525",
      notes: "Penanganan Bencana Banjir, Tanah Longsor, Pohon Tumbang & Cuaca Ekstrem",
      icon: AlertTriangle,
      color: "bg-red-600 text-white",
      bgLight: "bg-red-50/95 border-red-300 dark:bg-red-950/40",
      textColor: "text-red-950 dark:text-red-100",
    },
  ];

  // 3. Kontak Siaga Internal Tambahan RW 15 (Additional Pengurus RW)
  const defaultInternalRw: any[] = [];

  const [customContacts, setCustomContacts] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactCategory, setNewContactCategory] = useState("KAMTIBMAS RW");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactNotes, setNewContactNotes] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("simrw_custom_emergency_contacts");
      if (saved) {
        setCustomContacts(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const handleAddCustomContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;

    const newContact = {
      id: "custom-" + Date.now(),
      name: newContactName,
      category: newContactCategory,
      phone: newContactPhone,
      notes: newContactNotes || "Kontak Siaga Tambahan Pengurus RW 15",
      icon: Phone,
      color: "bg-indigo-600 text-white",
      bgLight: "bg-indigo-50/95 border-indigo-300 dark:bg-indigo-950/40",
      textColor: "text-indigo-950 dark:text-indigo-100",
    };

    const updated = [...customContacts, newContact];
    setCustomContacts(updated);
    try {
      localStorage.setItem("simrw_custom_emergency_contacts", JSON.stringify(updated));
    } catch {}

    setNewContactName("");
    setNewContactPhone("");
    setNewContactNotes("");
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Banner Navigation Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-700/80 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold rounded-full uppercase tracking-wider">
                {rwInfo?.number ? `RW ${rwInfo.number} ${rwInfo.village || ""}` : "RW Lingkungan Warga"}
              </span>
              <span className="text-xs text-slate-300 font-semibold">{rwInfo?.district ? `Kecamatan ${rwInfo.district}, ${rwInfo.city || ""}` : "Wilayah Resmi Lingkungan Setempat"}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Bagan Organisasi, Kontak & Layanan Tanggap Darurat
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-medium">
              Akses cepat terpisah untuk struktur kepengurusan RW/RT, direktori telepon pengurus, serta kontak darurat nasional & wilayah Ciparay.
            </p>
          </div>

          {/* 3 Dedicated Segmented Tabs (Bagan Organisasi vs Kontak Pengurus vs Tanggap Darurat) */}
          <div className="flex flex-wrap sm:flex-nowrap items-center bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700 gap-1.5 self-start lg:self-auto shrink-0 shadow-inner">
            <button
              onClick={() => setActiveTab("BAGAN")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "BAGAN"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/50"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Bagan Organisasi</span>
            </button>
            <button
              onClick={() => setActiveTab("KONTAK")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "KONTAK"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/50"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>Kontak Pengurus</span>
            </button>
            <button
              onClick={() => setActiveTab("DARURAT")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "DARURAT"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-900/50"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Siren className="w-3.5 h-3.5 shrink-0 animate-pulse" />
              <span>Tanggap Darurat</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: BAGAN ORGANISASI (HANYA STRUKTUR HIERARKI RW/RT TANPA KONTAK DARURAT) */}
      {/* ========================================================================= */}
      {activeTab === "BAGAN" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="p-4 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Bagan Struktur Resmi Kepengurusan RW {rwInfo?.number || ""} {rwInfo?.village || ""} (Periode {rwInfo?.termPeriod || "Berjalan"})
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {jajaranRt.length > 0 ? `RW ${rwInfo?.number || ""} • ${jajaranRt.length} Unit RT` : "Struktur Organisasi"}
            </span>
          </div>

          {/* LEVEL 1: PIMPINAN RW */}
          <div className="space-y-3">
            <div className="text-center">
              <span className="px-3.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded-full text-xs font-black uppercase tracking-wider">
                Tingkat 1: Pimpinan Rukun Warga (RW {rwInfo?.number || ""})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {/* Ketua RW */}
              <div className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border-2 border-emerald-500 shadow-lg relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white uppercase tracking-wider">
                        {pimpinanRw ? pimpinanRw.role : `Ketua RW ${rwInfo?.number || ""}`}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1.5">
                        {pimpinanRw ? pimpinanRw.name : "(Belum Terisi / Menunggu Pendaftaran)"}
                      </h3>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {pimpinanRw ? pimpinanRw.subrole : "Penanggung Jawab Wilayah & Kebijakan Lingkungan"}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg border border-emerald-300">
                      RW
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 font-bold dark:text-slate-300 mt-2 flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 shrink-0 text-slate-600" /> {pimpinanRw?.address || (rwInfo?.number ? `Kantor Sekretariat RW ${rwInfo.number}` : "Kantor Sekretariat RW")}
                  </p>

                  <p className="text-xs text-slate-800 font-medium dark:text-slate-300 mt-2.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 leading-relaxed italic">
                    "{pimpinanRw?.tupoksi || "Memimpin penyelenggaraan urusan kerukunan warga, menjembatani hubungan dengan pemerintah desa/kelurahan, dan mengoordinasikan pelaksanaan program kerja seluruh RT."}"
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  {pimpinanRw && pimpinanRw.phone ? (
                    <>
                      <a
                        href={`https://wa.me/62${pimpinanRw.phone.replace(/^0+/, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Ketua RW
                      </a>
                      <a
                        href={`tel:${pimpinanRw.phone}`}
                        className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1"
                        title="Telepon Langsung"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </>
                  ) : (
                    <span className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold text-center">
                      Posisi Belum Terisi
                    </span>
                  )}
                </div>
              </div>

              {/* Wakil Ketua RW */}
              <div className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-white uppercase tracking-wider">
                        {wakilRw ? wakilRw.role : `Wakil Ketua RW ${rwInfo?.number || ""}`}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1.5">
                        {wakilRw ? wakilRw.name : "(Belum Terisi / Menunggu Pendaftaran)"}
                      </h3>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {wakilRw ? wakilRw.subrole : "Membidangi Operasional & Pengawasan RT"}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-black text-lg border border-slate-300">
                      W.RW
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 font-bold dark:text-slate-300 mt-2 flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 shrink-0 text-slate-600" /> {wakilRw?.address || (rwInfo?.number ? `Kantor Sekretariat RW ${rwInfo.number}` : "Kantor Sekretariat RW")}
                  </p>

                  <p className="text-xs text-slate-800 font-medium dark:text-slate-300 mt-2.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 leading-relaxed italic">
                    "{wakilRw?.tupoksi || "Membantu Ketua RW dalam pengawasan lapangan, perumusan kebijakan teknis, dan mewakili pimpinan saat berhalangan hadir."}"
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  {wakilRw && wakilRw.phone ? (
                    <>
                      <a
                        href={`https://wa.me/62${wakilRw.phone.replace(/^0+/, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Wakil RW
                      </a>
                      <a
                        href={`tel:${wakilRw.phone}`}
                        className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1"
                        title="Telepon Langsung"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </>
                  ) : (
                    <span className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold text-center">
                      Posisi Belum Terisi
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* LEVEL 2: SEKRETARIAT & KEUANGAN RW */}
          <div className="space-y-3">
            <div className="text-center">
              <span className="px-3.5 py-1 bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-800 rounded-full text-xs font-black uppercase tracking-wider">
                Tingkat 2: Sekretariat & Manajemen Keuangan RW {rwInfo?.number || ""}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {sekretariatKeuangan.map((item: any, idx: number) => {
                const isFilled = !!item.officer;
                const officerName = isFilled ? item.officer.name : "(Belum Terisi / Menunggu Pendaftaran)";
                const officerRole = isFilled ? item.officer.role : item.defaultRole;
                const officerSubrole = isFilled ? item.officer.subrole : item.defaultSubrole;
                const officerAddress = isFilled ? item.officer.address : (rwInfo?.number ? `Kantor Sekretariat RW ${rwInfo.number}` : "Kantor Sekretariat RW");
                const officerPhone = isFilled ? item.officer.phone : "";

                return (
                  <div
                    key={idx}
                    className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            {officerRole}
                          </span>
                          <h4 className="font-black text-base text-slate-900 dark:text-white mt-1">
                            {officerName}
                          </h4>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {officerSubrole}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-black text-xs border border-blue-200">
                          {item.roleKey.includes("SECRETARY") ? "SEK" : "BEN"}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 font-bold mt-2 flex items-center gap-1">
                        <Home className="w-3.5 h-3.5 text-slate-600" /> {officerAddress}
                      </p>

                      <p className="text-xs text-slate-800 font-medium dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] leading-relaxed">
                        {item.tupoksi}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      {isFilled && officerPhone ? (
                        <>
                          <a
                            href={`https://wa.me/62${officerPhone.replace(/^0+/, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                          <a
                            href={`tel:${officerPhone}`}
                            className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center"
                            title="Telepon"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </>
                      ) : (
                        <span className="w-full py-1.5 px-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold text-center">
                          Posisi Belum Terisi
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LEVEL 3: SEKSI-SEKSI OPERASIONAL LINGKUNGAN */}
          <div className="space-y-3">
            <div className="text-center">
              <span className="px-3.5 py-1 bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-800 rounded-full text-xs font-black uppercase tracking-wider">
                Tingkat 3: Koordinator Seksi Pelayanan Lingkungan RW {rwInfo?.number || "15"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {seksiOperasional.map((seksi: any, idx: number) => {
                const IconComponent = getSeksiIcon(seksi.iconType);
                const isFilled = !!seksi.officer;
                const officerName = isFilled ? seksi.officer.name : "(Belum Terisi / Menunggu Pendaftaran)";
                const officerAddress = isFilled ? seksi.officer.address : `Balai Warga RW ${rwInfo?.number || "15"}`;
                const officerPhone = isFilled ? seksi.officer.phone : "";

                return (
                  <div
                    key={idx}
                    className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between hover:border-emerald-300 transition"
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

                      <h4 className="font-black text-sm text-slate-900 dark:text-white mt-2">
                        {officerName}
                      </h4>
                      <p className="text-xs text-slate-700 font-bold dark:text-slate-300">{seksi.subrole}</p>

                      <p className="text-xs text-slate-700 font-bold mt-2 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" /> {officerAddress}
                      </p>

                      <p className="text-[11px] text-slate-800 font-medium dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                        {seksi.tupoksi}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      {isFilled && officerPhone ? (
                        <>
                          <a
                            href={`https://wa.me/62${officerPhone.replace(/^0+/, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                          <a
                            href={`tel:${officerPhone}`}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                            title="Telepon"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </>
                      ) : (
                        <span className="w-full py-1.5 px-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold text-center">
                          Posisi Belum Terisi
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LEVEL 4: JAJARAN RUKUN TETANGGA */}
          <div className="space-y-3">
            <div className="text-center">
              <span className="px-3.5 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800 rounded-full text-xs font-black uppercase tracking-wider">
                Tingkat 4: Jajaran Rukun Tetangga (RT)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {jajaranRt.length === 0 ? (
                <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs font-bold">
                  Belum ada satuan unit RT terdaftar pada RW ini.
                </div>
              ) : (
                jajaranRt.map((rt: any, idx: number) => {
                  const isFilled = !!rt.chair;
                  const chairName = isFilled ? rt.chair.name : "(Belum ada Ketua RT)";
                  const chairAddress = isFilled ? rt.chair.address : `Wilayah ${rt.rtTitle}`;
                  const chairPhone = isFilled ? rt.chair.phone : "";
                  const isUserRt = user?.rt?.number === rt.rtNumber;

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 border shadow-sm flex flex-col justify-between ${
                        isUserRt
                          ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-600 text-white">
                            {rt.rtTitle}
                          </span>
                          {isUserRt && (
                            <span className="text-[10px] font-bold text-emerald-600 uppercase">
                              RT Anda
                            </span>
                          )}
                        </div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white mt-2">
                          {chairName}
                        </h4>
                        <p className="text-xs text-slate-700 font-bold dark:text-slate-300 mt-0.5">
                          Ketua {rt.rtTitle}
                        </p>
                        <p className="text-[11px] text-slate-700 font-semibold mt-1 flex items-center gap-1">
                          <Home className="w-3 h-3 text-slate-600 shrink-0" /> {chairAddress}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                        {isFilled && chairPhone ? (
                          <>
                            <a
                              href={`https://wa.me/62${chairPhone.replace(/^0+/, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold text-center flex items-center justify-center gap-1"
                            >
                              <MessageCircle className="w-3 h-3" /> WhatsApp
                            </a>
                            <a
                              href={`tel:${chairPhone}`}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                              title="Telepon"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                          </>
                        ) : (
                          <span className="w-full py-1.5 px-2 rounded-xl bg-slate-100 text-slate-400 text-[11px] font-bold text-center">
                            Belum Terdaftar
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: KONTAK PENGURUS (DIREKTORI LENGKAP PENGURUS TANPA DARURAT) */}
      {/* ========================================================================= */}
      {activeTab === "KONTAK" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="p-4 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Direktori Resmi Kontak & WhatsApp Pengurus Lingkungan RW {rwInfo?.number || ""} {rwInfo?.village || ""}
            </span>
            <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Total {allContacts.length} Pengurus Terdaftar
            </span>
          </div>

          {allContacts.length === 0 ? (
            <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Users className="w-8 h-8" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm">
                Belum Ada Pengurus Terdaftar
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Saat ini belum ada pengurus RW atau RT yang terdaftar dan disahkan untuk wilayah ini. Kontak akan muncul secara otomatis setelah pengurus mendaftar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allContacts.map((person: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200">
                        {person.role}
                      </span>
                      {person.phone && (
                        <span className="text-[11px] font-mono text-slate-900 dark:text-slate-100 font-black">
                          {person.phone}
                        </span>
                      )}
                    </div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white mt-2">
                      {person.name}
                    </h4>
                    <p className="text-xs text-slate-700 font-bold dark:text-slate-300 mt-0.5">
                      {person.subrole || person.role}
                    </p>
                    {person.address && (
                      <p className="text-xs text-slate-600 font-medium flex items-center gap-1 mt-1.5">
                        <Home className="w-3.5 h-3.5 text-slate-500 shrink-0" /> {person.address}
                      </p>
                    )}
                  </div>

                  {person.phone && (
                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <a
                        href={`https://wa.me/62${person.phone.replace(/^0+/, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                      <a
                        href={`tel:${person.phone}`}
                        className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center transition"
                        title="Telepon Langsung"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: TANGGAP DARURAT (DEDICATED FAST RESPONSE SECTION) */}
      {/* ========================================================================= */}
      {activeTab === "DARURAT" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Title Card with Guaranteed High Contrast & Legibility */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 text-white border-2 border-rose-500 shadow-xl space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Siren className="w-5 h-5 animate-pulse text-white" />
                </span>
                <span className="text-white drop-shadow-sm">Layanan Tanggap Darurat & Fast Response</span>
              </h2>
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-rose-600 text-white border border-rose-400 shrink-0">
                🚨 SIAGA 24 JAM
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
              Daftar resmi nomor panggilan darurat nasional Indonesia, instansi tanggap darurat wilayah Ciparay & Kab. Bandung, serta kontak siaga satpam internal RW 15.
            </p>
          </div>

          {/* Quick Satpam Internal RW Dialer Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border-2 border-rose-400 dark:border-rose-800 shadow-lg relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-900/30 shrink-0">
                  <Siren className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {pimpinanRw?.name ? `Pusat Siaga & Koordinasi Darurat RW ${rwInfo?.number || ""}` : "Pusat Layanan & Panggilan Darurat"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      SIAGA DARURAT
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold mt-0.5">
                    {pimpinanRw?.name
                      ? `Terhubung langsung dengan Ketua RW (${pimpinanRw.name}) dan aparat siaga lingkungan`
                      : "Gunakan saluran darurat terpadu atau hubungi layanan darurat nasional 112"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {pimpinanRw?.phone ? (
                  <>
                    <a
                      href={`tel:${pimpinanRw.phone}`}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black shadow-md transition-all flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4" /> Telepon: {pimpinanRw.phone}
                    </a>
                    <a
                      href={`https://wa.me/62${pimpinanRw.phone.replace(/^0+/, "")}?text=Halo%20Ketua%20RW,%20saya%20butuh%20bantuan%20darurat.`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </a>
                  </>
                ) : (
                  <a
                    href="tel:112"
                    className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black shadow-md transition-all flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" /> Panggil Darurat 112
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SUB-SECTION 1: NOMOR DARURAT NASIONAL DI INDONESIA */}
          {/* ========================================================= */}
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-700 flex flex-wrap items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-red-600 text-white font-black text-xs shadow-xs">
                  1. Nomor Darurat Nasional di Indonesia
                </span>
                <span className="text-xs text-slate-200 font-semibold hidden sm:inline">
                  Panggilan Darurat Bebas Pulsa (Dapat dihubungi saat ponsel terkunci)
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-300">
                7 Layanan Resmi Nasional
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nomorDaruratNasional.map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-3xl border-2 shadow-sm flex flex-col justify-between ${item.bgLight}`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-800 bg-white/95 border border-slate-300 shadow-2xs">
                          {item.badge}
                        </span>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.color} shadow-xs`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-baseline gap-2">
                        <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                          {item.number}
                        </span>
                        {item.altNumber && (
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            atau {item.altNumber}
                          </span>
                        )}
                      </div>

                      <h4 className={`font-black text-sm mt-1 leading-snug ${item.textColor}`}>
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium mt-1.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-300/80 dark:border-slate-700 flex flex-wrap items-center gap-2">
                      {item.dials.map((dial, dIdx) => (
                        <a
                          key={dIdx}
                          href={`tel:${dial.tel}`}
                          className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black flex items-center justify-center gap-1.5 transition shadow-xs text-center"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{dial.label}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================= */}
          {/* SUB-SECTION 2: INSTANSI DARURAT WILAYAH CIPARAY & KAB. BANDUNG */}
          {/* ========================================================= */}
          <div className="space-y-3.5 pt-4">
            <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-700 flex flex-wrap items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-blue-600 text-white font-black text-xs shadow-xs">
                  2. Instansi Tanggap Darurat Wilayah Ciparay
                </span>
                <span className="text-xs text-slate-200 font-semibold hidden sm:inline">
                  Fasilitas Medis, SPKT Polsek, Koramil & Damkar Terdekat
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-300">
                {layananDaruratWajib.length} Instansi Terintegrasi
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {layananDaruratWajib.map((layanan, idx) => {
                const IconComp = layanan.icon;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-3xl border-2 shadow-sm flex flex-col justify-between ${layanan.bgLight}`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 bg-white/95 px-2.5 py-0.5 rounded-full border border-slate-300">
                          {layanan.category}
                        </span>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${layanan.color} shadow-xs`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                      </div>

                      <h4 className={`font-black text-sm mt-2.5 ${layanan.textColor}`}>
                        {layanan.name}
                      </h4>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium mt-1 leading-relaxed">
                        {layanan.notes}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-300/80 dark:border-slate-700 flex items-center gap-2">
                      <a
                        href={`tel:${layanan.phone}`}
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black flex items-center justify-center gap-1.5 transition shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" /> Panggil: {layanan.phone}
                      </a>
                      {layanan.altPhone && (
                        <a
                          href={`tel:${layanan.altPhone}`}
                          className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-black flex items-center justify-center gap-1 transition shadow-xs"
                          title={`Dial: ${layanan.altPhone}`}
                        >
                          <span>{layanan.altPhone}</span>
                        </a>
                      )}
                      {layanan.phone.startsWith("08") && (
                        <a
                          href={`https://wa.me/62${layanan.phone.slice(1)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center transition shadow-xs"
                          title="Hubungi via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================= */}
          {/* SUB-SECTION 3: KONTAK SIAGA INTERNAL TAMBAHAN RW 15 */}
          {/* ========================================================= */}
          <div className="space-y-3.5 pt-4">
            <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-700 flex flex-wrap items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-xs">
                  3. Kontak Siaga Internal Tambahan RW {rwInfo?.number || ""}
                </span>
                <span className="text-xs text-slate-200 font-semibold hidden sm:inline">
                  Satpam, Trantib & Satgas Lingkungan Setempat
                </span>
              </div>
              {isOfficer && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Kontak RW</span>
                </button>
              )}
            </div>

            {[...defaultInternalRw, ...customContacts].length === 0 ? (
              <div className="p-8 bg-white/95 dark:bg-slate-900/95 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto border border-slate-200 dark:border-slate-700">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="text-sm font-extrabold text-slate-800 dark:text-white">
                  Belum Ada Kontak Internal Khusus
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Pengurus RW dapat mendaftarkan nomor telepon pos satpam, koordinator siskamling, atau narahubung darurat khusus melalui tombol di atas.
                </p>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...defaultInternalRw, ...customContacts].map((layanan: any, idx) => {
                const IconComp = layanan.icon || Phone;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-3xl border-2 shadow-sm flex flex-col justify-between ${layanan.bgLight}`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 bg-white/95 px-2.5 py-0.5 rounded-full border border-slate-300">
                          {layanan.category}
                        </span>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${layanan.color} shadow-xs`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                      </div>

                      <h4 className={`font-black text-sm mt-2.5 ${layanan.textColor}`}>
                        {layanan.name}
                      </h4>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium mt-1 leading-relaxed">
                        {layanan.notes}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-300/80 dark:border-slate-700 flex items-center gap-2">
                      <a
                        href={`tel:${layanan.phone}`}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-black flex items-center justify-center gap-1.5 transition shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" /> Panggil: {layanan.phone}
                      </a>
                      {layanan.phone.startsWith("08") && (
                        <a
                          href={`https://wa.me/62${layanan.phone.slice(1)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center transition shadow-xs"
                          title="Hubungi via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL TAMBAH KONTAK DARURAT INTERNAL RW (KHUSUS PENGURUS) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <Plus className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-black text-sm text-slate-900">Tambah Kontak Darurat RW</h4>
                  <p className="text-[11px] text-slate-600 font-medium">Khusus nomor siaga lingkungan RW setempat</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomContact} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Nama Kontak / Pos Siaga</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pos Satpam RT 03 / Dokter Warga"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Kategori</label>
                  <select
                    value={newContactCategory}
                    onChange={(e) => setNewContactCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="KAMTIBMAS RW">Kamtibmas & Keamanan</option>
                    <option value="MEDIS WARGA">Tenaga Medis Warga</option>
                    <option value="SARPRAS LINGKUNGAN">Sarpras & Saluran Air</option>
                    <option value="KOORDINATOR BLOK">Koordinator Blok / Gang</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    required
                    placeholder="08xxxxxxxxxx"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Keterangan / Lokasi</label>
                <textarea
                  rows={2}
                  placeholder="Catatan siaga, jam operasional, atau patokan rumah"
                  value={newContactNotes}
                  onChange={(e) => setNewContactNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Simpan Kontak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}