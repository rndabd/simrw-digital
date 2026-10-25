import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data-store";
import { comparePassword, generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { decryptAES256GCM, maskNik, hashBlindIndex } from "@/lib/security";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const nikInput = (body.nik || body.phoneNumber || body.identifier || "").toString().trim();
    const password = (body.password || "").toString();

    if (!nikInput || !password) {
      return NextResponse.json(
        { success: false, message: "Nomor NIK dan kata sandi wajib diisi" },
        { status: 400 }
      );
    }

    const store = getStore();

    // 1. Cari pengguna berdasarkan blind index NIK (16 digit)
    const cleanNik = nikInput.replace(/\D/g, "");
    let user = null;
    if (cleanNik.length === 16) {
      const nikHash = hashBlindIndex(cleanNik);
      user = store.users.find((u) => u.nik_hash === nikHash);
    }

    // Jika belum ketemu, coba blind index input mentah
    if (!user) {
      const rawNikHash = hashBlindIndex(nikInput);
      user = store.users.find((u) => u.nik_hash === rawNikHash);
    }

    // 2. Fallback untuk kompatibilitas jika input nomor HP atau email
    if (!user) {
      user = store.users.find(
        (u) =>
          u.phone_number === nikInput ||
          (cleanNik && u.phone_number === cleanNik) ||
          (u.email && u.email.toLowerCase() === nikInput.toLowerCase())
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Nomor NIK atau kata sandi salah" },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Nomor NIK atau kata sandi salah" },
        { status: 401 }
      );
    }

    // Determine user roles & permissions
    const userRoleMappings = store.user_roles.filter((ur) => ur.user_id === user.id);
    const roleIds = userRoleMappings.map((ur) => ur.role_id);
    const matchedRoles = store.roles.filter((r) => roleIds.includes(r.id));
    const roleNames = matchedRoles.map((r) => r.name);

    // Merge permissions
    const allPermissions = Array.from(
      new Set(matchedRoles.flatMap((r) => r.permissions))
    );

    const tokenPayload = {
      userId: user.id,
      fullName: user.full_name,
      phoneNumber: user.phone_number,
      status: user.status,
      rwId: user.rw_id,
      rtId: user.rt_id,
      roles: roleNames,
      permissions: allPermissions,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(user.id);

    // Mask NIK
    let maskedNik = "327301******0000";
    try {
      const rawNik = decryptAES256GCM(user.nik_encrypted);
      maskedNik = maskNik(rawNik);
    } catch (e) {
      // ignore
    }

    // Record Audit
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await recordAuditLog({
      userId: user.id,
      action: "USER_LOGIN",
      resource: "AUTH",
      ipAddress: ip,
    });

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil",
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user.id,
          fullName: user.full_name,
          phoneNumber: user.phone_number,
          status: user.status,
          rwId: user.rw_id,
          rtId: user.rt_id,
          roles: roleNames,
          permissions: allPermissions,
          maskedNik,
          householdId: user.household_id,
        },
      },
    });

    // Set HTTP-only Cookie for web PWA session
    response.cookies.set("warga_access_token", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 15 * 60, // 15 mins
      path: "/",
    });

    response.cookies.set("warga_refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

