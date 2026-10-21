"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Send,
  User,
  MapPin,
  Calendar,
  X,
  FileText,
  Tag,
} from "lucide-react";

export default function OfficerComplaintsTab() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [search, setSearch] = useState("");

  // Response Modal State
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseStatus, setResponseStatus] = useState<"DIPROSES" | "SELESAI" | "DITOLAK">("DIPROSES");
  const [responseText, setResponseText] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      let url = "/api/v1/complaints?scope=all";
      if (filterStatus !== "ALL") url += `&status=${filterStatus}`;
      if (filterCategory !== "ALL") url += `&category=${filterCategory}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setComplaints(json.data);
      }
    } catch (err) {
      console.error("Gagal memuat pengaduan:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [filterStatus, filterCategory]);

  const handleOpenResponse = (comp: any) => {
    setSelectedComplaint(comp);
    setResponseStatus(comp.status === "MENUNGGU" ? "DIPROSES" : comp.status);
    setResponseText(comp.officer_response || "");
    setShowResponseModal(true);
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    if (!responseText.trim()) {
      alert("Silakan berikan tanggapan atau catatan penanganan.");
      return;
    }

    setIsSubmittingResponse(true);
    try {
      const res = await fetch(`/api/v1/complaints/${selectedComplaint.id}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: responseStatus,
          officer_response: responseText,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessBanner(`Pengaduan [${selectedComplaint.ticket_number}] berhasil diperbarui statusnya!`);
        setShowResponseModal(false);
        setSelectedComplaint(null);
        fetchComplaints();
        setTimeout(() => setSuccessBanner(null), 5000);
      } else {
        alert(json.message || "Gagal memperbarui status pengaduan.");
      }
    } catch (err) {
      console.error("Gagal tanggapi pengaduan:", err);
      alert("Terjadi kesalahan sistem saat menyimpan tanggapan.");
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "MENUNGGU":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Menunggu Tanggapan
          </span>
        );
      case "DIPROSES":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sedang Ditangani
          </span>
        );
      case "SELESAI":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Tuntas / Selesai
          </span>
        );
      case "DITOLAK":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1.5">
            <X className="w-3.5 h-3.5" /> Ditolak
          </span>
        );
      default:
        return null;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "KEAMANAN":
      case "KEAMANAN_KETERTIBAN":
        return "Keamanan & Ketertiban";
      case "KEBERSIHAN":
      case "KEBERSIHAN_SAMPAH":
        return "Kebersihan & Sampah";
      case "FASILITAS":
      case "FASILITAS_LAMPU_JALAN":
        return "Fasilitas Umum & Lampu Jalan";
      case "INFRASTRUKTUR_SALURAN":
        return "Infrastruktur & Saluran";
      case "SOSIAL_TETANGGA":
      case "KETERTIBAN":
        return "Ketertiban & Sosial";
      case "IURAN_KEUANGAN":
        return "Pertanyaan Iuran & Keuangan";
      default:
        return "Lainnya / Umum";
    }
  };

  const filteredComplaints = complaints.filter((comp) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const citizen = (comp.citizen_name || comp.author_name || "").toLowerCase();
    const loc = (comp.location || comp.location_notes || "").toLowerCase();
    return (
      comp.ticket_number.toLowerCase().includes(q) ||
      comp.title.toLowerCase().includes(q) ||
      comp.description.toLowerCase().includes(q) ||
      citizen.includes(q) ||
      loc.includes(q)
    );
  });

  const countPending = complaints.filter((c) => c.status === "MENUNGGU").length;
  const countInProcess = complaints.filter((c) => c.status === "DIPROSES").length;
  const countResolved = complaints.filter((c) => c.status === "SELESAI").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Alert Banner if any */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/50 rounded-2xl flex items-center justify-between text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <p className="text-sm font-medium">{successBanner}</p>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-600 hover:text-emerald-800 text-sm font-semibold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-br from-slate-900 via-rose-950/60 to-slate-900 text-white rounded-3xl shadow-xl border border-rose-500/20 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-rose-500/30 border border-rose-400/40 text-rose-200 text-xs font-semibold rounded-full uppercase tracking-wider">
                Pusat Aduan Warga
              </span>
              <span className="text-xs text-slate-200 font-semibold">Respon Cepat Tanggap Pengurus</span>
            </div>
            <h2 className="text-2xl font-bold">Kelola Laporan & Pengaduan Warga</h2>
            <p className="text-sm text-slate-200 font-medium mt-1 max-w-2xl">
              Daftar seluruh aspirasi, keluhan keamanan, fasilitas umum, dan laporan kebersihan yang diajukan oleh warga di lingkungan Anda.
            </p>
          </div>

          <button
            onClick={fetchComplaints}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 transition rounded-2xl text-sm font-medium border border-white/10 self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Perbarui Laporan
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Total Pengaduan</span>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{complaints.length}</p>
        </div>

        <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-amber-200/80 dark:border-amber-800/40 shadow-sm">
          <span className="text-xs font-medium text-amber-600">Menunggu Respon</span>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{countPending}</p>
        </div>

        <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-blue-200/80 dark:border-blue-800/40 shadow-sm">
          <span className="text-xs font-medium text-blue-600">Sedang Ditangani</span>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{countInProcess}</p>
        </div>

        <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-emerald-200/80 dark:border-emerald-800/40 shadow-sm">
          <span className="text-xs font-medium text-emerald-600">Tuntas Selesai</span>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{countResolved}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium"
          >
            <option value="ALL">Semua Status</option>
            <option value="MENUNGGU">Menunggu Respon</option>
            <option value="DIPROSES">Sedang Ditangani</option>
            <option value="SELESAI">Tuntas / Selesai</option>
            <option value="DITOLAK">Ditolak</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="KEAMANAN">Keamanan & Ketertiban</option>
            <option value="KEBERSIHAN">Kebersihan & Sampah</option>
            <option value="FASILITAS">Fasilitas Umum</option>
            <option value="KETERTIBAN">Ketertiban Hewan/Warga</option>
            <option value="IURAN_KEUANGAN">Iuran & Kas</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            placeholder="Cari tiket, judul, atau pelapor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Complaints List */}
      {isLoading ? (
        <div className="p-12 text-center bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800">
          <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Memuat laporan warga...</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="p-12 text-center bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
          <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Tidak ada pengaduan warga yang sesuai filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((comp) => (
            <div
              key={comp.id}
              className="p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-rose-300 dark:hover:border-rose-700/50 transition flex flex-col md:flex-row md:items-start justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900">
                    {comp.ticket_number}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                    {getCategoryLabel(comp.category)}
                  </span>
                  {(comp.is_urgent || comp.priority === "HIGH" || comp.priority === "EMERGENCY") && (
                    <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-rose-600 text-white animate-pulse">
                      MENDESAK
                    </span>
                  )}
                  {getStatusBadge(comp.status)}
                </div>

                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  {comp.title}
                </h3>

                <p className="text-xs text-slate-800 dark:text-slate-100 font-medium leading-relaxed">
                  {comp.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 dark:text-slate-200 font-medium pt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" /> Pelapor:{" "}
                    <strong className="text-slate-900 dark:text-slate-100 font-bold">
                      {comp.author_name || comp.citizen_name || "Warga RT"}
                    </strong>
                  </span>
                  {(comp.location || comp.location_notes) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" /> Lokasi: {comp.location || comp.location_notes}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" /> Dilaporkan: {new Date(comp.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Officer Response Preview if available */}
                {comp.officer_response && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-1">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-500" /> Tanggapan Pengurus:
                    </p>
                    <p className="text-xs text-slate-800 dark:text-slate-100 italic font-medium">
                      "{comp.officer_response}"
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="shrink-0 self-end md:self-center">
                <button
                  onClick={() => handleOpenResponse(comp)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-md shadow-indigo-500/20"
                >
                  <Send className="w-3.5 h-3.5" /> Tanggapi / Update Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RESPONSE MODAL */}
      {showResponseModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                  {selectedComplaint.ticket_number}
                </span>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">
                  Tindak Lanjuti Pengaduan
                </h3>
              </div>
              <button
                onClick={() => setShowResponseModal(false)}
                className="text-slate-600 hover:text-slate-900 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitResponse} className="space-y-4 mt-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {selectedComplaint.title}
                </p>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium line-clamp-2">
                  {selectedComplaint.description}
                </p>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium pt-1">
                  Oleh: {selectedComplaint.author_name || selectedComplaint.citizen_name || "Warga"} • RT 02
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Status Penanganan *
                </label>
                <select
                  value={responseStatus}
                  onChange={(e: any) => setResponseStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium"
                >
                  <option value="DIPROSES">Sedang Ditangani / Koordinasi Petugas</option>
                  <option value="SELESAI">Tuntas / Selesai Diselesaikan</option>
                  <option value="DITOLAK">Ditolak / Di luar Kewenangan RT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Tanggapan Pengurus untuk Warga *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan keterangan tindakan, progres perbaikan, atau instruksi tindak lanjut untuk pelapor..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowResponseModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResponse}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition rounded-xl flex items-center gap-2 shadow-md shadow-indigo-500/20"
                >
                  {isSubmittingResponse ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Kirim Tanggapan
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
