import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasRole, hashPassword } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { encryptAES256GCM, hashBlindIndex, validateNikFormat } from "@/lib/security";
import { recordAuditLog } from "@/lib/audit";
import crypto from "crypto";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthUser(req);
    if (!auth || !hasRole(auth, ["SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Khusus Super Administrator Kelurahan." },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const {
      fullName,
      phoneNumber,
      email,
      role,
      nik,
      kk,
      rwId,
      rtId,
      addressBlock,
      status,
      newPassword,
    } = body;

    const store = getStore();
    const user = store.users.find((u) => u.id === id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Data pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    // 1. NIK
    if (nik !== undefined) {
      const cleanNik = nik.trim().replace(/\D/g, "");
      if (cleanNik) {
        const nikCheck = validateNikFormat(cleanNik);
        if (!nikCheck.isValid) {
          return NextResponse.json(
            { success: false, message: nikCheck.error || "Format NIK tidak valid." },
            { status: 400 }
          );
        }
        const nikHash = hashBlindIndex(cleanNik);
        const dupNik = store.users.find((u) => u.id !== user.id && u.nik_hash === nikHash);
        if (dupNik) {
          return NextResponse.json(
            { success: false, message: "NIK sudah terdaftar pada pengguna lain." },
            { status: 409 }
          );
        }
        user.nik_hash = nikHash;
        user.nik_encrypted = encryptAES256GCM(cleanNik);
      } else {
        user.nik_hash = "";
        user.nik_encrypted = "";
      }
    }

    // 2. KK
    if (kk !== undefined) {
      const cleanKk = kk.trim().replace(/\D/g, "");
      if (cleanKk) {
        if (cleanKk.length !== 16) {
          return NextResponse.json(
            { success: false, message: "Nomor KK harus 16 digit." },
            { status: 400 }
          );
        }
        const kkHash = hashBlindIndex(cleanKk);
        let hh = store.households.find((h) => h.kk_number_hash === kkHash);
        if (!hh) {
          hh = {
            id: crypto.randomUUID(),
            rt_id: user.rt_id,
            kk_number_hash: kkHash,
            kk_number_enc: encryptAES256GCM(cleanKk),
            address_block: addressBlock || user.address_block || "",
            created_at: new Date().toISOString(),
          };
          store.households.push(hh);
        }
        user.household_id = hh.id;
      }
    }

    // 3. Nama, HP, Email, Alamat, Status
    if (fullName && fullName.trim()) user.full_name = fullName.trim();
    if (phoneNumber && phoneNumber.trim()) user.phone_number = phoneNumber.trim();
    if (email !== undefined) user.email = email.trim() ? email.trim().toLowerCase() : undefined;
    if (addressBlock !== undefined) user.address_block = addressBlock.trim();
    if (status) user.status = status;

    // 4. Wilayah RW & RT
    if (rwId) user.rw_id = rwId;
    if (rtId) user.rt_id = rtId;

    // 5. Password Reset if requested
    if (newPassword && newPassword.trim()) {
      user.password_hash = await hashPassword(newPassword.trim());
    }

    // 6. Role Update if provided
    if (role) {
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
      // Replace role
      store.user_roles = store.user_roles.filter((ur) => ur.user_id !== user.id);
      store.user_roles.push({
        id: crypto.randomUUID(),
        user_id: user.id,
        role_id: targetRole.id,
        assigned_at: new Date().toISOString(),
      });
    }

    user.updated_at = new Date().toISOString();
    saveStore(store);

    await recordAuditLog({
      userId: auth.userId,
      action: "SUPER_ADMIN_UPDATE_USER",
      resource: `USER:${user.id}`,
      payload: {
        targetUserId: user.id,
        fullName: user.full_name,
        role,
        status: user.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Data pengguna ${user.full_name} berhasil diperbarui!`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memperbarui pengguna." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthUser(req);
    if (!auth || !hasRole(auth, ["SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Khusus Super Administrator Kelurahan." },
        { status: 403 }
      );
    }

    const { id } = params;
    if (id === auth.userId) {
      return NextResponse.json(
        { success: false, message: "Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk." },
        { status: 400 }
      );
    }

    const store = getStore();
    const userIndex = store.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    const targetUser = store.users[userIndex];
    store.users.splice(userIndex, 1);
    store.user_roles = store.user_roles.filter((ur) => ur.user_id !== id);

    saveStore(store);

    await recordAuditLog({
      userId: auth.userId,
      action: "SUPER_ADMIN_DELETE_USER",
      resource: `USER:${id}`,
      payload: {
        deletedUserId: id,
        fullName: targetUser.full_name,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Akun pengguna ${targetUser.full_name} berhasil dihapus dari sistem.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menghapus pengguna." },
      { status: 500 }
    );
  }
}

