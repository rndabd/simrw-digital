import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getStore, saveStore } from "@/lib/data-store";
import {
  validateNikFormat,
  hashBlindIndex,
  encryptAES256GCM,
  maskNik,
} from "@/lib/security";
import { hashPassword } from "@/lib/auth";
import { savePrivateFile } from "@/lib/storage";
import { dispatchNotification, FCMTopics } from "@/lib/notifications";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let nik = "";
    let kk = "";
    let fullName = "";
    let phoneNumber = "";
    let password = "";
    let rwId = "";
    let rtId = "";
    let addressBlock = "";
    let email = "";
    let verificationMethod: "WHATSAPP" | "EMAIL" = "WHATSAPP";
    let ktpDocUrl = "/uploads/sample-ktp.jpg";
    let verificationToken = "";
    let isPhoneVerifiedParam = false;
    let isEmailVerifiedParam = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      nik = (formData.get("nik") as string) || "";
      kk = (formData.get("kk") as string) || "";
      fullName = (formData.get("fullName") as string) || "";
      phoneNumber = (formData.get("phoneNumber") as string) || "";
      email = (formData.get("email") as string) || "";
      verificationMethod = ((formData.get("verificationMethod") as string) === "EMAIL" ? "EMAIL" : "WHATSAPP");
      password = (formData.get("password") as string) || "";
      rwId = (formData.get("rwId") as string) || "";
      rtId = (formData.get("rtId") as string) || "";
      addressBlock = (formData.get("addressBlock") as string) || "";
      verificationToken = (formData.get("verificationToken") as string) || "";
      isPhoneVerifiedParam = formData.get("isPhoneVerified") === "true";
      isEmailVerifiedParam = formData.get("isEmailVerified") === "true";

      const ktpFile = formData.get("ktpFile") as File | null;
      if (ktpFile && ktpFile.size > 0) {
        const buffer = Buffer.from(await ktpFile.arrayBuffer());
        const saved = await savePrivateFile(buffer, ktpFile.name, ktpFile.type);
        ktpDocUrl = saved.fileId;
      }
    } else {
      const body = await req.json();
      nik = body.nik;
      kk = body.kk;
      fullName = body.fullName;
      phoneNumber = body.phoneNumber;
      email = body.email || "";
      verificationMethod = body.verificationMethod === "EMAIL" ? "EMAIL" : "WHATSAPP";
      password = body.password;
      rwId = body.rwId;
      rtId = body.rtId;
      addressBlock = body.addressBlock;
      verificationToken = body.verificationToken || "";
      isPhoneVerifiedParam = !!body.isPhoneVerified;
      isEmailVerifiedParam = !!body.isEmailVerified;
      if (body.ktpDocUrl) ktpDocUrl = body.ktpDocUrl;
    }

    if (verificationMethod === "EMAIL" && !email) {
      return NextResponse.json(
        { success: false, message: "Email wajib diisi jika memilih verifikasi melalui Email" },
        { status: 400 }
      );
    }

    // 1. Validasi NIK
    const nikCheck = validateNikFormat(nik);
    if (!nikCheck.isValid) {
      return NextResponse.json(
        { success: false, message: nikCheck.error || "Format NIK tidak valid" },
        { status: 400 }
      );
    }

    if (!fullName || !phoneNumber || !password) {
      return NextResponse.json(
        { success: false, message: "Nama lengkap, nomor HP, dan kata sandi wajib diisi" },
        { status: 400 }
      );
    }

    const store = getStore();

    // 2. Default RT/RW if omitted
    if (!rwId && store.rws.length > 0) rwId = store.rws[0].id;
    if (!rtId && store.rts.length > 0) {
      const foundRt = store.rts.find((r) => r.rw_id === rwId);
      rtId = foundRt ? foundRt.id : store.rts[0].id;
    }

    // 3. Blind index uniqueness check
    const nikHash = hashBlindIndex(nik);
    const existingNik = store.users.find((u) => u.nik_hash === nikHash);
    if (existingNik) {
      return NextResponse.json(
        { success: false, message: "NIK sudah terdaftar dalam sistem SIM-RW" },
        { status: 409 }
      );
    }

    const existingPhone = store.users.find((u) => u.phone_number === phoneNumber);
    if (existingPhone) {
      return NextResponse.json(
        { success: false, message: "Nomor WhatsApp/HP sudah terdaftar" },
        { status: 409 }
      );
    }

    // 4. Encrypt sensitive PII
    const nikEncrypted = encryptAES256GCM(nik);
    const passwordHash = await hashPassword(password);
    const newUserId = crypto.randomUUID();

    // 5. Create Household if KK provided
    let householdId: string | undefined = undefined;
    if (kk) {
      const kkHash = hashBlindIndex(kk);
      let hh = store.households.find((h) => h.kk_number_hash === kkHash);
      if (!hh) {
        hh = {
          id: crypto.randomUUID(),
          rt_id: rtId,
          kk_number_hash: kkHash,
          kk_number_enc: encryptAES256GCM(kk),
          address_block: addressBlock || "Alamat Belum Terdata",
          created_at: new Date().toISOString(),
        };
        store.households.push(hh);
      }
      householdId = hh.id;
    }

    // 6. Save User with PENDING_VERIFICATION
    const isEmailVerified = isEmailVerifiedParam || verificationMethod === "EMAIL";
    const isPhoneVerified = isPhoneVerifiedParam || verificationMethod === "WHATSAPP";

    if (verificationToken && store.verification_otps) {
      store.verification_otps = store.verification_otps.filter(
        (t) => t.code !== verificationToken
      );
    }

    const newUser = {
      id: newUserId,
      rw_id: rwId,
      rt_id: rtId,
      household_id: householdId,
      nik_hash: nikHash,
      nik_encrypted: nikEncrypted,
      full_name: fullName.trim(),
      phone_number: phoneNumber.trim(),
      email: email.trim() ? email.trim() : undefined,
      is_phone_verified: isPhoneVerified,
      is_email_verified: isEmailVerified,
      password_hash: passwordHash,
      ktp_doc_url: ktpDocUrl,
      status: "PENDING_VERIFICATION" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.users.push(newUser);

    // Default Resident role mapping
    store.user_roles.push({
      id: crypto.randomUUID(),
      user_id: newUserId,
      role_id: "role-resident",
      assigned_at: new Date().toISOString(),
    });

    saveStore(store);

    // 7. Audit log
    await recordAuditLog({
      userId: newUserId,
      action: "REGISTER_RESIDENT",
      resource: "USER",
      payload: { fullName, maskedNik: maskNik(nik), addressBlock },
    });

    // 8. Async Push Notification to RT Officers
    await dispatchNotification({
      title: "Pendaftaran Warga Baru",
      body: `Ada pendaftaran warga baru (${fullName}) di ${addressBlock || "RT Anda"} menunggu verifikasi.`,
      topic: FCMTopics.rtOfficers(rtId),
      data: {
        type: "RESIDENT_PENDING_VERIFICATION",
        userId: newUserId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Pendaftaran berhasil. Menunggu verifikasi berkas oleh Pengurus RT setempat.",
        data: {
          id: newUserId,
          fullName: newUser.full_name,
          phoneNumber: newUser.phone_number,
          status: newUser.status,
          maskedNik: maskNik(nik),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

