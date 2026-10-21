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

    if (!hasRole(auth, ["SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Hanya Super Admin Kelurahan yang dapat menyetujui RW." },
        { status: 403 }
      );
    }

    const rwId = params.id;
    const { action, notes } = await req.json();

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Action harus berupa APPROVE atau REJECT" },
        { status: 400 }
      );
    }

    const store = getStore();
    const rw = store.rws.find((r) => r.id === rwId);
    if (!rw) {
      return NextResponse.json({ success: false, message: "RW tidak ditemukan." }, { status: 404 });
    }

    const applicant = store.users.find((u) => u.id === rw.applicant_user_id);
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (action === "APPROVE") {
      rw.status = "ACTIVE";

      if (applicant) {
        applicant.status = "VERIFIED_ACTIVE";
        applicant.verified_at = new Date().toISOString();
        applicant.verified_by_id = auth.userId;

        // Assign RW_CHAIR role
        const hasRwRole = store.user_roles.some(
          (ur) => ur.user_id === applicant.id && ur.role_id === "role-rw-chair"
        );
        if (!hasRwRole) {
          store.user_roles.push({
            id: crypto.randomUUID(),
            user_id: applicant.id,
            role_id: "role-rw-chair",
            assigned_at: new Date().toISOString(),
          });
        }

        // Subscribe to FCM topic
        const applicantTokens = store.device_tokens
          .filter((dt) => dt.user_id === applicant.id && dt.is_active)
          .map((dt) => dt.token);

        if (applicantTokens.length > 0) {
          await manageFCMTopicSubscription(applicantTokens, FCMTopics.rwOfficers(rw.id), "SUBSCRIBE");
          await manageFCMTopicSubscription(applicantTokens, FCMTopics.rwAll(rw.id), "SUBSCRIBE");
        }

        // Send Push notification
        await dispatchNotification({
          title: "Pendaftaran RW Disetujui! 🏛️",
          body: `Selamat, permohonan RW ${rw.rw_number} Kelurahan ${rw.village} telah disetujui oleh Kelurahan. Anda resmi menjabat sebagai Ketua RW.`,
          recipientUserId: applicant.id,
          topic: FCMTopics.userPrivate(applicant.id),
        });
      }

      saveStore(store);

      await recordAuditLog({
        userId: auth.userId,
        action: "APPROVE_NEW_RW_ORGANIZATION",
        resource: `ORGANIZATION_RW:${rw.id}`,
        payload: { rwNumber: rw.rw_number, village: rw.village, applicantId: applicant?.id },
        ipAddress: ip,
      });

      return NextResponse.json({
        success: true,
        message: `RW ${rw.rw_number} Kelurahan ${rw.village} resmi diaktifkan dan Ketua RW telah disahkan.`,
        data: rw,
      });
    } else {
      // REJECT
      rw.status = "REJECTED";
      saveStore(store);

      if (applicant) {
        await dispatchNotification({
          title: "Pendaftaran RW Ditolak",
          body: `Permohonan pendaftaran RW ${rw.rw_number} belum disetujui Kelurahan: ${notes || "Dokumen belum memenuhi syarat."}`,
          recipientUserId: applicant.id,
          topic: FCMTopics.userPrivate(applicant.id),
        });
      }

      await recordAuditLog({
        userId: auth.userId,
        action: "REJECT_NEW_RW_ORGANIZATION",
        resource: `ORGANIZATION_RW:${rw.id}`,
        payload: { rwNumber: rw.rw_number, village: rw.village, notes },
        ipAddress: ip,
      });

      return NextResponse.json({
        success: true,
        message: `Pendaftaran RW ${rw.rw_number} telah ditolak.`,
        data: rw,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to review RW" },
      { status: 500 }
    );
  }
}

