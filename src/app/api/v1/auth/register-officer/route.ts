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
    let role = "RT_CHAIR";
    let roleLevel = "RT";
    let rwId = "";
    let rtId = "";
    let isNewRw = false;
    let newRwNumber = "";
    let newRwVillage = "Sukamaju";
    let newRwDistrict = "Coblong";
    let newRwCity = "Kota Bandung";
    let newRwRtCount = 3;
    let isNewRt = false;
    let newRtNumber = "";
    let nik = "";
    let kk = "";
    let fullName = "";
    let phoneNumber = "";
    let password = "";
    let addressBlock = "";
    let termPeriod = "2026-2031";
    let skDocumentUrl = "/uploads/sk-mandat.pdf";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      role = (formData.get("role") as string) || "RT_CHAIR";
      roleLevel = (formData.get("roleLevel") as string) || (role.startsWith("RW_") ? "RW" : "RT");
      rwId = (formData.get("rwId") as string) || "";
      rtId = (formData.get("rtId") as string) || "";
      isNewRw = formData.get("isNewRw") === "true";
      newRwNumber = (formData.get("newRwNumber") as string) || "";
      newRwVillage = (formData.get("newRwVillage") as string) || "Sukamaju";
      newRwDistrict = (formData.get("newRwDistrict") as string) || "Coblong";
      newRwCity = (formData.get("newRwCity") as string) || "Kota Bandung";
      newRwRtCount = parseInt((formData.get("newRwRtCount") as string) || "3", 10);
      isNewRt = formData.get("isNewRt") === "true";
      newRtNumber = (formData.get("newRtNumber") as string) || "";
      nik = (formData.get("nik") as string) || "";
      kk = (formData.get("kk") as string) || "";
      fullName = (formData.get("fullName") as string) || "";
      phoneNumber = (formData.get("phoneNumber") as string) || "";
      password = (formData.get("password") as string) || "";
      addressBlock = (formData.get("addressBlock") as string) || "";
      termPeriod = (formData.get("termPeriod") as string) || "2026-2031";

      const skFile = formData.get("skFile") as File | null;
      if (skFile && skFile.size > 0) {
        const buffer = Buffer.from(await skFile.arrayBuffer());
        const saved = await savePrivateFile(buffer, skFile.name, skFile.type);
        skDocumentUrl = saved.fileId;
      }
    } else {
      const body = await req.json();
      role = body.role || "RT_CHAIR";
      roleLevel = body.roleLevel || (role.startsWith("RW_") ? "RW" : "RT");
      rwId = body.rwId || "";
      rtId = body.rtId || "";
      isNewRw = !!body.isNewRw;
      newRwNumber = body.newRwNumber || "";
      newRwVillage = body.newRwVillage || "Sukamaju";
      newRwDistrict = body.newRwDistrict || "Coblong";
      newRwCity = body.newRwCity || "Kota Bandung";
      newRwRtCount = body.newRwRtCount || 3;
      isNewRt = !!body.isNewRt;
      newRtNumber = body.newRtNumber || "";
      nik = body.nik || "";
      kk = body.kk || "";
      fullName = body.fullName || "";
      phoneNumber = body.phoneNumber || "";
      password = body.password || "";
      addressBlock = body.addressBlock || "";
      termPeriod = body.termPeriod || "2026-2031";
      if (body.skDocumentUrl) skDocumentUrl = body.skDocumentUrl;
    }

    // 1. Validasi NIK
    const nikCheck = validateNikFormat(nik);
    if (!nikCheck.isValid) {
      return NextResponse.json(
        { success: false, message: nikCheck.error || "Format NIK Calon Pengurus tidak valid (Wajib 16 digit angka)." },
        { status: 400 }
      );
    }

    if (!fullName || !phoneNumber || !password) {
      return NextResponse.json(
        { success: false, message: "Nama lengkap, nomor WhatsApp, dan kata sandi akun wajib diisi." },
        { status: 400 }
      );
    }

    const store = getStore();

    // 2. Cek NIK dan Nomor HP Unik
    const nikHash = hashBlindIndex(nik);
    if (store.users.some((u) => u.nik_hash === nikHash)) {
      return NextResponse.json(
        { success: false, message: "NIK sudah terdaftar dalam sistem SIM-RW." },
        { status: 409 }
      );
    }

    if (store.users.some((u) => u.phone_number === phoneNumber)) {
      return NextResponse.json(
        { success: false, message: "Nomor WhatsApp sudah digunakan oleh akun lain." },
        { status: 409 }
      );
    }

    const newUserId = crypto.randomUUID();
    let targetRwId = rwId;
    let targetRtId = rtId;

    // 3. Proses Pembentukan RW Baru jika dipilih
    if (isNewRw) {
      if (!newRwNumber) {
        return NextResponse.json(
          { success: false, message: "Nomor RW baru wajib diisi jika mendaftarkan unit RW baru." },
          { status: 400 }
        );
      }
      const formattedRw = newRwNumber.padStart(2, "0");
      targetRwId = `rw-${formattedRw}-${newRwVillage.toLowerCase().replace(/\s+/g, "-")}`;
      targetRtId = `rt-01-${targetRwId}`;

      // Buat entitas RW baru berstatus PENDING_APPROVAL
      const newRw = {
        id: targetRwId,
        rw_number: formattedRw,
        village: newRwVillage.trim(),
        district: newRwDistrict.trim(),
        city: newRwCity.trim(),
        status: "PENDING_APPROVAL" as const,
        term_period: termPeriod,
        applicant_user_id: newUserId,
        sk_kelurahan_url: skDocumentUrl,
        created_at: new Date().toISOString(),
      };
      store.rws.push(newRw);

      // Generate RT unit default
      const count = Math.max(1, newRwRtCount);
      for (let i = 1; i <= count; i++) {
        store.rts.push({
          id: `rt-${String(i).padStart(2, "0")}-${targetRwId}`,
          rw_id: targetRwId,
          rt_number: String(i).padStart(2, "0"),
          term_period: termPeriod,
          status: "ACTIVE" as const,
          created_at: new Date().toISOString(),
        });
      }
    } else {
      if (!targetRwId && store.rws.length > 0) {
        targetRwId = store.rws[0].id;
      }
    }

    // 4. Proses Pembentukan RT Baru jika dipilih
    if (isNewRt && !isNewRw) {
      if (!newRtNumber) {
        return NextResponse.json(
          { success: false, message: "Nomor RT baru wajib diisi jika mendaftarkan unit RT baru." },
          { status: 400 }
        );
      }
      const formattedRt = newRtNumber.padStart(2, "0");
      targetRtId = `rt-${formattedRt}-${targetRwId}`;

      const existingRt = store.rts.find(
        (r) => r.rw_id === targetRwId && r.rt_number === formattedRt && r.status !== "REJECTED"
      );
      if (existingRt) {
        return NextResponse.json(
          { success: false, message: `RT ${formattedRt} sudah terdaftar pada RW ini.` },
          { status: 409 }
        );
      }

      const newRt = {
        id: targetRtId,
        rw_id: targetRwId,
        rt_number: formattedRt,
        term_period: termPeriod,
        status: "PENDING_APPROVAL" as const,
        applicant_user_id: newUserId,
        sk_document_url: skDocumentUrl,
        created_at: new Date().toISOString(),
      };
      store.rts.push(newRt);
    } else if (!isNewRw && !targetRtId) {
      const foundRt = store.rts.find((r) => r.rw_id === targetRwId);
      targetRtId = foundRt ? foundRt.id : `rt-01-${targetRwId}`;
    }

    // 5. Enkripsi Data Pribadi & Simpan Akun Pengguna (Status: PENDING_VERIFICATION)
    const passwordHash = await hashPassword(password);
    const nikEncrypted = encryptAES256GCM(nik);

    let householdId: string | undefined = undefined;
    if (kk) {
      const kkHash = hashBlindIndex(kk);
      let hh = store.households.find((h) => h.kk_number_hash === kkHash);
      if (!hh) {
        hh = {
          id: crypto.randomUUID(),
          rt_id: targetRtId,
          kk_number_hash: kkHash,
          kk_number_enc: encryptAES256GCM(kk),
          address_block: addressBlock || "Alamat Belum Terdata",
          created_at: new Date().toISOString(),
        };
        store.households.push(hh);
      }
      householdId = hh.id;
    }

    const newUser = {
      id: newUserId,
      rw_id: targetRwId,
      rt_id: targetRtId,
      household_id: householdId,
      nik_hash: nikHash,
      nik_encrypted: nikEncrypted,
      full_name: fullName.trim(),
      phone_number: phoneNumber.trim(),
      password_hash: passwordHash,
      ktp_doc_url: skDocumentUrl,
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

    // 6. Catat Antrean Pengajuan Jabatan Pengurus (officer_requests)
    const newOfficerReq = {
      id: crypto.randomUUID(),
      user_id: newUserId,
      requested_role: role,
      target_rw_id: targetRwId,
      target_rt_id: targetRtId,
      sk_document_url: skDocumentUrl,
      status: "PENDING" as const,
      created_at: new Date().toISOString(),
    };
    store.officer_requests.unshift(newOfficerReq);

    saveStore(store);

    // 7. Audit Log UU PDP
    await recordAuditLog({
      userId: newUserId,
      action: "REGISTER_OFFICER_APPLICANT",
      resource: "OFFICER_REQUEST",
      payload: {
        role,
        roleLevel,
        targetRwId,
        targetRtId,
        isNewRw,
        isNewRt,
        maskedNik: maskNik(nik),
      },
    });

    // 8. Kirim Push Notifikasi ke Pihak Peninjau Berwenang
    const isRwLevel = role.startsWith("RW_") || isNewRw;
    if (isRwLevel) {
      // Ditujukan ke Super Admin Kelurahan
      await dispatchNotification({
        title: "Pendaftaran Pengurus RW Baru",
        body: `${fullName} mendaftar sebagai ${role}. Menunggu pengesahan Super Admin Kelurahan.`,
        topic: "admin_broadcast",
        data: {
          type: "OFFICER_REQUEST_RW",
          requestId: newOfficerReq.id,
        },
      });
    } else {
      // Ditujukan ke Pengurus RW Induk
      await dispatchNotification({
        title: "Pendaftaran Pengurus RT Baru",
        body: `${fullName} mendaftar sebagai ${role}. Menunggu peninjauan Pengurus RW.`,
        topic: FCMTopics.rwOfficers(targetRwId),
        data: {
          type: "OFFICER_REQUEST_RT",
          requestId: newOfficerReq.id,
        },
      });
    }

    const reviewMessage = isRwLevel
      ? "Pendaftaran kepengurusan tingkat RW berhasil diajukan! Menunggu pengesahan Super Admin Kelurahan."
      : "Pendaftaran kepengurusan tingkat RT berhasil diajukan! Menunggu pengesahan Ketua & Pengurus RW setempat.";

    return NextResponse.json(
      {
        success: true,
        message: reviewMessage,
        data: {
          id: newUserId,
          fullName: newUser.full_name,
          role,
          targetRwId,
          targetRtId,
          maskedNik: maskNik(nik),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Register officer error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

