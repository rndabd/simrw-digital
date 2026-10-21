import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getStore } from "@/lib/data-store";
import { decryptAES256GCM, maskNik } from "@/lib/security";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const store = getStore();
    const user = store.users.find((u) => u.id === auth.userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    // Determine current roles & permissions
    const userRoleMappings = store.user_roles.filter((ur) => ur.user_id === user.id);
    const roleIds = userRoleMappings.map((ur) => ur.role_id);
    const matchedRoles = store.roles.filter((r) => roleIds.includes(r.id));
    const roleNames = matchedRoles.map((r) => r.name);
    const allPermissions = Array.from(
      new Set(matchedRoles.flatMap((r) => r.permissions))
    );

    let maskedNik = "327301******0000";
    try {
      const rawNik = decryptAES256GCM(user.nik_encrypted);
      maskedNik = maskNik(rawNik);
    } catch {}

    const rw = store.rws.find((r) => r.id === user.rw_id);
    const rt = store.rts.find((r) => r.id === user.rt_id);
    const hh = user.household_id
      ? store.households.find((h) => h.id === user.household_id)
      : null;

    // Check if user has officer requests
    const pendingOfficerReq = store.officer_requests.find(
      (req) => req.user_id === user.id && req.status === "PENDING"
    );

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        fullName: user.full_name,
        phoneNumber: user.phone_number,
        status: user.status,
        maskedNik,
        rejectionNote: user.rejection_note,
        verifiedAt: user.verified_at,
        rw: rw ? { id: rw.id, number: rw.rw_number, village: rw.village, city: rw.city } : null,
        rt: rt ? { id: rt.id, number: rt.rt_number } : null,
        addressBlock: hh?.address_block || "Blok C2 No. 14",
        roles: roleNames,
        permissions: allPermissions,
        isOfficer: roleNames.some((r) =>
          r.startsWith("RT_") || r.startsWith("RW_") || r === "SUPER_ADMIN" || r === "SECURITY"
        ),
        hasPendingOfficerRequest: !!pendingOfficerReq,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

