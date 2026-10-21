# MISSION BRIEF: SISTEM INFORMASI & APLIKASI WARGA DIGITAL (SIM-RW)
# ARCHITECTURE: HIGH-PERFORMANCE, LIGHTWEIGHT, SECURE RBAC & UU PDP COMPLIANT
# UI/UX IDENTITY: MODERN CIVIC EXPERIENCE (HANGAT, BERSIH, RAMAH WARGA, INTUITIF)

---

## 1. TECH STACK & PERFORMANCE BUDGET (LIGHTWEIGHT & FAST)
Aplikasi ini wajib memiliki waktu muat kilat (< 1.5s First Contentful Paint), ukuran bundle ultra-ringan, dan hemat penggunaan memori/kuota warga:

* **Frontend / Mobile Client:**
  - **Pilihan Stack:** React Native (Expo SDK dengan File-based routing) atau Flutter (AOT compiled, rendering Skia/Impeller) ATAU Web App/PWA (Next.js App Router / Vite + React 19).
  - **Styling & Design System:** Tailwind CSS / NativeWind dengan komponen headless minimalis (misal: Radix UI / Shadcn UI).
  - **State Management & Caching:** TanStack Query (React Query) dengan *stale-while-revalidate* agresif, optimasi offline-first, dan zero runtime CSS overhead.
  - **Performance Rules:** Hindari library animasi berat (jangan gunakan Lottie berlebihan; utamakan CSS transitions / lightweight springs). Asset gambar wajib format WebP/AVIF dengan kompresi otomatis.

* **Backend & Database:**
  - **Runtime & Framework:** Node.js (Fastify / NestJS Fastify Adapter) atau Go (Fiber / Gin) untuk throughput tinggi dan latency rendah (< 50ms per request).
  - **Database:** PostgreSQL 15+ dengan indexing teroptimasi (B-Tree & Hash index). ORM: Prisma atau Drizzle ORM.
  - **Cache & Message Broker:** Redis 7+ (Upstash / standalone) untuk session, rate limiting, dan antrean pengiriman notifikasi (BullMQ).
  - **Storage:** S3 Compatible (MinIO, Cloudflare R2, atau AWS S3) dengan Pre-signed URL berdurasi singkat (TTL: 5 menit).

---

## 2. PANDUAN UI/UX: MODERN CIVIC DESIGN ("TEMA WARGA")
UI harus terasa modern seperti aplikasi perbankan digital/super-app terkemuka, namun tetap membumi, hangat, dan sangat mudah digunakan bahkan oleh warga lansia.

* **Color Palette:**
  - **Primary (Civic Green):** `Emerald 600` (`#059669`) — melambangkan ketenteraman, keasrian lingkungan warga, dan transparansi.
  - **Primary Soft:** `Emerald 50` (`#ECFDF5`) — background aksen kartu & status aktif.
  - **Secondary / Accent:** `Warm Amber 500` (`#F59E0B`) — untuk pengumuman penting, ronda malam, dan iuran tertunda.
  - **Surface & Background:** Warm Off-White (`#F8FAFC` atau `#FAFAF9`) dan Pure White (`#FFFFFF`). Hindari latar belakang abu-abu kusam.
  - **Text & Contrast:** `Slate 900` (`#0F172A`) untuk heading dan `Slate 600` (`#475569`) untuk body. Kontras rasio teks minimal 4.5:1 (WCAG AA).

* **Tipografi & Hirarki:**
  - Font: **Plus Jakarta Sans** atau **Inter** (modern, rapi, dan mudah dibaca pada layar kecil).
  - Ukuran minimum teks isi: `14px` - `16px`. Target sentuh tombol (*touch target*) minimal `48x48 dp`.

* **Desain Komponen Kunci:**
  - **Header Dashboard Warga:** Sapaan hangat personal ("Selamat Pagi, Pak Randi 👋") disertai status identitas: pill badge `RT 02 / RW 05 - Warga Tetap`.
  - **Kartu Identitas Digital (E-KTP Mini):** Card ringkas berisi Nama, Blok/Nomor Rumah, dan status verifikasi akun (dengan tombol "Tampilkan NIK Terverifikasi" yang disensor secara default).
  - **Quick Action Grid (4-6 ikon utama):** Pengajuan Surat, Bayar Iuran, Lapor Masalah, Tombol Darurat, Info RW, Kontak Pengurus.
  - **Timeline Pengumuman:** Feed bergaya kartu vertikal dengan kategori jelas (Pengumuman, Agenda Ronda, Laporan Finansial) dan penanda "Baru dibaca / Belum dibaca".
  - **Empty States & Loading:** Skeleton loader ringan (hindari spinner berputar membosankan) dengan ilustrasi warga sederhana dan teks ramah santun.

---

## 3. DOMAIN MODEL & DATABASE SCHEMA (PRISMA ORM)
Database wajib mematuhi UU Pelindungan Data Pribadi (UU PDP). NIK tidak boleh tersimpan dalam bentuk plain text.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum UserStatus {
  UNVERIFIED
  PENDING_VERIFICATION
  VERIFIED_ACTIVE
  REJECTED
  SUSPENDED
}

enum RoleType {
  SUPER_ADMIN
  RW_CHAIR
  RW_STAFF
  RT_CHAIR
  RT_STAFF
  SECURITY
  HEAD_OF_FAMILY
  RESIDENT
}

enum ElevationStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}

enum ScopeNotification {
  GLOBAL_BROADCAST
  RW_BROADCAST
  RT_BROADCAST
  OFFICER_ONLY
  PERSONAL
}

model OrganizationRW {
  id          String           @id @default(uuid())
  rw_number   String           // e.g. "05"
  village     String           // Kelurahan
  district    String           // Kecamatan
  city        String           // Kota/Kabupaten
  rt_units    OrganizationRT[]
  users       User[]
  announcements Announcement[]
  created_at  DateTime         @default(now())
}

model OrganizationRT {
  id          String         @id @default(uuid())
  rw_id       String
  rt_number   String         // e.g. "02"
  rw          OrganizationRW @relation(fields: [rw_id], references: [id])
  users       User[]
  households  Household[]
  created_at  DateTime       @default(now())

  @@unique([rw_id, rt_number])
}

model Household {
  id              String         @id @default(uuid())
  rt_id           String
  kk_number_hash  String         @unique // HMAC-SHA256 untuk index pencarian
  kk_number_enc   String         // AES-256-GCM Terenkripsi
  address_block   String         // Alamat / No. Rumah
  rt              OrganizationRT @relation(fields: [rt_id], references: [id])
  members         User[]
  created_at      DateTime       @default(now())
}

model User {
  id              String         @id @default(uuid())
  rw_id           String
  rt_id           String
  household_id    String?

  // PII (Data Pribadi Terlindungi UU PDP)
  nik_hash        String         @unique // HMAC-SHA256 Blind Index
  nik_encrypted   String         // AES-256-GCM Ciphertext
  full_name       String
  phone_number    String         @unique
  password_hash   String
  ktp_doc_url     String         // Lokasi file di private storage bucket
  
  status          UserStatus     @default(UNVERIFIED)
  rejection_note  String?
  verified_at     DateTime?
  verified_by_id  String?

  rw              OrganizationRW @relation(fields: [rw_id], references: [id])
  rt              OrganizationRT @relation(fields: [rt_id], references: [id])
  household       Household?     @relation(fields: [household_id], references: [id])
  roles           UserRoleMapping[]
  officer_requests OfficerElevationRequest[]
  device_tokens   DeviceToken[]
  audit_logs      AuditLog[]

  created_at      DateTime       @default(now())
  updated_at      DateTime       @updatedAt
}

model Role {
  id          String            @id @default(uuid())
  name        RoleType          @unique
  description String
  permissions RolePermission[]
  users       UserRoleMapping[]
}

model RolePermission {
  id         String   @id @default(uuid())
  role_id    String
  permission String   // Contoh: "citizen:verify", "broadcast:create", "audit:view"
  role       Role     @relation(fields: [role_id], references: [id])
}

model UserRoleMapping {
  id         String   @id @default(uuid())
  user_id    String
  role_id    String
  user       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  role       Role     @relation(fields: [role_id], references: [id])
  assigned_at DateTime @default(now())

  @@unique([user_id, role_id])
}

model OfficerElevationRequest {
  id              String          @id @default(uuid())
  user_id         String
  requested_role  RoleType
  target_rw_id    String
  target_rt_id    String?
  sk_document_url String          // Dokumen bukti SK / Berita Acara Pelantikan
  status          ElevationStatus @default(PENDING)
  rejection_reason String?
  reviewed_by     String?
  reviewed_at     DateTime?
  expires_at      DateTime?

  user            User            @relation(fields: [user_id], references: [id])
  created_at      DateTime        @default(now())
}

model DeviceToken {
  id          String   @id @default(uuid())
  user_id     String
  token       String   @unique
  platform    String   // "ANDROID", "IOS", "WEB"
  is_active   Boolean  @default(true)
  user        User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  updated_at  DateTime @updatedAt
}

model Announcement {
  id          String            @id @default(uuid())
  rw_id       String
  rt_id       String?
  author_id   String
  title       String
  content     String
  scope       ScopeNotification
  attachments String[]
  is_pinned   Boolean           @default(false)
  created_at  DateTime          @default(now())
  rw          OrganizationRW    @relation(fields: [rw_id], references: [id])
}

model AuditLog {
  id          String   @id @default(uuid())
  user_id     String?
  action      String   // e.g. "VIEW_UNMASKED_NIK", "APPROVE_RESIDENT"
  resource    String
  payload     Json?
  ip_address  String
  timestamp   DateTime @default(now())
  user        User?    @relation(fields: [user_id], references: [id])
}
4. LOGIKA SISTEM UTAMA (CORE WORKFLOWS)
4.1 Registrasi Warga & Verifikasi NIK Berjenjang
Warga input Form Pendaftaran: NIK, No KK, Nama Lengkap, Nomor HP, Kata Sandi, Pilihan RW/RT, Alamat Rumah/Blok, dan unggahan foto fisik KTP.

Sistem memvalidasi format NIK (16 digit angka dengan checksum kewilayahan).

NIK & No KK dienkripsi menggunakan AES-256-GCM ke kolom nik_encrypted. Nilai hash blind-index dibuat di kolom nik_hash untuk memastikan NIK tidak dapat didaftarkan dua kali.

User tersimpan dengan status UNVERIFIED.

Worker mengirim notifikasi real-time push ke Ketua RT setempat: "Ada pendaftaran warga baru di Blok [X] menunggu persetujuan Anda."

Ketua RT membuka dashboard, mengecek data dan foto KTP (via pre-signed URL yang hangus dalam 5 menit).

Jika valid, RT menekan tombol "Setujui". Status akun berubah menjadi VERIFIED_ACTIVE, peran default RESIDENT atau HEAD_OF_FAMILY otomatis disematkan, dan token perangkat warga didaftarkan ke topic push notification RT & RW.

4.2 Alur Pengajuan Pengurus (Officer Elevation)
Syarat Mutlak: Pengguna wajib sudah berstatus VERIFIED_ACTIVE sebagai warga.

Pengguna mengakses menu profil: "Pengajuan Kepengurusan Lingkungan".

Pengguna memilih peran yang diajukan (Ketua RT, Sekretaris RT, Bendahara RT, Pengurus RW, atau Satpam/Keamanan) dan mengunggah dokumen SK pengangkatan/Surat Tugas/Berita Acara pemilihan.

Status pengajuan masuk ke status PENDING.

Hierarki Verifikasi Jabatan:

Tingkat RT: Ditinjau dan disetujui langsung oleh Ketua RW atau Sekretaris RW terkait.

Tingkat RW: Ditinjau dan disetujui oleh Super Admin (Kelurahan/Admin Sistem).

Saat pengajuan disetujui:

Data otomatis dicatat ke tabel UserRoleMapping.

Token perangkat pengguna didaftarkan ke topic FCM khusus pengurus (rt_{id}_officers atau rw_{id}_officers).

Tampilan UI aplikasi pengguna otomatis beralih menampilkan "Panel Mode Pengurus" (Toggle switch dari Warga Mode ke Pengurus Mode).

5. ARSITEKTUR NOTIFIKASI TERARAH (FCM TOPICS & FAN-OUT PIPELINE)
Semua notifikasi pengumuman, tagihan, dan darurat dikirimkan secara instan via Firebase Cloud Messaging (FCM HTTP v1 API) menggunakan BullMQ Queue:

Topik Standar:

rw_{rw_id}_all: Menjangkau seluruh warga & pengurus dalam 1 RW tanpa query lambat ke database.

rt_{rt_id}_all: Menjangkau seluruh warga & pengurus dalam 1 RT tertentu.

rw_{rw_id}_officers: Hanya pengurus RW.

rt_{rt_id}_officers: Hanya pengurus RT.

user_{user_id}: Notifikasi privat (hasil verifikasi NIK, tagihan pribadi, surat pengantar selesai).

6. LANGKAH PENGERJAAN MANDIRI (DEVELOPER AI EXECUTION ROADMAP)
Jalankan pengerjaan aplikasi ini dengan urutan implementasi berikut:

Modul 1: Database & Security Engine

Buat file skema Prisma di atas, jalankan migrasi PostgreSQL.

Buat helper enkripsi 2 arah (AES-256-GCM) dan HMAC-SHA256 untuk hashing NIK/KK.

Pasang interceptor/middleware untuk masking NIK otomatis (327301******1234) pada response JSON.

Modul 2: Authentication & RBAC Service

Implementasikan registrasi akun dengan upload file KTP ke private storage.

Implementasikan autentikasi JWT token (Access Token 15 menit, Refresh Token 7 hari).

Buat RBAC Guard untuk membatasi endpoint berdasarkan daftar permission.

Modul 3: Onboarding & Verifikasi Warga

Endpoint daftar antrean warga baru untuk Ketua RT (GET /api/v1/officer/residents/pending).

Endpoint approval/rejection warga baru (PATCH /api/v1/officer/residents/:id/verify).

Pencatatan Audit Log setiap kali KTP/NIK dibuka oleh pengurus.

Modul 4: Pengajuan & Approval Kepengurusan

Endpoint pengajuan peran pengurus (POST /api/v1/officer-requests/apply).

Endpoint approval bertingkat (Ketua RW memverifikasi RT; Super Admin memverifikasi RW).

Modul 5: Notification Service (BullMQ + FCM)

Buat queue worker BullMQ untuk memproses pengiriman notifikasi secara asinkron.

Integrasikan FCM SDK untuk topic subscribe/unsubscribe saat warga disetujui atau saat jabatan pengurus berganti.

Modul 6: UI Client (Tema Warga Modern)

Buat navigasi bawah: Beranda, Surat/Layanan, Iuran, Warga/Kontak, Profil.

Terapkan skema warna Civic Emerald & Card-based layout.

Sediakan tombol saklar "Mode Pengurus" yang hanya aktif jika user memiliki role pengurus aktif.


note : jalankan server di port 3000