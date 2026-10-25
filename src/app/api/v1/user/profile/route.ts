import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";

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
    const { fullName, phoneNumber, email, addressBlock, rtId } = body;

    const store = getStore();
    const user = store.users.find((u) => u.id === auth.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Data pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    // Validasi Nomor WhatsApp unik jika diubah
    if (phoneNumber && phoneNumber.trim() !== user.phone_number) {
      const phoneClean = phoneNumber.trim();
      const duplicatePhone = store.users.find(
        (u) => u.id !== user.id && u.phone_number === phoneClean
      );
      if (duplicatePhone) {
        return NextResponse.json(
          { success: false, message: "Nomor WhatsApp tersebut sudah terdaftar pada akun lain." },
          { status: 409 }
        );
      }
      user.phone_number = phoneClean;
      user.is_phone_verified = false; // Reset verifikasi jika nomor diganti
    }

    // Validasi Email unik jika diubah
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
        user.is_email_verified = false; // Reset verifikasi jika email diganti
      } else if (!emailClean) {
        user.email = undefined;
        user.is_email_verified = false;
      }
    }

    if (fullName && fullName.trim()) {
      user.full_name = fullName.trim();
    }

    if (addressBlock !== undefined) {
      user.address_block = addressBlock.trim();
    }

    if (rtId && rtId !== user.rt_id) {
      const validRt = store.rts.find((r) => r.id === rtId);
      if (validRt) {
        user.rt_id = validRt.id;
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

