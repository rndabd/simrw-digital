import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";
import { encryptAES256GCM, hashBlindIndex, validateNikFormat, maskNik } from "@/lib/security";
import crypto from "crypto";

export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { fullName, phoneNumber, email, addressBlock, rtId, rwId, nik, kk } = body;

    const store = getStore();
    const user = store.users.find((u) => u.id === auth.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Data pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    // 1. Validasi & Update NIK (16 digit unik)
    if (nik !== undefined) {
      const cleanNik = nik.trim().replace(/\D/g, "");
      if (cleanNik) {
        const nikCheck = validateNikFormat(cleanNik);
        if (!nikCheck.isValid) {
          return NextResponse.json(
            { success: false, message: nikCheck.error || "Format NIK tidak valid (harus 16 digit)." },
            { status: 400 }
          );
        }
        const nikHash = hashBlindIndex(cleanNik);
        const duplicateNik = store.users.find(
          (u) => u.id !== user.id && u.nik_hash === nikHash
        );
        if (duplicateNik) {
          return NextResponse.json(
            { success: false, message: "NIK tersebut sudah terdaftar pada akun lain." },
            { status: 409 }
          );
        }
        user.nik_hash = nikHash;
        user.nik_encrypted = encryptAES256GCM(cleanNik);
      }
    }

    // 2. Validasi & Update Nomor KK (16 digit)
    if (kk !== undefined) {
      const cleanKk = kk.trim().replace(/\D/g, "");
      if (cleanKk) {
        if (cleanKk.length !== 16) {
          return NextResponse.json(
            { success: false, message: "Format Nomor Kartu Keluarga (KK) harus 16 digit." },
            { status: 400 }
          );
        }
        const kkHash = hashBlindIndex(cleanKk);
        let hh = store.households.find((h) => h.kk_number_hash === kkHash);
        if (!hh) {
          hh = {
            id: crypto.randomUUID(),
            rt_id: user.rt_id || store.rts[0]?.id || "rt-01",
            kk_number_hash: kkHash,
            kk_number_enc: encryptAES256GCM(cleanKk),
            address_block: addressBlock || user.address_block || "Alamat Belum Terdata",
            created_at: new Date().toISOString(),
          };
          store.households.push(hh);
        }
        user.household_id = hh.id;
      }
    }

    // 3. Update Nomor HP (bisa dipakai bersama dalam 1 KK)
    if (phoneNumber && phoneNumber.trim()) {
      user.phone_number = phoneNumber.trim();
    }

    // 4. Update Email
    if (email !== undefined) {
      const emailClean = email ? email.trim().toLowerCase() : "";
      if (emailClean && emailClean !== user.email?.toLowerCase()) {
        const duplicateEmail = store.users.find(
          (u) => u.id !== user.id && u.email?.toLowerCase() === emailClean
        );
        if (duplicateEmail) {
          return NextResponse.json(
            { success: false, message: "Alamat email tersebut sudah terdaftar pada akun lain." },
            { status: 409 }
          );
        }
        user.email = emailClean;
        user.is_email_verified = false;
      } else if (!emailClean) {
        user.email = undefined;
        user.is_email_verified = false;
      }
    }

    // 5. Update Nama & Alamat
    if (fullName && fullName.trim()) {
      user.full_name = fullName.trim();
    }

    if (addressBlock !== undefined) {
      user.address_block = addressBlock.trim();
      if (user.household_id) {
        const hh = store.households.find((h) => h.id === user.household_id);
        if (hh) hh.address_block = addressBlock.trim();
      }
    }

    // 6. Update Wilayah RW & RT
    if (rwId && rwId !== user.rw_id) {
      const validRw = store.rws.find((r) => r.id === rwId);
      if (validRw) {
        user.rw_id = validRw.id;
      }
    }

    if (rtId && rtId !== user.rt_id) {
      const validRt = store.rts.find((r) => r.id === rtId);
      if (validRt) {
        user.rt_id = validRt.id;
        if (user.household_id) {
          const hh = store.households.find((h) => h.id === user.household_id);
          if (hh) hh.rt_id = validRt.id;
        }
      }
    }

    user.updated_at = new Date().toISOString();
    saveStore(store);

    await recordAuditLog({
      userId: user.id,
      action: "UPDATE_PROFILE_DATA",
      resource: `USER:${user.id}`,
      payload: {
        fullName: user.full_name,
        phoneNumber: user.phone_number,
        email: user.email,
        addressBlock: user.address_block,
        rwId: user.rw_id,
        rtId: user.rt_id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Data profil berhasil diperbarui!",
      data: {
        id: user.id,
        fullName: user.full_name,
        phoneNumber: user.phone_number,
        email: user.email,
        addressBlock: user.address_block,
        rwId: user.rw_id,
        rtId: user.rt_id,
        isPhoneVerified: !!user.is_phone_verified,
        isEmailVerified: !!user.is_email_verified,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memperbarui profil." },
      { status: 500 }
    );
  }
}

