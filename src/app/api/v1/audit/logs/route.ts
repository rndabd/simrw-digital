import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { getStore } from "@/lib/data-store";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    if (!hasPermission(auth, "audit:view")) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Wewenang 'audit:view' diperlukan." },
        { status: 403 }
      );
    }

    const store = getStore();
    const enrichedLogs = store.audit_logs.map((log) => {
      const actor = store.users.find((u) => u.id === log.user_id);
      return {
        ...log,
        actorName: actor?.full_name || "Sistem SIM-RW",
      };
    });

    return NextResponse.json({
      success: true,
      count: enrichedLogs.length,
      data: enrichedLogs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to retrieve audit logs" },
      { status: 500 }
    );
  }
}

