"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useViewMode } from "@/context/ViewModeContext";
import AuthView from "@/components/auth/AuthView";
import AppShell from "@/components/layout/AppShell";
import HeaderDashboard from "@/components/warga/HeaderDashboard";
import EKtpMiniCard from "@/components/warga/EKtpMiniCard";
import QuickActions from "@/components/warga/QuickActions";
import AnnouncementFeed, { AnnouncementItem } from "@/components/warga/AnnouncementFeed";
import BottomNav, { NavTab } from "@/components/warga/BottomNav";
import SuratTab from "@/components/warga/SuratTab";
import IuranTab from "@/components/warga/IuranTab";
import WargaTab from "@/components/warga/WargaTab";
import ProfilTab from "@/components/warga/ProfilTab";
import PengaduanTab from "@/components/warga/PengaduanTab";
import OfficerDashboard from "@/components/officer/OfficerDashboard";
import SuperAdminDashboard from "@/components/admin/SuperAdminDashboard";
import { Siren, X, MessageSquare, Bell, Building2 } from "lucide-react";

export default function HomePage() {
  const { user, isLoading, isOfficerMode } = useAuth();
  const { isDesktop } = useViewMode();
  const [activeTab, setActiveTab] = useState<NavTab | "admin" | "pengaduan">("beranda");
  const [forceReady, setForceReady] = useState(false);

  // If user is Super Admin, default to "admin" tab
  useEffect(() => {
    if (user?.isSuperAdmin) {
      setActiveTab("admin");
    }
  }, [user?.isSuperAdmin]);

  // Fallback to guarantee the screen never hangs
  useEffect(() => {
    const timer = setTimeout(() => setForceReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Modals state
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencySent, setEmergencySent] = useState(false);
  const [showLaporModal, setShowLaporModal] = useState(false);
  const [laporSent, setLaporSent] = useState(false);
  const [laporText, setLaporText] = useState("");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  if (isLoading && !forceReady) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4 bg-cover bg-center"
        style={{ backgroundImage: isDesktop ? "url('/bg-desktop.jpeg')" : "url('/bg-mobile.jpg')" }}
      >
        <div className="p-8 rounded-3xl bg-white/90 backdrop-blur-md border border-white/60 shadow-2xl flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center animate-pulse shadow-lg text-white font-extrabold text-2xl">
            W
          </div>
          <div className="text-xs font-bold text-slate-800 mt-4 tracking-wide">
            Memuat SIM-RW Digital...
          </div>
        </div>
      </div>
    );
  }

  // If not logged in, show Auth View
  if (!user) {
    return (
      <AppShell>
        <AuthView />
      </AppShell>
    );
  }

  const handleQuickAction = (key: string) => {
    if (key === "surat") setActiveTab("surat");
    else if (key === "iuran") setActiveTab("iuran");
    else if (key === "kontak") setActiveTab("warga");
    else if (key === "darurat") {
      setEmergencySent(false);
      setShowEmergencyModal(true);
    } else if (key === "lapor") {
      setActiveTab("pengaduan");
    } else if (key === "inforw") {
      setActiveTab("warga");
    }
  };

  const handleSendEmergency = () => {
    setEmergencySent(true);
    setTimeout(() => {
      setShowEmergencyModal(false);
      setEmergencySent(false);
      alert("Sinyal Darurat SOS terkirim ke Pos Ronda dan HP seluruh Petugas Satpam RT 02!");
    }, 1500);
  };

  const handleSendLapor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!laporText) return;
    setLaporSent(true);
    setTimeout(() => {
      setShowLaporModal(false);
      setLaporSent(false);
      setLaporText("");
      alert("Laporan aduan warga berhasil diteruskan ke Pengurus RT 02!");
    }, 1200);
  };

  return (
    <AppShell
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      onOpenSOS={() => {
        setEmergencySent(false);
        setShowEmergencyModal(true);
      }}
      onOpenNotif={() => setShowNotificationsModal(true)}
    >
      {/* Super Admin Dashboard tab */}
      {activeTab === "admin" && user.isSuperAdmin ? (
        <div className={!isDesktop ? "p-4 pb-24" : ""}>
          <SuperAdminDashboard />
        </div>
      ) : isOfficerMode && user.isOfficer ? (
        /* Officer Dashboard */
        <div className={!isDesktop ? "p-4 pb-24" : ""}>
          <OfficerDashboard />
        </div>
      ) : (
        /* Citizen View */
        <div className="min-h-full flex flex-col">
          {/* Header (rendered in mobile mode, or compact sub-header) */}
          {!isDesktop && (
            <HeaderDashboard onOpenNotifications={() => setShowNotificationsModal(true)} />
          )}

          {/* Desktop Sub-Header Title */}
          {isDesktop && (
            <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 capitalize">
                  {activeTab === "beranda"
                    ? "Beranda & Pengumuman Warga"
                    : activeTab === "surat"
                    ? "Pengajuan Surat Online"
                    : activeTab === "iuran"
                    ? "Iuran & Transparansi Kas"
                    : activeTab === "pengaduan"
                    ? "Pusat Pengaduan & Keluhan Warga"
                    : activeTab === "warga"
                    ? "Direktori & Kontak Pengurus"
                    : "Profil Warga & E-KTP Digital"}
                </h1>
                <p className="text-xs text-slate-700 font-medium mt-0.5">
                  Pelayanan Administrasi Warga Digital Multi-RW Sukamaju, Bandung.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {user.isSuperAdmin
                    ? "Super Admin Kelurahan"
                    : `RT ${user.rt?.number || "02"} / RW ${user.rw?.number || "05"}`}
                </span>
              </div>
            </div>
          )}

          {/* Main Tab Render */}
          <div className="flex-1">
            {activeTab === "beranda" &&
              (isDesktop ? (
                /* DESKTOP BERANDA (2-Column Grid) */
                <div className="grid grid-cols-12 gap-6 items-start">
                  <div className="col-span-5 space-y-6">
                    <EKtpMiniCard />
                    <QuickActions onActionClick={handleQuickAction} />
                  </div>
                  <div className="col-span-7">
                    <AnnouncementFeed onSelectAnnouncement={(ann) => setSelectedAnnouncement(ann)} />
                  </div>
                </div>
              ) : (
                /* MOBILE BERANDA (Stacked Mobile View) */
                <div className="p-4 space-y-5 pb-24">
                  <EKtpMiniCard />
                  <QuickActions onActionClick={handleQuickAction} />
                  <AnnouncementFeed onSelectAnnouncement={(ann) => setSelectedAnnouncement(ann)} />
                </div>
              ))}

            {activeTab === "surat" && (
              <div className={!isDesktop ? "p-4 pb-24" : ""}>
                <SuratTab />
              </div>
            )}
            {activeTab === "iuran" && (
              <div className={!isDesktop ? "p-4 pb-24" : ""}>
                <IuranTab />
              </div>
            )}
            {activeTab === "pengaduan" && (
              <div className={!isDesktop ? "p-4 pb-24" : ""}>
                <PengaduanTab />
              </div>
            )}
            {activeTab === "warga" && (
              <div className={!isDesktop ? "p-4 pb-24" : ""}>
                <WargaTab />
              </div>
            )}
            {activeTab === "profil" && (
              <div className={!isDesktop ? "p-4 pb-24" : ""}>
                <ProfilTab />
              </div>
            )}
          </div>

          {/* Bottom Navigation (Only visible on mobile mode) */}
          <BottomNav activeTab={activeTab as NavTab} onChangeTab={setActiveTab} />
        </div>
      )}

      {/* EMERGENCY SOS MODAL */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Siren className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Tombol Darurat (Panic SOS)</h3>
              <p className="text-xs text-slate-700 font-medium">
                Peringatan darurat akan membunyikan sirene alarm di Pos Satpam dan mengirimkan koordinat rumah Anda.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold">
              Lokasi: {user.addressBlock || "Blok C2 No. 14"}, RT {user.rt?.number || "02"} / RW {user.rw?.number || "05"}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                disabled={emergencySent}
                onClick={handleSendEmergency}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5"
              >
                {emergencySent ? "Mengirim Sinyal..." : "BUNYIKAN SOS"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LAPOR MASALAH MODAL */}
      {showLaporModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSendLapor} className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Lapor Masalah Lingkungan
              </div>
              <button
                type="button"
                onClick={() => setShowLaporModal(false)}
                className="p-1 rounded-lg text-slate-600 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-700 font-medium">
              Sampaikan keluhan terkait lampu jalan mati, tumpukan sampah, saluran mampet, atau gangguan ketertiban.
            </p>

            <textarea
              required
              rows={4}
              value={laporText}
              onChange={(e) => setLaporText(e.target.value)}
              placeholder="Jelaskan detail lokasi dan permasalahan..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
            />

            <button
              type="submit"
              disabled={laporSent}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              {laporSent ? "Meneruskan Laporan..." : "Kirim Pengaduan ke Pengurus RT"}
            </button>
          </form>
        </div>
      )}

      {/* DETAIL ANNOUNCEMENT MODAL */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3.5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                  Pengumuman Resmi
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                  {selectedAnnouncement.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="p-1 rounded-lg text-slate-600 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-800 leading-relaxed max-h-60 overflow-y-auto">
              {selectedAnnouncement.content}
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-700 font-semibold">
              <span>Disiarkan: {selectedAnnouncement.authorName || "Pengurus RW"}</span>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS TRAY MODAL */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-emerald-600" />
                Pemberitahuan Warga
              </div>
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="p-1 text-slate-600 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs space-y-1">
                <div className="font-bold text-emerald-950">Status Akun Terverifikasi 🎉</div>
                <div className="text-emerald-900 text-[11px] font-medium">
                  Akun Anda aktif dalam sistem SIM-RW Digital. Seluruh layanan online tersedia.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowNotificationsModal(false)}
              className="w-full py-2 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs hover:bg-slate-200"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
