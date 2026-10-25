import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, comparePassword, hashPassword } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Kata sandi lama dan kata sandi baru wajib diisi." },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && confirmPassword !== newPassword) {
      return NextResponse.json(
        { success: false, message: "Kata sandi dan konfirmasi kata sandi tidak sama." },
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
    const user = store.users.find((u) => u.id === auth.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Data pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    const isMatch = await comparePassword(currentPassword, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Kata sandi lama yang Anda masukkan salah." },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);
    user.password_hash = newHash;
    user.updated_at = new Date().toISOString();
    saveStore(store);

    await recordAuditLog({
      userId: user.id,
      action: "CHANGE_PASSWORD",
      resource: `USER:${user.id}`,
      payload: { timestamp: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      message: "Kata sandi berhasil diperbarui! Silakan gunakan kata sandi baru untuk login selanjutnya.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengubah kata sandi." },
      { status: 500 }
    );
  }
}

