"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ViewMode = "desktop" | "mobile";

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  isDesktop: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>("desktop");

  useEffect(() => {
    // Check saved preference or screen size
    const saved = localStorage.getItem("sim_rw_view_mode") as ViewMode | null;
    if (saved === "desktop" || saved === "mobile") {
      setViewModeState(saved);
    } else if (typeof window !== "undefined") {
      // Auto detect: if screen width is smaller than 768px, default to mobile
      if (window.innerWidth < 768) {
        setViewModeState("mobile");
      } else {
        setViewModeState("desktop");
      }
    }
  }, []);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("sim_rw_view_mode", mode);
    }
  };

  const toggleViewMode = () => {
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

