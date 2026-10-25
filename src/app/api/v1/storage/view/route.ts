import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { verifyPresignedUrl } from "@/lib/storage";
import { getAuthUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId") || searchParams.get("id");
    const expires = searchParams.get("expires");
    const sig = searchParams.get("sig");
    const type = searchParams.get("type");

    if (!fileId) {
      return NextResponse.json(
        { success: false, message: "Parameter identifikasi berkas (fileId) tidak ditemukan." },
        { status: 400 }
      );
    }

    // Sanitize fileId to prevent directory traversal
    const safeFileId = path.basename(fileId);
    const filePath = path.join(process.cwd(), "private_storage", "uploads", safeFileId);

    const isAvatar = type === "avatar" || safeFileId.startsWith("avatar-");

    if (!isAvatar) {
      // Dokumen rahasia (KTP, SK Mandat, Bukti Bayar) wajib memiliki tanda tangan pre-signed & TTL
      if (!expires || !sig) {
        return NextResponse.json(
          { success: false, message: "Parameter tanda tangan pre-signed tidak lengkap." },
          { status: 400 }
        );
      }

      const verification = verifyPresignedUrl(safeFileId, expires, sig);
      if (!verification.valid) {
        return NextResponse.json(
          { success: false, message: verification.error },
          { status: 403 }
        );
      }

      // Catat log audit UU PDP untuk akses berkas rahasia
      const auth = getAuthUser(req);
      const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
      await recordAuditLog({
        userId: auth?.userId || "anonymous-signed-url",
        action: "VIEW_KTP_DOCUMENT",
        resource: "STORAGE_FILE",
        payload: { fileId: safeFileId },
        ipAddress: ip,
      });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, message: "Berkas tidak ditemukan." },
        { status: 404 }
      );
    }

    const fileBuffer = await fs.promises.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    let contentType = "image/jpeg";
    if (ext === ".png") contentType = "image/png";
    else if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".svg") contentType = "image/svg+xml";

    const cacheHeader = isAvatar
      ? "public, max-age=86400, stale-while-revalidate=604800"
      : "private, no-cache, no-store, must-revalidate";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheHeader,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to retrieve storage file" },
      { status: 500 }
    );
  }
}
