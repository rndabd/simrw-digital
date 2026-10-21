import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasRole } from "@/lib/auth";
import { getStore } from "@/lib/data-store";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    if (!hasRole(auth, ["SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Hanya Super Admin / Kelurahan yang berwenang." },
        { status: 403 }
      );
    }

    const store = getStore();

    const enriched = store.rws.map((rw) => {
      const applicant = store.users.find((u) => u.id === rw.applicant_user_id);
      const rts = store.rts.filter((rt) => rt.rw_id === rw.id);
      const citizens = store.users.filter((u) => u.rw_id === rw.id);

      return {
        ...rw,
        applicantName: applicant?.full_name || "Pengurus Terdaftar",
        applicantPhone: applicant?.phone_number || "-",
        totalRt: rts.length,
        totalCitizens: citizens.length,
      };
    });

    return NextResponse.json({
      success: true,
      data: enriched,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load RW requests" },
      { status: 500 }
    );
  }
}

