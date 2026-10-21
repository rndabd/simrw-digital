import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { verifyPresignedUrl } from "@/lib/storage";
import { getAuthUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");
    const expires = searchParams.get("expires");
    const sig = searchParams.get("sig");

    if (!fileId || !expires || !sig) {
      return NextResponse.json(
        { success: false, message: "Parameter tanda tangan pre-signed tidak lengkap." },
        { status: 400 }
      );
    }

    const verification = verifyPresignedUrl(fileId, expires, sig);
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, message: verification.error },
        { status: 403 }
      );
    }

    // Record Audit Log access to KTP/Document
    const auth = getAuthUser(req);
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await recordAuditLog({
      userId: auth?.userId || "anonymous-signed-url",
      action: "VIEW_KTP_DOCUMENT",
      resource: "STORAGE_FILE",
      payload: { fileId },
      ipAddress: ip,
    });

    const filePath = path.join(process.cwd(), "private_storage", "uploads", fileId);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, message: "File tidak ditemukan." },
        { status: 404 }
      );
    }

    const fileBuffer = await fs.promises.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    let contentType = "image/jpeg";
    if (ext === ".png") contentType = "image/png";
    else if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".webp") contentType = "image/webp";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to retrieve storage file" },
      { status: 500 }
    );
  }
}

