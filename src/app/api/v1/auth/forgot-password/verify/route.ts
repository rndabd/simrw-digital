import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getStore, saveStore } from "@/lib/data-store";
import { hashBlindIndex, maskNik, maskContact } from "@/lib/security";
import { normalizePhoneNumber, sendWhatsAppOtp } from "@/lib/waha";
import { sendEmailOtp } from "@/lib/email";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nik, phoneNumber, email, identifier, channel } = body;

    const cleanNik = (nik || "").trim();
    const cleanContact = (identifier || phoneNumber || email || "").trim();

    if (!cleanNik || !cleanContact) {
      return NextResponse.json(
        {
          success: false,
          message: "NIK dan Nomor WhatsApp atau Email terdaftar wajib diisi.",
          canContactAdmin: true,
        },
        { status: 400 }
      );
    }

    const store = getStore();
    const nikHash = hashBlindIndex(cleanNik);

    // Cari pengguna berdasarkan Blind Index NIK
    const user = store.users.find((u) => u.nik_hash === nikHash);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Data NIK tidak terdaftar dalam sistem SIM-RW.",
          canContactAdmin: true,
          adminHelp: {
            message: "Jika Anda warga baru atau belum terdaftar, silakan hubungi Pengurus RT / RW setempat.",
            whatsappLink: "https://wa.me/6281200000001?text=Halo%20Admin%20SIM-RW%2C%20saya%20ingin%20meminta%20bantuan%20terkait%20akun%20warga.",
          },
        },
        { status: 404 }
      );
    }

    // Verifikasi apakah kontak yang dimasukkan cocok dengan data pengguna
    const isEmail = cleanContact.includes("@");
    const matchesPhone =
      user.phone_number === cleanContact ||
      normalizePhoneNumber(user.phone_number) === normalizePhoneNumber(cleanContact);
    const matchesEmail =
      user.email && user.email.toLowerCase() === cleanContact.toLowerCase();

    if (!matchesPhone && !matchesEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Nomor WhatsApp atau Email tidak cocok dengan data terdaftar pada NIK ini.",
          canContactAdmin: true,
          adminHelp: {
            message: "Jika nomor HP atau email Anda sudah tidak aktif, hubungi Pengurus RT/RW untuk pembaruan profil.",
            whatsappLink: "https://wa.me/6281200000001?text=Halo%20Admin%20SIM-RW%2C%20saya%20ingin%20meminta%20bantuan%20pemulihan%20akun.",
          },
        },
        { status: 400 }
      );
    }

    // Tentukan kanal pengiriman OTP berdasarkan preferensi pengguna atau deteksi otomatis
    let activeChannel: "WHATSAPP" | "EMAIL" = "WHATSAPP";
    if (channel === "EMAIL" || (!channel && isEmail)) {
      activeChannel = "EMAIL";
    }

    if (activeChannel === "EMAIL" && !user.email && !isEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Akun Anda belum memiliki alamat email terdaftar. Silakan pilih opsi pengiriman via WhatsApp.",
          canContactAdmin: true,
        },
        { status: 400 }
      );
    }

    const targetDestination = activeChannel === "EMAIL" ? (user.email || cleanContact) : user.phone_number;

    // Generate 6-digit OTP untuk Reset Kata Sandi
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 menit

    if (!store.verification_otps) store.verification_otps = [];

    // Hapus OTP reset sebelumnya untuk target ini
    store.verification_otps = store.verification_otps.filter(
      (t) =>
        t.type !== "PASSWORD_RESET_OTP" ||
        (t.target !== cleanContact &&
          t.target !== targetDestination &&
          normalizePhoneNumber(t.target) !== normalizePhoneNumber(cleanContact))
    );

    store.verification_otps.push({
      id: crypto.randomUUID(),
      target: targetDestination,
      code: otpCode,
      type: "PASSWORD_RESET_OTP",
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    });

    if (cleanContact !== targetDestination) {
      store.verification_otps.push({
        id: crypto.randomUUID(),
        target: cleanContact,
        code: otpCode,
        type: "PASSWORD_RESET_OTP",
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      });
    }

    saveStore(store);

    // Kirim OTP via Email atau WhatsApp
    let dispatchResult: { success: boolean; messageId?: string; error?: string };
    if (activeChannel === "EMAIL") {
      dispatchResult = await sendEmailOtp(targetDestination, otpCode, "Pemulihan Kata Sandi");
    } else {
      dispatchResult = await sendWhatsAppOtp(targetDestination, otpCode, "Pemulihan Kata Sandi");
    }

    const isSimulated = dispatchResult?.messageId?.startsWith("sim-") || false;
    const maskedContact = maskContact(targetDestination);

    await recordAuditLog({
      userId: user.id,
      action: "REQUEST_FORGOT_PASSWORD_OTP",
      resource: `USER:${user.id}`,
      payload: { channel: activeChannel, targetMasked: maskedContact },
    });

    return NextResponse.json({
      success: true,
      message: isSimulated
        ? `[Mode Simulasi] Kode OTP pemulihan kata sandi: ${otpCode} (Gateway ${activeChannel === "EMAIL" ? "Email" : "WhatsApp"} belum terkonfigurasi).`
        : `Kode OTP pemulihan berhasil dikirim ke ${maskedContact} via ${activeChannel === "EMAIL" ? "Email" : "WhatsApp"}.`,
      data: {
        userId: user.id,
        fullName: user.full_name,
        maskedNik: maskNik(cleanNik),
        target: cleanContact,
        targetMasked: maskedContact,
        channel: activeChannel,
        simulated: isSimulated,
        devOtpCode: isSimulated ? otpCode : undefined,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memproses pemulihan kata sandi." },
      { status: 500 }
    );
  }
}
