#!/usr/bin/env bash
# ==============================================================================
# SIM-RW Digital - Debian 13 Production Deployment & Setup Script
# Versi Aplikasi: 1.0.0 (Branch: prod)
# ==============================================================================
set -e

echo "🚀 [1/6] Memperbarui repositori sistem Debian 13..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx ufw

echo "📦 [2/6] Memasang Node.js 20 LTS (NodeSource)..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo "Versi Terpasang:"
node -v
npm -v

echo "⚡ [3/6] Memasang PM2 Process Manager secara global..."
sudo npm install -g pm2

echo "📂 [4/6] Menyiapkan Dependensi & Build Next.js..."
npm ci || npm install
npm run build

echo "🔒 [5/6] Memastikan direktori data dan permission aman..."
mkdir -p data public/uploads
chmod -R 775 data public/uploads

echo "⚙️ [6/6] Menjalankan aplikasi dengan PM2..."
pm2 start ecosystem.config.js || pm2 restart simrw-app
pm2 save

echo "=============================================================================="
echo "✅ DEPLOYMENT BERHASIL!"
echo "Aplikasi SIM-RW Digital v1.0.0 telah berjalan di port 3000."
echo "Silakan buka browser Anda dan akses: http://IP_SERVER:3000/setup"
echo "Untuk menghubungkan domain & SSL Nginx, lihat panduan di README-PROD.md"
echo "=============================================================================="

