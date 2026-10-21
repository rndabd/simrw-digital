import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthUser, hasRole } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";
import { dispatchNotification, FCMTopics, manageFCMTopicSubscription } from "@/lib/notifications";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    if (!hasRole(auth, ["RW_CHAIR", "RW_STAFF", "SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Hanya Ketua RW atau Super Admin yang dapat mereview." },
        { status: 403 }
      );
    }

    const { action, rejectionReason } = await req.json();
    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Action harus berupa APPROVE atau REJECT" },
        { status: 400 }
      );
    }

    const store = getStore();
    const requestIndex = store.officer_requests.findIndex((r) => r.id === params.id);
    if (requestIndex === -1) {
      return NextResponse.json({ success: false, message: "Pengajuan tidak ditemukan" }, { status: 404 });
    }

    const officerReq = store.officer_requests[requestIndex];
    const applicant = store.users.find((u) => u.id === officerReq.user_id);
    if (!applicant) {
      return NextResponse.json({ success: false, message: "Pemohon tidak ditemukan" }, { status: 404 });
    }

    // Hierarki verification check:
    // RT level -> Reviewed by RW Chair
    // RW level -> Reviewed by Super Admin
    const isRwLevelRole = officerReq.requested_role.startsWith("RW_");
    if (isRwLevelRole && !auth.roles.includes("SUPER_ADMIN")) {
      return NextResponse.json(
        {
          success: false,
          message: "Pengajuan peran tingkat RW hanya dapat disetujui oleh Super Admin (Kelurahan/Admin Sistem).",
        },
        { status: 403 }
      );
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (action === "APPROVE") {
      officerReq.status = "APPROVED";
      officerReq.reviewed_by = auth.userId;
      officerReq.reviewed_at = new Date().toISOString();

      if (applicant.status === "PENDING_VERIFICATION") {
        applicant.status = "VERIFIED_ACTIVE";
      }

      // Find role definition in store
      const targetRoleDef = store.roles.find((r) => r.name === officerReq.requested_role);
      const roleId = targetRoleDef ? targetRoleDef.id : `role-${officerReq.requested_role.toLowerCase().replace(/_/g, "-")}`;

      // Assign to UserRoleMapping
      const existingMapping = store.user_roles.find(
        (ur) => ur.user_id === applicant.id && ur.role_id === roleId
      );
      if (!existingMapping) {
        store.user_roles.push({
          id: crypto.randomUUID(),
          user_id: applicant.id,
          role_id: roleId,
          assigned_at: new Date().toISOString(),
        });
      }

      saveStore(store);

      // Audit Log
      await recordAuditLog({
        userId: auth.userId,
        action: "APPROVE_OFFICER_ELEVATION",
        resource: `OFFICER_REQUEST:${officerReq.id}`,
        payload: {
          applicantId: applicant.id,
          requestedRole: officerReq.requested_role,
        },
        ipAddress: ip,
      });

      // FCM Topic subscription for officers
      const applicantTokens = store.device_tokens
        .filter((dt) => dt.user_id === applicant.id && dt.is_active)
        .map((dt) => dt.token);

      if (applicantTokens.length > 0) {
        const officerTopic = officerReq.requested_role.startsWith("RT_")
          ? FCMTopics.rtOfficers(officerReq.target_rt_id || applicant.rt_id)
          : FCMTopics.rwOfficers(officerReq.target_rw_id);

        await manageFCMTopicSubscription(applicantTokens, officerTopic, "SUBSCRIBE");
      }

      // Notify citizen
      await dispatchNotification({
        title: "Pengajuan Jabatan Disetujui! 🎖️",
        body: `Selamat! Pengajuan Anda sebagai ${officerReq.requested_role} telah disetujui. Silakan beralih ke Mode Pengurus.`,
        recipientUserId: applicant.id,
        topic: FCMTopics.userPrivate(applicant.id),
      });

      return NextResponse.json({
        success: true,
        message: `Pengajuan kepengurusan ${applicant.full_name} sebagai ${officerReq.requested_role} berhasil disetujui.`,
        data: officerReq,
      });
    } else {
      officerReq.status = "REJECTED";
      officerReq.rejection_reason = rejectionReason || "Dokumen persyaratan belum lengkap atau tidak valid.";
      officerReq.reviewed_by = auth.userId;
      officerReq.reviewed_at = new Date().toISOString();
      saveStore(store);

      await recordAuditLog({
        userId: auth.userId,
        action: "REJECT_OFFICER_ELEVATION",
        resource: `OFFICER_REQUEST:${officerReq.id}`,
        payload: {
          applicantId: applicant.id,
          rejectionReason: officerReq.rejection_reason,
        },
        ipAddress: ip,
      });

      await dispatchNotification({
        title: "Pengajuan Pengurus Ditolak",
        body: `Pengajuan ${officerReq.requested_role} belum disetujui: ${officerReq.rejection_reason}`,
        recipientUserId: applicant.id,
        topic: FCMTopics.userPrivate(applicant.id),
      });

      return NextResponse.json({
        success: true,
        message: "Pengajuan berhasil ditolak.",
        data: officerReq,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to review officer request" },
      { status: 500 }
    );
  }
}

