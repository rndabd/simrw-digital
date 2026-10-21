"use client";

import React from "react";
import { useViewMode } from "@/context/ViewModeContext";
import { Monitor, Smartphone } from "lucide-react";

export default function ViewModeToggle() {
  const { viewMode, toggleViewMode } = useViewMode();

  return (
    <button
      onClick={toggleViewMode}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 border bg-white/90 backdrop-blur-md border-emerald-500/30 text-emerald-900 hover:bg-emerald-50 hover:border-emerald-500"
      title="Beralih antara Tampilan Desktop & Tampilan Mobile"
    >
      {viewMode === "desktop" ? (
        <>
          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
          <span>Ubah ke Tampilan HP</span>
        </>
      ) : (
        <>
          <Monitor className="w-3.5 h-3.5 text-emerald-600" />
          <span>Ubah ke Tampilan Desktop</span>
        </>
      )}
    </button>
  );
}

