import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getStore, saveStore } from "@/lib/data-store";
import { hashPassword } from "@/lib/auth";
import {
  validateNikFormat,
  hashBlindIndex,
  encryptAES256GCM,
  maskNik,
} from "@/lib/security";
import { recordAuditLog } from "@/lib/audit";
import { dispatchNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const {
      rwNumber,
      village,
      district,
      city,
      chairName,
      phoneNumber,
      password,
      nik,
      skDocumentUrl,
      termPeriod = "2026-2031",
      rtCount = 3,
    } = await req.json();

    if (!rwNumber || !village || !chairName || !phoneNumber || !password || !nik) {
      return NextResponse.json(
        { success: false, message: "Seluruh kolom formulir pendaftaran RW wajib diisi." },
        { status: 400 }
      );
    }

    const nikCheck = validateNikFormat(nik);
    if (!nikCheck.isValid) {
      return NextResponse.json(
        { success: false, message: nikCheck.error || "Format NIK Ketua RW tidak valid" },
        { status: 400 }
      );
    }

    const store = getStore();

    // Check duplicate RW in same village
    const existingRw = store.rws.find(
      (r) =>
        r.rw_number.padStart(2, "0") === rwNumber.padStart(2, "0") &&
        r.village.toLowerCase() === village.toLowerCase()
    );
    if (existingRw) {
      return NextResponse.json(
        {
          success: false,
          message: `RW ${rwNumber} di Kelurahan ${village} sudah terdaftar dalam sistem (Status: ${existingRw.status}).`,
        },
        { status: 409 }
      );
    }

    // Check duplicate phone or NIK
    const nikHash = hashBlindIndex(nik);
    if (store.users.some((u) => u.nik_hash === nikHash)) {
      return NextResponse.json(
        { success: false, message: "NIK Ketua RW sudah terdaftar dalam sistem SIM-RW" },
        { status: 409 }
      );
    }
    if (store.users.some((u) => u.phone_number === phoneNumber)) {
      return NextResponse.json(
        { success: false, message: "Nomor WhatsApp Ketua RW sudah terdaftar" },
        { status: 409 }
      );
    }

    const newRwId = `rw-${rwNumber.padStart(2, "0")}-${village.toLowerCase().replace(/\s+/g, "-")}`;
    const newUserId = crypto.randomUUID();
    const defaultRtId = `rt-01-${newRwId}`;

    // 1. Create Default RTs
    const generatedRts = [];
    const count = Math.max(1, parseInt(rtCount, 10) || 3);
    for (let i = 1; i <= count; i++) {
      generatedRts.push({
        id: `rt-${String(i).padStart(2, "0")}-${newRwId}`,
        rw_id: newRwId,
        rt_number: String(i).padStart(2, "0"),
        term_period: termPeriod,
        status: "ACTIVE" as const,
        created_at: new Date().toISOString(),
      });
    }

    // 2. Create Chair User
    const passwordHash = await hashPassword(password);
    const newChairUser = {
      id: newUserId,
      rw_id: newRwId,
      rt_id: defaultRtId,
      nik_hash: nikHash,
      nik_encrypted: encryptAES256GCM(nik),
      full_name: chairName.trim(),
      phone_number: phoneNumber.trim(),
      password_hash: passwordHash,
      ktp_doc_url: skDocumentUrl || "/uploads/sk-pemilihan-rw.pdf",
      status: "PENDING_VERIFICATION" as const, // Waiting for Super Admin approval
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 3. Create RW record with PENDING_APPROVAL status
    const newRw = {
      id: newRwId,
      rw_number: rwNumber.padStart(2, "0"),
      village: village.trim(),
      district: district ? district.trim() : "Coblong",
      city: city ? city.trim() : "Kota Bandung",
      status: "PENDING_APPROVAL" as const,
      term_period: termPeriod,
      applicant_user_id: newUserId,
      sk_kelurahan_url: skDocumentUrl || "/uploads/sk-pelantikan-rw.pdf",
      created_at: new Date().toISOString(),
    };

    store.rws.push(newRw);
    store.rts.push(...generatedRts);
    store.users.push(newChairUser);

    // Default Resident role (RW_CHAIR will be assigned upon Super Admin approval)
    store.user_roles.push({
      id: crypto.randomUUID(),
      user_id: newUserId,
      role_id: "role-resident",
      assigned_at: new Date().toISOString(),
    });

    saveStore(store);

    // 4. Audit Log
    await recordAuditLog({
      userId: newUserId,
      action: "REGISTER_NEW_RW_ORGANIZATION",
      resource: `ORGANIZATION_RW:${newRwId}`,
      payload: { rwNumber, village, chairName, maskedNik: maskNik(nik), termPeriod },
    });

    // 5. Notify Super Admin (Kelurahan)
    await dispatchNotification({
      title: "Permohonan Pendaftaran RW Baru",
      body: `Pendaftaran RW ${rwNumber} Kelurahan ${village} oleh ${chairName} menunggu persetujuan Super Admin Kelurahan.`,
      topic: "admin_broadcast",
    });

    return NextResponse.json(
      {
        success: true,
        message: `Pendaftaran RW ${rwNumber} Kelurahan ${village} berhasil diajukan. Menunggu persetujuan Super Admin Kelurahan.`,
        data: {
          rwId: newRwId,
          rwNumber: newRw.rw_number,
          village: newRw.village,
          chairName: newChairUser.full_name,
          status: newRw.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to register RW" },
      { status: 500 }
    );
  }
}

