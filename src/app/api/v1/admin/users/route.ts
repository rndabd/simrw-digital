import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasRole, hashPassword } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { encryptAES256GCM, decryptAES256GCM, hashBlindIndex, maskNik, maskKK, validateNikFormat } from "@/lib/security";
import { recordAuditLog } from "@/lib/audit";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth || !hasRole(auth, ["SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Khusus Super Administrator Kelurahan." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.toLowerCase();
    const roleFilter = searchParams.get("role");
    const rwFilter = searchParams.get("rw_id");
    const rtFilter = searchParams.get("rt_id");

    const store = getStore();

    let users = store.users.map((u) => {
      // Find roles
      const userRoles = store.user_roles.filter((ur) => ur.user_id === u.id);
      const roleIds = userRoles.map((ur) => ur.role_id);
      const matchedRoles = store.roles.filter((r) => roleIds.includes(r.id)).map((r) => r.name);

      // Decrypt NIK if present
      let rawNik = "";
      let maskedNikText = "Belum Dilengkapi";
      try {
        if (u.nik_encrypted) {
          rawNik = decryptAES256GCM(u.nik_encrypted);
          maskedNikText = maskNik(rawNik);
        }
      } catch {}

      // Decrypt KK if present
      const hh = u.household_id ? store.households.find((h) => h.id === u.household_id) : null;
      let rawKk = "";
      let maskedKkText = "Belum Dilengkapi";
      try {
        if (hh?.kk_number_enc) {
          rawKk = decryptAES256GCM(hh.kk_number_enc);
          maskedKkText = maskKK(rawKk);
        }
      } catch {}

      const rw = store.rws.find((r) => r.id === u.rw_id);
      const rt = store.rts.find((r) => r.id === u.rt_id);

      return {
        id: u.id,
        fullName: u.full_name,
        phoneNumber: u.phone_number,
        email: u.email || "",
        status: u.status,
        roles: matchedRoles.length > 0 ? matchedRoles : ["RESIDENT"],
        nik: rawNik,
        maskedNik: maskedNikText,
        kk: rawKk,
        maskedKk: maskedKkText,
        addressBlock: u.address_block || hh?.address_block || "",
        rwId: u.rw_id,
        rwNumber: rw?.rw_number || "",
        rwVillage: rw?.village || "",
        rtId: u.rt_id,
        rtNumber: rt?.rt_number || "",
        createdAt: u.created_at,
        updatedAt: u.updated_at,
      };
    });

    if (roleFilter) {
      users = users.filter((u) => u.roles.includes(roleFilter));
    }

    if (rwFilter) {
      users = users.filter((u) => u.rwId === rwFilter);
    }

    if (rtFilter) {
      users = users.filter((u) => u.rtId === rtFilter);
    }

    if (q) {
      users = users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.phoneNumber.toLowerCase().includes(q) ||
          u.nik.includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.addressBlock.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memuat daftar pengguna." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth || !hasRole(auth, ["SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Khusus Super Administrator Kelurahan." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      fullName,
      phoneNumber,
      password,
      role = "RESIDENT",
      nik,
      kk,
      rwId,
      rtId,
      addressBlock,
      email,
      status = "VERIFIED_ACTIVE",
    } = body;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json(
        { success: false, message: "Nama lengkap wajib diisi." },
        { status: 400 }
      );
    }

    const store = getStore();

    // 1. Validasi NIK jika diberikan (bisa kosong untuk dilengkapi user nanti)
    let nikHash = "";
    let nikEncrypted = "";
    if (nik && nik.trim()) {
      const cleanNik = nik.trim().replace(/\D/g, "");
      const nikCheck = validateNikFormat(cleanNik);
      if (!nikCheck.isValid) {
        return NextResponse.json(
          { success: false, message: nikCheck.error || "Format NIK tidak valid (harus 16 digit)." },
          { status: 400 }
        );
      }
      nikHash = hashBlindIndex(cleanNik);
      const existingNik = store.users.find((u) => u.nik_hash === nikHash);
      if (existingNik) {
        return NextResponse.json(
          { success: false, message: "NIK sudah terdaftar dalam sistem SIM-RW." },
          { status: 409 }
        );
      }
      nikEncrypted = encryptAES256GCM(cleanNik);
    }

    // 2. Household & No KK jika diberikan
    let householdId: string | undefined = undefined;
    if (kk && kk.trim()) {
      const cleanKk = kk.trim().replace(/\D/g, "");
      if (cleanKk.length !== 16) {
        return NextResponse.json(
          { success: false, message: "Format Nomor KK harus 16 digit." },
          { status: 400 }
        );
      }
      const kkHash = hashBlindIndex(cleanKk);
      let hh = store.households.find((h) => h.kk_number_hash === kkHash);
      if (!hh) {
        hh = {
          id: crypto.randomUUID(),
          rt_id: rtId || store.rts[0]?.id || "rt-01",
          kk_number_hash: kkHash,
          kk_number_enc: encryptAES256GCM(cleanKk),
          address_block: addressBlock || "Alamat Belum Terdata",
          created_at: new Date().toISOString(),
        };
        store.households.push(hh);
      }
      householdId = hh.id;
    }

    // 3. Wilayah default jika RW/RT belum diisi
    let finalRwId = rwId || (store.rws.length > 0 ? store.rws[0].id : "");
    let finalRtId = rtId || (store.rts.length > 0 ? store.rts.find((r) => r.rw_id === finalRwId)?.id || store.rts[0].id : "");

    // 4. Kata Sandi (default: Warga12345! jika kosong)
    const rawPass = password && password.trim() ? password.trim() : "Warga12345!";
    const passwordHash = await hashPassword(rawPass);

    const newUserId = crypto.randomUUID();
    const newUser = {
      id: newUserId,
      rw_id: finalRwId,
      rt_id: finalRtId,
      household_id: householdId,
      nik_hash: nikHash,
      nik_encrypted: nikEncrypted,
      full_name: fullName.trim(),
      phone_number: (phoneNumber || "").trim() || "08" + Math.floor(1000000000 + Math.random() * 9000000000),
      email: email && email.trim() ? email.trim().toLowerCase() : undefined,
      address_block: addressBlock || "",
      is_phone_verified: true,
      is_email_verified: !!email,
      password_hash: passwordHash,
      ktp_doc_url: "https://placeholder.co/ktp.jpg",
      status: status as any,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.users.push(newUser);

    // 5. Hubungkan Role
    // Cari role yang cocok di store.roles atau buat jika belum ada
    let targetRole = store.roles.find((r) => r.name === role);
    if (!targetRole) {
      targetRole = {
        id: `role-${role.toLowerCase().replace(/_/g, "-")}`,
        name: role,
        description: `Peran ${role}`,
        permissions: ["citizen:view"],
      };
      store.roles.push(targetRole);
    }

    store.user_roles.push({
      id: crypto.randomUUID(),
      user_id: newUserId,
      role_id: targetRole.id,
      assigned_at: new Date().toISOString(),
    });

    saveStore(store);

    await recordAuditLog({
      userId: auth.userId,
      action: "SUPER_ADMIN_ADD_USER",
      resource: `USER:${newUserId}`,
      payload: {
        newUserId,
        fullName: newUser.full_name,
        role,
        rwId: finalRwId,
        rtId: finalRtId,
        hasNik: !!nikHash,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Akun ${newUser.full_name} (${role}) berhasil ditambahkan oleh Super Admin!`,
        data: {
          id: newUserId,
          fullName: newUser.full_name,
          phoneNumber: newUser.phone_number,
          role,
          defaultPassword: password ? undefined : "Warga12345!",
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menambahkan pengguna." },
      { status: 500 }
    );
  }
}

