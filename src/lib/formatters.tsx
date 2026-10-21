import React from "react";
import {
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  UserCheck,
  FileText,
  DollarSign,
  ArrowRight,
  Info,
  Lock,
} from "lucide-react";

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Lurah / Admin Kelurahan",
  RW_CHAIR: "Ketua RW",
  RW_VICE_CHAIR: "Wakil Ketua RW",
  RW_SECRETARY: "Sekretaris RW",
  RW_TREASURER: "Bendahara RW",
  RW_SECURITY: "Koordinator Keamanan RW",
  RW_GOVERNMENT_RELATION: "Humas & Hubungan Lembaga RW",
  RW_DEVELOPMENT_INFRA: "Bidang Pembangunan & Sarpras RW",
  RW_SOCIAL_HEALTH: "Bidang Sosial & Kesehatan RW",
  RW_YOUTH_SPORTS: "Bidang Karang Taruna & Pemuda RW",
  RW_RELIGION_SPIRITUAL: "Bidang Rohani & Mental RW",
  RW_WOMEN_PKK: "Bidang Pemberdayaan PKK RW",
  RW_STAFF: "Staf Kepengurusan RW",
  RT_CHAIR: "Ketua RT",
  RT_VICE_CHAIR: "Wakil Ketua RT",
  RT_SECRETARY: "Sekretaris RT",
  RT_TREASURER: "Bendahara RT",
  RT_SECURITY: "Seksi Keamanan RT",
  RT_DEVELOPMENT: "Seksi Pembangunan RT",
  RT_SOCIAL: "Seksi Sosial RT",
  RT_YOUTH: "Seksi Pemuda RT",
  RT_RELIGION: "Seksi Keagamaan RT",
  RT_WOMEN_EMPOWERMENT: "Seksi PKK RT",
  RT_STAFF: "Pengurus RT",
  HEAD_OF_FAMILY: "Kepala Keluarga",
  RESIDENT: "Warga Tetap",
  CITIZEN: "Warga Tetap",
  PENDING: "Menunggu Verifikasi",
  SECURITY: "Petugas Keamanan Lingkungan",
};

export function formatRoleName(role?: string): string {
  if (!role) return "Warga";
  if (ROLE_LABELS[role]) return ROLE_LABELS[role];
  return role
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function formatRoleList(roles?: string[]): string {
  if (!roles || roles.length === 0) return "Warga Tetap";
  const officerRoles = roles.filter(
    (r) => r !== "RESIDENT" && r !== "CITIZEN" && r !== "HEAD_OF_FAMILY"
  );
  const targetRoles = officerRoles.length > 0 ? officerRoles : roles;
  return targetRoles.map((r) => formatRoleName(r)).join(", ");
}

export const AUDIT_ACTION_MAP: Record<
  string,
  { title: string; colorClass: string; icon: "shield" | "check" | "alert" | "file" | "dollar" }
> = {
  USER_LOGIN: {
    title: "Masuk ke Sistem",
    colorClass: "bg-blue-50 text-blue-700 border-blue-200",
    icon: "shield",
  },
  UPDATE_INITIAL_BALANCE_RW: {
    title: "Pembaruan Saldo Awal RW",
    colorClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: "dollar",
  },
  UPDATE_INITIAL_BALANCE_RT: {
    title: "Pembaruan Saldo Awal RT",
    colorClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: "dollar",
  },
  GENERATE_MONTHLY_DUES: {
    title: "Penerbitan Iuran Bulanan",
    colorClass: "bg-amber-50 text-amber-800 border-amber-200",
    icon: "file",
  },
  APPROVE_OFFICER_ELEVATION: {
    title: "Pengesahan Pengurus",
    colorClass: "bg-purple-50 text-purple-800 border-purple-200",
    icon: "check",
  },
  REJECT_OFFICER_ELEVATION: {
    title: "Penolakan Pengajuan Pengurus",
    colorClass: "bg-rose-50 text-rose-800 border-rose-200",
    icon: "alert",
  },
  REGISTER_OFFICER_APPLICANT: {
    title: "Pendaftaran Pengurus Baru",
    colorClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
    icon: "file",
  },
  APPROVE_FUND_REQUEST_STAGE_RW_FINAL: {
    title: "Pengesahan Dana (RW Final)",
    colorClass: "bg-teal-50 text-teal-800 border-teal-200",
    icon: "check",
  },
  APPROVE_FUND_REQUEST_STAGE_RT: {
    title: "Persetujuan Dana (Ketua RT)",
    colorClass: "bg-teal-50 text-teal-800 border-teal-200",
    icon: "check",
  },
  REJECT_FUND_REQUEST_STAGE_RT: {
    title: "Penolakan Pengajuan Dana (RT)",
    colorClass: "bg-rose-50 text-rose-800 border-rose-200",
    icon: "alert",
  },
  REJECT_FUND_REQUEST_STAGE_RW: {
    title: "Penolakan Pengajuan Dana (RW)",
    colorClass: "bg-rose-50 text-rose-800 border-rose-200",
    icon: "alert",
  },
  DISBURSE_FUND_REQUEST: {
    title: "Pencairan Kas Lingkungan",
    colorClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: "dollar",
  },
  APPROVE_NEW_RT_ORGANIZATION: {
    title: "Pengesahan Unit RT Baru",
    colorClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: "check",
  },
  REJECT_NEW_RT_ORGANIZATION: {
    title: "Penolakan Pendaftaran RT",
    colorClass: "bg-rose-50 text-rose-800 border-rose-200",
    icon: "alert",
  },
  VALIDATE_DUES_PAYMENT_APPROVED: {
    title: "Validasi Iuran Diterima",
    colorClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: "check",
  },
  VALIDATE_DUES_PAYMENT_REJECTED: {
    title: "Penolakan Bukti Iuran",
    colorClass: "bg-rose-50 text-rose-800 border-rose-200",
    icon: "alert",
  },
  RECORD_CASH_TRANSACTION: {
    title: "Pencatatan Buku Kas",
    colorClass: "bg-blue-50 text-blue-800 border-blue-200",
    icon: "dollar",
  },
  SYSTEM_INITIALIZE_MULTITENANT: {
    title: "Inisialisasi Sistem Terpadu",
    colorClass: "bg-slate-100 text-slate-800 border-slate-200",
    icon: "shield",
  },
  UNMASK_NIK_ACCESS: {
    title: "Pemeriksaan Privasi NIK Warga",
    colorClass: "bg-amber-50 text-amber-800 border-amber-200",
    icon: "shield",
  },
  VERIFY_RESIDENT_APPROVED: {
    title: "Verifikasi Warga Disetujui",
    colorClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: "check",
  },
  VERIFY_RESIDENT_REJECTED: {
    title: "Penolakan Berkas Warga",
    colorClass: "bg-rose-50 text-rose-800 border-rose-200",
    icon: "alert",
  },
  APPROVE_RW_ORGANIZATION: {
    title: "Pengesahan Unit RW Baru",
    colorClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: "check",
  },
  REJECT_RW_ORGANIZATION: {
    title: "Penolakan Pendaftaran RW",
    colorClass: "bg-rose-50 text-rose-800 border-rose-200",
    icon: "alert",
  },
  SUBMIT_FUND_REQUEST: {
    title: "Pengajuan Anggaran Dana",
    colorClass: "bg-sky-50 text-sky-800 border-sky-200",
    icon: "file",
  },
  BROADCAST_ANNOUNCEMENT: {
    title: "Penerbitan Pengumuman Warga",
    colorClass: "bg-teal-50 text-teal-800 border-teal-200",
    icon: "file",
  },
  ROLLOVER_5_YEAR_MANDATE: {
    title: "Serah Terima Jabatan 5 Tahun (BAST)",
    colorClass: "bg-purple-50 text-purple-800 border-purple-200",
    icon: "check",
  },
  PAY_DUES_BILL: {
    title: "Warga Membayar Iuran",
    colorClass: "bg-blue-50 text-blue-800 border-blue-200",
    icon: "dollar",
  },
  VIEW_DOCUMENT: {
    title: "Pemeriksaan Dokumen Kependudukan",
    colorClass: "bg-slate-50 text-slate-800 border-slate-200",
    icon: "file",
  },
  REGISTER_RESIDENT: {
    title: "Pendaftaran Warga Baru",
    colorClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: "check",
  },
  ADD_MASTER_RESIDENT: {
    title: "Pencatatan Data Penduduk RT",
    colorClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
    icon: "file",
  },
  UPDATE_MASTER_RESIDENT: {
    title: "Pembaruan Data Penduduk RT",
    colorClass: "bg-blue-50 text-blue-800 border-blue-200",
    icon: "file",
  },
  RECORD_RESIDENT_MUTATION: {
    title: "Pencatatan Mutasi Penduduk",
    colorClass: "bg-amber-50 text-amber-800 border-amber-200",
    icon: "alert",
  },
  SUBMIT_COMPLAINT: {
    title: "Penyampaian Pengaduan Warga",
    colorClass: "bg-rose-50 text-rose-800 border-rose-200",
    icon: "file",
  },
  RESPOND_COMPLAINT: {
    title: "Tanggapan Resmi Pengaduan",
    colorClass: "bg-teal-50 text-teal-800 border-teal-200",
    icon: "check",
  },
};

export function formatAuditAction(action: string): {
  title: string;
  colorClass: string;
  icon: "shield" | "check" | "alert" | "file" | "dollar";
} {
  if (AUDIT_ACTION_MAP[action]) {
    return AUDIT_ACTION_MAP[action];
  }
  // Fallback title formatting without raw underscores
  const cleanTitle = action
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  return {
    title: cleanTitle,
    colorClass: "bg-slate-100 text-slate-700 border-slate-200",
    icon: "file",
  };
}

/**
 * Component to display audit payload in pure Indonesian without code or JSON braces.
 */
export function AuditPayloadViewer({
  action,
  payload,
}: {
  action: string;
  payload: any;
}) {
  if (!payload || (typeof payload === "object" && Object.keys(payload).length === 0)) {
    if (action === "USER_LOGIN") {
      return (
        <div className="p-2 rounded-xl bg-slate-50 text-slate-600 text-[11px] flex items-center gap-1.5 border border-slate-100">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Sesi login berhasil diverifikasi melalui autentikasi aman.</span>
        </div>
      );
    }
    if (action === "UNMASK_NIK_ACCESS") {
      return (
        <div className="p-2 rounded-xl bg-amber-50/60 text-amber-900 text-[11px] flex items-center gap-1.5 border border-amber-100">
          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Akses privasi NIK warga diverifikasi sesuai standar UU PDP No. 27/2022.</span>
        </div>
      );
    }
    return null;
  }

  // Case 1: Initial Balance Update
  if (payload.initialBalance !== undefined) {
    return (
      <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-950 space-y-0.5">
        <div className="font-bold flex items-center gap-1.5 text-emerald-800">
          <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Saldo Awal Kas: Rp {Number(payload.initialBalance).toLocaleString("id-ID")}</span>
        </div>
        {payload.notes && (
          <div className="text-slate-600 pl-5 text-[10.5px]">
            Keterangan: <span className="font-medium text-slate-800">{payload.notes}</span>
          </div>
        )}
      </div>
    );
  }

  // Case 2: Monthly Dues Generation
  if (payload.month || payload.createdCount !== undefined) {
    return (
      <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-100 text-[11px] text-amber-950 space-y-0.5">
        <div className="font-bold flex items-center gap-1.5 text-amber-900">
          <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            Tagihan Iuran Periode: {payload.month} {payload.year}
          </span>
        </div>
        <div className="text-slate-600 pl-5 text-[10.5px] flex flex-wrap gap-x-3 gap-y-0.5">
          <span>
            Tarif: <strong className="text-slate-800">Rp {Number(payload.amount || 0).toLocaleString("id-ID")} / KK</strong>
          </span>
          {payload.createdCount !== undefined && (
            <span>
              Penerima: <strong className="text-slate-800">{payload.createdCount} Kepala Keluarga</strong>
            </span>
          )}
        </div>
      </div>
    );
  }

  // Case 3: Elevation Approval
  if (payload.requestedRole) {
    return (
      <div className="p-2 rounded-xl bg-purple-50/60 border border-purple-100 text-[11px] text-purple-950 flex items-center gap-1.5">
        <CheckCircle className="w-3.5 h-3.5 text-purple-600 shrink-0" />
        <span>
          Pengesahan Jabatan Resmi: <strong className="text-purple-900">{formatRoleName(payload.requestedRole)}</strong>
        </span>
      </div>
    );
  }

  // Case 4: Officer Registration
  if (payload.role) {
    return (
      <div className="p-2 rounded-xl bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-950 space-y-0.5">
        <div className="font-bold flex items-center gap-1.5 text-indigo-900">
          <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>Pengajuan Posisi: {formatRoleName(payload.role)} ({payload.roleLevel || "RT/RW"})</span>
        </div>
        {payload.maskedNik && (
          <div className="text-slate-600 pl-5 text-[10.5px]">
            NIK KTP Terdaftar: <span className="font-mono font-medium text-slate-800">{payload.maskedNik}</span>
          </div>
        )}
      </div>
    );
  }

  // Case 5: Fund Requests (Pengesahan Anggaran)
  if (payload.title && payload.amount !== undefined) {
    return (
      <div className="p-2 rounded-xl bg-teal-50/60 border border-teal-100 text-[11px] text-teal-950 space-y-0.5">
        <div className="font-bold flex items-center gap-1.5 text-teal-900">
          <DollarSign className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>{payload.title}</span>
        </div>
        <div className="text-slate-600 pl-5 text-[10.5px]">
          Anggaran Disetujui: <strong className="text-emerald-700">Rp {Number(payload.amount).toLocaleString("id-ID")}</strong>
        </div>
      </div>
    );
  }

  // Case 6: RT Creation / Approval
  if (payload.rtNumber) {
    return (
      <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-950 flex items-center gap-1.5">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>
          Unit Wilayah: <strong className="text-emerald-900">Rukun Tetangga (RT) {payload.rtNumber}</strong>
        </span>
      </div>
    );
  }

  // Case 7: Dues validation
  if (payload.amount !== undefined && (payload.citizenId || payload.transactionId)) {
    return (
      <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-950 flex items-center gap-1.5">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>
          Nominal Pembayaran: <strong className="text-emerald-800">Rp {Number(payload.amount).toLocaleString("id-ID")}</strong> (Telah Diverifikasi Masuk Kas)
        </span>
      </div>
    );
  }

  // Case 8: System / Notes
  if (payload.note) {
    return (
      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>Keterangan: <strong className="text-slate-800">{payload.note}</strong></span>
      </div>
    );
  }

  // Case 9: Master Resident Action
  if (payload.residentName) {
    return (
      <div className="p-2 rounded-xl bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-950 flex items-center gap-1.5">
        <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        <span>
          Warga: <strong className="text-indigo-900">{payload.residentName}</strong>
          {payload.maskedNik ? ` • NIK: ${payload.maskedNik}` : ""}
          {payload.familyRelation ? ` (${payload.familyRelation})` : ""}
        </span>
      </div>
    );
  }

  // Case 10: Complaints
  if (payload.ticketNumber) {
    return (
      <div className="p-2 rounded-xl bg-rose-50/60 border border-rose-100 text-[11px] text-rose-950 space-y-0.5">
        <div className="font-bold flex items-center gap-1.5 text-rose-900">
          <FileText className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>No. Tiket: {payload.ticketNumber} • {payload.title || "Pengaduan Warga"}</span>
        </div>
        {payload.statusNote && (
          <div className="text-slate-600 pl-5 text-[10.5px]">
            Tanggapan: <span className="font-medium text-slate-800">{payload.statusNote}</span>
          </div>
        )}
      </div>
    );
  }

  // Fallback: Elegant Key-Value Display with Indonesian Labels (Zero JSON!)
  const labelMap: Record<string, string> = {
    amount: "Jumlah",
    notes: "Catatan",
    note: "Keterangan",
    reason: "Alasan",
    rejectionReason: "Alasan Penolakan",
    rejectionNote: "Alasan Penolakan",
    category: "Kategori",
    title: "Judul",
    type: "Tipe Transaksi",
    period: "Masa Bakti",
    description: "Uraian",
  };

  const entries = Object.entries(payload).filter(
    ([k]) => !k.toLowerCase().includes("id") && typeof payload[k] !== "object"
  );

  if (entries.length === 0) {
    return (
      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[10.5px] text-slate-600">
        Rincian transaksi telah diverifikasi dan tersimpan dalam pangkalan data.
      </div>
    );
  }

  return (
    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[10.5px] text-slate-700 space-y-1">
      {entries.map(([key, val]) => {
        const displayLabel = labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
        let displayVal = String(val);
        if (typeof val === "number" && val >= 1000) {
          displayVal = "Rp " + val.toLocaleString("id-ID");
        }
        return (
          <div key={key} className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">{displayLabel}:</span>
            <span className="font-semibold text-slate-800">{displayVal}</span>
          </div>
        );
      })}
    </div>
  );
}

