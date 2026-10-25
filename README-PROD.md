# Panduan Instalasi & Produksi SIM-RW Digital v1.0.0 (Debian 13)

Dokumen ini memandu pemasangan aplikasi **SIM-RW Digital (Versi 1.0.0 Produksi)** pada server **Debian 13 (Trixie)** yang bersih/kosongan. Branch `prod` dirancang khusus tanpa data demo dummy, dan dilengkapi fitur **Setup Wizard Awal (`/setup`)** untuk membuat akun Super Administrator dan Wilayah perdana.

---

## 1. Persyaratan Server (Debian 13)
- **Sistem Operasi**: Debian 13 (64-bit)
- **RAM Minimum**: 1 GB (Rekomendasi: 2 GB+)
- **CPU**: 1 Core atau lebih
- **Penyimpanan**: 10 GB SSD/NVMe
- **Port Terbuka**: 80 (HTTP), 443 (HTTPS), 3000 (Next.js internal)

---

## 2. Langkah-Langkah Instalasi di Server Debian 13

### A. Clone Repositori (Branch `prod`)
Masuk ke terminal server Debian Anda (via SSH) dan clone branch `prod`:

```bash
cd /var/www
sudo git clone -b prod https://github.com/rndabd/simrw-digital.git simrw
sudo chown -R $USER:$USER /var/www/simrw
cd /var/www/simrw
```

### B. Konfigurasi Lingkungan (`.env`)
Salin berkas template lingkungan:

```bash
cp .env.example .env
nano .env
```

Pastikan variabel berikut terisi dengan nilai produksi Anda:

```env
NODE_ENV=production
PORT=3000

# Kunci Enkripsi Kriptografi UU PDP (32-karakter) & JWT
DATA_ENCRYPTION_KEY=your-super-secret-aes-key-32chars!!
JWT_SECRET=your-jwt-production-secret-key-simrw

# WhatsApp Gateway (GOWA Engine)
WAHA_API_URL=https://gowa-api.rnd.web.id

# Layanan SMTP Email Resmi
SMTP_HOST=kenari.superserver.co.id
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=no-reply@simrw.web.id
SMTP_PASS=your-smtp-password
SMTP_FROM="SIM-RW Digital <no-reply@simrw.web.id>"
```

### C. Jalankan Skrip Otomatis Deployment
Jadikan skrip deployment executable dan jalankan:

```bash
chmod +x deploy-debian.sh
./deploy-debian.sh
```

Skrip ini secara otomatis akan:
1. Memperbarui paket sistem Debian 13 (`apt update && apt upgrade`).
2. Memasang dependensi inti (Node.js 20 LTS, Git, build-essential, Nginx, Certbot).
3. Memasang **PM2** process manager secara global.
4. Menjalankan `npm install` dan `npm run build` (Next.js Production Build).
5. Memulai service `simrw-app` di port `3000` dengan PM2 daemon auto-restart.

---

## 3. Konfigurasi Nginx & Domain SSL

### A. Salin Konfigurasi Nginx
```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/simrw.conf
sudo nano /etc/nginx/sites-available/simrw.conf
```
*Ganti `example.com www.example.com` dengan nama domain atau subdomain Anda.*

### B. Aktifkan Konfigurasi & Reload Nginx
```bash
sudo ln -s /etc/nginx/sites-available/simrw.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### C. Pasang Sertifikat SSL Gratis (Let's Encrypt Certbot)
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 4. Inisialisasi Awal Akun Admin (`/setup`)

Setelah server berjalan:
1. Buka browser dan kunjungi:
   `https://your-domain.com/setup` (atau `http://IP_SERVER:3000/setup`).
2. Masukkan identitas **Super Administrator**:
   - Nama Lengkap Admin
   - NIK (16 digit angka KTP - otomatis dienkripsi AES-256-GCM blind index)
   - Nomor WhatsApp Aktif (untuk OTP & Login)
   - Email Resmi (opsional)
   - Kata Sandi Baru
3. Masukkan data **Wilayah Perdana**:
   - Kelurahan / Desa
   - Kecamatan
   - Kota / Kabupaten
   - Nomor RW (contoh: 01)
   - Periode Masa Bakti (contoh: 2026-2031)
   - Jumlah Satuan RT Awal
4. Klik **Selesaikan Setup Server Baru**.
5. Sistem akan mengunci halaman `/setup` secara permanen dan Anda langsung dapat masuk menggunakan akun Super Admin tersebut!

---

## 5. Perintah Manajemen Server (PM2)

```bash
# Memeriksa status aplikasi
pm2 status

# Melihat log aplikasi secara realtime
pm2 logs simrw-app

# Me-restart aplikasi setelah update kode
pm2 restart simrw-app

# Menghentikan aplikasi
pm2 stop simrw-app

# Memperbarui kode dari git (branch prod)
git pull origin prod
npm run build
pm2 restart simrw-app
```

---

## 6. Struktur Data Produksi
- Data tersimpan terenkripsi di folder `data/store.json`.
- Berkas unggahan warga (KTP/Bukti Iuran/Surat SK) tersimpan aman di `public/uploads/`.
- Jangan lupa lakukan backup berkala pada direktori `data/` dan `public/uploads/`.

