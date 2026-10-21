import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { encryptAES256GCM, hashBlindIndex } from "./security";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

export interface DataStoreSchema {
  rws: Array<{
    id: string;
    rw_number: string;
    village: string;
    district: string;
    city: string;
    status: "ACTIVE" | "PENDING_APPROVAL" | "REJECTED";
    term_period: string; // e.g. "2021-2026"
    initial_balance?: number;
    applicant_user_id?: string;
    sk_kelurahan_url?: string;
    created_at: string;
  }>;
  rts: Array<{
    id: string;
    rw_id: string;
    rt_number: string;
    term_period?: string;
    status: "ACTIVE" | "PENDING_APPROVAL" | "REJECTED";
    initial_balance?: number;
    applicant_user_id?: string;
    sk_document_url?: string;
    created_at: string;
  }>;
  households: Array<{
    id: string;
    rt_id: string;
    kk_number_hash: string;
    kk_number_enc: string;
    address_block: string;
    created_at: string;
  }>;
  users: Array<{
    id: string;
    rw_id: string;
    rt_id: string;
    household_id?: string;
    nik_hash: string;
    nik_encrypted: string;
    full_name: string;
    phone_number: string;
    password_hash: string;
    ktp_doc_url: string;
    status: "UNVERIFIED" | "PENDING_VERIFICATION" | "VERIFIED_ACTIVE" | "REJECTED" | "SUSPENDED";
    rejection_note?: string;
    verified_at?: string;
    verified_by_id?: string;
    created_at: string;
    updated_at: string;
  }>;
  roles: Array<{
    id: string;
    name: string;
    description: string;
    permissions: string[];
  }>;
  user_roles: Array<{
    id: string;
    user_id: string;
    role_id: string;
    assigned_at: string;
  }>;
  officer_requests: Array<{
    id: string;
    user_id: string;
    requested_role: string;
    target_rw_id: string;
    target_rt_id?: string;
    sk_document_url: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
    rejection_reason?: string;
    reviewed_by?: string;
    reviewed_at?: string;
    expires_at?: string;
    created_at: string;
  }>;
  device_tokens: Array<{
    id: string;
    user_id: string;
    token: string;
    platform: string;
    is_active: boolean;
    updated_at: string;
  }>;
  announcements: Array<{
    id: string;
    rw_id: string;
    rt_id?: string;
    author_id: string;
    title: string;
    content: string;
    scope: "GLOBAL_BROADCAST" | "RW_BROADCAST" | "RT_BROADCAST" | "OFFICER_ONLY" | "PERSONAL";
    attachments: string[];
    is_pinned: boolean;
    created_at: string;
  }>;
  audit_logs: Array<{
    id: string;
    user_id?: string;
    action: string;
    resource: string;
    payload?: any;
    ip_address: string;
    timestamp: string;
  }>;
  bills: Array<{
    id: string;
    user_id: string;
    rw_id: string;
    rt_id: string;
    month: string;
    year: number;
    amount: number;
    category: "IURAN_KEBERSIHAN_KEAMANAN" | "DANA_SOSIAL" | "KAS_RT";
    status: "UNPAID" | "PENDING_VALIDATION" | "PAID" | "REJECTED";
    proof_url?: string;
    paid_at?: string;
    validated_by?: string;
    validated_at?: string;
    rejection_note?: string;
  }>;
  cash_transactions: Array<{
    id: string;
    org_type: "RT" | "RW";
    rw_id: string;
    rt_id?: string;
    type: "INCOME" | "EXPENSE";
    amount: number;
    category: string;
    description: string;
    date: string;
    recorded_by: string;
    proof_doc_url?: string;
  }>;
  fund_requests: Array<{
    id: string;
    rw_id: string;
    rt_id: string;
    applicant_user_id: string;
    title: string;
    amount: number;
    purpose: string;
    document_url?: string;
    status: "PENDING_RT_APPROVAL" | "PENDING_RW_APPROVAL" | "APPROVED" | "REJECTED";
    rt_reviewed_by?: string;
    rt_reviewed_at?: string;
    rw_reviewed_by?: string;
    rw_reviewed_at?: string;
    rejection_reason?: string;
    created_at: string;
  }>;
  rollovers: Array<{
    id: string;
    target_type: "RW" | "RT";
    target_rw_id: string;
    target_rt_id?: string;
    from_user_id: string;
    to_user_id: string;
    period_from: string;
    period_to: string;
    next_period_to: string;
    closing_cash_balance: number;
    handover_notes: string;
    bast_document_url: string;
    executed_by: string;
    created_at: string;
  }>;
  master_residents: Array<{
    id: string;
    rw_id: string;
    rt_id: string;
    kk_number: string;
    nik: string;
    full_name: string;
    gender: "LAKI_LAKI" | "PEREMPUAN";
    birth_place?: string;
    birth_date: string;
    religion: "ISLAM" | "KRISTEN" | "KATOLIK" | "HINDU" | "BUDDHA" | "KONGHUCU";
    occupation: string;
    family_relation: "KEPALA_KELUARGA" | "ISTRI" | "ANAK" | "ORANG_TUA" | "FAMILI_LAIN";
    residence_status: "TETAP" | "KONTRAK" | "KOST";
    mutation_status: "AKTIF" | "PINDAH_KELUAR" | "PINDAH_MASUK" | "MENINGGAL" | "LAHIR";
    mutation_date?: string;
    mutation_note?: string;
    address_street: string;
    phone_number?: string;
    input_by: string;
    created_at: string;
    updated_at: string;
  }>;
  complaints: Array<{
    id: string;
    ticket_number: string;
    rw_id: string;
    rt_id: string;
    user_id: string;
    author_name: string;
    author_phone?: string;
    category: "KEBERSIHAN_SAMPAH" | "KEAMANAN_KETERTIBAN" | "FASILITAS_LAMPU_JALAN" | "SOSIAL_TETANGGA" | "INFRASTRUKTUR_SALURAN" | "LAINNYA";
    title: string;
    description: string;
    location: string;
    photo_url?: string;
    priority: "LOW" | "NORMAL" | "HIGH" | "EMERGENCY";
    status: "MENUNGGU" | "DIPROSES" | "SELESAI" | "DITOLAK";
    officer_response?: string;
    resolved_at?: string;
    resolved_by?: string;
    created_at: string;
    updated_at: string;
  }>;
}

// Initial Multi-RW & Multi-RT Seed Data
function getInitialData(): DataStoreSchema {
  const rw05Id = "rw-05-coblong";
  const rw08Id = "rw-08-coblong";
  const rw12Id = "rw-12-coblong";

  const rt01Rw05 = "rt-01-rw-05";
  const rt02Rw05 = "rt-02-rw-05";
  const rt03Rw05 = "rt-03-rw-05";
  const rt04Rw05 = "rt-04-rw-05";

  const rt01Rw08 = "rt-01-rw-08";
  const rt02Rw08 = "rt-02-rw-08";

  const defaultPwHash = bcrypt.hashSync("password123", 10);

  const roles = [
    {
      id: "role-super-admin",
      name: "SUPER_ADMIN",
      description: "Super Administrator Kelurahan (Kelola Seluruh RW & Rollover)",
      permissions: [
        "*",
        "citizen:verify",
        "broadcast:create",
        "audit:view",
        "officer:verify_rw",
        "officer:verify_rt",
        "rw:manage",
        "rollover:execute",
        "finance:manage",
      ],
    },
    {
      id: "role-rw-chair",
      name: "RW_CHAIR",
      description: "Ketua Rukun Warga (RW)",
      permissions: [
        "citizen:verify",
        "broadcast:create",
        "audit:view",
        "officer:verify_rt",
        "rollover:execute",
        "finance:view_all_rt",
        "fund_request:review_rw",
      ],
    },
    {
      id: "role-rw-vice-chair",
      name: "RW_VICE_CHAIR",
      description: "Wakil Ketua RW",
      permissions: [
        "citizen:verify",
        "broadcast:create",
        "audit:view",
        "officer:verify_rt",
        "finance:view_all_rt",
        "fund_request:review_rw",
      ],
    },
    {
      id: "role-rw-secretary",
      name: "RW_SECRETARY",
      description: "Sekretaris RW",
      permissions: [
        "citizen:verify",
        "broadcast:create",
        "audit:view",
        "finance:view_all_rt",
        "letter:manage",
      ],
    },
    {
      id: "role-rw-treasurer",
      name: "RW_TREASURER",
      description: "Bendahara RW",
      permissions: [
        "broadcast:create",
        "audit:view",
        "finance:view_all_rt",
        "finance:manage_rw",
      ],
    },
    {
      id: "role-rw-security",
      name: "RW_SECURITY",
      description: "Seksi Keamanan & Ketertiban RW",
      permissions: ["patrol:log", "emergency:respond", "broadcast:create"],
    },
    {
      id: "role-rw-environment",
      name: "RW_ENVIRONMENT",
      description: "Seksi Kebersihan & Lingkungan Hidup RW",
      permissions: ["broadcast:create"],
    },
    {
      id: "role-rw-development",
      name: "RW_DEVELOPMENT",
      description: "Seksi Pembangunan & Sarana Prasarana RW",
      permissions: ["broadcast:create"],
    },
    {
      id: "role-rw-relations",
      name: "RW_RELATIONS",
      description: "Seksi Hubungan Masyarakat (Humas) RW",
      permissions: ["broadcast:create"],
    },
    {
      id: "role-rw-youth",
      name: "RW_YOUTH",
      description: "Seksi Pemuda & Karang Taruna RW",
      permissions: ["broadcast:create"],
    },
    {
      id: "role-rw-social",
      name: "RW_SOCIAL",
      description: "Seksi Sosial & Kesejahteraan Warga RW",
      permissions: ["broadcast:create"],
    },
    {
      id: "role-rw-staff",
      name: "RW_STAFF",
      description: "Pengurus / Staf RW",
      permissions: ["broadcast:create", "audit:view", "finance:view_all_rt", "finance:manage_rw"],
    },
    {
      id: "role-rt-chair",
      name: "RT_CHAIR",
      description: "Ketua Rukun Tetangga (RT)",
      permissions: [
        "citizen:verify",
        "broadcast:create",
        "audit:view",
        "bill:validate",
        "finance:manage_rt",
        "fund_request:review_rt",
      ],
    },
    {
      id: "role-rt-vice-chair",
      name: "RT_VICE_CHAIR",
      description: "Wakil Ketua RT",
      permissions: [
        "citizen:verify",
        "broadcast:create",
        "audit:view",
        "bill:validate",
        "finance:manage_rt",
        "fund_request:review_rt",
      ],
    },
    {
      id: "role-rt-secretary",
      name: "RT_SECRETARY",
      description: "Sekretaris RT",
      permissions: [
        "citizen:verify",
        "broadcast:create",
        "audit:view",
        "letter:manage",
      ],
    },
    {
      id: "role-rt-treasurer",
      name: "RT_TREASURER",
      description: "Bendahara RT",
      permissions: [
        "broadcast:create",
        "bill:validate",
        "finance:manage_rt",
      ],
    },
    {
      id: "role-rt-security",
      name: "RT_SECURITY",
      description: "Seksi Keamanan RT",
      permissions: ["patrol:log", "emergency:respond", "broadcast:create"],
    },
    {
      id: "role-rt-environment",
      name: "RT_ENVIRONMENT",
      description: "Seksi Kebersihan & Pengelolaan Lingkungan RT",
      permissions: ["broadcast:create"],
    },
    {
      id: "role-rt-social",
      name: "RT_SOCIAL",
      description: "Seksi Sosial & Kerohanian RT",
      permissions: ["broadcast:create"],
    },
    {
      id: "role-rt-youth",
      name: "RT_YOUTH",
      description: "Seksi Pemuda / Karang Taruna RT",
      permissions: ["broadcast:create"],
    },
    {
      id: "role-rt-women",
      name: "RT_WOMEN",
      description: "Seksi Pemberdayaan Perempuan & PKK RT",
      permissions: ["broadcast:create"],
    },
    {
      id: "role-rt-staff",
      name: "RT_STAFF",
      description: "Pengurus / Staf RT",
      permissions: ["broadcast:create", "bill:validate", "finance:manage_rt"],
    },
    {
      id: "role-security",
      name: "SECURITY",
      description: "Petugas Keamanan Lingkungan",
      permissions: ["patrol:log", "emergency:respond"],
    },
    {
      id: "role-head-family",
      name: "HEAD_OF_FAMILY",
      description: "Kepala Keluarga Warga",
      permissions: ["citizen:read", "bill:pay", "letter:request"],
    },
    {
      id: "role-resident",
      name: "RESIDENT",
      description: "Warga Tetap / Warga Domisili",
      permissions: ["citizen:read", "bill:pay", "letter:request"],
    },
  ];

  // 1. Super Admin (Lurah Kelurahan Sukamaju)
  const userSuperAdmin = {
    id: "user-super-admin",
    rw_id: rw05Id,
    rt_id: rt02Rw05,
    nik_hash: hashBlindIndex("3273010101650009"),
    nik_encrypted: encryptAES256GCM("3273010101650009"),
    full_name: "Ibu Ratna Dewi (Lurah Sukamaju)",
    phone_number: "081100000000",
    password_hash: defaultPwHash,
    ktp_doc_url: "/uploads/ktp-lurah.jpg",
    status: "VERIFIED_ACTIVE" as const,
    verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 2. Ketua RW 05 (Budi Santoso)
  const userRwChair = {
    id: "user-rw-01",
    rw_id: rw05Id,
    rt_id: rt02Rw05,
    nik_hash: hashBlindIndex("3273010101700001"),
    nik_encrypted: encryptAES256GCM("3273010101700001"),
    full_name: "Budi Santoso",
    phone_number: "081200000001",
    password_hash: defaultPwHash,
    ktp_doc_url: "/uploads/sample-ktp-1.jpg",
    status: "VERIFIED_ACTIVE" as const,
    verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 3. Ketua RT 02 (Hendra Gunawan)
  const userRtChair = {
    id: "user-rt-01",
    rw_id: rw05Id,
    rt_id: rt02Rw05,
    household_id: "hh-02",
    nik_hash: hashBlindIndex("3273011508820002"),
    nik_encrypted: encryptAES256GCM("3273011508820002"),
    full_name: "Hendra Gunawan",
    phone_number: "081200000002",
    password_hash: defaultPwHash,
    ktp_doc_url: "/uploads/sample-ktp-2.jpg",
    status: "VERIFIED_ACTIVE" as const,
    verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 4. Warga Aktif (Siti Aminah)
  const userResident = {
    id: "user-warga-01",
    rw_id: rw05Id,
    rt_id: rt02Rw05,
    household_id: "hh-01",
    nik_hash: hashBlindIndex("3273015509930003"),
    nik_encrypted: encryptAES256GCM("3273015509930003"),
    full_name: "Siti Aminah",
    phone_number: "081200000003",
    password_hash: defaultPwHash,
    ktp_doc_url: "/uploads/sample-ktp-3.jpg",
    status: "VERIFIED_ACTIVE" as const,
    verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 5. Warga Baru Pending (Ahmad Hidayat)
  const userPending = {
    id: "user-pending-01",
    rw_id: rw05Id,
    rt_id: rt02Rw05,
    household_id: "hh-03",
    nik_hash: hashBlindIndex("3273011204980004"),
    nik_encrypted: encryptAES256GCM("3273011204980004"),
    full_name: "Ahmad Hidayat",
    phone_number: "081200000004",
    password_hash: defaultPwHash,
    ktp_doc_url: "/uploads/sample-ktp-pending.jpg",
    status: "PENDING_VERIFICATION" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 6. Calon Ketua RT 04 yang Mendaftar (H. Mulyono)
  const userApplicantRt04 = {
    id: "user-applicant-rt04",
    rw_id: rw05Id,
    rt_id: rt04Rw05,
    nik_hash: hashBlindIndex("3273011802770007"),
    nik_encrypted: encryptAES256GCM("3273011802770007"),
    full_name: "H. Mulyono (Calon Ketua RT 04)",
    phone_number: "081233445566",
    password_hash: defaultPwHash,
    ktp_doc_url: "/uploads/ktp-mulyono.jpg",
    status: "VERIFIED_ACTIVE" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    rws: [
      {
        id: rw05Id,
        rw_number: "05",
        village: "Sukamaju",
        district: "Coblong",
        city: "Kota Bandung",
        status: "ACTIVE",
        term_period: "2021-2026",
        created_at: new Date().toISOString(),
      },
      {
        id: rw08Id,
        rw_number: "08",
        village: "Sukamaju",
        district: "Coblong",
        city: "Kota Bandung",
        status: "ACTIVE",
        term_period: "2022-2027",
        created_at: new Date().toISOString(),
      },
      {
        id: rw12Id,
        rw_number: "12",
        village: "Sukamaju",
        district: "Coblong",
        city: "Kota Bandung",
        status: "PENDING_APPROVAL",
        term_period: "2026-2031",
        sk_kelurahan_url: "/uploads/sk-pemilihan-rw12.pdf",
        created_at: new Date().toISOString(),
      },
    ],
    rts: [
      {
        id: rt01Rw05,
        rw_id: rw05Id,
        rt_number: "01",
        term_period: "2021-2026",
        status: "ACTIVE",
        created_at: new Date().toISOString(),
      },
      {
        id: rt02Rw05,
        rw_id: rw05Id,
        rt_number: "02",
        term_period: "2021-2026",
        status: "ACTIVE",
        created_at: new Date().toISOString(),
      },
      {
        id: rt03Rw05,
        rw_id: rw05Id,
        rt_number: "03",
        term_period: "2021-2026",
        status: "ACTIVE",
        created_at: new Date().toISOString(),
      },
      {
        id: rt04Rw05,
        rw_id: rw05Id,
        rt_number: "04",
        term_period: "2026-2031",
        status: "PENDING_APPROVAL", // Menunggu persetujuan Ketua RW 05
        applicant_user_id: userApplicantRt04.id,
        sk_document_url: "/uploads/sk-pemilihan-rt04.pdf",
        created_at: new Date().toISOString(),
      },
      {
        id: rt01Rw08,
        rw_id: rw08Id,
        rt_number: "01",
        term_period: "2022-2027",
        status: "ACTIVE",
        created_at: new Date().toISOString(),
      },
      {
        id: rt02Rw08,
        rw_id: rw08Id,
        rt_number: "02",
        term_period: "2022-2027",
        status: "ACTIVE",
        created_at: new Date().toISOString(),
      },
    ],
    households: [
      {
        id: "hh-01",
        rt_id: rt02Rw05,
        kk_number_hash: hashBlindIndex("3273012010150001"),
        kk_number_enc: encryptAES256GCM("3273012010150001"),
        address_block: "Blok C2 No. 14",
        created_at: new Date().toISOString(),
      },
      {
        id: "hh-02",
        rt_id: rt02Rw05,
        kk_number_hash: hashBlindIndex("3273011505800002"),
        kk_number_enc: encryptAES256GCM("3273011505800002"),
        address_block: "Jl. Sukamaju Raya No. 05",
        created_at: new Date().toISOString(),
      },
      {
        id: "hh-03",
        rt_id: rt02Rw05,
        kk_number_hash: hashBlindIndex("3273012509180099"),
        kk_number_enc: encryptAES256GCM("3273012509180099"),
        address_block: "Blok Anggrek No. 17",
        created_at: new Date().toISOString(),
      },
    ],
    roles,
    users: [
      userSuperAdmin,
      userRwChair,
      userRtChair,
      userResident,
      userPending,
      userApplicantRt04,
    ],
    user_roles: [
      {
        id: "ur-0",
        user_id: userSuperAdmin.id,
        role_id: "role-super-admin",
        assigned_at: new Date().toISOString(),
      },
      {
        id: "ur-1",
        user_id: userRwChair.id,
        role_id: "role-rw-chair",
        assigned_at: new Date().toISOString(),
      },
      {
        id: "ur-2",
        user_id: userRtChair.id,
        role_id: "role-rt-chair",
        assigned_at: new Date().toISOString(),
      },
      {
        id: "ur-3",
        user_id: userResident.id,
        role_id: "role-resident",
        assigned_at: new Date().toISOString(),
      },
      {
        id: "ur-4",
        user_id: userPending.id,
        role_id: "role-resident",
        assigned_at: new Date().toISOString(),
      },
      {
        id: "ur-5",
        user_id: userApplicantRt04.id,
        role_id: "role-resident",
        assigned_at: new Date().toISOString(),
      },
    ],
    officer_requests: [],
    device_tokens: [],
    announcements: [
      {
        id: "ann-01",
        rw_id: rw05Id,
        author_id: userRwChair.id,
        title: "Kerja Bakti Massal Lingkungan RW 05",
        content:
          "Dalam rangka memasuki musim penghujan dan pencegahan genangan air, seluruh warga dihimbau mengikuti giat gotong royong membersihkan saluran air pada hari Minggu pagi pukul 07.30 WIB di pos masing-masing.",
        scope: "RW_BROADCAST",
        attachments: [],
        is_pinned: true,
        created_at: new Date(Date.now() - 86400 * 1000).toISOString(),
      },
      {
        id: "ann-02",
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        author_id: userRtChair.id,
        title: "Pemberitahuan Jadwal Ronda Malam RT 02",
        content:
          "Jadwal siskamling ronda malam RT 02 telah diperbarui untuk periode Oktober. Bapak-bapak warga diharap mengecek giliran jaga masing-masing di pos ronda.",
        scope: "RT_BROADCAST",
        attachments: [],
        is_pinned: false,
        created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
      },
    ],
    audit_logs: [
      {
        id: "audit-init-01",
        user_id: userSuperAdmin.id,
        action: "SYSTEM_INITIALIZE_MULTITENANT",
        resource: "SYSTEM",
        payload: { note: "SIM-RW Multi-Tenant, Multi-RT & Finansial Engine Ready" },
        ip_address: "127.0.0.1",
        timestamp: new Date().toISOString(),
      },
    ],
    bills: [
      {
        id: "bill-01",
        user_id: userResident.id,
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        month: "Oktober",
        year: 2026,
        amount: 50000,
        category: "IURAN_KEBERSIHAN_KEAMANAN",
        status: "PENDING_VALIDATION", // Sedang menunggu validasi bendahara RT!
        proof_url: "/uploads/bukti-transfer-siti.jpg",
        paid_at: new Date().toISOString(),
      },
      {
        id: "bill-02",
        user_id: userResident.id,
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        month: "September",
        year: 2026,
        amount: 50000,
        category: "IURAN_KEBERSIHAN_KEAMANAN",
        status: "PAID",
        paid_at: new Date(Date.now() - 86400 * 1000 * 25).toISOString(),
        validated_by: userRtChair.id,
        validated_at: new Date(Date.now() - 86400 * 1000 * 24).toISOString(),
      },
      {
        id: "bill-03",
        user_id: userPending.id,
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        month: "Oktober",
        year: 2026,
        amount: 50000,
        category: "IURAN_KEBERSIHAN_KEAMANAN",
        status: "UNPAID",
      },
    ],
    cash_transactions: [
      // KAS RT 02
      {
        id: "ctx-rt02-01",
        org_type: "RT",
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        type: "INCOME",
        amount: 2500000,
        category: "Iuran Warga",
        description: "Penerimaan iuran kebersihan & keamanan warga RT 02 September (50 KK)",
        date: "2026-09-30",
        recorded_by: userRtChair.id,
      },
      {
        id: "ctx-rt02-02",
        org_type: "RT",
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        type: "INCOME",
        amount: 700000,
        category: "Donasi / Kas Sukarela",
        description: "Donasi warga untuk penambahan lampu penerangan jalan gang C",
        date: "2026-10-05",
        recorded_by: userRtChair.id,
      },
      {
        id: "ctx-rt02-03",
        org_type: "RT",
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        type: "EXPENSE",
        amount: 1200000,
        category: "Operasional Sampah",
        description: "Biaya angkut sampah gerobak ke TPS Sukamaju bulan September",
        date: "2026-10-02",
        recorded_by: userRtChair.id,
      },
      {
        id: "ctx-rt02-04",
        org_type: "RT",
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        type: "EXPENSE",
        amount: 350000,
        category: "Perawatan Fasilitas",
        description: "Pembelian 5 bohlam LED tenaga surya untuk gang B",
        date: "2026-10-10",
        recorded_by: userRtChair.id,
      },

      // KAS RT 01 (RW 05)
      {
        id: "ctx-rt01-01",
        org_type: "RT",
        rw_id: rw05Id,
        rt_id: rt01Rw05,
        type: "INCOME",
        amount: 2800000,
        category: "Iuran Warga",
        description: "Penerimaan iuran warga RT 01",
        date: "2026-10-01",
        recorded_by: "user-rt01-chair",
      },
      {
        id: "ctx-rt01-02",
        org_type: "RT",
        rw_id: rw05Id,
        rt_id: rt01Rw05,
        type: "EXPENSE",
        amount: 1500000,
        category: "Keamanan",
        description: "Honor ronda malam satpam RT 01",
        date: "2026-10-03",
        recorded_by: "user-rt01-chair",
      },

      // KAS RT 03 (RW 05)
      {
        id: "ctx-rt03-01",
        org_type: "RT",
        rw_id: rw05Id,
        rt_id: rt03Rw05,
        type: "INCOME",
        amount: 1900000,
        category: "Iuran Warga",
        description: "Iuran warga RT 03 bulan berjalan",
        date: "2026-10-02",
        recorded_by: "user-rt03-chair",
      },
      {
        id: "ctx-rt03-02",
        org_type: "RT",
        rw_id: rw05Id,
        rt_id: rt03Rw05,
        type: "EXPENSE",
        amount: 900000,
        category: "Kebersihan",
        description: "Pembersihan parit dan rumput liar RT 03",
        date: "2026-10-08",
        recorded_by: "user-rt03-chair",
      },

      // KAS RW 05 (TINGKAT RW)
      {
        id: "ctx-rw05-01",
        org_type: "RW",
        rw_id: rw05Id,
        type: "INCOME",
        amount: 10000000,
        category: "Alokasi Dana Kelurahan",
        description: "Pencairan dana stimulus sarana prasarana Kelurahan Sukamaju semester 2",
        date: "2026-09-15",
        recorded_by: userRwChair.id,
      },
      {
        id: "ctx-rw05-02",
        org_type: "RW",
        rw_id: rw05Id,
        type: "INCOME",
        amount: 3000000,
        category: "Iuran Operasional RW",
        description: "Kontribusi kas terpadu dari unit-unit RT",
        date: "2026-10-01",
        recorded_by: userRwChair.id,
      },
      {
        id: "ctx-rw05-03",
        org_type: "RW",
        rw_id: rw05Id,
        type: "EXPENSE",
        amount: 4000000,
        category: "Sarana Lingkungan RW",
        description: "Perbaikan portal gerbang utama dan pengecatan pos kamling induk RW 05",
        date: "2026-10-06",
        recorded_by: userRwChair.id,
      },
    ],
    fund_requests: [
      {
        id: "freq-01",
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        applicant_user_id: userRtChair.id,
        title: "Pengadaan 4 Titik CCTV Lingkungan Gang RT 02",
        amount: 2400000,
        purpose: "Peningkatan keamanan warga pasca maraknya pencurian sepeda di gang sempit.",
        document_url: "/uploads/rab-cctv-rt02.pdf",
        status: "PENDING_RW_APPROVAL", // Sudah diajukan & disetujui RT, menunggu approval Ketua RW Budi!
        rt_reviewed_by: userRtChair.id,
        rt_reviewed_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
        created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
      },
      {
        id: "freq-02",
        rw_id: rw05Id,
        rt_id: rt01Rw05,
        applicant_user_id: "user-rt01-chair",
        title: "Penyemprotan Fogging Demam Berdarah RT 01",
        amount: 1500000,
        purpose: "Pencegahan DBD karena ada 2 warga yang terkena demam berdarah.",
        document_url: "/uploads/rab-fogging.pdf",
        status: "APPROVED", // Telah disetujui RT dan RW
        rt_reviewed_by: "user-rt01-chair",
        rt_reviewed_at: new Date(Date.now() - 86400 * 1000 * 10).toISOString(),
        rw_reviewed_by: userRwChair.id,
        rw_reviewed_at: new Date(Date.now() - 86400 * 1000 * 9).toISOString(),
        created_at: new Date(Date.now() - 86400 * 1000 * 12).toISOString(),
      },
    ],
    rollovers: [
      {
        id: "rollover-prev-01",
        target_type: "RW",
        target_rw_id: rw05Id,
        from_user_id: "user-rw-past-01",
        to_user_id: userRwChair.id,
        period_from: "2016",
        period_to: "2021",
        next_period_to: "2026",
        closing_cash_balance: 14500000,
        handover_notes: "Serah terima kas saldo awal, inventaris balai warga 120 kursi lipat & 4 tenda, dan 2 unit mesin rumput.",
        bast_document_url: "/uploads/bast-rw05-2021.pdf",
        executed_by: userSuperAdmin.id,
        created_at: new Date("2021-08-17T10:00:00Z").toISOString(),
      },
    ],
    master_residents: [
      // KK 1: Keluarga Supriyadi & Siti Aminah (MATCHED / TERDAFTAR APLIKASI - Siti Aminah akun aktif)
      {
        id: "res-01",
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        kk_number: "3273012010150001",
        nik: "3273011205800001",
        full_name: "Supriyadi",
        gender: "LAKI_LAKI",
        birth_place: "Bandung",
        birth_date: "1980-05-12",
        religion: "ISLAM",
        occupation: "Karyawan Swasta",
        family_relation: "KEPALA_KELUARGA",
        residence_status: "TETAP",
        mutation_status: "AKTIF",
        address_street: "Jl. Sukamaju Gang Melati Blok C2 No. 14",
        phone_number: "081299990001",
        input_by: userRtChair.id,
        created_at: new Date(Date.now() - 86400 * 1000 * 60).toISOString(),
        updated_at: new Date(Date.now() - 86400 * 1000 * 60).toISOString(),
      },
      {
        id: "res-02",
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        kk_number: "3273012010150001",
        nik: "3273012010850002",
        full_name: "Siti Aminah",
        gender: "PEREMPUAN",
        birth_place: "Bandung",
        birth_date: "1985-10-20",
        religion: "ISLAM",
        occupation: "Wiraswasta",
        family_relation: "ISTRI",
        residence_status: "TETAP",
        mutation_status: "AKTIF",
        address_street: "Jl. Sukamaju Gang Melati Blok C2 No. 14",
        phone_number: "081200000003",
        input_by: userRtChair.id,
        created_at: new Date(Date.now() - 86400 * 1000 * 60).toISOString(),
        updated_at: new Date(Date.now() - 86400 * 1000 * 60).toISOString(),
      },
      {
        id: "res-03",
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        kk_number: "3273012010150001",
        nik: "3273011508120003",
        full_name: "Rizky Pratama",
        gender: "LAKI_LAKI",
        birth_place: "Bandung",
        birth_date: "2012-08-15",
        religion: "ISLAM",
        occupation: "Pelajar",
        family_relation: "ANAK",
        residence_status: "TETAP",
        mutation_status: "AKTIF",
        address_street: "Jl. Sukamaju Gang Melati Blok C2 No. 14",
        input_by: userRtChair.id,
        created_at: new Date(Date.now() - 86400 * 1000 * 60).toISOString(),
        updated_at: new Date(Date.now() - 86400 * 1000 * 60).toISOString(),
      },

      // KK 2: Keluarga Hendra Gunawan (Pak RT 02) (MATCHED / TERDAFTAR APLIKASI)
      {
        id: "res-04",
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        kk_number: "3273011505800002",
        nik: "3273011003780004",
        full_name: "Hendra Gunawan",
        gender: "LAKI_LAKI",
        birth_place: "Garut",
        birth_date: "1978-03-10",
        religion: "ISLAM",
        occupation: "Pegawai Negeri Sipil (PNS)",
        family_relation: "KEPALA_KELUARGA",
        residence_status: "TETAP",
        mutation_status: "AKTIF",
        address_street: "Jl. Sukamaju Raya No. 05 RT 02",
        phone_number: "081200000002",
        input_by: userRtChair.id,
        created_at: new Date(Date.now() - 86400 * 1000 * 90).toISOString(),
        updated_at: new Date(Date.now() - 86400 * 1000 * 90).toISOString(),
      },
      {
        id: "res-05",
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        kk_number: "3273011505800002",
        nik: "3273012507810005",
        full_name: "Ratna Sari",
        gender: "PEREMPUAN",
        birth_place: "Bandung",
        birth_date: "1981-07-25",
        religion: "ISLAM",
        occupation: "Guru",
        family_relation: "ISTRI",
        residence_status: "TETAP",
        mutation_status: "AKTIF",
        address_street: "Jl. Sukamaju Raya No. 05 RT 02",
        input_by: userRtChair.id,
        created_at: new Date(Date.now() - 86400 * 1000 * 90).toISOString(),
        updated_at: new Date(Date.now() - 86400 * 1000 * 90).toISOString(),
      },

      // KK 3: Keluarga Bambang Sudarmono (BELUM TERDAFTAR APLIKASI SAMA SEKALI)
      {
        id: "res-06",
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        kk_number: "3273010408750003",
        nik: "3273010408750006",
        full_name: "Bambang Sudarmono",
        gender: "LAKI_LAKI",
        birth_place: "Semarang",
        birth_date: "1975-08-04",
        religion: "ISLAM",
        occupation: "Wiraswasta Otomotif",
        family_relation: "KEPALA_KELUARGA",
        residence_status: "TETAP",
        mutation_status: "AKTIF",
        address_street: "Gang Kenanga Blok B3 No. 08 RT 02",
        phone_number: "081322001188",
        input_by: userRtChair.id,
        created_at: new Date(Date.now() - 86400 * 1000 * 45).toISOString(),
        updated_at: new Date(Date.now() - 86400 * 1000 * 45).toISOString(),
      },
      {
        id: "res-07",
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        kk_number: "3273010408750003",
        nik: "3273011409770007",
        full_name: "Lestari Rahayu",
        gender: "PEREMPUAN",
        birth_place: "Solo",
        birth_date: "1977-09-14",
        religion: "ISLAM",
        occupation: "Ibu Rumah Tangga",
        family_relation: "ISTRI",
        residence_status: "TETAP",
        mutation_status: "AKTIF",
        address_street: "Gang Kenanga Blok B3 No. 08 RT 02",
        input_by: userRtChair.id,
        created_at: new Date(Date.now() - 86400 * 1000 * 45).toISOString(),
        updated_at: new Date(Date.now() - 86400 * 1000 * 45).toISOString(),
      },
      {
        id: "res-08",
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        kk_number: "3273010408750003",
        nik: "3273011802050008",
        full_name: "Farhan Sudarmono",
        gender: "LAKI_LAKI",
        birth_place: "Bandung",
        birth_date: "2005-02-18",
        religion: "ISLAM",
        occupation: "Mahasiswa",
        family_relation: "ANAK",
        residence_status: "TETAP",
        mutation_status: "AKTIF",
        address_street: "Gang Kenanga Blok B3 No. 08 RT 02",
        input_by: userRtChair.id,
        created_at: new Date(Date.now() - 86400 * 1000 * 45).toISOString(),
        updated_at: new Date(Date.now() - 86400 * 1000 * 45).toISOString(),
      },

      // KK 4: Keluarga Ibu Sri Wahyuni (Lansia / Belum Ada Akun Aplikasi)
      {
        id: "res-09",
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        kk_number: "3273011212600004",
        nik: "3273015212580009",
        full_name: "Sri Wahyuni",
        gender: "PEREMPUAN",
        birth_place: "Yogyakarta",
        birth_date: "1958-12-12",
        religion: "ISLAM",
        occupation: "Pensiunan",
        family_relation: "KEPALA_KELUARGA",
        residence_status: "TETAP",
        mutation_status: "AKTIF",
        address_street: "Gang Bougenville Blok A1 No. 02 RT 02",
        phone_number: "081566778899",
        input_by: userRtChair.id,
        created_at: new Date(Date.now() - 86400 * 1000 * 30).toISOString(),
        updated_at: new Date(Date.now() - 86400 * 1000 * 30).toISOString(),
      },

      // KK 5: Mutasi Pindah Keluar
      {
        id: "res-10",
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        kk_number: "3273010804820005",
        nik: "3273010804820010",
        full_name: "Dedi Mulyadi",
        gender: "LAKI_LAKI",
        birth_place: "Subang",
        birth_date: "1982-04-08",
        religion: "ISLAM",
        occupation: "BUMN",
        family_relation: "KEPALA_KELUARGA",
        residence_status: "KONTRAK",
        mutation_status: "PINDAH_KELUAR",
        mutation_date: "2026-09-15",
        mutation_note: "Pindah tugas kedinasan ke Jakarta Selatan",
        address_street: "Rumah Kontrakan No. 22 RT 02",
        input_by: userRtChair.id,
        created_at: new Date(Date.now() - 86400 * 1000 * 120).toISOString(),
        updated_at: new Date(Date.now() - 86400 * 1000 * 35).toISOString(),
      },

      // KK 6: Mutasi Pindah Masuk (Warga Baru Datang)
      {
        id: "res-11",
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        kk_number: "3273012209900006",
        nik: "3273012209900011",
        full_name: "Rudi Hermawan",
        gender: "LAKI_LAKI",
        birth_place: "Surabaya",
        birth_date: "1990-09-22",
        religion: "KRISTEN",
        occupation: "Arsitek",
        family_relation: "KEPALA_KELUARGA",
        residence_status: "KONTRAK",
        mutation_status: "PINDAH_MASUK",
        mutation_date: "2026-10-02",
        mutation_note: "Pindah domisili dari Surabaya, SK Pindah Lengkap",
        address_street: "Gang Cempaka Blok D1 No. 04 RT 02",
        phone_number: "081788990011",
        input_by: userRtChair.id,
        created_at: new Date(Date.now() - 86400 * 1000 * 18).toISOString(),
        updated_at: new Date(Date.now() - 86400 * 1000 * 18).toISOString(),
      },
    ],
    complaints: [
      {
        id: "comp-01",
        ticket_number: "ADU-202610-001",
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        user_id: userResident.id,
        author_name: "Siti Aminah",
        author_phone: "081200000003",
        category: "FASILITAS_LAMPU_JALAN",
        title: "Lampu Penerangan Jalan Gang Mawar 3 Mati Total",
        description: "Lampu jalan tiang depan rumah No. 12 sudah 3 malam mati, jalanan gang jadi gelap gulita dan rawan terpeleset saat hujan.",
        location: "Depan rumah No. 12 Gang Mawar RT 02",
        photo_url: "/uploads/lampu-jalan-mati.jpg",
        priority: "NORMAL",
        status: "DIPROSES",
        officer_response: "Petugas seksi sarpras RT 02 telah membeli bohlam LED baru dan dijadwalkan dipasang sore ini bersama petugas PLN setempat.",
        created_at: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
        updated_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
      },
      {
        id: "comp-02",
        ticket_number: "ADU-202610-002",
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        user_id: userResident.id,
        author_name: "Siti Aminah",
        author_phone: "081200000003",
        category: "KEBERSIHAN_SAMPAH",
        title: "Tumpukan Sampah Liar Dekat Lapangan Bulutangkis",
        description: "Ada pembuangan sampah liar di pinggir pagar lapangan bulutangkis, menimbulkan bau busuk dan lalat.",
        location: "Sebelah barat lapangan badminton RT 02",
        priority: "HIGH",
        status: "SELESAI",
        officer_response: "Sudah diangkut oleh tim kebersihan truk sampah kelurahan pukul 09.00 WIB pagi tadi. Warga dihimbau tidak membuang sampah di lokasi tersebut.",
        resolved_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        resolved_by: userRtChair.id,
        created_at: new Date(Date.now() - 86400 * 1000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      },
      {
        id: "comp-03",
        ticket_number: "ADU-202610-003",
        rw_id: rw05Id,
        rt_id: rt02Rw05,
        user_id: userRtChair.id,
        author_name: "Hendra Gunawan",
        author_phone: "081200000002",
        category: "KEAMANAN_KETERTIBAN",
        title: "Kendaraan Knalpot Brong Bising Melewati Gang Malam Hari",
        description: "Sering ada pemuda luar melintas tengah malam dengan knalpot brong bising yang mengganggu istirahat warga lansia dan balita.",
        location: "Portal gerbang masuk RW 05",
        priority: "NORMAL",
        status: "MENUNGGU",
        created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
      },
    ],
  };
}

let memoryStore: DataStoreSchema | null = null;

export function getStore(): DataStoreSchema {
  if (memoryStore) return memoryStore;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(STORE_FILE)) {
    try {
      const content = fs.readFileSync(STORE_FILE, "utf-8");
      memoryStore = JSON.parse(content);
      if (!memoryStore?.cash_transactions) memoryStore!.cash_transactions = [];
      if (!memoryStore?.fund_requests) memoryStore!.fund_requests = [];
      if (!memoryStore?.rollovers) memoryStore!.rollovers = [];

      // Ensure all standard roles exist
      const initialRoles = getInitialData().roles;
      for (const r of initialRoles) {
        if (!memoryStore!.roles.some((ex) => ex.id === r.id || ex.name === r.name)) {
          memoryStore!.roles.push(r);
        }
      }

      // Ensure Saldo Awal on RW & RT
      for (const rw of memoryStore!.rws) {
        if (rw.initial_balance === undefined) {
          rw.initial_balance = rw.rw_number === "05" ? 15000000 : 10000000;
        }
      }
      for (const rt of memoryStore!.rts) {
        if (rt.initial_balance === undefined) {
          rt.initial_balance = rt.rt_number === "02" ? 5000000 : 3000000;
        }
      }

      // Ensure Initial Balance transactions in cash_transactions
      const hasRt02Init = memoryStore!.cash_transactions.some(
        (t) => t.category === "Saldo Awal Kas" && t.rt_id === "rt-02-rw-05"
      );
      if (!hasRt02Init) {
        memoryStore!.cash_transactions.unshift({
          id: "ctx-rt02-init",
          org_type: "RT",
          rw_id: "rw-05-coblong",
          rt_id: "rt-02-rw-05",
          type: "INCOME",
          amount: 5000000,
          category: "Saldo Awal Kas",
          description: "Saldo awal kas kepengurusan RT 02 masa bakti 2021-2026",
          date: "2021-08-17",
          recorded_by: "user-super-admin",
        });
      }

      const hasRw05Init = memoryStore!.cash_transactions.some(
        (t) => t.category === "Saldo Awal Kas" && t.rw_id === "rw-05-coblong" && t.org_type === "RW"
      );
      if (!hasRw05Init) {
        memoryStore!.cash_transactions.unshift({
          id: "ctx-rw05-init",
          org_type: "RW",
          rw_id: "rw-05-coblong",
          type: "INCOME",
          amount: 15000000,
          category: "Saldo Awal Kas",
          description: "Saldo awal kas kepengurusan RW 05 hasil serah terima BAST",
          date: "2021-08-17",
          recorded_by: "user-super-admin",
        });
      }

      // Ensure Master Residents & Complaints exist
      if (!memoryStore!.master_residents || memoryStore!.master_residents.length === 0) {
        memoryStore!.master_residents = getInitialData().master_residents;
      }
      if (!memoryStore!.complaints || memoryStore!.complaints.length === 0) {
        memoryStore!.complaints = getInitialData().complaints;
      }
      // Ensure households for reconciliation exist
      const initialHh = getInitialData().households;
      for (const h of initialHh) {
        if (!memoryStore!.households.some((ex) => ex.id === h.id)) {
          memoryStore!.households.push(h);
        }
      }
      const rtChairUser = memoryStore!.users.find((u) => u.id === "user-rt-01");
      if (rtChairUser && !rtChairUser.household_id) {
        rtChairUser.household_id = "hh-02";
      }
      const residentUser = memoryStore!.users.find((u) => u.id === "user-warga-01");
      if (residentUser && !residentUser.household_id) {
        residentUser.household_id = "hh-01";
      }
      const pendingUser = memoryStore!.users.find((u) => u.id === "user-pending-01");
      if (pendingUser && !pendingUser.household_id) {
        pendingUser.household_id = "hh-03";
      }

      return memoryStore!;
    } catch (e) {
      console.warn("Failed to read store.json, reinitializing initial data");
    }
  }

  memoryStore = getInitialData();
  saveStore(memoryStore);
  return memoryStore;
}

export function saveStore(store: DataStoreSchema): void {
  memoryStore = store;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
}
