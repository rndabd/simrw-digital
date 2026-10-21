"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  MessageSquare,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Send,
  RefreshCw,
  Tag,
  ShieldAlert,
  ChevronRight,
  Filter,
  Camera,
  Upload,
  Image as ImageIcon,
  X,
} from "lucide-react";

export default function PengaduanTab() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"my" | "community">("my");
  const [showFormModal, setShowFormModal] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("KEBERSIHAN_SAMPAH");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState<"NORMAL" | "HIGH" | "EMERGENCY">("NORMAL");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Camera & Photo Proof State
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const scope = activeSubTab === "my" ? "my" : "all";
      const res = await fetch(`/api/v1/complaints?scope=${scope}`);
      const json = await res.json();
      if (json.success) {
        setComplaints(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [activeSubTab]);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !location) return;

    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch("/api/v1/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          location,
          priority,
          description,
          photo_url: photoPreview || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setFeedbackMsg(json.message);
        setTitle("");
        setLocation("");
        setDescription("");
        setPriority("NORMAL");
        setPhotoPreview(null);
        setTimeout(() => {
          setShowFormModal(false);
          setFeedbackMsg(null);
          fetchComplaints();
        }, 1500);
      } else {
        alert(json.message || "Gagal menyampaikan pengaduan.");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SELESAI":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Selesai Ditangani
          </span>
        );
      case "DIPROSES":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1 animate-pulse">
            <Clock className="w-3 h-3 text-blue-600" />
            Sedang Ditangani RT
          </span>
        );
      case "DITOLAK":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Ditolak / Diarsipkan
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            Menunggu Respon RT
          </span>
        );
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "KEBERSIHAN_SAMPAH":
        return "Kebersihan & Sampah";
      case "KEAMANAN_KETERTIBAN":
        return "Keamanan Lingkungan";
      case "FASILITAS_LAMPU_JALAN":
        return "Lampu Jalan & Sarpras";
      case "INFRASTRUKTUR_SALURAN":
        return "Saluran Drainase / Jalan";
      case "SOSIAL_TETANGGA":
        return "Ketertiban & Sosial";
      default:
        return "Lainnya";
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white">Layanan Pengaduan & Keluhan Warga</h2>
            <p className="text-[11px] text-slate-300">
              Sampaikan aspirasi, kerusakan fasilitas, dan gangguan ketertiban lingkungan RT secara resmi.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowFormModal(true)}
          className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Buat Pengaduan Baru</span>
        </button>
      </div>

      {/* Sub Tabs: Pengaduan Saya vs Lingkungan */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveSubTab("my")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === "my"
                ? "bg-white text-emerald-800 shadow-xs font-extrabold"
                : "hover:text-slate-900"
            }`}
          >
            Pengaduan Saya
          </button>
          <button
            onClick={() => setActiveSubTab("community")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === "community"
                ? "bg-white text-emerald-800 shadow-xs font-extrabold"
                : "hover:text-slate-900"
            }`}
          >
            Aduan Publik RT
          </button>
        </div>

        <button
          onClick={fetchComplaints}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 shadow-2xs"
          title="Segarkan data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Complaints List */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-500">Memuat riwayat pengaduan...</div>
      ) : complaints.length === 0 ? (
        <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center space-y-2 shadow-xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <div className="text-sm font-bold text-slate-800">
            {activeSubTab === "my" ? "Belum Ada Pengaduan yang Anda Kirimkan" : "Belum Ada Pengaduan di Lingkungan RT"}
          </div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Jika ada kendala kebersihan, lampu mati, atau keamanan lingkungan, silakan tekan tombol &quot;Buat Pengaduan Baru&quot;.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2.5 hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {item.ticket_number}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {getCategoryLabel(item.category)}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                </div>

                <div className="shrink-0">{getStatusBadge(item.status)}</div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {item.description}
              </p>

              {item.photo_url && (
                <div className="rounded-xl overflow-hidden border border-slate-200 max-h-48 bg-slate-100">
                  <img
                    src={item.photo_url}
                    alt="Lampiran Bukti Foto"
                    className="w-full h-40 object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="p-1.5 bg-slate-900/80 text-white text-[10px] text-center font-semibold">
                    Lampiran Bukti Foto Lapangan
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 gap-y-1">
                <span className="flex items-center gap-1 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Lokasi: <strong>{item.location}</strong></span>
                </span>
                <span className="text-slate-400">
                  Diajukan: {new Date(item.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Officer Official Response Box */}
              {item.officer_response && (
                <div className="mt-2 p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-teal-900 text-[11px]">
                    <ShieldAlert className="w-3.5 h-3.5 text-teal-700" />
                    <span>Tanggapan Resmi Pengurus RT:</span>
                  </div>
                  <p className="text-teal-900 text-[11.5px] pl-5 leading-relaxed font-medium">
                    &quot;{item.officer_response}&quot;
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL BUAT PENGADUAN BARU */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Form Pengaduan Warga</h3>
                  <p className="text-[10px] text-slate-500">Laporan akan diteruskan ke Pengurus RT 02</p>
                </div>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {feedbackMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feedbackMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitComplaint} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Kategori Pengaduan
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="KEBERSIHAN_SAMPAH">Kebersihan & Penumpukan Sampah</option>
                  <option value="FASILITAS_LAMPU_JALAN">Fasilitas / Lampu Jalan Mati</option>
                  <option value="KEAMANAN_KETERTIBAN">Keamanan Lingkungan & Ronda</option>
                  <option value="INFRASTRUKTUR_SALURAN">Saluran Drainase / Jalan Rusak</option>
                  <option value="SOSIAL_TETANGGA">Ketertiban Sosial Warga</option>
                  <option value="LAINNYA">Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Judul Pengaduan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Lampu tiang gang mati sudah 2 hari"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Titik Lokasi Kejadian
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Depan rumah No. 12 Gang Mawar RT 02"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Uraian Lengkap Keluhan
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Jelaskan secara rinci permasalahan yang terjadi..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Lampiran Bukti Foto (Kamera / Galeri) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Lampiran Bukti Foto (Kamera Langsung / Berkas)
                </label>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoFileChange}
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoFileChange}
                />

                {photoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
                    <img
                      src={photoPreview}
                      alt="Bukti Pengaduan"
                      className="w-full h-36 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="absolute top-4 right-4 w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md text-xs transition"
                      title="Hapus Foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="mt-1 text-center">
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Bukti Foto Siap Dikirim
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="py-2.5 px-3 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-xs"
                    >
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span>Ambil via Kamera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95"
                    >
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span>Pilih dari Galeri</span>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tingkat Urgensi
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority("NORMAL")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      priority === "NORMAL"
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    Biasa
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority("HIGH")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      priority === "HIGH"
                        ? "bg-amber-500 text-slate-950 border-amber-600 font-extrabold"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    Penting
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority("EMERGENCY")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      priority === "EMERGENCY"
                        ? "bg-rose-600 text-white border-rose-600 font-extrabold animate-pulse"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    Darurat
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-900/30 transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? "Mengirimkan Pengaduan..." : "Kirimkan Pengaduan Sekarang"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

