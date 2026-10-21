import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasRole } from "@/lib/auth";
import { getStore } from "@/lib/data-store";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope"); // "me" | "rt" | "rw"
    const targetRtId = searchParams.get("rtId");

    const store = getStore();

    // 1. RW Scope: RW Chair or Staff can view dues across any RT in their RW
    if (scope === "rw" || hasRole(auth, ["RW_CHAIR", "RW_STAFF", "SUPER_ADMIN"])) {
      if (scope === "rw") {
        let bills = store.bills.filter((b) => b.rw_id === auth.rwId);
        if (targetRtId) {
          bills = bills.filter((b) => b.rt_id === targetRtId);
        }
        const enriched = bills.map((b) => {
          const user = store.users.find((u) => u.id === b.user_id);
          const rt = store.rts.find((r) => r.id === b.rt_id);
          return {
            ...b,
            citizenName: user?.full_name || "Warga",
            rtNumber: rt?.rt_number || "-",
          };
        });
        return NextResponse.json({ success: true, data: enriched });
      }
    }

    // 2. RT Scope: RT Chair or Staff can view all resident bills in their RT
    if (scope === "rt" && hasRole(auth, ["RT_CHAIR", "RT_STAFF"])) {
      const bills = store.bills.filter((b) => b.rt_id === auth.rtId);
      const enriched = bills.map((b) => {
        const user = store.users.find((u) => u.id === b.user_id);
        const rt = store.rts.find((r) => r.id === b.rt_id);
        return {
          ...b,
          citizenName: user?.full_name || "Warga",
          rtNumber: rt?.rt_number || "-",
        };
      });
      return NextResponse.json({ success: true, data: enriched });
    }

    // 3. Default: Citizen views their own bills
    let myBills = store.bills.filter((b) => b.user_id === auth.userId);
    if (myBills.length === 0) {
      const defaultBill = {
        id: `bill-${Date.now()}`,
        user_id: auth.userId,
        rw_id: auth.rwId,
        rt_id: auth.rtId,
        month: "Oktober",
        year: 2026,
        amount: 50000,
        category: "IURAN_KEBERSIHAN_KEAMANAN" as const,
        status: "UNPAID" as const,
      };
      store.bills.push(defaultBill);
      myBills = [defaultBill];
    }

    return NextResponse.json({
      success: true,
      data: myBills,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load bills" },
      { status: 500 }
    );
  }
}
