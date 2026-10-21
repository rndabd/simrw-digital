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
import { dispatchNotification, FCMTopics } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const {
      rwId,
      rtNumber,
      chairName,
      phoneNumber,
      password,
      nik,
      skDocumentUrl,
      termPeriod = "2026-2031",
    } = await req.json();

    if (!rwId || !rtNumber || !chairName || !phoneNumber || !password || !nik) {
      return NextResponse.json(
        { success: false, message: "Seluruh kolom formulir pendaftaran RT wajib diisi." },
        { status: 400 }
      );
    }

    const nikCheck = validateNikFormat(nik);
    if (!nikCheck.isValid) {
      return NextResponse.json(
        { success: false, message: nikCheck.error || "Format NIK Ketua RT tidak valid." },
        { status: 400 }
      );
    }

    const store = getStore();
    const rw = store.rws.find((r) => r.id === rwId);
    if (!rw) {
      return NextResponse.json({ success: false, message: "RW induk tidak ditemukan." }, { status: 404 });
    }

    // Check duplicate RT number in same RW
    const formattedRt = rtNumber.padStart(2, "0");
    const existingRt = store.rts.find(
      (r) => r.rw_id === rwId && r.rt_number === formattedRt
    );
    if (existingRt && existingRt.status !== "REJECTED") {
      return NextResponse.json(
        {
          success: false,
          message: `RT ${formattedRt} sudah terdaftar di RW ${rw.rw_number} (Status: ${existingRt.status}).`,
        },
        { status: 409 }
      );
    }

    const nikHash = hashBlindIndex(nik);
    if (store.users.some((u) => u.nik_hash === nikHash)) {
      return NextResponse.json(
        { success: false, message: "NIK sudah terdaftar dalam sistem SIM-RW." },
        { status: 409 }
      );
    }

    const newRtId = `rt-${formattedRt}-${rw.id}`;
    const newUserId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    // 1. Create applicant user
    const newChairUser = {
      id: newUserId,
      rw_id: rw.id,
      rt_id: newRtId,
      nik_hash: nikHash,
      nik_encrypted: encryptAES256GCM(nik),
      full_name: chairName.trim(),
      phone_number: phoneNumber.trim(),
      password_hash: passwordHash,
      ktp_doc_url: skDocumentUrl || "/uploads/sk-pemilihan-rt.pdf",
      status: "PENDING_VERIFICATION" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 2. Create RT record with PENDING_APPROVAL status (Menunggu Approval Pengurus RW!)
    const newRt = {
      id: newRtId,
      rw_id: rw.id,
      rt_number: formattedRt,
      term_period: termPeriod,
      status: "PENDING_APPROVAL" as const,
      applicant_user_id: newUserId,
      sk_document_url: skDocumentUrl || "/uploads/sk-pemilihan-rt.pdf",
      created_at: new Date().toISOString(),
    };

    store.rts.push(newRt);
    store.users.push(newChairUser);

    store.user_roles.push({
      id: crypto.randomUUID(),
      user_id: newUserId,
      role_id: "role-resident",
      assigned_at: new Date().toISOString(),
    });

    saveStore(store);

    // 3. Record Audit Log
    await recordAuditLog({
      userId: newUserId,
      action: "REGISTER_NEW_RT_ORGANIZATION",
      resource: `ORGANIZATION_RT:${newRtId}`,
      payload: { rtNumber: formattedRt, rwNumber: rw.rw_number, chairName, maskedNik: maskNik(nik) },
    });

    // 4. Dispatch Push Notification to Ketua RW
    await dispatchNotification({
      title: "Permohonan Pendaftaran RT Baru",
      body: `Pendaftaran RT ${formattedRt} diajukan oleh ${chairName}. Menunggu persetujuan Ketua RW ${rw.rw_number}.`,
      topic: FCMTopics.rwOfficers(rw.id),
    });

    return NextResponse.json(
      {
        success: true,
        message: `Pendaftaran RT ${formattedRt} berhasil dikirim. Menunggu persetujuan dari Pengurus RW ${rw.rw_number}.`,
        data: newRt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to register RT" },
      { status: 500 }
    );
  }
}

