# Panduan Produksi & Build Ulang SIM-RW Digital v1.0.0

Dokumen ini merupakan panduan teknis resmi pengoperasian, instalasi baru, serta **prosedur build ulang dari awal (*clean rebuild*)** untuk aplikasi **SIM-RW Digital (Versi 1.0.0 Produksi)**, baik pada sisi **Server Web (Next.js 14 / Debian 13)** maupun pada sisi **Aplikasi Ponsel Android (Capacitor 8 / APK Native)**.

Branch `prod` telah dikonfigurasi khusus untuk lingkungan produksi riil: bebas dari data dummy/tiruan, menggunakan proteksi privasi kependudukan sesuai amanat **UU PDP No. 27/2022 (Enkripsi AES-256-GCM)**, serta dilengkapi sistem **Setup Wizard Awal (`/setup`)** untuk inisialisasi akun Super Administrator dan Wilayah perdana.

---

## Daftar Isi
1. [Persyaratan Sistem](#1-persyaratan-sistem)
2. [Panduan Instalasi Server Baru (Debian 13 / Linux)](#2-panduan-instalasi-server-baru-debian-13--linux)
3. [Panduan Build Ulang dari Awal (Clean Rebuild Guide)](#3-panduan-build-ulang-dari-awal-clean-rebuild-guide)
   - [A. Build Ulang Aplikasi Web / Server Next.js](#a-build-ulang-aplikasi-web--server-nextjs)
   - [B. Reset Database & Inisialisasi Baru dari Nol](#b-reset-database--inisialisasi-baru-dari-nol)
   - [C. Build Ulang Berkas APK Android dari Nol](#c-build-ulang-berkas-apk-android-dari-nol)
   - [D. Perintah Ringkas Sekali Jalan (One-Liner Scripts)](#d-perintah-ringkas-sekali-jalan-one-liner-scripts)
4. [Konfigurasi Nginx Reverse Proxy & SSL Certbot](#4-konfigurasi-nginx-reverse-proxy--ssl-certbot)
5. [Inisialisasi Setup Awal Super Admin (/setup)](#5-inisialisasi-setup-awal-super-admin-setup)
6. [Manajemen Layanan Server (PM2) & Pemeliharaan Data](#6-manajemen-layanan-server-pm2--pemeliharaan-data)

---

## 1. Persyaratan Sistem

### A. Server Produksi (VPS / Dedicated Server)
- **Sistem Operasi**: Debian 13 (Trixie) 64-bit / Ubuntu 22.04 LTS atau lebih baru
- **Akses**: Langsung sebagai `root` (atau akun dengan hak sudo)
- **CPU**: 1 Core vCPU (Rekomendasi: 2 Core)
- **RAM**: Minimum 1 GB (Rekomendasi: 2 GB untuk kelancaran kompilasi build Next.js)
- **Penyimpanan**: Minimum 10 GB SSD / NVMe
- **Port Terbuka**: `80` (HTTP), `443` (HTTPS), `3000` (Next.js internal)

### B. Lingkungan Kompilasi APK Android (Komputer Pengembang)
- **Node.js**: Versi 20 LTS atau lebih baru
- **Java Development Kit (JDK)**: OpenJDK 17/21 atau Android Studio JBR (`jbr`)
- **Android SDK & Build-Tools**: API Level 34 / 35 (Android 14/15)
- **Shell**: PowerShell (Windows) atau Bash (Linux/macOS)

---

## 2. Panduan Instalasi Server Baru (Debian 13 / Linux)

### Langkah 1: Kloning Repositori (Branch `prod`)
Masuk ke terminal server Anda via SSH sebagai `root`:

```bash
mkdir -p /var/www
cd /var/www
git clone -b prod https://github.com/rndabd/simrw-digital.git simrw
cd /var/www/simrw
```

### Langkah 2: Konfigurasi File Lingkungan (`.env`)
Salin berkas template lingkungan produksi:

```bash
cp .env.example .env
nano .env
```

Pastikan variabel berikut terisi sesuai konfigurasi produksi Anda:

```env
NODE_ENV=production
PORT=3000

# Kunci Enkripsi Kriptografi UU PDP (Wajib 32 karakter rahasia) & JWT Secret
DATA_ENCRYPTION_KEY=ganti-dengan-kunci-aes-32karakter!
JWT_SECRET=ganti-dengan-rahasia-jwt-produksi-simrw

# WhatsApp Gateway (GOWA Engine)
WAHA_API_URL=https://gowa-api.rnd.web.id

# Konfigurasi SMTP Email Resmi
SMTP_HOST=kenari.superserver.co.id
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=no-reply@simrw.web.id
SMTP_PASS=password-email-smtp-anda
SMTP_FROM="SIM-RW Digital <no-reply@simrw.web.id>"
```

### Langkah 3: Eksekusi Skrip Instalasi Otomatis
Jalankan skrip deployment Debian yang telah disediakan:

```bash
chmod +x deploy-debian.sh
./deploy-debian.sh
```

Skrip ini akan secara otomatis memperbarui dependensi OS, memasang Node.js 20 LTS, PM2, mengompilasi aplikasi, menyiapkan hak akses folder, dan menyalakan daemon PM2.

---

## 3. Panduan Build Ulang dari Awal (Clean Rebuild Guide)

Gunakan panduan ini apabila Anda ingin memperbarui kode program, membersihkan cache lama yang korup, mengganti konfigurasi environment, atau mengompilasi ulang aplikasi secara menyeluruh dari nol.

### A. Build Ulang Aplikasi Web / Server Next.js

Ikuti langkah-langkah berikut pada direktori proyek (`/var/www/simrw` atau direktori lokal):

#### 1. Hentikan Layanan yang Sedang Berjalan
```bash
# Jika menggunakan PM2 pada server
pm2 stop simrw-app

# Atau jika di lokal, hentikan proses terminal (Ctrl + C)
```

#### 2. Bersihkan Cache Build & Dependensi Lama
Menghapus direktori `.next` (cache kompilasi) dan `node_modules` untuk menjamin proses build bersih:
```bash
# Pada Linux / Debian:
rm -rf .next node_modules package-lock.json

# Pada Windows PowerShell:
Remove-Item -Recurse -Force .next, node_modules, package-lock.json -ErrorAction SilentlyContinue
```

#### 3. Pasang Kembali Dependensi Bersih
```bash
npm install
```

#### 4. Jalankan Kompilasi Produksi Next.js
```bash
npm run build
```
> [!NOTE]
> Pastikan proses build menghasilkan status `✓ Compiled successfully` dan `✓ Generating static pages (40/40)` dengan exit code 0.

#### 5. Nyalakan Kembali Layanan
```bash
# Pada server dengan PM2:
pm2 restart simrw-app --update-env || pm2 start ecosystem.config.js
pm2 save

# Pengujian lokal langsung:
npm run start
```

---

### B. Reset Database & Inisialisasi Baru dari Nol

Lakukan prosedur ini **hanya jika** Anda ingin menghapus seluruh data lama (warga, pengurus, transaksi kas, permohonan surat) dan memulai instalasi fresh seperti baru pertama kali rilis:

#### 1. Hentikan Aplikasi Terlebih Dahulu
```bash
pm2 stop simrw-app
```

#### 2. Backup Data Lama (Disarankan)
```bash
tar -czvf /root/backup-simrw-$(date +%F).tar.gz data/ public/uploads/
```

#### 3. Kosongkan Data dan Berkas Upload
```bash
# Linux:
rm -rf data/store.json public/uploads/*
mkdir -p data public/uploads
chmod -R 775 data public/uploads

# Windows PowerShell:
Remove-Item -Force data\store.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force public\uploads\* -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path data, public\uploads
```

#### 4. Jalankan Ulang Aplikasi
```bash
pm2 restart simrw-app
```

#### 5. Buka Setup Wizard Awal
Buka browser dan akses URL:
```text
https://simrw.web.id/setup
(atau http://IP_SERVER:3000/setup)
```
Sistem akan otomatis mendeteksi status belum terinisialisasi (`system_initialized: false`) dan menampilkan formulir pendaftaran Super Admin perdana serta unit RW/RT awal.

---

### C. Build Ulang Berkas APK Android dari Nol

Aplikasi Android SIM-RW dibangun menggunakan Capacitor 8 yang mengintegrasikan Web App ke dalam shell native Android dengan fitur proteksi anti-crash (Android 13/14), deteksi scroll pull-to-refresh cerdas, dan offline fallback.

#### 1. Pastikan Dependensi & Web Asset Siap
Kompilasi web app terlebih dahulu agar berkas asset web di `public` dan konfigurasi API mutakhir:
```powershell
npm run build
```

#### 2. Sinkronkan Proyek Web ke Android via Capacitor
Perintah ini akan menyinkronkan seluruh plugin Capacitor, service worker, serta asset statis ke dalam folder `android/`:
```powershell
npx cap sync android
```

#### 3. Perbarui Ikon Aplikasi dari Favicon Web (Otomatis)
Untuk memastikan launcher icon di semua resolusi (mdpi s.d. xxxhdpi, termasuk ikon bulat dan adaptive foreground) sinkron dengan `public/favicon.png`, jalankan:
```powershell
# Jalankan skrip PowerShell generator ikon:
powershell -ExecutionPolicy Bypass -File scripts/generate-icons.ps1
```

#### 4. Kompilasi APK Menggunakan Gradle

##### Di Lingkungan Windows:
Pastikan variabel path Java (JDK / Android Studio JBR) telah terpasang:
```powershell
# Contoh menggunakan Java bawaan Android Studio:
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

# Pindah ke folder android dan jalankan clean build:
cd android
.\gradlew.bat clean assembleDebug
cd ..
```

##### Di Lingkungan Linux:
```bash
export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
cd android
chmod +x gradlew
./gradlew clean assembleDebug
cd ..
```

#### 5. Salin dan Beri Nama Berkas APK Final
Berkas APK yang dihasilkan Gradle terletak di:
`android/app/build/outputs/apk/debug/app-debug.apk`

Salin ke root direktori proyek untuk didistribusikan:
```powershell
# Windows PowerShell:
Copy-Item "android\app\build\outputs\apk\debug\app-debug.apk" "SIM-RW-Digital-v1.0-Final.apk" -Force

# Linux Bash:
cp android/app/build/outputs/apk/debug/app-debug.apk SIM-RW-Digital-v1.0-Final.apk
```

#### 6. Fitur Native Unggulan yang Terpasang di APK:
1. **SafePushNotificationsPlugin & Native Crash Protector**: Mencegah force-close akibat kesalahan otentikasi Firebase Cloud Messaging (FCM) pada Android 13+.
2. **Jembatan Scroll `AndroidRefresher`**: Pull-to-refresh native (`SwipeRefreshLayout`) hanya diizinkan aktif saat posisi scroll kontainer halaman berada mentok di paling atas (0px). Menggeser layar dari bawah ke atas tidak akan memicu refresh mendadak.
3. **Offline App Shell Cerdas**: Menyimpan antarmuka UI di memori perangkat, sehingga ketika tidak ada koneksi internet, aplikasi tetap dapat dibuka dan menampilkan panduan serta nomor panggilan darurat siaga 24 jam.

---

### D. Perintah Ringkas Sekali Jalan (One-Liner Scripts)

#### 🚀 Build Ulang Server Lengkap (Linux Server)
```bash
cd /var/www/simrw && \
git pull origin prod && \
rm -rf .next && \
npm install && \
npm run build && \
pm2 restart simrw-app --update-env && \
echo "✅ Rebuild Server Berhasil!"
```

#### 📱 Build Ulang APK Lengkap (Windows PowerShell)
```powershell
npm run build; `
npx cap sync android; `
powershell -ExecutionPolicy Bypass -File scripts\generate-icons.ps1; `
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"; `
cd android; .\gradlew.bat clean assembleDebug; cd ..; `
Copy-Item "android\app\build\outputs\apk\debug\app-debug.apk" "SIM-RW-Digital-v1.0-Final.apk" -Force; `
Write-Host "✅ APK Berhasil Dikompilasi: SIM-RW-Digital-v1.0-Final.apk" -ForegroundColor Green
```

---

## 4. Konfigurasi Nginx Reverse Proxy & SSL Certbot

### A. Konfigurasi Nginx
Buat berkas konfigurasi di `/etc/nginx/sites-available/simrw.conf`:

```nginx
server {
    listen 80;
    server_name simrw.web.id www.simrw.web.id;

    # Pengalihan ke HTTPS otomatis ditangani oleh Certbot

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Batas ukuran upload berkas (KTP / Foto Bukti Transfer)
        client_max_body_size 25M;
    }
}
```

Aktifkan konfigurasi dan uji sintaks:
```bash
ln -sf /etc/nginx/sites-available/simrw.conf /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### B. Pasang Sertifikat SSL Gratis (Let's Encrypt Certbot)
```bash
certbot --nginx -d simrw.web.id -d www.simrw.web.id
```

---

## 5. Inisialisasi Setup Awal Super Admin (`/setup`)

Setelah server berjalan dan domain terhubung dengan SSL:
1. Buka browser dan kunjungi: **`https://simrw.web.id/setup`**
2. Lengkapi formulir pendaftaran akun **Super Administrator**:
   - **Nama Lengkap**: Nama resmi penanggung jawab kelurahan/sistem.
   - **NIK**: 16 digit angka KTP (dienkripsi otomatis menggunakan AES-256-GCM blind-index).
   - **Nomor WhatsApp**: Digunakan untuk verifikasi OTP dan login akun.
   - **Email Resmi**: Untuk pengiriman notifikasi dan pemulihan sandi.
   - **Kata Sandi**: Kata sandi baru (minimal 8 karakter).
3. Masukkan data **Organisasi Wilayah Perdana**:
   - Nama Kelurahan / Desa, Kecamatan, dan Kota / Kabupaten.
   - Nomor RW perdana (contoh: `01` atau `15`).
   - Periode Kepengurusan (contoh: `2026-2031`).
   - Jumlah Satuan Unit RT awal (unit RT langsung terdaftar dan dapat dipilih oleh warga).
4. Klik **Selesaikan Setup Server Baru**.
5. Sistem akan mengunci rute `/setup` secara permanen demi keamanan, dan Anda dapat langsung masuk ke dashboard portal administratif.

---

## 6. Manajemen Layanan Server (PM2) & Pemeliharaan Data

### Perintah Operasional PM2:
```bash
# Memeriksa status kesehatan aplikasi
pm2 status

# Melihat log aktivitas secara langsung (realtime)
pm2 logs simrw-app

# Me-restart aplikasi
pm2 restart simrw-app

# Menghentikan aplikasi sementara
pm2 stop simrw-app

# Menyimpan konfigurasi proses otomatis saat server reboot
pm2 save
```

### Prosedur Pencadangan (Backup) Berkala:
Data penting aplikasi disimpan pada 2 lokasi:
1. `data/store.json`: Database utama terenkripsi.
2. `public/uploads/`: Direktori penyimpanan dokumen digital warga.

Buat skrip cron job harian pada server Debian:
```bash
# Tambahkan ke crontab (crontab -e):
0 2 * * * tar -czf /backup/simrw-backup-$(date +\%F).tar.gz /var/www/simrw/data /var/www/simrw/public/uploads
```

---
*SIM-RW Digital v1.0.0 Produksi — Sistem Informasi Manajemen Rukun Warga & Pelayanan Warga Mandiri Terintegrasi.*
