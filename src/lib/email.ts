import nodemailer from "nodemailer";

/**
 * Konfigurasi Layanan Pengiriman Email (SMTP)
 */
export function getEmailTransporter() {
  const host = process.env.SMTP_HOST || "kenari.superserver.co.id";
  const user = process.env.SMTP_USER || "no-reply@simrw.web.id";
  const pass = process.env.SMTP_PASS || ";~nS+f9@PB&??]Tp";
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE === "false" ? false : true;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Kirim Email Standar HTML
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transporter = getEmailTransporter();
  const from = process.env.SMTP_FROM || `"SIM-RW Digital" <no-reply@simrw.web.id>`;

  // Fallback simulasi jika kredensial SMTP belum diisi di .env
  if (!transporter) {
    console.log(`[Email Simulated] To: ${to}\nSubject: ${subject}\nHTML Preview:\n${html.replace(/<[^>]*>?/gm, ' ').slice(0, 200)}...`);
    return {
      success: true,
      messageId: `sim-email-${Date.now()}`,
    };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log(`[Email Live] Terkirim ke: ${to}, Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Email Error]:`, error);
    return { success: false, error: error.message || "Gagal mengirim email" };
  }
}

/**
 * Kirim Kode OTP Verifikasi Akun via Email
 */
export async function sendEmailOtp(toEmail: string, otpCode: string, purpose: string = "Verifikasi Akun") {
  const subject = `[SIM-RW] Kode OTP ${purpose}: ${otpCode}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #047857; margin: 0; font-size: 22px;">SIM-RW Digital</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Sistem Informasi & Administrasi Warga Rukun Warga</p>
      </div>
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; border: 1px dashed #cbd5e1; margin-bottom: 20px;">
        <p style="color: #475569; font-size: 14px; margin-bottom: 12px; font-weight: bold;">Kode Verifikasi OTP Anda (${purpose}):</p>
        <span style="display: inline-block; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #0f172a; font-family: monospace; background-color: #ffffff; padding: 8px 24px; border-radius: 8px; border: 2px solid #10b981;">
          ${otpCode}
        </span>
        <p style="color: #64748b; font-size: 12px; margin-top: 12px;">Kode ini berlaku selama 10 menit. Jangan bagikan kepada siapa pun.</p>
      </div>
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
        Email ini dikirim otomatis oleh sistem SIM-RW. Jika Anda tidak merasa meminta kode ini, silakan abaikan.
      </p>
    </div>
  `;

  return await sendEmail({ to: toEmail, subject, html });
}

