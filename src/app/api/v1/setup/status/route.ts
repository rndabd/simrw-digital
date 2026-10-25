import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const store = getStore();

    // Check if system has a Super Admin or any verified user
    const superAdminRole = store.roles.find((r) => r.name === "SUPER_ADMIN");
    const superAdminRoleMappings = superAdminRole
      ? store.user_roles.filter((ur) => ur.role_id === superAdminRole.id)
      : [];
    const superAdminUserIds = superAdminRoleMappings.map((ur) => ur.user_id);
    const hasSuperAdmin = store.users.some(
      (u) =>
        (superAdminUserIds.includes(u.id) || u.id === "user-super-admin") &&
        u.status === "VERIFIED_ACTIVE"
    );

    // Initialized if system_initialized flag is set, or if admin / active user exists
    const initialized = Boolean(
      store.system_initialized || hasSuperAdmin || store.users.length > 0
    );

    return NextResponse.json(
      {
        success: true,
        initialized,
        hasAdmin: hasSuperAdmin || store.users.length > 0,
        organizationCount: store.rws.length,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to check setup status" },
      { status: 500 }
    );
  }
}
