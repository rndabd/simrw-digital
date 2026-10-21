import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthUser, hasRole } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";
import { dispatchNotification, FCMTopics } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    if (!hasRole(auth, ["RT_CHAIR", "RT_STAFF", "RW_CHAIR", "SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, message: "Hanya Pengurus RT yang dapat menerbitkan tagihan iuran." },
        { status: 403 }
      );
    }

    const { month, year, amount = 50000, category = "IURAN_KEBERSIHAN_KEAMANAN" } = await req.json();

    if (!month || !year || !amount) {
      return NextResponse.json(
        { success: false, message: "Bulan, tahun, dan nominal iuran wajib diisi." },
        { status: 400 }
      );
    }

    const store = getStore();

    // Get active residents in this RT
    const residentsInRt = store.users.filter(
      (u) => u.rt_id === auth.rtId && u.status === "VERIFIED_ACTIVE"
    );

    let createdCount = 0;
    for (const resident of residentsInRt) {
      const exists = store.bills.some(
        (b) => b.user_id === resident.id && b.month === month && b.year === Number(year) && b.category === category
      );
      if (!exists) {
        store.bills.unshift({
          id: `bill-${Date.now()}-${crypto.randomUUID().substring(0, 6)}`,
          user_id: resident.id,
          rw_id: auth.rwId,
          rt_id: auth.rtId,
          month,
          year: Number(year),
          amount: Number(amount),
          category,
          status: "UNPAID",
        });
        createdCount++;
      }
    }

    saveStore(store);

    await recordAuditLog({
      userId: auth.userId,
      action: "GENERATE_MONTHLY_DUES",
      resource: `RT:${auth.rtId}`,
      payload: { month, year, amount, createdCount },
    });

    // Broadcast notification to all RT residents
    await dispatchNotification({
      title: "Tagihan Iuran Warga Baru Telah Terbit",
      body: `Iuran ${category.replace(/_/g, " ")} periode ${month} ${year} sebesar Rp ${Number(amount).toLocaleString("id-ID")} telah diterbitkan. Mohon selesaikan pembayaran via aplikasi.`,
      topic: FCMTopics.rtAll(auth.rtId),
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menerbitkan ${createdCount} tagihan iuran untuk warga RT setempat.`,
      count: createdCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create bills" },
      { status: 500 }
    );
  }
}

