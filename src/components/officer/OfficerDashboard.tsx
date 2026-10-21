"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  ShieldCheck,
  Send,
  Check,
  X,
  Eye,
  FileText,
  AlertCircle,
  ExternalLink,
  Lock,
  ArrowLeft,
  RefreshCw,
  Bell,
  Clock,
  CreditCard,
  Wallet,
  Building2,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  DollarSign,
  Receipt,
  RotateCw,
  BarChart3,
  Database,
  GitCompare,
  MessageSquare,
} from "lucide-react";
import { formatAuditAction, AuditPayloadViewer, formatRoleList, formatRoleName } from "@/lib/formatters";
import MasterResidentsTab from "./MasterResidentsTab";
import KkReconciliationTab from "./KkReconciliationTab";
import PopulationStatsTab from "./PopulationStatsTab";
import OfficerComplaintsTab from "./OfficerComplaintsTab";
import ReportDownloadTab from "./ReportDownloadTab";

export default function OfficerDashboard() {
  const { user, setOfficerMode } = useAuth();

  const isRwOfficer = user?.roles?.some((r) =>
    r.startsWith("RW_") || r === "SUPER_ADMIN"
  );
  const isRtOfficer = user?.roles?.some((r) =>
    r.startsWith("RT_")
  );

  const [activeTab, setActiveTab] = useState<
    | "pending"
    | "rt_approvals"
    | "dues_validation"
    | "finances"
    | "rw_consolidated"
    | "fund_requests"
    | "broadcast"
    | "audit"
    | "residents"
    | "reconciliation"
    | "statistics"
    | "complaints"
    | "reports"
  >("pending");

  // State for Saldo Awal Modal
  const [showSetInitBalanceModal, setShowSetInitBalanceModal] = useState(false);
  const [newInitBalance, setNewInitBalance] = useState<number | "">("");
  const [newInitNotes, setNewInitNotes] = useState("");
  const [isSubmittingInitBalance, setIsSubmittingInitBalance] = useState(false);

  // State for Pending Residents
  const [pendingResidents, setPendingResidents] = useState<any[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [unmaskedNiks, setUnmaskedNiks] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // State for RT Registration Approvals (RW Level)
  const [rtRequests, setRtRequests] = useState<any[]>([]);
  const [isLoadingRtRequests, setIsLoadingRtRequests] = useState(false);

  // State for Dues Validation (Pending Citizen Payments)
  const [duesList, setDuesList] = useState<any[]>([]);
  const [isLoadingDues, setIsLoadingDues] = useState(false);
  const [newDuesMonth, setNewDuesMonth] = useState("November");
  const [newDuesYear, setNewDuesYear] = useState("2026");
  const [newDuesAmount, setNewDuesAmount] = useState(50000);
  const [isCreatingDues, setIsCreatingDues] = useState(false);

  // State for Cashbook & Finances
  const [financeData, setFinanceData] = useState<any | null>(null);
  const [isLoadingFinance, setIsLoadingFinance] = useState(false);
  const [txType, setTxType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [txAmount, setTxAmount] = useState<number | "">("");
  const [txCategory, setTxCategory] = useState("Iuran Warga");
  const [txDesc, setTxDesc] = useState("");
  const [isRecordingTx, setIsRecordingTx] = useState(false);

  // State for RW Consolidated RT Reports (Every RT in RW)
  const [consolidatedRtReports, setConsolidatedRtReports] = useState<any[]>([]);
  const [isLoadingConsolidated, setIsLoadingConsolidated] = useState(false);

  // State for Fund Requests (Pengajuan Dana Berjenjang)
  const [fundRequests, setFundRequests] = useState<any[]>([]);
  const [isLoadingFundReqs, setIsLoadingFundReqs] = useState(false);
  const [newFundTitle, setNewFundTitle] = useState("");
  const [newFundAmount, setNewFundAmount] = useState<number | "">("");
  const [newFundPurpose, setNewFundPurpose] = useState("");
  const [isSubmittingFundReq, setIsSubmittingFundReq] = useState(false);

  // State for Broadcast Form
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastContent, setBroadcastContent] = useState("");
  const [broadcastScope, setBroadcastScope] = useState<"RT_BROADCAST" | "RW_BROADCAST" | "OFFICER_ONLY">("RT_BROADCAST");
  const [isBroadcastPinned, setIsBroadcastPinned] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  // State for Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // 1. Fetch pending residents
  const fetchPendingResidents = async () => {
    setIsLoadingPending(true);
    try {
      const res = await fetch("/api/v1/officer/residents/pending");
      const json = await res.json();
      if (json.success) setPendingResidents(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingPending(false);
    }
  };

  // 2. Fetch RT Registrations (for RW Chair)
  const fetchRtRequests = async () => {
    setIsLoadingRtRequests(true);
    try {
      const res = await fetch("/api/v1/officer/rt-requests");
      const json = await res.json();
      if (json.success) setRtRequests(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingRtRequests(false);
    }
  };

  // 3. Fetch Dues Validation Queue
  const fetchDuesList = async () => {
    setIsLoadingDues(true);
    try {
      const scope = isRwOfficer ? "rw" : "rt";
      const res = await fetch(`/api/v1/bills?scope=${scope}`);
      const json = await res.json();
      if (json.success) setDuesList(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDues(false);
    }
  };

  // 4. Fetch Cashbook Finances
  const fetchFinances = async () => {
    setIsLoadingFinance(true);
    try {
      const scope = isRwOfficer ? "RW" : "RT";
      const res = await fetch(`/api/v1/finances?scope=${scope}`);
      const json = await res.json();
      if (json.success) setFinanceData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingFinance(false);
    }
  };

  // 5. Fetch RW Consolidated All-RT Report
  const fetchConsolidatedReports = async () => {
    setIsLoadingConsolidated(true);
    try {
      const res = await fetch("/api/v1/finances?scope=ALL_RT");
      const json = await res.json();
      if (json.success) setConsolidatedRtReports(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingConsolidated(false);
    }
  };

  // 6. Fetch Fund Requests
  const fetchFundRequests = async () => {
    setIsLoadingFundReqs(true);
    try {
      const res = await fetch("/api/v1/fund-requests");
      const json = await res.json();
      if (json.success) setFundRequests(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingFundReqs(false);
    }
  };

  // 7. Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setIsLoadingAudit(true);
    try {
      const res = await fetch("/api/v1/audit/logs");
      const json = await res.json();
      if (json.success) setAuditLogs(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === "pending") fetchPendingResidents();
    if (activeTab === "rt_approvals") fetchRtRequests();
    if (activeTab === "dues_validation") fetchDuesList();
    if (activeTab === "finances") fetchFinances();
    if (activeTab === "rw_consolidated") fetchConsolidatedReports();
    if (activeTab === "fund_requests") fetchFundRequests();
    if (activeTab === "audit") fetchAuditLogs();
  }, [activeTab]);

  // Actions
  const handleVerifyResident = async (
    residentId: string,
    action: "APPROVE" | "REJECT",
    role?: "RESIDENT" | "HEAD_OF_FAMILY"
  ) => {
    setActionLoading(residentId);
    let rejectionNote: string | undefined = undefined;
    if (action === "REJECT") {
      const promptNote = window.prompt("Masukkan alasan penolakan berkas warga:");
      if (!promptNote) {
        setActionLoading(null);
        return;
      }
      rejectionNote = promptNote;
    }

    try {
      const res = await fetch(`/api/v1/officer/residents/${residentId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, assignedRole: role || "RESIDENT", rejectionNote }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchPendingResidents();
      } else {
        alert(json.message || "Gagal memproses verifikasi.");
      }
    } catch (e: any) {
      alert(e.message || "Terjadi kesalahan.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnmaskNik = async (residentId: string) => {
    const confirmView = window.confirm(
      "PERHATIAN (UU PDP 27/2022):\n\nPembukaan NIK lengkap akan dicatat permanen dalam Audit Log. Lanjutkan?"
    );
    if (!confirmView) return;

    try {
      const res = await fetch(`/api/v1/officer/residents/${residentId}/unmask-nik`);
      const json = await res.json();
      if (json.success && json.data?.nik) {
        setUnmaskedNiks((prev) => ({ ...prev, [residentId]: json.data.nik }));
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Review RT Registration (RW Level)
  const handleReviewRt = async (rtId: string, action: "APPROVE" | "REJECT") => {
    let rejectionReason: string | undefined = undefined;
    if (action === "REJECT") {
      const prompt = window.prompt("Masukkan alasan penolakan pendaftaran RT:");
      if (!prompt) return;
      rejectionReason = prompt;
    }

    try {
      const res = await fetch(`/api/v1/officer/rt-requests/${rtId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchRtRequests();
      } else {
        alert(json.message || "Gagal meninjau pendaftaran RT.");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Validate Citizen Dues Payment
  const handleValidateDues = async (billId: string, action: "APPROVE" | "REJECT") => {
    let rejectionNote: string | undefined = undefined;
    if (action === "REJECT") {
      const prompt = window.prompt("Masukkan alasan penolakan bukti pembayaran:");
      if (!prompt) return;
      rejectionNote = prompt;
    }

    try {
      const res = await fetch(`/api/v1/bills/${billId}/validate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionNote }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchDuesList();
        if (activeTab === "finances") fetchFinances();
      } else {
        alert(json.message || "Gagal memvalidasi iuran.");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Generate New Monthly Dues
  const handleCreateMonthlyDues = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingDues(true);
    try {
      const res = await fetch("/api/v1/bills/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: newDuesMonth,
          year: Number(newDuesYear),
          amount: Number(newDuesAmount),
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchDuesList();
      } else {
        alert(json.message || "Gagal menerbitkan tagihan");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsCreatingDues(false);
    }
  };

  // Record Cash Transaction
  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || !txDesc) return;

    setIsRecordingTx(true);
    try {
      const res = await fetch("/api/v1/finances/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgType: isRwOfficer ? "RW" : "RT",
          type: txType,
          amount: Number(txAmount),
          category: txCategory,
          description: txDesc,
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setTxAmount("");
        setTxDesc("");
        fetchFinances();
      } else {
        alert(json.message || "Gagal mencatat transaksi.");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsRecordingTx(false);
    }
  };

  // Update Initial Balance (Saldo Awal Kas)
  const handleUpdateInitialBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newInitBalance === "" || Number(newInitBalance) < 0) return;

    setIsSubmittingInitBalance(true);
    try {
      const res = await fetch("/api/v1/finances/initial-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgType: isRwOfficer ? "RW" : "RT",
          targetId: isRwOfficer ? user?.rw?.id : user?.rt?.id,
          initialBalance: Number(newInitBalance),
          notes: newInitNotes || "Penetapan saldo awal kas kepengurusan",
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setShowSetInitBalanceModal(false);
        setNewInitBalance("");
        setNewInitNotes("");
        fetchFinances();
      } else {
        alert(json.message || "Gagal memperbarui saldo awal.");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmittingInitBalance(false);
    }
  };

  // Submit Fund Request
  const handleSubmitFundRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFundTitle || !newFundAmount || !newFundPurpose) return;

    setIsSubmittingFundReq(true);
    try {
      const res = await fetch("/api/v1/fund-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newFundTitle,
          amount: Number(newFundAmount),
          purpose: newFundPurpose,
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setNewFundTitle("");
        setNewFundAmount("");
        setNewFundPurpose("");
        fetchFundRequests();
      } else {
        alert(json.message || "Gagal mengajukan dana.");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmittingFundReq(false);
    }
  };

  // Review Fund Request (RT or RW)
  const handleReviewFundRequest = async (requestId: string, action: "APPROVE" | "REJECT") => {
    let rejectionReason: string | undefined = undefined;
    if (action === "REJECT") {
      const prompt = window.prompt("Masukkan alasan penolakan proposal dana:");
      if (!prompt) return;
      rejectionReason = prompt;
    }

    try {
      const res = await fetch(`/api/v1/fund-requests/${requestId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchFundRequests();
      } else {
        alert(json.message || "Gagal meninjau pengajuan dana.");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Send Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastContent) return;

    setIsBroadcasting(true);
    setBroadcastSuccess(null);
    try {
      const res = await fetch("/api/v1/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: broadcastTitle,
          content: broadcastContent,
          scope: broadcastScope,
          isPinned: isBroadcastPinned,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setBroadcastSuccess("Pengumuman resmi berhasil diterbitkan ke seluruh perangkat warga terdaftar!");
        setBroadcastTitle("");
        setBroadcastContent("");
        setIsBroadcastPinned(false);
      } else {
        alert(json.message || "Gagal menyiarkan pengumuman.");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const pendingDues = duesList.filter((b) => b.status === "PENDING_VALIDATION");
  const pendingRts = rtRequests.filter((r) => r.status === "PENDING_APPROVAL");

  return (
    <div className="space-y-5 pb-20">
      {/* Officer Header Banner Card */}
      <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                <span>PANEL KEPENGURUSAN {isRwOfficer ? "RW" : "RT"}</span>
              </div>
              <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight mt-0.5">
                {isRwOfficer
                  ? `Rukun Warga (RW) ${user?.rw?.number || "05"} - Sukamaju`
                  : `Rukun Tetangga (RT) ${user?.rt?.number || "02"} / RW ${user?.rw?.number || "05"}`}
              </h2>
              <div className="text-xs text-slate-300 mt-0.5">
                Pengurus: <span className="font-bold text-white">{user?.fullName}</span> •{" "}
                <span className="text-emerald-300 font-semibold">{formatRoleList(user?.roles)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setOfficerMode(false)}
            className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs text-emerald-400 font-bold flex items-center gap-1.5 self-start sm:self-center transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Mode Warga
          </button>
        </div>

        {/* Tab Navigation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5 mt-5 bg-slate-800/90 p-1.5 rounded-2xl text-xs font-bold text-slate-300">
          <button
            onClick={() => setActiveTab("pending")}
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              activeTab === "pending" ? "bg-emerald-600 text-white shadow-xs font-extrabold" : "hover:text-white"
            }`}
          >
            Verif Akun ({pendingResidents.length})
          </button>

          {isRwOfficer && (
            <button
              onClick={() => setActiveTab("rt_approvals")}
              className={`py-2 px-1 rounded-xl text-center transition-all ${
                activeTab === "rt_approvals" ? "bg-emerald-600 text-white shadow-xs font-extrabold" : "hover:text-white"
              }`}
            >
              Approval RT ({pendingRts.length})
            </button>
          )}

          <button
            onClick={() => setActiveTab("residents")}
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              activeTab === "residents" ? "bg-emerald-600 text-white shadow-xs font-extrabold" : "hover:text-white"
            }`}
          >
            Sensus Penduduk
          </button>

          <button
            onClick={() => setActiveTab("reconciliation")}
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              activeTab === "reconciliation" ? "bg-emerald-600 text-white shadow-xs font-extrabold" : "hover:text-white"
            }`}
          >
            Rekonsiliasi KK
          </button>

          <button
            onClick={() => setActiveTab("statistics")}
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              activeTab === "statistics" ? "bg-emerald-600 text-white shadow-xs font-extrabold" : "hover:text-white"
            }`}
          >
            Statistik & Mutasi
          </button>

          <button
            onClick={() => setActiveTab("complaints")}
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              activeTab === "complaints" ? "bg-emerald-600 text-white shadow-xs font-extrabold" : "hover:text-white"
            }`}
          >
            Pengaduan Warga
          </button>

          <button
            onClick={() => setActiveTab("dues_validation")}
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              activeTab === "dues_validation" ? "bg-emerald-600 text-white shadow-xs font-extrabold" : "hover:text-white"
            }`}
          >
            Validasi Iuran ({pendingDues.length})
          </button>

          <button
            onClick={() => setActiveTab("finances")}
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              activeTab === "finances" ? "bg-emerald-600 text-white shadow-xs font-extrabold" : "hover:text-white"
            }`}
          >
            Buku Kas {isRwOfficer ? "RW" : "RT"}
          </button>

          {isRwOfficer && (
            <button
              onClick={() => setActiveTab("rw_consolidated")}
              className={`py-2 px-1 rounded-xl text-center transition-all ${
                activeTab === "rw_consolidated" ? "bg-emerald-600 text-white shadow-xs font-extrabold" : "hover:text-white"
              }`}
            >
              Laporan Semua RT
            </button>
          )}

          <button
            onClick={() => setActiveTab("fund_requests")}
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              activeTab === "fund_requests" ? "bg-emerald-600 text-white shadow-xs font-extrabold" : "hover:text-white"
            }`}
          >
            Pengajuan Dana
          </button>

          <button
            onClick={() => setActiveTab("broadcast")}
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              activeTab === "broadcast" ? "bg-emerald-600 text-white shadow-xs font-extrabold" : "hover:text-white"
            }`}
          >
            Siaran Warga
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              activeTab === "audit" ? "bg-emerald-600 text-white shadow-xs font-extrabold" : "hover:text-white"
            }`}
          >
            Audit UU PDP
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              activeTab === "reports" ? "bg-emerald-600 text-white shadow-xs font-extrabold" : "hover:text-white"
            }`}
          >
            Unduh Laporan
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="space-y-4">
        {/* TAB 1: VERIFIKASI WARGA BARU */}
        {activeTab === "pending" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Antrean Verifikasi Warga Baru
                </h3>
                <p className="text-[11px] text-slate-500">
                  Periksa keabsahan KTP fisik & alamat sebelum menyetujui akun warga.
                </p>
              </div>
              <button
                onClick={fetchPendingResidents}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPending ? "animate-spin" : ""}`} />
              </button>
            </div>

            {isLoadingPending ? (
              <div className="p-8 text-center text-xs text-slate-500">Memuat antrean verifikasi...</div>
            ) : pendingResidents.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2 shadow-xs">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                <div className="text-xs font-bold text-slate-800">Semua Warga Sudah Terverifikasi</div>
                <div className="text-[11px] text-slate-500">
                  Tidak ada pendaftaran baru yang menunggu persetujuan di wilayah Anda.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pendingResidents.map((resident) => (
                  <div
                    key={resident.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{resident.fullName}</div>
                        <div className="text-xs text-slate-500">
                          {resident.addressBlock} • RT {resident.rtNumber} / RW {resident.rwNumber}
                        </div>
                        <div className="text-xs text-emerald-700 font-mono mt-0.5">
                          WA: {resident.phoneNumber}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        Pending
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">
                          NIK Warga (Terproteksi UU PDP)
                        </div>
                        <div className="font-mono text-xs font-bold text-slate-800">
                          {unmaskedNiks[resident.id] || resident.maskedNik}
                        </div>
                      </div>
                      {!unmaskedNiks[resident.id] && (
                        <button
                          onClick={() => handleUnmaskNik(resident.id)}
                          className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Buka NIK
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[11px] text-slate-600 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" /> Foto Fisik KTP (Private Storage)
                      </span>
                      <a
                        href={resident.ktpPresignedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200"
                      >
                        <Lock className="w-3 h-3" /> Cek KTP (TTL 5 Mnt) <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <button
                        disabled={actionLoading === resident.id}
                        onClick={() => handleVerifyResident(resident.id, "REJECT")}
                        className="py-2 px-3 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Tolak Berkas
                      </button>
                      <button
                        disabled={actionLoading === resident.id}
                        onClick={() => handleVerifyResident(resident.id, "APPROVE", "RESIDENT")}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" /> Setujui Warga
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: APPROVAL PENDAFTARAN KETUA RT (KHUSUS PENGURUS RW) */}
        {activeTab === "rt_approvals" && isRwOfficer && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Approval Pendaftaran Satuan & Ketua RT Baru
                </h3>
                <p className="text-[11px] text-slate-500">
                  Calon Ketua RT yang mendaftar di bawah RW {user?.rw?.number || "05"} wajib disahkan oleh Pengurus RW.
                </p>
              </div>
              <button
                onClick={fetchRtRequests}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRtRequests ? "animate-spin" : ""}`} />
              </button>
            </div>

            {isLoadingRtRequests ? (
              <div className="p-8 text-center text-xs text-slate-500">Memuat pendaftaran RT...</div>
            ) : rtRequests.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                Belum ada pendaftaran RT baru di lingkungan RW Anda.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rtRequests.map((rt) => (
                  <div
                    key={rt.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          Rukun Tetangga (RT) {rt.rt_number}
                        </div>
                        <div className="text-xs text-slate-500">
                          Masa Bakti: {rt.term_period || "2026-2031"}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rt.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : rt.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : "bg-amber-100 text-amber-900 border border-amber-300"
                        }`}
                      >
                        {rt.status === "ACTIVE"
                          ? "Aktif Disahkan"
                          : rt.status === "REJECTED"
                          ? "Ditolak RW"
                          : "Menunggu Persetujuan RW"}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="text-slate-400 text-[10px] uppercase font-semibold">Calon Ketua RT:</div>
                      <div className="font-bold text-slate-900">{rt.applicantName}</div>
                      <div className="text-emerald-700 font-mono text-[11px]">WA: {rt.applicantPhone}</div>
                      {rt.sk_document_url && (
                        <div className="text-slate-500 text-[11px] pt-1">
                          SK Pemilihan: <span className="font-mono">{rt.sk_document_url}</span>
                        </div>
                      )}
                    </div>

                    {rt.status === "PENDING_APPROVAL" && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleReviewRt(rt.id, "REJECT")}
                          className="py-2 px-3 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Tolak
                        </button>
                        <button
                          onClick={() => handleReviewRt(rt.id, "APPROVE")}
                          className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Sahkan Ketua RT
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VALIDASI PEMBAYARAN IURAN OLEH BENDAHARA */}
        {activeTab === "dues_validation" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Antrean Validasi Pembayaran Iuran Warga
                </h3>
                <p className="text-[11px] text-slate-500">
                  Warga yang telah mentransfer iuran wajib divalidasi oleh Bendahara sebelum dana tercatat sah di Kas RT.
                </p>
              </div>
              <button
                onClick={fetchDuesList}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDues ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Quick Form: Terbitkan Tagihan Iuran Baru */}
            {isRtOfficer && (
              <form onSubmit={handleCreateMonthlyDues} className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  Terbitkan Tagihan Iuran Bulanan Baru (Seluruh Warga RT)
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Bulan</label>
                    <input
                      type="text"
                      required
                      value={newDuesMonth}
                      onChange={(e) => setNewDuesMonth(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Tahun</label>
                    <input
                      type="number"
                      required
                      value={newDuesYear}
                      onChange={(e) => setNewDuesYear(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Nominal (Rp)</label>
                    <input
                      type="number"
                      required
                      value={newDuesAmount}
                      onChange={(e) => setNewDuesAmount(Number(e.target.value))}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono font-bold text-emerald-800"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isCreatingDues}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isCreatingDues ? "Menerbitkan..." : "Terbitkan Tagihan ke Seluruh Warga RT"}
                </button>
              </form>
            )}

            {/* List of Pending Validation Bills */}
            {isLoadingDues ? (
              <div className="p-8 text-center text-xs text-slate-500">Memuat data iuran...</div>
            ) : duesList.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                Belum ada data iuran yang tercatat.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
                  Antrean Pembayaran Masuk ({pendingDues.length} Menunggu Konfirmasi)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {duesList.map((bill) => (
                    <div
                      key={bill.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-900">{bill.citizenName || "Warga"}</div>
                          <div className="text-[11px] text-slate-500">
                            Iuran {bill.month} {bill.year} • RT {bill.rtNumber}
                          </div>
                          <div className="text-sm font-extrabold text-emerald-800 mt-0.5">
                            Rp {bill.amount.toLocaleString("id-ID")}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bill.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : bill.status === "PENDING_VALIDATION"
                              ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {bill.status === "PAID"
                            ? "Lunas Terverifikasi"
                            : bill.status === "PENDING_VALIDATION"
                            ? "Menunggu Validasi"
                            : "Belum Bayar"}
                        </span>
                      </div>

                      {bill.proof_url && (
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] flex items-center justify-between">
                          <span className="text-slate-600 flex items-center gap-1">
                            <Receipt className="w-3.5 h-3.5 text-emerald-600" /> Bukti Transfer Warga
                          </span>
                          <span className="font-mono text-emerald-700 font-bold">Terlampir</span>
                        </div>
                      )}

                      {bill.status === "PENDING_VALIDATION" && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleValidateDues(bill.id, "REJECT")}
                            className="py-1.5 px-3 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Tolak
                          </button>
                          <button
                            onClick={() => handleValidateDues(bill.id, "APPROVE")}
                            className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" /> Sahkan & Masuk Kas RT
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BUKU KAS & LAPORAN KEUANGAN INTERNAL */}
        {activeTab === "finances" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  Buku Kas & Keuangan {isRwOfficer ? "RW 05" : `RT ${user?.rt?.number || "02"}`}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pembukuan arus kas masuk, pengeluaran operasional, dan saldo riil terverifikasi.
                </p>
              </div>
              <button
                onClick={fetchFinances}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFinance ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Financial Summary Cards with Saldo Awal */}
            {financeData?.summary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Saldo Awal */}
                <div className="p-4 rounded-2xl bg-indigo-900 text-white shadow-xs relative flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] text-indigo-200 font-medium flex items-center justify-between">
                      <span>Saldo Awal Kas</span>
                      <button
                        onClick={() => {
                          setNewInitBalance(financeData.summary.initialBalance ?? "");
                          setShowSetInitBalanceModal(true);
                        }}
                        className="px-2 py-0.5 rounded-md bg-indigo-700/80 hover:bg-indigo-600 text-[10px] text-indigo-100 font-bold transition-colors"
                      >
                        Atur Saldo
                      </button>
                    </div>
                    <div className="text-xl font-extrabold mt-1 text-indigo-100">
                      Rp {(financeData.summary.initialBalance ?? 0).toLocaleString("id-ID")}
                    </div>
                  </div>
                  <div className="text-[10px] text-indigo-300 mt-2 pt-1.5 border-t border-indigo-800">
                    Kas awal saat pelantikan/serah terima
                  </div>
                </div>

                {/* 2. Total Pemasukan */}
                <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] text-emerald-100 font-medium">Total Pemasukan Kas</div>
                    <div className="text-xl font-extrabold mt-1 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Rp {financeData.summary.totalIncome.toLocaleString("id-ID")}
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-200 mt-2 pt-1.5 border-t border-emerald-500/50">
                    Iuran warga, kas masuk & donasi
                  </div>
                </div>

                {/* 3. Total Pengeluaran */}
                <div className="p-4 rounded-2xl bg-rose-600 text-white shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] text-rose-100 font-medium">Total Pengeluaran Kas</div>
                    <div className="text-xl font-extrabold mt-1 flex items-center gap-1">
                      <TrendingDown className="w-4 h-4" />
                      Rp {financeData.summary.totalExpense.toLocaleString("id-ID")}
                    </div>
                  </div>
                  <div className="text-[10px] text-rose-200 mt-2 pt-1.5 border-t border-rose-500/50">
                    Operasional sampah, ronda & sarpras
                  </div>
                </div>

                {/* 4. Saldo Kas Riil Berjalan */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xs flex flex-col justify-between border border-emerald-500/30">
                  <div>
                    <div className="text-[11px] text-emerald-300 font-medium">Saldo Kas Bersih Riil</div>
                    <div className="text-xl font-extrabold mt-1 text-emerald-400">
                      Rp {financeData.summary.netBalance.toLocaleString("id-ID")}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-800">
                    Saldo Awal + Masuk - Keluar
                  </div>
                </div>
              </div>
            )}

            {/* MODAL ATUR SALDO AWAL */}
            {showSetInitBalanceModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <form
                  onSubmit={handleUpdateInitialBalance}
                  className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3.5 shadow-2xl animate-in zoom-in-95"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      Atur Saldo Awal Kas {isRwOfficer ? "RW 05" : `RT ${user?.rt?.number || "02"}`}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSetInitBalanceModal(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500">
                    Tetapkan saldo awal kas kepengurusan hasil serah terima jabatan (BAST) atau saldo penutupan periode sebelumnya.
                  </p>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Nominal Saldo Awal (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="Contoh: 5000000"
                      value={newInitBalance}
                      onChange={(e) => setNewInitBalance(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Catatan / Keterangan Serah Terima
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Saldo kas BAST pelantikan periode 2026-2031"
                      value={newInitNotes}
                      onChange={(e) => setNewInitNotes(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSetInitBalanceModal(false)}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingInitBalance}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      {isSubmittingInitBalance ? "Menyimpan..." : "Simpan Saldo Awal"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Form Catat Transaksi Baru */}
            <form onSubmit={handleRecordTransaction} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                Catat Transaksi Kas Baru
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Tipe</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-bold"
                  >
                    <option value="INCOME">Pemasukan (+)</option>
                    <option value="EXPENSE">Pengeluaran (-)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="Nominal"
                    value={txAmount}
                    onChange={(e) => setTxAmount(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Kategori</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Lampu Jalan / Sampah"
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Deskripsi / Uraian</label>
                  <input
                    type="text"
                    required
                    placeholder="Rincian penggunaan kas"
                    value={txDesc}
                    onChange={(e) => setTxDesc(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isRecordingTx}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                {isRecordingTx ? "Menyimpan..." : "Simpan Transaksi Kas"}
              </button>
            </form>

            {/* List of Recent Transactions */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mutasi Buku Kas Terbaru
              </div>

              {financeData?.transactions?.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4">Belum ada transaksi kas tercatat.</div>
              ) : (
                <div className="space-y-2">
                  {financeData?.transactions?.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{tx.description}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Kategori: {tx.category} • Tanggal: {tx.date}
                        </div>
                      </div>
                      <span
                        className={`font-mono font-bold text-sm ${
                          tx.type === "INCOME" ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {tx.type === "INCOME" ? "+" : "-"} Rp {tx.amount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: LAPORAN KONSOLIDASI SELURUH RT (KHUSUS PENGURUS RW) */}
        {activeTab === "rw_consolidated" && isRwOfficer && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Laporan Keuangan Konsolidasi Seluruh RT (Wilayah RW 05)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Ketua dan Kepengurusan RW dapat memantau saldo kas dan kepatuhan iuran dari seluruh unit RT binaan.
                </p>
              </div>
              <button
                onClick={fetchConsolidatedReports}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingConsolidated ? "animate-spin" : ""}`} />
              </button>
            </div>

            {isLoadingConsolidated ? (
              <div className="p-8 text-center text-xs text-slate-500">Memuat laporan konsolidasi RT...</div>
            ) : consolidatedRtReports.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                Tidak ada laporan RT yang ditemukan.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {consolidatedRtReports.map((rt) => (
                  <div
                    key={rt.rtId}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-base font-extrabold text-slate-900">
                          Rukun Tetangga (RT) {rt.rtNumber}
                        </div>
                        <div className="text-xs text-slate-500">Ketua: {rt.leaderName}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {rt.transactionCount} Mutasi
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Saldo Awal Kas:</span>
                        <span className="font-bold text-slate-800">Rp {(rt.initialBalance ?? 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pemasukan Berjalan:</span>
                        <span className="font-bold text-emerald-700">Rp {(rt.operationalIncome ?? rt.totalIncome).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pengeluaran Kas:</span>
                        <span className="font-bold text-rose-700">Rp {rt.totalExpense.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="pt-1 border-t border-slate-200 flex justify-between font-bold">
                        <span className="text-slate-900">Saldo Kas Riil:</span>
                        <span className="text-emerald-800 font-mono">Rp {rt.netBalance.toLocaleString("id-ID")}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                      <div className="flex justify-between">
                        <span>Iuran Masuk Terkumpul:</span>
                        <strong className="text-slate-800">Rp {rt.totalDuesCollected.toLocaleString("id-ID")}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Menunggu Validasi:</span>
                        <span className="text-amber-700 font-bold">{rt.pendingValidationCount} Warga</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Warga Belum Bayar:</span>
                        <span className="text-rose-700 font-bold">{rt.unpaidCount} KK</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: PENGAJUAN DANA BERJENJANG (APPROVAL RT & RW) */}
        {activeTab === "fund_requests" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Pengajuan Dana Kegiatan & Anggaran (Hierarki RT & RW)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Alur persetujuan berjenjang: Diajukan oleh RT ➔ Ditinjau Ketua RT ➔ Disetujui Pengurus RW.
                </p>
              </div>
              <button
                onClick={fetchFundRequests}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFundReqs ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Form Ajukan Dana Baru */}
            <form onSubmit={handleSubmitFundRequest} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                Buat Pengajuan Dana / Proposal Baru
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Judul Kegiatan / Pengadaan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pengadaan CCTV Gang RT 02"
                    value={newFundTitle}
                    onChange={(e) => setNewFundTitle(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Estimasi Anggaran (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="Nominal dana"
                    value={newFundAmount}
                    onChange={(e) => setNewFundAmount(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Uraian Tujuan & Manfaat untuk Warga</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Jelaskan kebutuhan pengadaan atau kegiatan lingkungan..."
                  value={newFundPurpose}
                  onChange={(e) => setNewFundPurpose(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingFundReq}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmittingFundReq ? "Mengajukan..." : "Kirimkan Proposal Pengajuan Dana"}
              </button>
            </form>

            {/* List of Fund Requests */}
            {isLoadingFundReqs ? (
              <div className="p-8 text-center text-xs text-slate-500">Memuat pengajuan dana...</div>
            ) : fundRequests.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                Belum ada pengajuan dana kegiatan.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fundRequests.map((reqItem) => (
                  <div
                    key={reqItem.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{reqItem.title}</div>
                        <div className="text-[11px] text-slate-500">
                          Wilayah RT {reqItem.rtNumber} / RW {reqItem.rwNumber} • Pemohon: {reqItem.applicantName}
                        </div>
                        <div className="text-sm font-extrabold text-emerald-800 mt-0.5">
                          Rp {reqItem.amount.toLocaleString("id-ID")}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          reqItem.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : reqItem.status === "PENDING_RW_APPROVAL"
                            ? "bg-blue-100 text-blue-900 border border-blue-300"
                            : reqItem.status === "PENDING_RT_APPROVAL"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-rose-100 text-rose-800 border border-rose-300"
                        }`}
                      >
                        {reqItem.status === "PENDING_RT_APPROVAL"
                          ? "Menunggu Approval RT"
                          : reqItem.status === "PENDING_RW_APPROVAL"
                          ? "Menunggu Approval RW"
                          : reqItem.status === "APPROVED"
                          ? "Disetujui Penuh"
                          : "Ditolak"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {reqItem.purpose}
                    </p>

                    {/* Stage 1 Action: Ketua RT reviews */}
                    {reqItem.status === "PENDING_RT_APPROVAL" && isRtOfficer && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleReviewFundRequest(reqItem.id, "REJECT")}
                          className="py-1.5 px-3 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Tolak RT
                        </button>
                        <button
                          onClick={() => handleReviewFundRequest(reqItem.id, "APPROVE")}
                          className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Setujui & Teruskan ke RW
                        </button>
                      </div>
                    )}

                    {/* Stage 2 Action: Ketua / Kepengurusan RW reviews */}
                    {reqItem.status === "PENDING_RW_APPROVAL" && isRwOfficer && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleReviewFundRequest(reqItem.id, "REJECT")}
                          className="py-1.5 px-3 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Tolak RW
                        </button>
                        <button
                          onClick={() => handleReviewFundRequest(reqItem.id, "APPROVE")}
                          className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Setujui Pencairan Dana (RW)
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: SIARAN PENGUMUMAN WARGA */}
        {activeTab === "broadcast" && (
          <div className="space-y-3">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Siarkan Pengumuman & Pemberitahuan Warga
              </h3>
              <p className="text-[11px] text-slate-500">
                Pengumuman resmi akan langsung disebarluaskan dan diterima ponsel seluruh warga.
              </p>
            </div>

            {broadcastSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                {broadcastSuccess}
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Jangkauan Penerima Pengumuman</label>
                <select
                  value={broadcastScope}
                  onChange={(e) => setBroadcastScope(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="RT_BROADCAST">Seluruh Warga RT {user?.rt?.number || "02"}</option>
                  <option value="RW_BROADCAST">Seluruh Warga RW {user?.rw?.number || "05"}</option>
                  <option value="OFFICER_ONLY">Khusus Jajaran Pengurus Lingkungan RT & RW</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  required
                  placeholder="Tuliskan judul pengumuman resmi..."
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Isi Pesan Siaran</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tuliskan isi informasi pengumuman kepada warga..."
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={isBroadcastPinned}
                  onChange={(e) => setIsBroadcastPinned(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="pinCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Sematkan di bagian teratas pengumuman (Pemberitahuan Penting)
                </label>
              </div>

              <button
                type="submit"
                disabled={isBroadcasting}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Send className="w-4 h-4" />
                {isBroadcasting ? "Mengirimkan Pengumuman..." : "Kirim Pengumuman Sekarang"}
              </button>
            </form>
          </div>
        )}

        {/* TAB 8: AUDIT LOG UU PDP */}
        {activeTab === "audit" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  Jejak Audit Kepatuhan UU PDP
                </h3>
                <p className="text-[11px] text-slate-500">
                  Log rekaman mutlak setiap akses NIK, perubahan status, dan interaksi data privasi warga.
                </p>
              </div>
              <button
                onClick={fetchAuditLogs}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAudit ? "animate-spin" : ""}`} />
              </button>
            </div>

            {isLoadingAudit ? (
              <div className="p-8 text-center text-xs text-slate-500">Memuat log audit...</div>
            ) : auditLogs.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                Belum ada catatan audit log.
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
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600">
                        Oleh: <span className="font-bold text-slate-900">{log.actorName}</span> • IP:{" "}
                        <span className="font-mono text-[10px] text-slate-400">{log.ip_address}</span>
                      </div>

                      <AuditPayloadViewer action={log.action} payload={log.payload} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 9: BUKU INDUK SENSUS PENDUDUK RT/RW */}
        {activeTab === "residents" && <MasterResidentsTab />}

        {/* TAB 10: REKONSILIASI KK VS AKUN APLIKASI */}
        {activeTab === "reconciliation" && <KkReconciliationTab />}

        {/* TAB 11: STATISTIK & MUTASI PENDUDUK */}
        {activeTab === "statistics" && <PopulationStatsTab />}

        {/* TAB 12: PENGADUAN WARGA */}
        {activeTab === "complaints" && <OfficerComplaintsTab />}

        {/* TAB 13: UNDUH & CETAK LAPORAN RESMI */}
        {activeTab === "reports" && <ReportDownloadTab />}
      </div>
    </div>
  );
}
