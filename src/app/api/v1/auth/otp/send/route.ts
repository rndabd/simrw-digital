import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getStore, saveStore } from "@/lib/data-store";
import { sendWhatsAppOtp } from "@/lib/waha";
import { sendEmailOtp } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { target, channel = "WHATSAPP", purpose = "Verifikasi Akun" } = await req.json();

    if (!target) {
      return NextResponse.json(
        { success: false, message: "Nomor HP atau alamat email tujuan wajib diisi." },
        { status: 400 }
      );
    }

    const cleanTarget = target.trim();
    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const store = getStore();
    if (!store.verification_otps) store.verification_otps = [];

    // Clear previous pending OTPs for this target
    store.verification_otps = store.verification_otps.filter((t) => t.target !== cleanTarget);

    store.verification_otps.push({
      id: crypto.randomUUID(),
      target: cleanTarget,
      code: otpCode,
      type: channel === "EMAIL" ? "EMAIL_VERIFICATION" : "PHONE_VERIFICATION",
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    });

    saveStore(store);

    // Send dispatch via respective channel
    if (channel === "EMAIL") {
      await sendEmailOtp(cleanTarget, otpCode, purpose);
    } else {
      await sendWhatsAppOtp(cleanTarget, otpCode, purpose);
    }

    return NextResponse.json({
      success: true,
      message: `Kode OTP verifikasi berhasil dikirim ke ${cleanTarget} via ${channel === "EMAIL" ? "Email" : "WhatsApp"}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengirimkan kode OTP." },
      { status: 500 }
    );
  }
}

