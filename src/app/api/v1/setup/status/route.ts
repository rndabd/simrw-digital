import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data-store";

export async function GET(req: NextRequest) {
  try {
    const store = getStore();

    // Check if system has a Super Admin
    const superAdminRole = store.roles.find((r) => r.name === "SUPER_ADMIN");
    const superAdminRoleMappings = superAdminRole
      ? store.user_roles.filter((ur) => ur.role_id === superAdminRole.id)
      : [];
    const superAdminUserIds = superAdminRoleMappings.map((ur) => ur.user_id);
    const hasSuperAdmin = store.users.some(
      (u) => superAdminUserIds.includes(u.id) && u.status === "VERIFIED_ACTIVE"
    );

    const initialized = !!store.system_initialized && hasSuperAdmin;

    return NextResponse.json({
      success: true,
      initialized,
      hasAdmin: hasSuperAdmin,
      organizationCount: store.rws.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to check setup status" },
      { status: 500 }
    );
  }
}

