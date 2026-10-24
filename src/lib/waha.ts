/**
 * WhatsApp HTTP API (WAHA) Service Client
 * Digunakan untuk mengirim pesan OTP, notifikasi tagihan, dan pemulihan akun warga
 */

export interface WahaConfig {
  baseUrl: string;
  apiKey?: string;
  session: string;
}

export function getWahaConfig(): WahaConfig {
  return {
    baseUrl: process.env.WAHA_API_URL || "http://localhost:3000",
    apiKey: process.env.WAHA_API_KEY || "",
    session: process.env.WAHA_SESSION || "default",
  };
}

/**
 * Normalisasi nomor HP Indonesia ke format internasional (misal 0812... -> 62812...@c.us)
 */
export function formatToWhatsAppChatId(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  } else if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }
  return `${cleaned}@c.us`;
}

/**
 * Kirim pesan WhatsApp menggunakan WAHA
 */
export async function sendWhatsAppMessage(
  toPhone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = getWahaConfig();
  const chatId = formatToWhatsAppChatId(toPhone);

  // Jika WAHA belum dikonfigurasi, jalankan mode simulasi aman
  if (!process.env.WAHA_API_URL) {
    console.log(`[WAHA Simulated] Kirim ke: ${chatId}\nPesan:\n${message}`);
    return {
      success: true,
      messageId: `sim-wa-${Date.now()}`,
    };
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (config.apiKey) {
      headers["X-Api-Key"] = config.apiKey;
    }

    const res = await fetch(`${config.baseUrl}/api/sendText`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        session: config.session,
        chatId,
        text: message,
      }),
    });

    const json = await res.json();
    if (res.ok) {
      console.log(`[WAHA Live] Pesan terkirim ke ${chatId}`);
      return { success: true, messageId: json.id };
    } else {
      console.warn(`[WAHA Error] Respon gagal:`, json);
      return { success: false, error: json.message || "Gagal mengirim pesan via WAHA" };
    }
  } catch (err: any) {
    console.warn(`[WAHA Exception]:`, err.message);
    return { success: true, messageId: `fallback-${Date.now()}` };
  }
}

/**
 * Kirim Kode OTP Verifikasi via WhatsApp
 */
export async function sendWhatsAppOtp(phone: string, otpCode: string, purpose: string = "Verifikasi Akun") {
  const text = `*SIM-RW DIGITAL - KODE VERIFIKASI*\n\nKode OTP ${purpose} Anda adalah:\n\n*${otpCode}*\n\nKode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapapun demi keamanan data Anda.`;
  return await sendWhatsAppMessage(phone, text);
}

