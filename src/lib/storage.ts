import fs from "fs";
import path from "path";
import crypto from "crypto";

const STORAGE_DIR = path.join(process.cwd(), "private_storage", "uploads");
const SIGNING_SECRET = process.env.JWT_SECRET || "sim-rw-storage-signing-secret";

// Ensure storage dir exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

export interface StoredFileResult {
  fileId: string;
  originalName: string;
  mimeType: string;
  size: number;
  filePath: string;
}

/**
 * Save an uploaded buffer to secure private storage
 */
export async function savePrivateFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<StoredFileResult> {
  const ext = path.extname(originalName) || ".jpg";
  const fileId = `${crypto.randomUUID()}${ext}`;
  const targetPath = path.join(STORAGE_DIR, fileId);

  await fs.promises.writeFile(targetPath, buffer);

  return {
    fileId,
    originalName,
    mimeType,
    size: buffer.length,
    filePath: targetPath,
  };
}

/**
 * Generate a Pre-signed URL with 5-minute TTL
 */
export function generatePresignedUrl(fileId: string, ttlSeconds: number = 300): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const dataToSign = `${fileId}:${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", SIGNING_SECRET)
    .update(dataToSign)
    .digest("hex");

  return `/api/v1/storage/view?fileId=${encodeURIComponent(fileId)}&expires=${expiresAt}&sig=${signature}`;
}

/**
 * Verify a Pre-signed URL token
 */
export function verifyPresignedUrl(
  fileId: string,
  expiresStr: string,
  sig: string
): { valid: boolean; error?: string } {
  const expires = parseInt(expiresStr, 10);
  const now = Math.floor(Date.now() / 1000);

  if (isNaN(expires) || now > expires) {
    return { valid: false, error: "Tautan dokumen telah kadaluarsa (Expired TTL 5 Menit)." };
  }

  const dataToSign = `${fileId}:${expires}`;
  const expectedSig = crypto
    .createHmac("sha256", SIGNING_SECRET)
    .update(dataToSign)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    return { valid: false, error: "Tanda tangan tanda akses dokumen tidak valid." };
  }

  const filePath = path.join(STORAGE_DIR, fileId);
  if (!fs.existsSync(filePath)) {
    return { valid: false, error: "Berkas tidak ditemukan pada private storage." };
  }

  return { valid: true };
}

