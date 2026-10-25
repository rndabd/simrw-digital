"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      // Ping lightweight status endpoint or favicon
      const res = await fetch("/api/v1/setup/status", {
        method: "GET",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        setIsOffline(false);
        setJustReconnected(true);
        setTimeout(() => setJustReconnected(false), 3000);
      } else {
        setIsOffline(true);
      }
    } catch (e) {
      setIsOffline(true);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      checkConnection();
    };

    const handleOffline = () => {
      setIsOffline(true);
      setJustReconnected(false);
    };

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  if (justReconnected) {
    return (
      <div className="w-full bg-emerald-600 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between shadow-md z-50 animate-in fade-in duration-300">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>Koneksi internet terhubung kembali. Data diperbarui.</span>
        </div>
      </div>
    );
  }

  if (!isOffline) return null;

  return (
    <div className="w-full bg-amber-600 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between shadow-md z-50 animate-in slide-in-from-top duration-200">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-amber-200 shrink-0 animate-pulse" />
        <span className="text-[11px] sm:text-xs">
          Tidak ada koneksi internet. Menampilkan data tersimpan. Tarik ke bawah untuk refresh.
        </span>
      </div>
      <button
        onClick={checkConnection}
        disabled={isChecking}
        className="bg-amber-800 hover:bg-amber-900 active:scale-95 px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 shrink-0 ml-2 shadow-sm transition-all"
      >
        <RefreshCw className={`w-3 h-3 ${isChecking ? "animate-spin" : ""}`} />
        <span>{isChecking ? "Memeriksa..." : "Cek Koneksi"}</span>
      </button>
    </div>
  );
}

