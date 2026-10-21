"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface UserProfile {
  id: string;
  fullName: string;
  phoneNumber: string;
  status: "UNVERIFIED" | "PENDING_VERIFICATION" | "VERIFIED_ACTIVE" | "REJECTED" | "SUSPENDED";
  maskedNik: string;
  rejectionNote?: string;
  verifiedAt?: string;
  rw?: { id: string; number: string; village: string; city: string };
  rt?: { id: string; number: string };
  addressBlock?: string;
  roles: string[];
  permissions: string[];
  isOfficer: boolean;
  isSuperAdmin: boolean;
  hasPendingOfficerRequest?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isOfficerMode: boolean;
  setOfficerMode: (val: boolean) => void;
  login: (phoneNumber: string, password: string) => Promise<{ success: boolean; message?: string }>;
  quickLogin: (type: "ADMIN" | "RT" | "RW" | "RESIDENT" | "PENDING") => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfficerMode, setIsOfficerMode] = useState(false);

  const fetchProfile = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
      const res = await fetch("/api/v1/auth/me", { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const isSuperAdmin = json.data.roles?.includes("SUPER_ADMIN");
          const isOfficer = json.data.isOfficer || isSuperAdmin;
          setUser({
            ...json.data,
            isSuperAdmin,
            isOfficer,
          });
          if (!isOfficer) {
            setIsOfficerMode(false);
          }
          return;
        }
      }
      setUser(null);
    } catch (e) {
      setUser(null);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (phoneNumber: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchProfile();
        return { success: true };
      } else {
        return { success: false, message: data.message || "Login gagal" };
      }
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (type: "ADMIN" | "RT" | "RW" | "RESIDENT" | "PENDING") => {
    let phone = "081200000003"; // Siti Aminah (Resident)
    if (type === "ADMIN") phone = "081100000000"; // Ibu Ratna Dewi (Lurah Sukamaju / Super Admin)
    if (type === "RT") phone = "081200000002"; // Hendra Gunawan (RT Chair)
    if (type === "RW") phone = "081200000001"; // Budi Santoso (RW Chair)
    if (type === "PENDING") phone = "081200000004"; // Ahmad Hidayat (Pending)

    await login(phone, "password123");
  };

  const logout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
    setIsOfficerMode(false);
  };

  const setOfficerModeSafe = (val: boolean) => {
    if (val && !user?.isOfficer) return;
    setIsOfficerMode(val);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isOfficerMode,
        setOfficerMode: setOfficerModeSafe,
        login,
        quickLogin,
        logout,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
