import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasRole } from "@/lib/auth";
import { getStore } from "@/lib/data-store";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    if (!hasRole(auth, ["RW_CHAIR", "RW_STAFF", "SUPER_ADMIN", "RT_CHAIR"])) {
      return NextResponse.json(
        { success: false, message: "Hanya pengurus tingkat RW/Admin yang dapat meninjau pengajuan." },
        { status: 403 }
      );
    }

    const store = getStore();
    let requests = [...store.officer_requests];

    // Hierarki:
    // RW Chair reviews RT level requests for their RW
    if (auth.roles.includes("RW_CHAIR") || auth.roles.includes("RW_STAFF")) {
      requests = requests.filter(
        (r) =>
          r.target_rw_id === auth.rwId &&
          (r.requested_role.startsWith("RT_") || r.requested_role === "SECURITY")
      );
    } else if (!auth.roles.includes("SUPER_ADMIN")) {
      // RT Chair can only view status of their own RT
      requests = requests.filter((r) => r.target_rt_id === auth.rtId);
    }

    const enriched = requests.map((reqItem) => {
      const applicant = store.users.find((u) => u.id === reqItem.user_id);
      const rt = store.rts.find((r) => r.id === reqItem.target_rt_id);
      const rw = store.rws.find((r) => r.id === reqItem.target_rw_id);

      return {
        ...reqItem,
        applicantName: applicant?.full_name || "Warga",
        applicantPhone: applicant?.phone_number || "-",
        rtNumber: rt?.rt_number || "-",
        rwNumber: rw?.rw_number || "05",
      };
    });

    return NextResponse.json({
      success: true,
      data: enriched,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to list officer requests" },
      { status: 500 }
    );
  }
}

