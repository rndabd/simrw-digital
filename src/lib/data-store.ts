import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { encryptAES256GCM, hashBlindIndex } from "./security";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

export interface DataStoreSchema {
  system_initialized?: boolean;
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
    email?: string;
    avatar_url?: string;
    is_phone_verified?: boolean;
    is_email_verified?: boolean;
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
  emergency_contacts?: Array<{
    id: string;
    rw_id: string;
    name: string;
    category: string;
    phone: string;
    altPhone?: string;
    notes: string;
    type: "WILAYAH" | "INTERNAL";
    created_at: string;
    updated_at: string;
  }>;
  wilayah_configs?: Array<{
    rw_id: string;
    wilayah_name: string;
    notes?: string;
  }>;
  verification_otps?: Array<{
    id: string;
    target: string;
    code: string;
    type: "PHONE_VERIFICATION" | "EMAIL_VERIFICATION" | "PASSWORD_RESET";
    expires_at: string;
    created_at: string;
  }>;
}

// Initial Standard Configuration for Clean Production
function getInitialData(): DataStoreSchema {
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

  const nationalEmergencyContacts = [
    {
      id: "emg-polisi-110",
      rw_id: "GLOBAL",
      name: "Panggilan Darurat Kepolisian",
      category: "Kepolisian (Polsek/Polres)",
      phone: "110",
      notes: "Layanan bebas pulsa darurat kepolisian 24 jam",
      type: "WILAYAH" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "emg-damkar-113",
      rw_id: "GLOBAL",
      name: "Pemadam Kebakaran (Damkar)",
      category: "Pemadam Kebakaran (Damkar)",
      phone: "113",
      notes: "Penanganan kebakaran dan evakuasi satwa/bencana",
      type: "WILAYAH" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "emg-ambulans-118",
      rw_id: "GLOBAL",
      name: "Ambulans Gawat Darurat (SPGDT)",
      category: "Ambulans / Rumah Sakit",
      phone: "118",
      altPhone: "119",
      notes: "Pertolongan pertama medis gawat darurat",
      type: "WILAYAH" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "emg-bnpb-112",
      rw_id: "GLOBAL",
      name: "Layanan Tanggap Darurat Terpadu",
      category: "BPBD / Kebencanaan",
      phone: "112",
      notes: "Pusat panggilan darurat bencana & kecelakaan terpadu",
      type: "WILAYAH" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  return {
    system_initialized: false,
    rws: [],
    rts: [],
    households: [],
    users: [],
    roles,
    user_roles: [],
    officer_requests: [],
    device_tokens: [],
    announcements: [],
    audit_logs: [],
    bills: [],
    cash_transactions: [],
    fund_requests: [],
    rollovers: [],
    master_residents: [],
    complaints: [],
    emergency_contacts: nationalEmergencyContacts,
    wilayah_configs: [],
    verification_otps: [],
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
      if (!memoryStore?.rws) memoryStore!.rws = [];
      if (!memoryStore?.rts) memoryStore!.rts = [];
      if (!memoryStore?.households) memoryStore!.households = [];
      if (!memoryStore?.users) memoryStore!.users = [];
      if (!memoryStore?.roles) memoryStore!.roles = [];
      if (!memoryStore?.user_roles) memoryStore!.user_roles = [];
      if (!memoryStore?.officer_requests) memoryStore!.officer_requests = [];
      if (!memoryStore?.device_tokens) memoryStore!.device_tokens = [];
      if (!memoryStore?.announcements) memoryStore!.announcements = [];
      if (!memoryStore?.audit_logs) memoryStore!.audit_logs = [];
      if (!memoryStore?.bills) memoryStore!.bills = [];
      if (!memoryStore?.cash_transactions) memoryStore!.cash_transactions = [];
      if (!memoryStore?.fund_requests) memoryStore!.fund_requests = [];
      if (!memoryStore?.rollovers) memoryStore!.rollovers = [];
      if (!memoryStore?.master_residents) memoryStore!.master_residents = [];
      if (!memoryStore?.complaints) memoryStore!.complaints = [];
      if (!memoryStore?.emergency_contacts) memoryStore!.emergency_contacts = [];
      if (!memoryStore?.wilayah_configs) memoryStore!.wilayah_configs = [];
      if (!memoryStore?.verification_otps) memoryStore!.verification_otps = [];

      // Ensure all standard roles exist
      const initialRoles = getInitialData().roles;
      for (const r of initialRoles) {
        if (!memoryStore!.roles.some((ex) => ex.id === r.id || ex.name === r.name)) {
          memoryStore!.roles.push(r);
        }
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
