import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthUser, hasRole } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";
import { dispatchNotification, FCMTopics, manageFCMTopicSubscription } from "@/lib/notifications";

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

    if (!hasRole(auth, ["RW_CHAIR", "RW_STAFF", "SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Hanya Pengurus RW yang berwenang menyetujui pendaftaran RT." },
        { status: 403 }
      );
    }

    const { action, rejectionReason } = await req.json();
    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ success: false, message: "Action wajib APPROVE atau REJECT" }, { status: 400 });
    }

    const store = getStore();
    const rt = store.rts.find((r) => r.id === params.id && r.rw_id === auth.rwId);
    if (!rt) {
      return NextResponse.json({ success: false, message: "Unit RT tidak ditemukan dalam lingkup RW Anda." }, { status: 404 });
    }

    const applicant = store.users.find((u) => u.id === rt.applicant_user_id);
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (action === "APPROVE") {
      rt.status = "ACTIVE";

      if (applicant) {
        applicant.status = "VERIFIED_ACTIVE";
        applicant.verified_at = new Date().toISOString();
        applicant.verified_by_id = auth.userId;

        // Assign RT_CHAIR role
        const hasRtChair = store.user_roles.some(
          (ur) => ur.user_id === applicant.id && ur.role_id === "role-rt-chair"
        );
        if (!hasRtChair) {
          store.user_roles.push({
            id: crypto.randomUUID(),
            user_id: applicant.id,
            role_id: "role-rt-chair",
            assigned_at: new Date().toISOString(),
          });
        }

        // Subscribe to FCM topic
        const applicantTokens = store.device_tokens
          .filter((dt) => dt.user_id === applicant.id && dt.is_active)
          .map((dt) => dt.token);

        if (applicantTokens.length > 0) {
          await manageFCMTopicSubscription(applicantTokens, FCMTopics.rtOfficers(rt.id), "SUBSCRIBE");
          await manageFCMTopicSubscription(applicantTokens, FCMTopics.rtAll(rt.id), "SUBSCRIBE");
        }

        // Notify new RT Chair
        await dispatchNotification({
          title: "Pendaftaran RT Disetujui! 🎖️",
          body: `Selamat, pembentukan RT ${rt.rt_number} telah disetujui resmi oleh Ketua RW. Anda telah disahkan sebagai Ketua RT.`,
          recipientUserId: applicant.id,
          topic: FCMTopics.userPrivate(applicant.id),
        });
      }

      saveStore(store);

      await recordAuditLog({
        userId: auth.userId,
        action: "APPROVE_NEW_RT_ORGANIZATION",
        resource: `ORGANIZATION_RT:${rt.id}`,
        payload: { rtNumber: rt.rt_number, applicantId: applicant?.id },
        ipAddress: ip,
      });

      return NextResponse.json({
        success: true,
        message: `Pendaftaran RT ${rt.rt_number} resmi disetujui oleh Pengurus RW.`,
        data: rt,
      });
    } else {
      rt.status = "REJECTED";
      saveStore(store);

      if (applicant) {
        await dispatchNotification({
          title: "Pendaftaran RT Belum Disetujui",
          body: `Permohonan RT ${rt.rt_number} ditolak oleh Pengurus RW: ${rejectionReason || "Dokumen belum lengkap."}`,
          recipientUserId: applicant.id,
          topic: FCMTopics.userPrivate(applicant.id),
        });
      }

      await recordAuditLog({
        userId: auth.userId,
        action: "REJECT_NEW_RT_ORGANIZATION",
        resource: `ORGANIZATION_RT:${rt.id}`,
        payload: { rtNumber: rt.rt_number, rejectionReason },
        ipAddress: ip,
      });

      return NextResponse.json({
        success: true,
        message: `Pendaftaran RT ${rt.rt_number} telah ditolak.`,
        data: rt,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to review RT request" },
      { status: 500 }
    );
  }
}

