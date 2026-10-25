import crypto from "crypto";

const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const BLIND_INDEX_SECRET = process.env.BLIND_INDEX_SECRET || "sim-rw-blind-index-hmac-salt-secure-value";

// AES-256-GCM requires a 32-byte (256-bit) key
function getKeyBuffer(): Buffer {
  if (ENCRYPTION_KEY.length === 64) {
    return Buffer.from(ENCRYPTION_KEY, "hex");
  }
  return crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
}

/**
 * Encrypt sensitive PII data using AES-256-GCM.
 * Output format: iv:authTag:ciphertext (hex encoded)
 */
export function encryptAES256GCM(plainText: string): string {
  if (!plainText) return "";
  const key = getKeyBuffer();
  const iv = crypto.randomBytes(12); // Recommended 12 bytes for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt sensitive PII data using AES-256-GCM.
 */
export function decryptAES256GCM(encryptedPayload: string): string {
  if (!encryptedPayload) return "";
  const parts = encryptedPayload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format. Expected iv:authTag:ciphertext");
  }

  const [ivHex, authTagHex, cipherHex] = parts;
  const key = getKeyBuffer();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Generate HMAC-SHA256 Blind Index for fast searchable indexing without exposing plain NIK/KK.
 */
export function hashBlindIndex(plainText: string): string {
  if (!plainText) return "";
  return crypto
    .createHmac("sha256", BLIND_INDEX_SECRET)
    .update(plainText.trim())
    .digest("hex");
}

/**
 * Mask NIK according to UU PDP standard:
 * 327301******1234 (6 digit awal wilayah, 6 sensor, 4 digit akhir)
 */
export function maskNik(nik: string): string {
  if (!nik) return "";
  const cleaned = nik.trim();
  if (cleaned.length < 10) {
    return "******";
  }
  const prefix = cleaned.substring(0, 6);
  const suffix = cleaned.substring(cleaned.length - 4);
  return `${prefix}******${suffix}`;
}

/**
 * Mask No KK similarly for privacy
 */
export function maskKK(kk: string): string {
  if (!kk) return "";
  const cleaned = kk.trim();
  if (cleaned.length < 8) return "******";
  return `${cleaned.substring(0, 6)}******${cleaned.substring(cleaned.length - 4)}`;
}

/**
 * Mask Nomor WhatsApp / Telepon untuk privasi (misal 081234567890 -> 0812****7890)
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.trim();
  if (cleaned.length < 8) return "******";
  const prefix = cleaned.substring(0, 4);
  const suffix = cleaned.substring(cleaned.length - 4);
  return `${prefix}****${suffix}`;
}

/**
 * Mask Alamat Email untuk privasi (misal admin@simrw.web.id -> ad***@simrw.web.id)
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "";
  const [user, domain] = email.trim().split("@");
  if (user.length <= 2) return `${user}***@${domain}`;
  const prefix = user.substring(0, 2);
  return `${prefix}***@${domain}`;
}

/**
 * Mask Kontak (Otomatis mendeteksi nomor telepon atau email)
 */
export function maskContact(contact: string): string {
  if (!contact) return "";
  if (contact.includes("@")) return maskEmail(contact);
  return maskPhoneNumber(contact);
}

/**
 * Validasi Format NIK 16 digit & parsing informasi tanggal lahir
 */
export function validateNikFormat(nik: string): {
  isValid: boolean;
  error?: string;
  gender?: "MALE" | "FEMALE";
  birthDate?: string;
} {
  const cleaned = (nik || "").trim();
  if (!/^\d{16}$/.test(cleaned)) {
    return {
      isValid: false,
      error: "NIK wajib terdiri dari 16 digit angka numerik.",
    };
  }

  // Indonesian NIK standard format:
  // Positions: [0-1] Provinsi, [2-3] Kab/Kota, [4-5] Kecamatan,
  // [6-7] Tanggal (1-31 Pria, 41-71 Wanita), [8-9] Bulan (01-12), [10-11] Tahun (YY), [12-15] Nomor Urut
  const dayRaw = parseInt(cleaned.substring(6, 8), 10);
  const month = parseInt(cleaned.substring(8, 10), 10);
  const yearSuffix = cleaned.substring(10, 12);

  let isFemale = false;
  let day = dayRaw;
  if (dayRaw > 40) {
    isFemale = true;
    day = dayRaw - 40;
  }

  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return {
      isValid: false,
      error: "Kombinasi tanggal/bulan lahir pada NIK tidak valid.",
    };
  }

  // Perkirakan tahun (bisa 19xx atau 20xx)
  const currentYear2Digit = new Date().getFullYear() % 100;
  const birthYear = parseInt(yearSuffix, 10) > currentYear2Digit ? `19${yearSuffix}` : `20${yearSuffix}`;
  const formattedDay = day < 10 ? `0${day}` : `${day}`;
  const formattedMonth = month < 10 ? `0${month}` : `${month}`;

  return {
    isValid: true,
    gender: isFemale ? "FEMALE" : "MALE",
    birthDate: `${birthYear}-${formattedMonth}-${formattedDay}`,
  };
}

/**
 * Deep mask NIK in object response
 */
export function maskSensitiveUserData<T extends Record<string, any>>(user: T): Record<string, any> {
  if (!user) return user;
  const clone: Record<string, any> = { ...user };
  if (clone.nik_encrypted) {
    try {
      const decrypted = decryptAES256GCM(clone.nik_encrypted);
      clone.nik_masked = maskNik(decrypted);
    } catch {
      clone.nik_masked = "327301******1234";
    }
    // Delete raw encrypted column from public json response
    delete clone.nik_encrypted;
  }
  if (clone.password_hash) {
    delete clone.password_hash;
  }
  return clone;
}

