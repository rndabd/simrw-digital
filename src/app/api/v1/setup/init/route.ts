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
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const store = getStore();

    // Check if system has already been initialized
    const superAdminRole = store.roles.find((r) => r.name === "SUPER_ADMIN");
    const superAdminRoleMappings = superAdminRole
      ? store.user_roles.filter((ur) => ur.role_id === superAdminRole.id)
      : [];
    const superAdminUserIds = superAdminRoleMappings.map((ur) => ur.user_id);
    const hasSuperAdmin = store.users.some(
      (u) => superAdminUserIds.includes(u.id) && u.status === "VERIFIED_ACTIVE"
    );

    if (store.system_initialized && hasSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Sistem SIM-RW Digital telah diinisialisasi sebelumnya. Setup awal dikunci demi keamanan.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { admin, organization } = body;

    if (!admin || !organization) {
      return NextResponse.json(
        { success: false, message: "Data profil Super Admin dan data Wilayah wajib diisi lengkap." },
        { status: 400 }
      );
    }

    const {
      fullName,
      nik,
      phoneNumber,
      email,
      password,
      isPhoneVerified,
      isEmailVerified,
      verificationToken,
    } = admin;
    const { village, district, city, rwNumber, termPeriod, rtCount = 1 } = organization;

    if (!fullName || !nik || !phoneNumber || !password) {
      return NextResponse.json(
        { success: false, message: "Nama lengkap, NIK, nomor HP, dan kata sandi admin wajib diisi." },
        { status: 400 }
      );
    }

    if (!village || !district || !city || !rwNumber) {
      return NextResponse.json(
        { success: false, message: "Nama kelurahan, kecamatan, kota, dan nomor RW wajib diisi." },
        { status: 400 }
      );
    }

    // Validasi verifikasi kontak pemulihan akun (WhatsApp atau Email)
    if (!isPhoneVerified && !isEmailVerified) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Nomor WhatsApp atau Email Super Admin wajib diverifikasi via kode OTP terlebih dahulu agar akun dapat dipulihkan jika lupa kata sandi.",
        },
        { status: 400 }
      );
    }

    // Validate NIK
    const nikCheck = validateNikFormat(nik);
    if (!nikCheck.isValid) {
      return NextResponse.json(
        { success: false, message: nikCheck.error || "Format NIK tidak valid (wajib 16 digit angka)." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Kata sandi Super Admin minimal 6 karakter." },
        { status: 400 }
      );
    }

    // 1. Inisialisasi Wilayah RW Perdana
    const cleanRwNumber = String(rwNumber).trim().padStart(2, "0");
    const rwId = `rw-${cleanRwNumber}-${district.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    
    // Ensure RW list
    if (!store.rws) store.rws = [];
    let initialRw = store.rws.find((r) => r.id === rwId);
    if (!initialRw) {
      initialRw = {
        id: rwId,
        rw_number: cleanRwNumber,
        village: village.trim(),
        district: district.trim(),
        city: city.trim(),
        status: "ACTIVE",
        term_period: termPeriod || "2026-2031",
        created_at: new Date().toISOString(),
      };
      store.rws.push(initialRw);
    }

    // 2. Inisialisasi Satuan RT Perdana
    if (!store.rts) store.rts = [];
    const count = Math.max(1, Math.min(Number(rtCount) || 1, 30));
    let firstRtId = "";

    for (let i = 1; i <= count; i++) {
      const rtNum = String(i).padStart(2, "0");
      const rtId = `rt-${rtNum}-${rwId}`;
      if (!firstRtId) firstRtId = rtId;

      if (!store.rts.some((r) => r.id === rtId)) {
        store.rts.push({
          id: rtId,
          rw_id: rwId,
          rt_number: rtNum,
          status: "ACTIVE",
          term_period: termPeriod || "2026-2031",
          created_at: new Date().toISOString(),
        });
      }
    }

    // 3. Buat Akun Super Admin
    const nikHash = hashBlindIndex(nik.trim());
    const nikEncrypted = encryptAES256GCM(nik.trim());
    const passwordHash = await hashPassword(password);
    const superAdminUserId = "user-super-admin";

    // Clean any prior admin in store
    store.users = store.users.filter((u) => u.id !== superAdminUserId && u.nik_hash !== nikHash);

    const superAdminUser = {
      id: superAdminUserId,
      rw_id: rwId,
      rt_id: firstRtId,
      nik_hash: nikHash,
      nik_encrypted: nikEncrypted,
      full_name: fullName.trim(),
      phone_number: phoneNumber.trim(),
      email: email ? email.trim() : undefined,
      is_phone_verified: !!isPhoneVerified,
      is_email_verified: !!isEmailVerified,
      password_hash: passwordHash,
      ktp_doc_url: "/uploads/ktp-admin.jpg",
      status: "VERIFIED_ACTIVE" as const,
      verified_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.users.push(superAdminUser);

    // 4. Pastikan Role SUPER_ADMIN terpetakan
    const targetRoleId = superAdminRole ? superAdminRole.id : "role-super-admin";
    if (!store.user_roles) store.user_roles = [];
    store.user_roles = store.user_roles.filter(
      (ur) => !(ur.user_id === superAdminUserId && ur.role_id === targetRoleId)
    );

    store.user_roles.push({
      id: crypto.randomUUID(),
      user_id: superAdminUserId,
      role_id: targetRoleId,
      assigned_at: new Date().toISOString(),
    });

    // 5. Tandai sistem sudah terinisialisasi
    store.system_initialized = true;
    saveStore(store);

    // 6. Catat Audit Log
    await recordAuditLog({
      userId: superAdminUserId,
      action: "SYSTEM_INITIALIZED",
      resource: "SYSTEM",
      payload: {
        adminName: fullName.trim(),
        maskedNik: maskNik(nik.trim()),
        phoneNumber: phoneNumber.trim(),
        email: email || null,
        isPhoneVerified: !!isPhoneVerified,
        isEmailVerified: !!isEmailVerified,
        rw: cleanRwNumber,
        village: village.trim(),
        rtCount: count,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Inisialisasi sistem SIM-RW Digital berhasil diselesaikan! Akun Super Admin telah aktif.",
      data: {
        adminId: superAdminUserId,
        fullName: superAdminUser.full_name,
        phoneNumber: superAdminUser.phone_number,
        email: superAdminUser.email || null,
        rw: `${cleanRwNumber} - ${village}`,
      },
    });
  } catch (error: any) {
    console.error("Setup init error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal melakukan inisialisasi sistem" },
      { status: 500 }
    );
  }
}

