"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Download,
  Printer,
  FileText,
  CheckCircle2,
  Calendar,
  Layers,
  Building,
  DollarSign,
  Users,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Filter,
  Check,
  Eye,
} from "lucide-react";

export default function ReportDownloadTab() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<"ALL" | "PARTIAL">("ALL");
  const [selectedModules, setSelectedModules] = useState<string[]>([
    "FINANCES",
    "DUES",
    "RESIDENTS",
    "MUTATIONS",
    "RECONCILIATION",
    "COMPLAINTS",
    "AUDIT",
  ]);
  const [timeRange, setTimeRange] = useState("THIS_MONTH");
  const [scopeUnit, setScopeUnit] = useState("CURRENT_RT");
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Loaded data for report compilation
  const [reportData, setReportData] = useState<any>({
    finances: null,
    dues: [],
    residents: [],
    stats: null,
    reconciliation: null,
    complaints: [],
    auditLogs: [],
  });

  const isRwOfficer = user?.roles?.some((r) => r.startsWith("RW_") || r === "SUPER_ADMIN");

  const modulesList = [
    {
      id: "FINANCES",
      label: "Buku Kas & Keuangan",
      desc: "Pemasukan, pengeluaran, saldo awal & akhir",
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60",
    },
    {
      id: "DUES",
      label: "Iuran & Tagihan Warga",
      desc: "Rekapitulasi pembayaran warga, status lunas & tunggakan",
      icon: FileText,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/60",
    },
    {
      id: "RESIDENTS",
      label: "Sensus Data Kependudukan",
      desc: "Buku induk kependudukan RT, kepala keluarga & jiwa",
      icon: Users,
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60",
    },
    {
      id: "MUTATIONS",
      label: "Dinamika Mutasi Penduduk",
      desc: "Pencatatan pindah masuk, keluar, kelahiran & kematian",
      icon: RefreshCw,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/60",
    },
    {
      id: "RECONCILIATION",
      label: "Rekonsiliasi KK vs Akun SIM-RW",
      desc: "Tingkat adopsi digital, KK terdaftar vs belum terdaftar",
      icon: Layers,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/60",
    },
    {
      id: "COMPLAINTS",
      label: "Pengaduan & Aspirasi Warga",
      desc: "Daftar tiket aduan, tindak lanjut & tanggapan pengurus",
      icon: MessageSquare,
      color: "text-rose-600 bg-rose-50 dark:bg-rose-950/60",
    },
    {
      id: "AUDIT",
      label: "Jejak Audit UU PDP No. 27/2022",
      desc: "Log rekaman pembukaan NIK & verifikasi berkas privasi",
      icon: ShieldCheck,
      color: "text-teal-600 bg-teal-50 dark:bg-teal-950/60",
    },
  ];

  const fetchAllData = async () => {
    setIsGenerating(true);
    try {
      const [resFin, resDues, resRes, resStats, resReconcile, resComp, resAudit] = await Promise.all([
        fetch(`/api/v1/finances?scope=${isRwOfficer ? "RW" : "RT"}`).then((r) => r.json()).catch(() => ({})),
        fetch(`/api/v1/bills?scope=${isRwOfficer ? "rw" : "rt"}`).then((r) => r.json()).catch(() => ({})),
        fetch(`/api/v1/residents`).then((r) => r.json()).catch(() => ({})),
        fetch(`/api/v1/residents/statistics`).then((r) => r.json()).catch(() => ({})),
        fetch(`/api/v1/residents/reconciliation`).then((r) => r.json()).catch(() => ({})),
        fetch(`/api/v1/complaints?scope=all`).then((r) => r.json()).catch(() => ({})),
        fetch(`/api/v1/audit/logs`).then((r) => r.json()).catch(() => ({})),
      ]);

      const finSummary = resFin?.summary || resFin?.data?.summary || {};
      const finTx = resFin?.transactions || resFin?.data?.transactions || [];
      const initTx = finTx.find((t: any) => t.category === "Saldo Awal Kas");
      const initialBalance = finSummary.initialBalance ?? resFin?.initialBalance ?? (initTx ? initTx.amount : (isRwOfficer ? 15000000 : 6000000));
      const totalIncome = finSummary.totalIncome ?? resFin?.totalIncome ?? (initialBalance + finTx.filter((t: any) => t.type === "INCOME" && t.category !== "Saldo Awal Kas").reduce((s: number, t: any) => s + Number(t.amount || 0), 0));
      const totalExpense = finSummary.totalExpense ?? resFin?.totalExpense ?? finTx.filter((t: any) => t.type === "EXPENSE").reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
      const currentBalance = finSummary.netBalance ?? resFin?.currentBalance ?? (totalIncome - totalExpense);

      setReportData({
        finances: {
          initialBalance,
          totalIncome,
          totalExpense,
          currentBalance,
          operationalIncome: finSummary.operationalIncome || (totalIncome - initialBalance),
          transactions: finTx,
          scope: resFin?.scope || (isRwOfficer ? "RW" : "RT"),
        },
        dues: resDues?.data || [],
        residents: resRes?.data || [],
        stats: resStats?.data || null,
        reconciliation: resReconcile?.data || null,
        complaints: resComp?.data || [],
        auditLogs: resAudit?.data || [],
      });
    } catch (e) {
      console.error("Gagal memuat data laporan:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const toggleModule = (id: string) => {
    if (selectedModules.includes(id)) {
      if (selectedModules.length === 1) return; // Keep at least one
      setSelectedModules(selectedModules.filter((m) => m !== id));
    } else {
      setSelectedModules([...selectedModules, id]);
    }
  };

  const handleSelectAllModules = () => {
    setSelectedModules(modulesList.map((m) => m.id));
  };

  // Generate & Download CSV File
  const handleExportCSV = () => {
    const lines: string[] = [];
    const dateStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    lines.push(`"LAPORAN RESMI KEPENGURUSAN RW 15 KOMPLEK GIRI CIHEULANG"`);
    lines.push(`"Kecamatan Ciparay - Kabupaten Bandung"`);
    lines.push(`"Tanggal Unduh: ${dateStr}"`);
    lines.push(`"Pengunduh: ${user?.fullName} (${user?.roles?.join(", ")})"`);
    lines.push("");

    const isIncluded = (mod: string) => reportType === "ALL" || selectedModules.includes(mod);

    // 1. Keuangan
    if (isIncluded("FINANCES") && reportData.finances) {
      const fin = reportData.finances;
      lines.push(`"=== 1. BUKU KAS & KEUANGAN ==="`);
      lines.push(`"Saldo Awal: Rp ${Number(fin.initialBalance || 0).toLocaleString("id-ID")}"`);
      lines.push(`"Total Pemasukan: Rp ${Number(fin.totalIncome || 0).toLocaleString("id-ID")}"`);
      lines.push(`"Total Pengeluaran: Rp ${Number(fin.totalExpense || 0).toLocaleString("id-ID")}"`);
      lines.push(`"Saldo Kas Berjalan: Rp ${Number(fin.currentBalance || 0).toLocaleString("id-ID")}"`);
      lines.push(`"Tanggal","Tipe Transaksi","Kategori","Keterangan","Jumlah (Rp)"`);
      (fin.transactions || []).forEach((t: any) => {
        lines.push(
          `"${new Date(t.date).toLocaleDateString("id-ID")}","${t.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}","${t.category}","${t.description.replace(/"/g, '""')}","${t.amount}"`
        );
      });
      lines.push("");
    }

    // 2. Iuran Warga
    if (isIncluded("DUES")) {
      lines.push(`"=== 2. REKAPITULASI IURAN WARGA ==="`);
      lines.push(`"No. Tagihan","Warga Pelanggan","Bulan","Tahun","Nominal (Rp)","Status Pembayaran"`);
      reportData.dues.forEach((d: any) => {
        lines.push(
          `"TRX-${d.id.slice(0, 8)}","${d.citizen_name || "Warga"}","${d.month}","${d.year}","${d.amount}","${d.status === "PAID" ? "Lunas" : d.status === "PENDING_VALIDATION" ? "Menunggu Validasi" : "Belum Bayar"}"`
        );
      });
      lines.push("");
    }

    // 3. Data Sensus Penduduk
    if (isIncluded("RESIDENTS")) {
      lines.push(`"=== 3. SENSUS PENDUDUK BUKU INDUK ==="`);
      lines.push(`"Nama Lengkap","No. KK","NIK","Gender","Status Hubungan","Domisili","Alamat","Telepon"`);
      reportData.residents.forEach((r: any) => {
        lines.push(
          `"${r.full_name}","${r.kk_number}","${r.maskedNik || r.nik}","${r.gender === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}","${r.family_relation}","${r.residence_status}","${r.address_street.replace(/"/g, '""')}","${r.phone_number || "-"}"`
        );
      });
      lines.push("");
    }

    // 4. Pengaduan Warga
    if (isIncluded("COMPLAINTS")) {
      lines.push(`"=== 4. ASPIRASI & PENGADUAN WARGA ==="`);
      lines.push(`"No. Tiket","Judul Pengaduan","Pelapor","Kategori","Status","Tanggapan Pengurus"`);
      reportData.complaints.forEach((c: any) => {
        lines.push(
          `"${c.ticket_number}","${c.title.replace(/"/g, '""')}","${c.author_name || c.citizen_name}","${c.category}","${c.status}","${(c.officer_response || "-").replace(/"/g, '""')}"`
        );
      });
      lines.push("");
    }

    // Convert to Blob and trigger download
    const csvContent = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const filename = `Laporan_SIM-RW_${reportType === "ALL" ? "Lengkap" : "Parsial"}_${new Date().toISOString().split("T")[0]}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(`File laporan "${filename}" berhasil diunduh!`);
    setTimeout(() => setDownloadSuccess(null), 5000);
  };

  // Open Printable Official HTML View
  const handlePrintReport = () => {
    const isIncluded = (mod: string) => reportType === "ALL" || selectedModules.includes(mod);
    const dateStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const printWin = window.open("", "_blank");
    if (!printWin) return;

    let contentHtml = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>Laporan Resmi SIM-RW - RW 15 Giri Ciheulang</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; padding: 30px; color: #111; line-height: 1.5; }
          .kop-surat { text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 24px; }
          .kop-surat h2 { margin: 0; font-size: 16pt; font-weight: bold; text-transform: uppercase; }
          .kop-surat h3 { margin: 2px 0; font-size: 14pt; font-weight: bold; }
          .kop-surat p { margin: 2px 0; font-size: 10pt; font-style: italic; }
          .title { text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 15px; text-decoration: underline; text-transform: uppercase; }
          .meta-info { margin-bottom: 20px; font-size: 10pt; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10pt; }
          table th, table td { border: 1px solid #444; padding: 6px 8px; }
          table th { background-color: #f2f2f2; text-align: left; }
          .section-title { font-size: 11pt; font-weight: bold; margin-top: 25px; margin-bottom: 8px; text-transform: uppercase; }
          .ttd-container { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
          .ttd-box { text-align: center; width: 220px; }
          .ttd-space { height: 70px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #059669; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
            🖨️ Cetak Dokumen / Simpan ke PDF
          </button>
        </div>

        <div class="kop-surat">
          <h2>RUKUN WARGA (RW) 15 KOMPLEK GIRI CIHEULANG</h2>
          <h3>DESA / KELURAHAN CIHEULANG • KECAMATAN CIPARAY</h3>
          <p>KABUPATEN BANDUNG, JAWA BARAT 40381</p>
          <p>Inisiasi Pelayanan Mandiri Berbasis Digital SIM-RW & Kepatuhan UU PDP No. 27/2022</p>
        </div>

        <div class="title">
          ${reportType === "ALL" ? "LAPORAN LENGKAP KEPENGURUSAN LINGKUNGAN" : "LAPORAN PARSIAL OPERASIONAL LINGKUNGAN"}
        </div>

        <div class="meta-info">
          <div><strong>Wilayah Pelaporan:</strong> Rukun Tetangga (RT) 02 / RW 15 Komplek Giri Ciheulang</div>
          <div><strong>Tanggal Cetak:</strong> ${dateStr}</div>
          <div><strong>Pejabat Pengunduh:</strong> ${user?.fullName || "Ketua Pengurus"}</div>
        </div>
    `;

    // Finances Section
    if (isIncluded("FINANCES") && reportData.finances) {
      const fin = reportData.finances;
      const initialBal = fin?.initialBalance ?? fin?.summary?.initialBalance ?? 0;
      const totIncome = fin?.totalIncome ?? fin?.summary?.totalIncome ?? 0;
      const totExpense = fin?.totalExpense ?? fin?.summary?.totalExpense ?? 0;
      const curBal = fin?.currentBalance ?? fin?.summary?.netBalance ?? (totIncome - totExpense);

      contentHtml += `
        <div class="section-title">1. Ringkasan Keuangan & Buku Kas Lingkungan</div>
        <p style="margin: 8px 0; font-size: 10.5pt; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1;">
          Saldo Awal Kas: <strong>Rp ${Number(initialBal).toLocaleString("id-ID")}</strong> &nbsp;|&nbsp; 
          Total Pemasukan: <strong style="color: #059669;">Rp ${Number(totIncome).toLocaleString("id-ID")}</strong> &nbsp;|&nbsp; 
          Total Pengeluaran: <strong style="color: #dc2626;">Rp ${Number(totExpense).toLocaleString("id-ID")}</strong> &nbsp;|&nbsp; 
          <strong>Saldo Kas Akhir: Rp ${Number(curBal).toLocaleString("id-ID")}</strong>
        </p>
        <table>
          <thead>
            <tr><th>No</th><th>Tanggal</th><th>Tipe</th><th>Kategori</th><th>Uraian</th><th>Nominal</th></tr>
          </thead>
          <tbody>
            ${(fin.transactions || []).map((t: any, idx: number) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${new Date(t.date).toLocaleDateString("id-ID")}</td>
                <td>${t.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}</td>
                <td>${t.category}</td>
                <td>${t.description}</td>
                <td>Rp ${Number(t.amount).toLocaleString("id-ID")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    }

    // Sensus Penduduk Section
    if (isIncluded("RESIDENTS")) {
      contentHtml += `
        <div class="section-title">2. Data Sensus Kependudukan Buku Induk RT</div>
        <table>
          <thead>
            <tr><th>No</th><th>Nama Warga</th><th>No. KK</th><th>NIK</th><th>Gender</th><th>Hubungan</th><th>Status Domisili</th></tr>
          </thead>
          <tbody>
            ${reportData.residents.map((r: any, idx: number) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${r.full_name}</strong></td>
                <td>${r.kk_number}</td>
                <td>${r.maskedNik || r.nik}</td>
                <td>${r.family_relation}</td>
                <td>${r.residence_status}</td>
                <td>${r.address_street}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    }

    // Complaints Section
    if (isIncluded("COMPLAINTS")) {
      contentHtml += `
        <div class="section-title">3. Aspirasi & Penanganan Aduan Warga</div>
        <table>
          <thead>
            <tr><th>No. Tiket</th><th>Judul Aduan</th><th>Pelapor</th><th>Kategori</th><th>Status</th><th>Tanggapan Pengurus</th></tr>
          </thead>
          <tbody>
            ${reportData.complaints.map((c: any) => `
              <tr>
                <td><strong>${c.ticket_number}</strong></td>
                <td>${c.title}</td>
                <td>${c.author_name || c.citizen_name}</td>
                <td>${c.category}</td>
                <td>${c.status}</td>
                <td>${c.officer_response || "Dalam koordinasi"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    }

    // Signature Block
    contentHtml += `
        <div class="ttd-container">
          <div class="ttd-box">
            <p>Mengetahui,<br><strong>Ketua RW 15 Giri Ciheulang</strong></p>
            <div class="ttd-space"></div>
            <p><strong>( Budi Santoso )</strong></p>
          </div>
          <div class="ttd-box">
            <p>Ciparay, ${dateStr}<br><strong>Ketua RT 02 / Pengurus</strong></p>
            <div class="ttd-space"></div>
            <p><strong>( ${user?.fullName || "Hendra Gunawan"} )</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWin.document.write(contentHtml);
    printWin.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Success Notification */}
      {downloadSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/50 rounded-2xl flex items-center justify-between text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <p className="text-sm font-semibold">{downloadSuccess}</p>
          </div>
          <button
            onClick={() => setDownloadSuccess(null)}
            className="text-emerald-700 dark:text-emerald-300 font-bold text-xs"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl border-2 border-indigo-900 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-900 border border-indigo-500 text-indigo-200 text-xs font-bold rounded-full uppercase tracking-wider">
                Pusat Ekspor & Unduh Laporan
              </span>
              <span className="text-xs text-slate-200 font-semibold">Resmi Berstempel Digital</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Unduh Laporan Lingkungan RT / RW</h2>
            <p className="text-sm text-slate-200 font-medium mt-1 max-w-2xl">
              Fasilitas cetak PDF ber-Kop Surat resmi RW 15 Komplek Giri Ciheulang, Kec. Ciparay Kab. Bandung, serta unduh spreadsheet CSV untuk Microsoft Excel.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAllData}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border-2 border-slate-600"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
              Perbarui Data
            </button>
          </div>
        </div>
      </div>

      {/* Scope Selector: ALL vs PARTIAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mode Laporan Pilihan */}
        <div
          onClick={() => setReportType("ALL")}
          className={`p-5 rounded-3xl border-2 transition-all cursor-pointer ${
            reportType === "ALL"
              ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-600 shadow-md"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-600 text-white">
              REKOMENDASI RESMI
            </span>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                reportType === "ALL" ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-400"
              }`}
            >
              {reportType === "ALL" && <Check className="w-4 h-4 stroke-[3]" />}
            </div>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
            Laporan Lengkap Komprehensif (Semua Laporan)
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 leading-relaxed font-medium">
            Mencakup seluruh 7 modul: Keuangan, Iuran, Sensus Kependudukan, Mutasi, Rekonsiliasi, Pengaduan Warga, dan Jejak Audit UU PDP dalam satu bundel dokumen.
          </p>
        </div>

        {/* Mode Laporan Parsial */}
        <div
          onClick={() => setReportType("PARTIAL")}
          className={`p-5 rounded-3xl border-2 transition-all cursor-pointer ${
            reportType === "PARTIAL"
              ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-600 shadow-md"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300">
              KUSTOMISASI PETUGAS
            </span>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                reportType === "PARTIAL" ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-400"
              }`}
            >
              {reportType === "PARTIAL" && <Check className="w-4 h-4 stroke-[3]" />}
            </div>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
            Laporan Parsial (Pilih Modul Tertentu)
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 leading-relaxed font-medium">
            Pilih modul atau bidang tertentu sesuai kebutuhan rapat pengurus atau kebutuhan pelaporan insidental (misal: hanya Kas Keuangan atau Sensus saja).
          </p>
        </div>
      </div>

      {/* Checklist Modul jika Partial dipilih */}
      {reportType === "PARTIAL" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Pilih Modul yang Ingin Dicantumkan dalam Laporan:
              </h4>
              <p className="text-xs text-slate-700 font-bold">Centang minimal 1 modul laporan</p>
            </div>
            <button
              onClick={handleSelectAllModules}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Pilih Semua Modul
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {modulesList.map((mod) => {
              const isChecked = selectedModules.includes(mod.id);
              const IconComp = mod.icon;
              return (
                <div
                  key={mod.id}
                  onClick={() => toggleModule(mod.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isChecked
                      ? "bg-slate-100 dark:bg-slate-800 border-indigo-500 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center shrink-0 ${
                      isChecked ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-400"
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-white">
                      <IconComp className="w-3.5 h-3.5 text-indigo-500" />
                      {mod.label}
                    </div>
                    <p className="text-[11px] text-slate-700 font-medium leading-tight">{mod.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons: Cetak PDF Resmi & Unduh CSV */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-base text-slate-900 dark:text-white">
            Siap Mengekspor Dokumen Resmi
          </h4>
          <p className="text-xs text-slate-700 font-medium mt-0.5">
            Format: Kop Surat Resmi RW 15 Giri Ciheulang, Ciparay • Sesuai format kearsipan desa/kelurahan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Print PDF Button */}
          <button
            onClick={handlePrintReport}
            disabled={isGenerating}
            className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-900/30 transition-all"
          >
            <Printer className="w-4 h-4" /> Cetak PDF Ber-Kop Surat
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={isGenerating}
            className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Download className="w-4 h-4" /> Unduh Spreadsheet (.CSV)
          </button>
        </div>
      </div>
    </div>
  );
}

