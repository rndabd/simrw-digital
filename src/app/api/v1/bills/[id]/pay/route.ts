import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";
import { dispatchNotification, FCMTopics } from "@/lib/notifications";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { proofUrl = "/uploads/bukti-transfer-warga.jpg", paymentMethod = "TRANSFER_BANK" } = await req.json().catch(() => ({}));

    const store = getStore();
    const bill = store.bills.find((b) => b.id === params.id && b.user_id === auth.userId);
    if (!bill) {
      return NextResponse.json({ success: false, message: "Tagihan tidak ditemukan." }, { status: 404 });
    }

    // Set to PENDING_VALIDATION (wajib divalidasi oleh bendahara / pengurus RT)
    bill.status = "PENDING_VALIDATION";
    bill.paid_at = new Date().toISOString();
    bill.proof_url = proofUrl;
    bill.rejection_note = undefined;

    saveStore(store);

    await recordAuditLog({
      userId: auth.userId,
      action: "SUBMIT_PAYMENT_PROOF",
      resource: `BILL:${bill.id}`,
      payload: { amount: bill.amount, month: bill.month, year: bill.year, paymentMethod },
    });

    // Notify RT Officers (Bendahara & Ketua RT)
    await dispatchNotification({
      title: "Pembayaran Iuran Warga Masuk",
      body: `${auth.fullName} telah mengirimkan bukti pembayaran iuran (${bill.month} ${bill.year}) sebesar Rp ${bill.amount.toLocaleString("id-ID")}. Menunggu validasi bendahara.`,
      topic: FCMTopics.rtOfficers(bill.rt_id),
      data: {
        billId: bill.id,
        type: "DUES_PENDING_VALIDATION",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Bukti pembayaran berhasil dikirim! Status kini PENDING menunggu verifikasi & konfirmasi dari Bendahara RT.",
      data: bill,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process bill payment" },
      { status: 500 }
    );
  }
}
