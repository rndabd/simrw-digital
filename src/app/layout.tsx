import type { Metadata, Viewport } from "next";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { AuthProvider } from "@/context/AuthContext";
import { ViewModeProvider } from "@/context/ViewModeContext";

export const metadata: Metadata = {
  title: "SIM-RW | Aplikasi Warga Digital",
  description:
    "Sistem Informasi & Aplikasi Warga Digital Modern, Cepat, Terverifikasi, dan Aman UU Pelindungan Data Pribadi.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SIM-RW Warga",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
        <ViewModeProvider>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        </ViewModeProvider>
      </body>
    </html>
  );
}
