/**
 * Helper untuk normalisasi pesan error koneksi & jaringan.
 * Mencegah pesan mentah browser seperti "Failed to fetch" muncul ke warga/pengguna.
 */
export function getFriendlyErrorMessage(
  err: any,
  fallback = "Terjadi kesalahan koneksi. Periksa jaringan internet Anda atau coba beberapa saat lagi."
): string {
  if (!err) return fallback;
  const msg = typeof err === "string" ? err : err?.message || "";
  
  if (
    !msg ||
    /failed to fetch|networkerror|load failed|network error|offline|aborterror|econnrefused|connection refused|failed to load/i.test(msg) ||
    (typeof navigator !== "undefined" && !navigator.onLine)
  ) {
    return "Tidak dapat terhubung ke server. Periksa koneksi internet Anda atau coba beberapa saat lagi.";
  }
  
  return msg;
}

