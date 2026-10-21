import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthUser, hasRole } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";
import { dispatchNotification, FCMTopics } from "@/lib/notifications";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return PATCH(req, { params });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    if (!hasRole(auth, ["RT_CHAIR", "RT_STAFF", "RW_CHAIR", "SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, message: "Hanya Bendahara atau Pengurus RT/RW yang berwenang memvalidasi iuran." },
        { status: 403 }
      );
    }

    const { action, rejectionNote } = await req.json();
    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ success: false, message: "Action wajib APPROVE atau REJECT" }, { status: 400 });
    }

    const store = getStore();
    const bill = store.bills.find((b) => b.id === params.id);
    if (!bill) {
      return NextResponse.json({ success: false, message: "Tagihan tidak ditemukan." }, { status: 404 });
    }

    const citizen = store.users.find((u) => u.id === bill.user_id);
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (action === "APPROVE") {
      bill.status = "PAID";
      bill.validated_by = auth.userId;
      bill.validated_at = new Date().toISOString();
      bill.rejection_note = undefined;

      // Automatically post transaction into Kas RT
      const newTransaction = {
        id: crypto.randomUUID(),
        org_type: "RT" as const,
        rw_id: bill.rw_id,
        rt_id: bill.rt_id,
        type: "INCOME" as const,
        amount: bill.amount,
        category: "Iuran Warga",
        description: `Penerimaan iuran ${bill.category.replace(/_/g, " ")} (${citizen?.full_name || "Warga"}) periode ${bill.month} ${bill.year}`,
        date: new Date().toISOString().split("T")[0],
        recorded_by: auth.userId,
        proof_doc_url: bill.proof_url,
      };
      store.cash_transactions.unshift(newTransaction);

      saveStore(store);

      await recordAuditLog({
        userId: auth.userId,
        action: "VALIDATE_DUES_PAYMENT_APPROVED",
        resource: `BILL:${bill.id}`,
        payload: { citizenId: citizen?.id, amount: bill.amount, transactionId: newTransaction.id },
        ipAddress: ip,
      });

      // Send push notification to citizen
      await dispatchNotification({
        title: "Iuran Terverifikasi Lunas! ✅",
        body: `Pembayaran iuran (${bill.month} ${bill.year}) sebesar Rp ${bill.amount.toLocaleString("id-ID")} telah divalidasi oleh Bendahara RT dan tercatat di Kas RT.`,
        recipientUserId: bill.user_id,
        topic: FCMTopics.userPrivate(bill.user_id),
      });

      return NextResponse.json({
        success: true,
        message: `Pembayaran warga ${citizen?.full_name} berhasil divalidasi dan saldo Kas RT otomatis bertambah.`,
        data: bill,
      });
    } else {
      // REJECT
      bill.status = "REJECTED";
      bill.rejection_note = rejectionNote || "Bukti transfer tidak terbaca atau nominal tidak sesuai.";
      bill.validated_by = auth.userId;
      bill.validated_at = new Date().toISOString();

      saveStore(store);

      await recordAuditLog({
        userId: auth.userId,
        action: "VALIDATE_DUES_PAYMENT_REJECTED",
        resource: `BILL:${bill.id}`,
        payload: { citizenId: citizen?.id, rejectionNote: bill.rejection_note },
        ipAddress: ip,
      });

      await dispatchNotification({
        title: "Konfirmasi Iuran Perlu Perbaikan",
        body: `Pembayaran iuran (${bill.month} ${bill.year}) belum dapat disetujui: ${bill.rejection_note}. Silakan kirim ulang bukti transfer yang valid.`,
        recipientUserId: bill.user_id,
        topic: FCMTopics.userPrivate(bill.user_id),
      });

      return NextResponse.json({
        success: true,
        message: "Pembayaran telah ditolak dengan catatan.",
        data: bill,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to validate bill payment" },
      { status: 500 }
    );
  }
}

