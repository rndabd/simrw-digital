import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasRole } from "@/lib/auth";
import { getStore } from "@/lib/data-store";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    if (!hasRole(auth, ["RW_CHAIR", "RW_STAFF", "SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, message: "Hanya Pengurus RW atau Super Admin yang dapat meninjau pendaftaran RT." },
        { status: 403 }
      );
    }

    const store = getStore();
    const rtsInRw = store.rts.filter((r) => r.rw_id === auth.rwId);

    const enriched = rtsInRw.map((rt) => {
      const applicant = store.users.find((u) => u.id === rt.applicant_user_id);
      const citizens = store.users.filter((u) => u.rt_id === rt.id);
      return {
        ...rt,
        applicantName: applicant?.full_name || "Calon Ketua RT",
        applicantPhone: applicant?.phone_number || "-",
        totalCitizens: citizens.length,
      };
    });

    return NextResponse.json({
      success: true,
      data: enriched,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load RT requests" },
      { status: 500 }
    );
  }
}

