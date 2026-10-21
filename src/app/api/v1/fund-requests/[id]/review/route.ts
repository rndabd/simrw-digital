import { NextRequest, NextResponse } from "next/server";
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

    const { action, rejectionReason } = await req.json();
    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ success: false, message: "Action wajib APPROVE atau REJECT" }, { status: 400 });
    }

    const store = getStore();
    const fundReq = store.fund_requests.find((r) => r.id === params.id);
    if (!fundReq) {
      return NextResponse.json({ success: false, message: "Pengajuan dana tidak ditemukan." }, { status: 404 });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // STAGE 1: TAHAP PENINJAUAN KETUA RT
    if (fundReq.status === "PENDING_RT_APPROVAL") {
      if (!hasRole(auth, ["RT_CHAIR", "SUPER_ADMIN"])) {
        return NextResponse.json(
          { success: false, message: "Hanya Ketua RT atau Super Admin yang dapat menyetujui tahap RT." },
          { status: 403 }
        );
      }

      if (action === "APPROVE") {
        fundReq.status = "PENDING_RW_APPROVAL";
        fundReq.rt_reviewed_by = auth.userId;
        fundReq.rt_reviewed_at = new Date().toISOString();

        saveStore(store);

        await recordAuditLog({
          userId: auth.userId,
          action: "APPROVE_FUND_REQUEST_STAGE_RT",
          resource: `FUND_REQUEST:${fundReq.id}`,
          payload: { title: fundReq.title, amount: fundReq.amount },
          ipAddress: ip,
        });

        // Notify RW Officers
        await dispatchNotification({
          title: "Proposal Dana Menunggu Approval RW",
          body: `Pengajuan dana "${fundReq.title}" telah disetujui Ketua RT dan kini menunggu persetujuan akhir Pengurus RW.`,
          topic: FCMTopics.rwOfficers(fundReq.rw_id),
        });

        return NextResponse.json({
          success: true,
          message: "Pengajuan dana disetujui di tingkat RT dan diteruskan ke Pengurus RW.",
          data: fundReq,
        });
      } else {
        fundReq.status = "REJECTED";
        fundReq.rejection_reason = rejectionReason || "Ditolak oleh Ketua RT.";
        fundReq.rt_reviewed_by = auth.userId;
        fundReq.rt_reviewed_at = new Date().toISOString();

        saveStore(store);

        await recordAuditLog({
          userId: auth.userId,
          action: "REJECT_FUND_REQUEST_STAGE_RT",
          resource: `FUND_REQUEST:${fundReq.id}`,
          payload: { rejectionReason: fundReq.rejection_reason },
          ipAddress: ip,
        });

        return NextResponse.json({
          success: true,
          message: "Pengajuan dana ditolak oleh Ketua RT.",
          data: fundReq,
        });
      }
    }

    // STAGE 2: TAHAP PENINJAUAN KETUA & KEPENGURUSAN RW
    if (fundReq.status === "PENDING_RW_APPROVAL") {
      if (!hasRole(auth, ["RW_CHAIR", "RW_STAFF", "SUPER_ADMIN"])) {
        return NextResponse.json(
          { success: false, message: "Akses ditolak. Tahap akhir pengajuan dana memerlukan persetujuan Ketua/Pengurus RW." },
          { status: 403 }
        );
      }

      if (action === "APPROVE") {
        fundReq.status = "APPROVED";
        fundReq.rw_reviewed_by = auth.userId;
        fundReq.rw_reviewed_at = new Date().toISOString();

        saveStore(store);

        await recordAuditLog({
          userId: auth.userId,
          action: "APPROVE_FUND_REQUEST_STAGE_RW_FINAL",
          resource: `FUND_REQUEST:${fundReq.id}`,
          payload: { title: fundReq.title, amount: fundReq.amount },
          ipAddress: ip,
        });

        // Notify RT Officers & Applicant
        await dispatchNotification({
          title: "Pengajuan Dana Disetujui Penuh! 🎉",
          body: `Selamat! Pengajuan dana "${fundReq.title}" sebesar Rp ${fundReq.amount.toLocaleString("id-ID")} telah disetujui penuh oleh Pengurus RW dan siap dicairkan.`,
          topic: FCMTopics.rtOfficers(fundReq.rt_id),
          recipientUserId: fundReq.applicant_user_id,
        });

        return NextResponse.json({
          success: true,
          message: "Pengajuan dana resmi disetujui penuh oleh Pengurus RW.",
          data: fundReq,
        });
      } else {
        fundReq.status = "REJECTED";
        fundReq.rejection_reason = rejectionReason || "Ditolak oleh Pengurus RW.";
        fundReq.rw_reviewed_by = auth.userId;
        fundReq.rw_reviewed_at = new Date().toISOString();

        saveStore(store);

        await recordAuditLog({
          userId: auth.userId,
          action: "REJECT_FUND_REQUEST_STAGE_RW",
          resource: `FUND_REQUEST:${fundReq.id}`,
          payload: { rejectionReason: fundReq.rejection_reason },
          ipAddress: ip,
        });

        return NextResponse.json({
          success: true,
          message: "Pengajuan dana ditolak oleh Pengurus RW.",
          data: fundReq,
        });
      }
    }

    return NextResponse.json(
      { success: false, message: "Status pengajuan saat ini sudah selesai (APPROVED / REJECTED)." },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to review fund request" },
      { status: 500 }
    );
  }
}

