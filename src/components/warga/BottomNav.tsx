"use client";

import React from "react";
import { Home, FileText, CreditCard, Users, User, MessageSquare } from "lucide-react";
import { useViewMode } from "@/context/ViewModeContext";

export type NavTab = "beranda" | "surat" | "iuran" | "pengaduan" | "warga" | "profil";

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export default function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  const { viewMode } = useViewMode();

  // If in desktop mode, bottom nav is not needed (sidebar is used instead)
  if (viewMode === "desktop") {
    return null;
  }

  const tabs: { key: NavTab; label: string; icon: any; badge?: string }[] = [
    { key: "beranda", label: "Beranda", icon: Home },
    { key: "surat", label: "Surat", icon: FileText },
    { key: "iuran", label: "Iuran", icon: CreditCard, badge: "1" },
    { key: "pengaduan", label: "Pengaduan", icon: MessageSquare },
    { key: "warga", label: "Warga", icon: Users },
    { key: "profil", label: "Profil", icon: User },
  ];

  return (
    <nav className="w-full bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-xl px-2 py-1.5 flex items-center justify-around shrink-0 z-40">
      {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChangeTab(tab.key)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 relative rounded-xl transition-all ${
                isActive
                  ? "text-emerald-700 font-extrabold"
                  : "text-slate-600 hover:text-slate-900 font-semibold"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "scale-110 text-emerald-600 stroke-[2.3]" : "text-slate-600 stroke-[2]"
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight ${isActive ? "text-emerald-700 font-extrabold" : "text-slate-600 font-semibold"}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 absolute bottom-0.5" />
              )}
            </button>
          );
        })}
    </nav>
  );
}
