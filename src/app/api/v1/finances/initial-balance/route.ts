import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthUser } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { orgType, targetId, initialBalance, notes } = await req.json();

    if (!orgType || !["RT", "RW"].includes(orgType)) {
      return NextResponse.json({ success: false, message: "orgType wajib 'RT' atau 'RW'" }, { status: 400 });
    }

    const numBalance = Number(initialBalance);
    if (isNaN(numBalance) || numBalance < 0) {
      return NextResponse.json({ success: false, message: "Nominal saldo awal harus berupa angka valid >= 0" }, { status: 400 });
    }

    const isRwOfficer = auth.roles.some((r) => r.startsWith("RW_") || r === "SUPER_ADMIN");
    const isRtOfficer = auth.roles.some((r) => r.startsWith("RT_"));

    const store = getStore();

    if (orgType === "RW") {
      if (!isRwOfficer) {
        return NextResponse.json({ success: false, message: "Akses ditolak. Hanya Pengurus RW atau Super Admin yang dapat mengatur Saldo Awal RW." }, { status: 403 });
      }

      const rw = store.rws.find((r) => r.id === (targetId || auth.rwId));
      if (!rw) {
        return NextResponse.json({ success: false, message: "RW tidak ditemukan." }, { status: 404 });
      }

      rw.initial_balance = numBalance;

      // Update or create initial balance transaction
      const existingTx = store.cash_transactions.find(
        (t) => t.org_type === "RW" && t.rw_id === rw.id && t.category === "Saldo Awal Kas"
      );
      if (existingTx) {
        existingTx.amount = numBalance;
        existingTx.description = notes || `Saldo awal kas RW ${rw.rw_number} terverifikasi`;
        existingTx.date = new Date().toISOString().split("T")[0];
      } else {
        store.cash_transactions.unshift({
          id: `ctx-${rw.id}-init-${Date.now()}`,
          org_type: "RW",
          rw_id: rw.id,
          type: "INCOME",
          amount: numBalance,
          category: "Saldo Awal Kas",
          description: notes || `Saldo awal kas RW ${rw.rw_number} terverifikasi`,
          date: new Date().toISOString().split("T")[0],
          recorded_by: auth.userId,
        });
      }

      saveStore(store);

      await recordAuditLog({
        userId: auth.userId,
        action: "UPDATE_INITIAL_BALANCE_RW",
        resource: `RW:${rw.id}`,
        payload: { initialBalance: numBalance, notes },
      });

      return NextResponse.json({
        success: true,
        message: `Saldo awal Kas RW ${rw.rw_number} berhasil diperbarui menjadi Rp ${numBalance.toLocaleString("id-ID")}.`,
        data: { initialBalance: numBalance },
      });
    } else {
      const effectiveRtId = targetId || auth.rtId;
      const canManageRt = isRwOfficer || (isRtOfficer && auth.rtId === effectiveRtId);
      if (!canManageRt) {
        return NextResponse.json({ success: false, message: "Akses ditolak. Anda tidak berwenang mengatur Saldo Awal RT ini." }, { status: 403 });
      }

      const rt = store.rts.find((r) => r.id === effectiveRtId);
      if (!rt) {
        return NextResponse.json({ success: false, message: "RT tidak ditemukan." }, { status: 404 });
      }

      rt.initial_balance = numBalance;

      // Update or create initial balance transaction
      const existingTx = store.cash_transactions.find(
        (t) => t.org_type === "RT" && t.rt_id === rt.id && t.category === "Saldo Awal Kas"
      );
      if (existingTx) {
        existingTx.amount = numBalance;
        existingTx.description = notes || `Saldo awal kas RT ${rt.rt_number} terverifikasi`;
        existingTx.date = new Date().toISOString().split("T")[0];
      } else {
        store.cash_transactions.unshift({
          id: `ctx-${rt.id}-init-${Date.now()}`,
          org_type: "RT",
          rw_id: rt.rw_id,
          rt_id: rt.id,
          type: "INCOME",
          amount: numBalance,
          category: "Saldo Awal Kas",
          description: notes || `Saldo awal kas RT ${rt.rt_number} terverifikasi`,
          date: new Date().toISOString().split("T")[0],
          recorded_by: auth.userId,
        });
      }

      saveStore(store);

      await recordAuditLog({
        userId: auth.userId,
        action: "UPDATE_INITIAL_BALANCE_RT",
        resource: `RT:${rt.id}`,
        payload: { initialBalance: numBalance, notes },
      });

      return NextResponse.json({
        success: true,
        message: `Saldo awal Kas RT ${rt.rt_number} berhasil diperbarui menjadi Rp ${numBalance.toLocaleString("id-ID")}.`,
        data: { initialBalance: numBalance },
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 });
  }
}

