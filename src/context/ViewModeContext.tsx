"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Capacitor } from "@capacitor/core";

export type ViewMode = "desktop" | "mobile";

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  isDesktop: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  // Default to "mobile" on native apps (Android/iOS) or when screen is small
  const [viewMode, setViewModeState] = useState<ViewMode>("mobile");

  useEffect(() => {
    // 1. Jika berjalan di aplikasi native Android / iOS via Capacitor, SELALU gunakan mode "mobile"
    if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
      setViewModeState("mobile");
      return;
    }

    // 2. Di browser: Cek preferensi tersimpan atau lebar layar
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sim_rw_view_mode") as ViewMode | null;
      if (saved === "desktop" || saved === "mobile") {
        setViewModeState(saved);
      } else {
        if (window.innerWidth < 1024) {
          setViewModeState("mobile");
        } else {
          setViewModeState("desktop");
        }
      }
    }
  }, []);

  const setViewMode = (mode: ViewMode) => {
    // Di aplikasi native, jangan biarkan berpindah ke desktop simulation frame
    if (Capacitor.isNativePlatform()) {
      setViewModeState("mobile");
      return;
    }
    setViewModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("sim_rw_view_mode", mode);
    }
  };

  const toggleViewMode = () => {
    if (Capacitor.isNativePlatform()) return;
    setViewMode(viewMode === "desktop" ? "mobile" : "desktop");
  };

  return (
    <ViewModeContext.Provider
      value={{
        viewMode,
        setViewMode,
        toggleViewMode,
        isDesktop: viewMode === "desktop",
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error("useViewMode must be used within a ViewModeProvider");
  }
  return context;
}

