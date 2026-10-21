"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Building2,
  CheckCircle2,
  Clock,
  History,
  ShieldCheck,
  Users,
  AlertTriangle,
  RotateCw,
  FileText,
  Lock,
  ArrowRight,
  RefreshCw,
  Send,
  X,
  Check,
} from "lucide-react";
import { formatAuditAction, AuditPayloadViewer, formatRoleName } from "@/lib/formatters";

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"rw_requests" | "all_rws" | "rollover_wizard" | "rollover_history" | "audit">("rw_requests");

  // RW Requests & List State
  const [rwList, setRwList] = useState<any[]>([]);
  const [isLoadingRws, setIsLoadingRws] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Rollover History State
  const [rollovers, setRollovers] = useState<any[]>([]);
  const [isLoadingRollovers, setIsLoadingRollovers] = useState(false);

  // Rollover Wizard State
  const [selectedRwId, setSelectedRwId] = useState("");
  const [outgoingId, setOutgoingId] = useState("user-rw-01"); // Default Budi Santoso
  const [incomingId, setIncomingId] = useState("user-rw-successor"); // Ir. Bambang Wijaya
  const [periodFrom, setPeriodFrom] = useState("2021");
  const [periodTo, setPeriodTo] = useState("2026");
  const [nextPeriodTo, setNextPeriodTo] = useState("2031");
  const [closingCash, setClosingCash] = useState(18500000);
  const [handoverNotes, setHandoverNotes] = useState(
    "Serah terima saldo kas akhir Rp 18.500.000, inventaris 150 kursi balai RW, 4 tenda acara, 2 unit fogging, dan arsip data 450 KK."
  );
  const [isExecutingRollover, setIsExecutingRollover] = useState(false);
  const [rolloverSuccess, setRolloverSuccess] = useState<string | null>(null);

  // Audit State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  const fetchRwRequests = async () => {
    setIsLoadingRws(true);
    try {
      const res = await fetch("/api/v1/admin/rw-requests");
      const json = await res.json();
      if (json.success) {
        setRwList(json.data);
        if (json.data.length > 0 && !selectedRwId) {
          setSelectedRwId(json.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingRws(false);
    }
  };

  const fetchRollovers = async () => {
    setIsLoadingRollovers(true);
    try {
      const res = await fetch("/api/v1/organizations/rollover");
      const json = await res.json();
      if (json.success) {
        setRollovers(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingRollovers(false);
    }
  };

  const fetchAuditLogs = async () => {
    setIsLoadingAudit(true);
    try {
      const res = await fetch("/api/v1/audit/logs");
      const json = await res.json();
      if (json.success) {
        setAuditLogs(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === "rw_requests" || activeTab === "all_rws" || activeTab === "rollover_wizard") {
      fetchRwRequests();
    }
    if (activeTab === "rollover_history") {
      fetchRollovers();
    }
    if (activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const handleReviewRw = async (rwId: string, action: "APPROVE" | "REJECT") => {
    setActionLoading(rwId);
    try {
      const res = await fetch(`/api/v1/admin/rw-requests/${rwId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchRwRequests();
      } else {
        alert(json.message || "Gagal memproses permohonan RW.");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExecuteRollover = async (e: React.FormEvent) => {
    e.preventDefault();
    const confirm = window.confirm(
      `PERHATIAN RESMI KELURAHAN:\n\nAnda akan mengeksekusi Serah Terima Jabatan & Rollover Masa Bakti 5 Tahun (${periodTo}-${nextPeriodTo}).\n\nWewenang Ketua RW lama akan dicabut dan dialihkan ke Pejabat Baru secara otomatis beserta pencatatan BAST dan siaran warga. Lanjutkan?`
    );
    if (!confirm) return;

    setIsExecutingRollover(true);
    setRolloverSuccess(null);

    try {
      const res = await fetch("/api/v1/organizations/rollover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "RW",
          targetRwId: selectedRwId,
          outgoingOfficerId: outgoingId,
          incomingOfficerId: incomingId,
          periodFrom,
          periodTo,
          nextPeriodTo,
          closingCashBalance: closingCash,
          handoverNotes,
          bastDocumentUrl: "/uploads/bast-resmi-kelurahan.pdf",
        }),
      });

      const json = await res.json();
      if (json.success) {
        setRolloverSuccess(
          `Rollover Masa Bakti 5 Tahun (${periodTo}-${nextPeriodTo}) Berhasil Disahkan! Pejabat baru telah aktif dan pengumuman warga resmi diterbitkan.`
        );
        fetchRwRequests();
      } else {
        alert(json.message || "Gagal mengeksekusi rollover.");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsExecutingRollover(false);
    }
  };

  const pendingRws = rwList.filter((r) => r.status === "PENDING_APPROVAL");
  const activeRws = rwList.filter((r) => r.status === "ACTIVE");

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner Kelurahan */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                PORTAL SUPER ADMIN KELURAHAN
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
                Pusat Tata Kelola RW & Rollover Kepengurusan
              </h2>
              <div className="text-xs text-slate-200 font-semibold mt-1">
                Admin: <span className="font-bold text-white">{user?.fullName}</span> • Kelurahan Sukamaju, Bandung
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Multi-Tenant System Active</span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5 mt-6 bg-slate-800/90 p-1.5 rounded-2xl text-xs font-bold text-slate-200">
          <button
            onClick={() => setActiveTab("rw_requests")}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "rw_requests"
                ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
                : "hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Verifikasi RW ({pendingRws.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("all_rws")}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "all_rws"
                ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
                : "hover:text-white"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Seluruh RW ({activeRws.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("rollover_wizard")}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "rollover_wizard"
                ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
                : "hover:text-white"
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rollover 5 Tahun</span>
          </button>

          <button
            onClick={() => setActiveTab("rollover_history")}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "rollover_history"
                ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
                : "hover:text-white"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Arsip BAST</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "audit"
                ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
                : "hover:text-white"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Jejak Audit</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PERMOHONAN RW BARU */}
      {activeTab === "rw_requests" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Permohonan Pendaftaran RW Baru
              </h3>
              <p className="text-xs text-slate-700 font-medium">
                Verifikasi dokumen SK Pelantikan & keabsahan pemilihan sebelum mengaktifkan RW di sistem.
              </p>
            </div>
            <button
              onClick={fetchRwRequests}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRws ? "animate-spin" : ""}`} />
              <span>Muat Ulang</span>
            </button>
          </div>

          {isLoadingRws ? (
            <div className="p-8 text-center text-xs text-slate-700 font-bold">Memuat permohonan RW...</div>
          ) : pendingRws.length === 0 ? (
            <div className="p-10 bg-white rounded-3xl border border-slate-200 text-center space-y-2 shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <div className="text-sm font-bold text-slate-800">Tidak Ada Permohonan RW Menunggu</div>
              <p className="text-xs text-slate-700 font-medium max-w-sm mx-auto">
                Semua RW yang mendaftar telah ditinjau dan disetujui oleh Kelurahan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRws.map((rw) => (
                <div
                  key={rw.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-base font-extrabold text-slate-900">
                        RW {rw.rw_number} Kelurahan {rw.village}
                      </div>
                      <div className="text-xs text-slate-700 font-bold">
                        Kecamatan {rw.district}, {rw.city}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      Menunggu Approval
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="text-slate-700 text-[10px] uppercase font-bold">Pemohon Calon Ketua RW:</div>
                    <div className="font-bold text-slate-900">{rw.applicantName}</div>
                    <div className="text-emerald-700 font-mono text-[11px] font-bold">WhatsApp: {rw.applicantPhone}</div>
                    <div className="text-slate-700 text-[11px] font-bold pt-1 border-t border-slate-200 mt-1 flex items-center justify-between">
                      <span>Masa Bakti: {rw.term_period}</span>
                      <span>Unit RT: {rw.totalRt} RT</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-700 font-bold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" /> Dokumen SK Pemilihan
                    </span>
                    <a
                      href={rw.sk_kelurahan_url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      Buka Dokumen SK
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button
                      disabled={actionLoading === rw.id}
                      onClick={() => handleReviewRw(rw.id, "REJECT")}
                      className="py-2.5 px-3 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <X className="w-4 h-4" /> Tolak
                    </button>
                    <button
                      disabled={actionLoading === rw.id}
                      onClick={() => handleReviewRw(rw.id, "APPROVE")}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Check className="w-4 h-4" /> Sahkan & Aktifkan RW
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DAFTAR SELURUH RW & RT */}
      {activeTab === "all_rws" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Direktori Seluruh RW & RT Terdaftar
            </h3>
            <p className="text-xs text-slate-700 font-medium">
              Pemantauan multi-tenant seluruh unit RW dalam lingkup wilayah Kelurahan Sukamaju.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRws.map((rw) => (
              <div
                key={rw.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-base font-extrabold text-slate-900">
                      Rukun Warga (RW) {rw.rw_number}
                    </div>
                    <div className="text-xs text-slate-700 font-bold">
                      Kel. {rw.village}, Kec. {rw.district}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Aktif
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-600 font-bold uppercase">Masa Bakti</div>
                    <div className="font-extrabold text-slate-800 mt-0.5">{rw.term_period}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-600 font-bold uppercase">Jumlah Unit RT</div>
                    <div className="font-extrabold text-slate-800 mt-0.5">{rw.totalRt} Rukun Tetangga</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs flex items-center justify-between text-slate-700 font-bold">
                  <span>Warga Terdaftar: <strong className="text-slate-900 font-extrabold">{rw.totalCitizens} Orang</strong></span>
                  <button
                    onClick={() => {
                      setSelectedRwId(rw.id);
                      setActiveTab("rollover_wizard");
                    }}
                    className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
                  >
                    Rollover Jabatan <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ROLLOVER KEPENGURUSAN 5 TAHUN & HANDOVER PEKERJAAN */}
      {activeTab === "rollover_wizard" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-emerald-600" />
              Fungsi Rollover 5 Tahun & Serah Terima Pekerjaan (BAST)
            </h3>
            <p className="text-xs text-slate-700 font-medium">
              Otomatisasi pengalihan wewenang ketua RW/RT demisioner ke pejabat baru terpilih, serah terima saldo kas, dan arsip dokumen.
            </p>
          </div>

          {rolloverSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-bold flex items-center gap-2.5 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>{rolloverSuccess}</div>
            </div>
          )}

          <form onSubmit={handleExecuteRollover} className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Pilih Satuan RW yang Melakukan Rollover
                </label>
                <select
                  value={selectedRwId}
                  onChange={(e) => setSelectedRwId(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {activeRws.map((rw) => (
                    <option key={rw.id} value={rw.id}>
                      RW {rw.rw_number} Kel. {rw.village} (Periode Aktif: {rw.term_period})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Masa Bakti Rollover (Siklus 5 Tahun)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={periodFrom}
                    onChange={(e) => setPeriodFrom(e.target.value)}
                    placeholder="2021"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 text-center font-bold"
                  />
                  <span className="text-slate-700 font-bold">s/d</span>
                  <input
                    type="text"
                    value={periodTo}
                    onChange={(e) => setPeriodTo(e.target.value)}
                    placeholder="2026"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 text-center font-bold"
                  />
                  <span className="text-slate-700 font-bold">ke</span>
                  <input
                    type="text"
                    value={nextPeriodTo}
                    onChange={(e) => setNextPeriodTo(e.target.value)}
                    placeholder="2031"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 text-center font-bold text-emerald-700"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ketua RW Lama (Demisioner - Hak Akses Dicabut)
                </label>
                <select
                  value={outgoingId}
                  onChange={(e) => setOutgoingId(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-slate-50 font-medium"
                >
                  <option value="user-rw-01">Budi Santoso (Ketua RW 05 Masa Bakti 2021-2026)</option>
                </select>
                <span className="text-[11px] text-slate-600 font-medium mt-1 block">
                  *Mandat kepemimpinan Ketua RW lama dicabut & beralih status menjadi Penasihat RW.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ketua RW Baru Terpilih (Menerima Mandat)
                </label>
                <select
                  value={incomingId}
                  onChange={(e) => setIncomingId(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-emerald-300 bg-emerald-50/40 font-bold text-emerald-950"
                >
                  <option value="user-rw-successor">Ir. Bambang Wijaya (Warga Terverifikasi RT 01)</option>
                  <option value="user-warga-01">Siti Aminah (Warga Terverifikasi RT 02)</option>
                </select>
                <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
                  *Otomatis disahkan sebagai Ketua RW aktif dan berwenang penuh atas pelayanan warga.
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Saldo Kas Akhir yang Diserahterimakan (Rp)
              </label>
              <input
                type="number"
                value={closingCash}
                onChange={(e) => setClosingCash(Number(e.target.value))}
                placeholder="18500000"
                className="w-full text-xs p-3 rounded-xl border border-slate-300 font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Catatan Berita Acara Serah Terima (BAST) & Inventaris Pekerjaan
              </label>
              <textarea
                rows={3}
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="Tuliskan serah terima aset balai warga, dokumen kependudukan, stempel resmi, dan kas saldo..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isExecutingRollover}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-98 transition-all"
            >
              <RotateCw className={`w-4 h-4 ${isExecutingRollover ? "animate-spin" : ""}`} />
              {isExecutingRollover
                ? "Memproses Rollover & Handover BAST..."
                : "Sahkan & Eksekusi Rollover 5 Tahun Sekarang"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: ARSIP BAST & RIWAYAT ROLLOVER */}
      {activeTab === "rollover_history" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" />
              Arsip Berita Acara Serah Terima (BAST) & Jejak Rollover
            </h3>
            <p className="text-xs text-slate-700 font-medium">
              Riwayat lengkap peralihan kepengurusan masa bakti 5 tahun dari masa ke masa.
            </p>
          </div>

          {isLoadingRollovers ? (
            <div className="p-8 text-center text-xs text-slate-700 font-bold">Memuat arsip BAST...</div>
          ) : rollovers.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-700 font-bold">
              Belum ada arsip rollover sebelumnya.
            </div>
          ) : (
            <div className="space-y-3">
              {rollovers.map((r) => (
                <div
                  key={r.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-700">
                        Peralihan Masa Bakti: <span className="text-emerald-700 font-extrabold">{r.period_from}-{r.period_to} ➔ {r.period_to}-{r.next_period_to}</span>
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                        RW {r.rwNumber} Kelurahan {r.village}
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      BAST Disahkan Kelurahan
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <div className="text-[10px] text-slate-600 font-bold uppercase">Pejabat Demisioner</div>
                      <div className="font-extrabold text-slate-900">{r.outgoingName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-600 font-bold uppercase">Pejabat Baru Dilantik</div>
                      <div className="font-extrabold text-emerald-800">{r.incomingName}</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-800 font-medium bg-slate-50/50 p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 font-bold">Catatan BAST:</strong> {r.handover_notes}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700 font-bold">
                    <span>Kas Dialihkan: <strong className="text-emerald-700 font-extrabold">Rp {Number(r.closing_cash_balance).toLocaleString("id-ID")}</strong></span>
                    <span className="text-[11px] text-slate-600 font-mono font-bold">Disahkan: {new Date(r.created_at).toLocaleDateString("id-ID")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: JEJAK AUDIT GLOBAL */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              Jejak Audit Global UU PDP (Seluruh RW)
            </h3>
            <p className="text-xs text-slate-700 font-medium">
              Rekaman mutlak seluruh aktivitas login, pembukaan NIK, dan perubahan hak akses se-kelurahan.
            </p>
          </div>

          {isLoadingAudit ? (
            <div className="p-8 text-center text-xs text-slate-700 font-bold">Memuat log audit...</div>
          ) : auditLogs.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-700 font-bold">
              Belum ada catatan log audit.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {auditLogs.map((log) => {
                const actionMeta = formatAuditAction(log.action);
                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs space-y-2 shadow-2xs hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${actionMeta.colorClass}`}
                      >
                        {actionMeta.title}
                      </span>
                      <span className="text-[10px] text-slate-600 font-bold shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-700 font-medium">
                      Aktor: <span className="font-bold text-slate-900">{log.actorName}</span> • IP:{" "}
                      <span className="font-mono text-[10px] text-slate-600 font-bold">{log.ip_address}</span>
                    </div>

                    <AuditPayloadViewer action={log.action} payload={log.payload} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

