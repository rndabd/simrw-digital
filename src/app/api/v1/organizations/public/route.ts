import { NextResponse } from "next/server";
import { getStore } from "@/lib/data-store";

export async function GET() {
  try {
    const store = getStore();

    // Only active RWs for public citizen onboarding
    const activeRws = store.rws.filter((r) => r.status === "ACTIVE");

    const result = activeRws.map((rw) => {
      const rts = store.rts.filter((rt) => rt.rw_id === rw.id);
      return {
        id: rw.id,
        number: rw.rw_number,
        village: rw.village,
        district: rw.district,
        city: rw.city,
        termPeriod: rw.term_period,
        rtUnits: rts.map((rt) => ({
          id: rt.id,
          number: rt.rt_number,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load organizations" },
      { status: 500 }
    );
  }
}

