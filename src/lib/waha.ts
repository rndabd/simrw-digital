/**
 * WhatsApp Gateway (GOWA & WAHA) Service Client
 * Digunakan untuk mengirim pesan OTP, notifikasi tagihan, dan pemulihan akun warga
 */

export interface WhatsAppGatewayConfig {
  gowaUrl: string;
  wahaUrl: string;
  apiKey?: string;
  session: string;
}

export function getWhatsAppConfig(): WhatsAppGatewayConfig {
  return {
    gowaUrl: process.env.GOWA_API_URL || "https://gowa-api.rnd.web.id",
    wahaUrl: process.env.WAHA_API_URL || "",
    apiKey: process.env.WAHA_API_KEY || "",
    session: process.env.WAHA_SESSION || "default",
  };
}

/**
 * Normalisasi nomor HP Indonesia ke format murni angka internasional (misal 0857... -> 62857...)
 */
export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  } else if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
}

/**
 * Format ke WhatsApp JID / ChatId (62812...@c.us)
 */
export function formatToWhatsAppChatId(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  return `${normalized}@c.us`;
}

/**
 * Kirim pesan WhatsApp menggunakan GOWA (Go WhatsApp API) atau WAHA
 */
export async function sendWhatsAppMessage(
  toPhone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = getWhatsAppConfig();
  const normalizedPhone = normalizePhoneNumber(toPhone);

  // 1. Prioritaskan GOWA Gateway jika aktif
  const gowaUrl = config.gowaUrl || (config.wahaUrl.includes("gowa") ? config.wahaUrl : "");
  if (gowaUrl) {
    try {
      const endpoint = `${gowaUrl.replace(/\/+$/, "")}/send/message`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalizedPhone,
          message: message,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.code === "SUCCESS") {
        console.log(`[GOWA Live] Pesan WhatsApp terkirim ke ${normalizedPhone}:`, json.message);
        return {
          success: true,
          messageId: json.results?.message_id || `gowa-${Date.now()}`,
        };
      } else {
        console.warn(`[GOWA Error] Respon dari server:`, json);
        return {
          success: false,
          error: json.message || "Gagal mengirim pesan via GOWA",
        };
      }
    } catch (err: any) {
      console.error(`[GOWA Exception]:`, err.message);
    }
  }

  // 2. WAHA Fallback jika digunakan
  if (config.wahaUrl && !config.wahaUrl.includes("gowa")) {
    try {
      const chatId = `${normalizedPhone}@c.us`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (config.apiKey) headers["X-Api-Key"] = config.apiKey;

      const res = await fetch(`${config.wahaUrl}/api/sendText`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          session: config.session,
          chatId,
          text: message,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log(`[WAHA Live] Pesan terkirim ke ${chatId}`);
        return { success: true, messageId: json.id };
      }
    } catch (err: any) {
      console.warn(`[WAHA Exception]:`, err.message);
    }
  }

  // 3. Fallback simulasi
  console.log(`[WhatsApp Simulated] Kirim ke: ${normalizedPhone}\nPesan:\n${message}`);
  return {
    success: true,
    messageId: `sim-wa-${Date.now()}`,
  };
}

/**
 * Kirim Kode OTP Verifikasi via WhatsApp
 */
export async function sendWhatsAppOtp(phone: string, otpCode: string, purpose: string = "Verifikasi Akun") {
  const text = `*SIM-RW DIGITAL - KODE VERIFIKASI*\n\nKode OTP ${purpose} Anda adalah:\n\n*${otpCode}*\n\nKode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapapun demi keamanan data Anda.`;
  return await sendWhatsAppMessage(phone, text);
}
