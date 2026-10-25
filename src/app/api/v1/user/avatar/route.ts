import { NextRequest, NextResponse } from "next/server";
import path from "path";
import crypto from "crypto";
import { getAuthUser } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { savePrivateFile } from "@/lib/storage";
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

    const contentType = req.headers.get("content-type") || "";
    let avatarUrl = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file || file.size === 0) {
        return NextResponse.json(
          { success: false, message: "Berkas foto profil wajib dilampirkan." },
          { status: 400 }
        );
      }

      // Check max size 5MB
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, message: "Ukuran foto maksimal 5 MB." },
          { status: 400 }
        );
      }

      const ext = path.extname(file.name) || ".jpg";
      const customFileId = `avatar-${crypto.randomUUID()}${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const saved = await savePrivateFile(buffer, file.name, file.type, customFileId);
      avatarUrl = `/api/v1/storage/view?fileId=${saved.fileId}&type=avatar`;
    } else {
      const body = await req.json();
      if (!body.avatarUrl) {
        return NextResponse.json(
          { success: false, message: "avatarUrl wajib diisi." },
          { status: 400 }
        );
      }
      avatarUrl = body.avatarUrl;
    }

    const store = getStore();
    const user = store.users.find((u) => u.id === auth.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    user.avatar_url = avatarUrl;
    user.updated_at = new Date().toISOString();
    saveStore(store);

    await recordAuditLog({
      userId: user.id,
      action: "UPDATE_PROFILE_AVATAR",
      resource: `USER:${user.id}`,
      payload: { avatarUrl },
    });

    return NextResponse.json({
      success: true,
      message: "Foto profil berhasil diperbarui!",
      data: {
        avatarUrl,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memperbarui foto profil." },
      { status: 500 }
    );
  }
}
