import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getStore, saveStore } from "@/lib/data-store";
import { hashBlindIndex } from "@/lib/security";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const { nik, phoneNumber } = await req.json();

    if (!nik || !phoneNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "NIK dan nomor HP/WhatsApp wajib diisi untuk verifikasi identitas.",
          canContactAdmin: true,
        },
        { status: 400 }
      );
    }

    const store = getStore();
    const cleanNik = nik.trim();
    const cleanPhone = phoneNumber.trim();
    const nikHash = hashBlindIndex(cleanNik);

    const user = store.users.find(
      (u) => u.nik_hash === nikHash && u.phone_number === cleanPhone
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Data NIK dan nomor HP tidak cocok dengan data warga terdaftar.",
          canContactAdmin: true,
          adminHelp: {
            message: "Jika Anda lupa NIK atau nomor HP sudah tidak aktif, silakan hubungi Pengurus RT / RW setempat untuk bantuan pemulihan akun.",
            whatsappLink: "https://wa.me/6281200000001?text=Halo%20Admin%2FPengurus%20SIM-RW%2C%20saya%20warga%20ingin%20meminta%20bantuan%20pemulihan%20akun%20karena%20lupa%20kata%20sandi.",
          },
        },
        { status: 404 }
      );
    }

    // Generate temporary reset token valid for 15 minutes
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    if (!store.verification_otps) {
      store.verification_otps = [];
    }

    // Remove any previous reset tokens for this user's phone
    store.verification_otps = store.verification_otps.filter(
      (t) => !(t.target === cleanPhone && t.type === "PASSWORD_RESET")
    );

    store.verification_otps.push({
      id: crypto.randomUUID(),
      target: cleanPhone,
      code: resetToken,
      type: "PASSWORD_RESET",
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    });

    saveStore(store);

    await recordAuditLog({
      userId: user.id,
      action: "VERIFY_FORGOT_PASSWORD_IDENTITY",
      resource: `USER:${user.id}`,
      payload: { phone: cleanPhone },
    });

    return NextResponse.json({
      success: true,
      message: "Verifikasi identitas NIK & Nomor HP berhasil. Silakan buat kata sandi baru.",
      data: {
        userId: user.id,
        fullName: user.full_name,
        resetToken,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memverifikasi identitas warga" },
      { status: 500 }
    );
  }
}

