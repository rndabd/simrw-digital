import { NextRequest, NextResponse } from "next/server";
import { getStore, saveStore } from "@/lib/data-store";
import { hashPassword } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const { resetToken, newPassword } = await req.json();

    if (!resetToken || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Token pemulihan dan kata sandi baru wajib diisi." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Kata sandi baru minimal 6 karakter." },
        { status: 400 }
      );
    }

    const store = getStore();
    if (!store.verification_otps) store.verification_otps = [];

    const now = new Date();
    const tokenRecord = store.verification_otps.find(
      (t) => t.code === resetToken && t.type === "PASSWORD_RESET" && new Date(t.expires_at) > now
    );

    if (!tokenRecord) {
      return NextResponse.json(
        {
          success: false,
          message: "Sesi pemulihan telah kedaluwarsa atau tidak valid. Silakan ulangi verifikasi NIK dan HP.",
        },
        { status: 401 }
      );
    }

    const user = store.users.find((u) => u.phone_number === tokenRecord.target);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    // Hash and update password
    const newHash = await hashPassword(newPassword);
    user.password_hash = newHash;
    user.updated_at = new Date().toISOString();

    // Invalidate used reset token
    store.verification_otps = store.verification_otps.filter((t) => t.id !== tokenRecord.id);
    saveStore(store);

    await recordAuditLog({
      userId: user.id,
      action: "RESET_PASSWORD_SUCCESS",
      resource: `USER:${user.id}`,
      payload: { phone: user.phone_number },
    });

    return NextResponse.json({
      success: true,
      message: "Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memperbarui kata sandi." },
      { status: 500 }
    );
  }
}

