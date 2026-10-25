import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getStore, saveStore } from "@/lib/data-store";
import { hashBlindIndex } from "@/lib/security";
import { normalizePhoneNumber } from "@/lib/waha";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const { nik, identifier, otpCode } = await req.json();

    const cleanNik = (nik || "").trim();
    const cleanContact = (identifier || "").trim();
    const cleanCode = (otpCode || "").trim();

    if (!cleanNik || !cleanContact || !cleanCode) {
      return NextResponse.json(
        { success: false, message: "NIK, kontak terdaftar, dan kode OTP wajib diisi." },
        { status: 400 }
      );
    }

    const store = getStore();
    if (!store.verification_otps) store.verification_otps = [];
    const nikHash = hashBlindIndex(cleanNik);
    const user = store.users.find((u) => u.nik_hash === nikHash);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Data pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    const now = new Date();
    const isEmail = cleanContact.includes("@");

    const otpIndex = (store.verification_otps || []).findIndex((t) => {
      const matchType = t.type === "PASSWORD_RESET_OTP";
      const matchCode = t.code === cleanCode;
      const notExpired = new Date(t.expires_at) > now;
      let matchTarget = false;

      if (isEmail) {
        matchTarget =
          t.target.toLowerCase() === cleanContact.toLowerCase() ||
          Boolean(user.email && user.email.toLowerCase() === t.target.toLowerCase());
      } else {
        matchTarget =
          t.target === cleanContact ||
          normalizePhoneNumber(t.target) === normalizePhoneNumber(cleanContact) ||
          normalizePhoneNumber(t.target) === normalizePhoneNumber(user.phone_number);
      }

      return matchType && matchCode && matchTarget && notExpired;
    });

    if (otpIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "Kode OTP salah atau telah kedaluwarsa. Silakan periksa kembali atau minta kode baru.",
        },
        { status: 400 }
      );
    }

    // Hapus OTP yang sudah digunakan
    store.verification_otps.splice(otpIndex, 1);

    // Buat resetToken sementara berlaku 15 menit
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    store.verification_otps.push({
      id: crypto.randomUUID(),
      target: user.id, // simpan userId langsung agar independen dari channel
      code: resetToken,
      type: "PASSWORD_RESET",
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    });

    saveStore(store);

    await recordAuditLog({
      userId: user.id,
      action: "VERIFY_FORGOT_PASSWORD_OTP_SUCCESS",
      resource: `USER:${user.id}`,
      payload: { contact: cleanContact },
    });

    return NextResponse.json({
      success: true,
      message: "Verifikasi OTP berhasil. Silakan buat kata sandi baru Anda.",
      data: {
        resetToken,
        fullName: user.full_name,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memverifikasi kode OTP." },
      { status: 500 }
    );
  }
}
