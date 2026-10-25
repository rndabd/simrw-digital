import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthUser } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";
import { normalizePhoneNumber } from "@/lib/waha";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    const { target, code, channel = "WHATSAPP" } = await req.json();

    if (!target || !code) {
      return NextResponse.json(
        { success: false, message: "Target kontak dan kode OTP wajib diisi." },
        { status: 400 }
      );
    }

    const cleanTarget = target.trim();
    const cleanCode = code.trim();
    const isEmail = channel === "EMAIL" || cleanTarget.includes("@");
    const expectedType = isEmail ? "EMAIL_VERIFICATION" : "PHONE_VERIFICATION";

    const store = getStore();
    if (!store.verification_otps) store.verification_otps = [];

    const now = new Date();

    const otpIndex = store.verification_otps.findIndex((t) => {
      const matchType = t.type === expectedType;
      const matchCode = t.code === cleanCode;
      const notExpired = new Date(t.expires_at) > now;
      let matchTarget = false;

      if (isEmail) {
        matchTarget = t.target.toLowerCase() === cleanTarget.toLowerCase();
      } else {
        matchTarget =
          t.target === cleanTarget ||
          normalizePhoneNumber(t.target) === normalizePhoneNumber(cleanTarget);
      }

      return matchType && matchCode && matchTarget && notExpired;
    });

    if (otpIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Kode OTP salah atau telah kedaluwarsa. Silakan periksa kembali atau minta kode baru." },
        { status: 400 }
      );
    }

    // Remove used OTP
    store.verification_otps.splice(otpIndex, 1);

    // Generate verified token for registration / setup authorization
    const verificationToken = crypto.randomUUID();
    store.verification_otps.push({
      id: crypto.randomUUID(),
      target: cleanTarget,
      code: verificationToken,
      type: "CONTACT_VERIFIED",
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      created_at: new Date().toISOString(),
    });

    // If user is logged in or match by phone/email, update verification status
    let matchedUser = auth ? store.users.find((u) => u.id === auth.userId) : null;
    if (!matchedUser) {
      matchedUser = store.users.find((u) => {
        if (isEmail) {
          return u.email?.toLowerCase() === cleanTarget.toLowerCase();
        }
        return (
          u.phone_number === cleanTarget ||
          normalizePhoneNumber(u.phone_number) === normalizePhoneNumber(cleanTarget)
        );
      });
    }

    if (matchedUser) {
      if (isEmail) {
        matchedUser.email = cleanTarget;
        matchedUser.is_email_verified = true;
      } else {
        matchedUser.phone_number = cleanTarget;
        matchedUser.is_phone_verified = true;
      }
      matchedUser.updated_at = new Date().toISOString();

      await recordAuditLog({
        userId: matchedUser.id,
        action: `VERIFY_${isEmail ? "EMAIL" : "PHONE"}_SUCCESS`,
        resource: `USER:${matchedUser.id}`,
        payload: { target: cleanTarget, channel: isEmail ? "EMAIL" : "WHATSAPP" },
      });
    }

    saveStore(store);

    return NextResponse.json({
      success: true,
      message: `${isEmail ? "Alamat email" : "Nomor WhatsApp"} berhasil diverifikasi!`,
      data: {
        verificationToken,
        target: cleanTarget,
        channel: isEmail ? "EMAIL" : "WHATSAPP",
        isEmailVerified: isEmail,
        isPhoneVerified: !isEmail,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memverifikasi OTP." },
      { status: 500 }
    );
  }
}
