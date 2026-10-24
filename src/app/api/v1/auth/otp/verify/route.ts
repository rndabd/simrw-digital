import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    const { target, code, channel = "WHATSAPP" } = await req.json();

    if (!target || !code) {
      return NextResponse.json(
        { success: false, message: "Target dan kode OTP wajib diisi." },
        { status: 400 }
      );
    }

    const cleanTarget = target.trim();
    const cleanCode = code.trim();

    const store = getStore();
    if (!store.verification_otps) store.verification_otps = [];

    const now = new Date();
    const expectedType = channel === "EMAIL" ? "EMAIL_VERIFICATION" : "PHONE_VERIFICATION";

    const otpIndex = store.verification_otps.findIndex(
      (t) =>
        t.target === cleanTarget &&
        t.code === cleanCode &&
        t.type === expectedType &&
        new Date(t.expires_at) > now
    );

    if (otpIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Kode OTP salah atau telah kedaluwarsa." },
        { status: 400 }
      );
    }

    // Remove used OTP
    store.verification_otps.splice(otpIndex, 1);

    // If user is logged in or match by phone/email, update verification status
    let matchedUser = auth ? store.users.find((u) => u.id === auth.userId) : null;
    if (!matchedUser) {
      matchedUser = store.users.find(
        (u) => u.phone_number === cleanTarget || u.email === cleanTarget
      );
    }

    if (matchedUser) {
      if (channel === "EMAIL") {
        matchedUser.email = cleanTarget;
        matchedUser.is_email_verified = true;
      } else {
        matchedUser.phone_number = cleanTarget;
        matchedUser.is_phone_verified = true;
      }
      matchedUser.updated_at = new Date().toISOString();

      await recordAuditLog({
        userId: matchedUser.id,
        action: `VERIFY_${channel}_SUCCESS`,
        resource: `USER:${matchedUser.id}`,
        payload: { target: cleanTarget, channel },
      });
    }

    saveStore(store);

    return NextResponse.json({
      success: true,
      message: `${channel === "EMAIL" ? "Alamat email" : "Nomor WhatsApp"} berhasil diverifikasi!`,
      data: {
        isEmailVerified: matchedUser?.is_email_verified,
        isPhoneVerified: matchedUser?.is_phone_verified,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memverifikasi OTP." },
      { status: 500 }
    );
  }
}

