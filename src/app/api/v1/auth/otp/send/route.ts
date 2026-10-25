import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getStore, saveStore } from "@/lib/data-store";
import { sendWhatsAppOtp, normalizePhoneNumber } from "@/lib/waha";
import { sendEmailOtp } from "@/lib/email";
import { maskContact } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const { target, channel = "WHATSAPP", purpose = "Verifikasi Akun" } = await req.json();

    if (!target) {
      return NextResponse.json(
        { success: false, message: "Nomor WhatsApp atau alamat email tujuan wajib diisi." },
        { status: 400 }
      );
    }

    const cleanTarget = target.trim();
    const isEmail = channel === "EMAIL" || cleanTarget.includes("@");
    const activeChannel = isEmail ? "EMAIL" : "WHATSAPP";

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const store = getStore();
    if (!store.verification_otps) store.verification_otps = [];

    // Clear previous pending OTPs for this target
    store.verification_otps = store.verification_otps.filter((t) => {
      if (activeChannel === "WHATSAPP") {
        return (
          t.target !== cleanTarget &&
          normalizePhoneNumber(t.target) !== normalizePhoneNumber(cleanTarget)
        );
      }
      return t.target.toLowerCase() !== cleanTarget.toLowerCase();
    });

    store.verification_otps.push({
      id: crypto.randomUUID(),
      target: cleanTarget,
      code: otpCode,
      type: activeChannel === "EMAIL" ? "EMAIL_VERIFICATION" : "PHONE_VERIFICATION",
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    });

    saveStore(store);

    // Send dispatch via respective channel
    let dispatchResult: { success: boolean; messageId?: string; error?: string };
    if (activeChannel === "EMAIL") {
      dispatchResult = await sendEmailOtp(cleanTarget, otpCode, purpose);
    } else {
      dispatchResult = await sendWhatsAppOtp(cleanTarget, otpCode, purpose);
    }

    if (!dispatchResult.success && !dispatchResult.messageId) {
      return NextResponse.json(
        {
          success: false,
          message: dispatchResult.error || `Gagal mengirimkan kode OTP via ${activeChannel === "EMAIL" ? "Email" : "WhatsApp"}. Silakan periksa kembali alamat/nomor tujuan.`,
        },
        { status: 500 }
      );
    }

    const isSimulated = dispatchResult?.messageId?.startsWith("sim-") || false;
    const masked = maskContact(cleanTarget);

    return NextResponse.json({
      success: true,
      message: isSimulated
        ? `[Mode Simulasi] Kode OTP Anda: ${otpCode} (Gateway ${activeChannel === "EMAIL" ? "Email/SMTP" : "WhatsApp"} belum terkonfigurasi).`
        : `Kode OTP verifikasi berhasil dikirim ke ${masked} via ${activeChannel === "EMAIL" ? "Email" : "WhatsApp"}.`,
      simulated: isSimulated,
      devOtpCode: isSimulated ? otpCode : undefined,
      channel: activeChannel,
      targetMasked: masked,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengirimkan kode OTP." },
      { status: 500 }
    );
  }
}
