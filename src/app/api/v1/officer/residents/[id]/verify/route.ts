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

    if (!hasRole(auth, ["RT_CHAIR", "RT_STAFF", "RW_CHAIR", "SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Hanya pengurus RT/RW yang berwenang." },
        { status: 403 }
      );
    }

    const userId = params.id;
    const { action, rejectionNote, assignedRole } = await req.json();

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Action harus berupa APPROVE atau REJECT" },
        { status: 400 }
      );
    }

    const store = getStore();
    const userIndex = store.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Warga tidak ditemukan" },
        { status: 404 }
      );
    }

    const targetUser = store.users[userIndex];
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (action === "APPROVE") {
      targetUser.status = "VERIFIED_ACTIVE";
      targetUser.verified_at = new Date().toISOString();
      targetUser.verified_by_id = auth.userId;
      targetUser.rejection_note = undefined;

      // Assign role (HEAD_OF_FAMILY or RESIDENT)
      const roleToAssign = assignedRole === "HEAD_OF_FAMILY" ? "role-head-family" : "role-resident";
      const existingRole = store.user_roles.find(
        (ur) => ur.user_id === targetUser.id && ur.role_id === roleToAssign
      );
      if (!existingRole) {
        store.user_roles.push({
          id: crypto.randomUUID(),
          user_id: targetUser.id,
          role_id: roleToAssign,
          assigned_at: new Date().toISOString(),
        });
      }

      saveStore(store);

      // Audit Log
      await recordAuditLog({
        userId: auth.userId,
        action: "APPROVE_RESIDENT",
        resource: `USER:${targetUser.id}`,
        payload: { targetUserId: targetUser.id, assignedRole: roleToAssign },
        ipAddress: ip,
      });

      // FCM Topics subscription
      const userTokens = store.device_tokens
        .filter((dt) => dt.user_id === targetUser.id && dt.is_active)
        .map((dt) => dt.token);

      if (userTokens.length > 0) {
        await manageFCMTopicSubscription(userTokens, FCMTopics.rtAll(targetUser.rt_id), "SUBSCRIBE");
        await manageFCMTopicSubscription(userTokens, FCMTopics.rwAll(targetUser.rw_id), "SUBSCRIBE");
      }

      // Send Push notification to Citizen
      await dispatchNotification({
        title: "Pendaftaran Disetujui! 🎉",
        body: `Selamat, akun warga Anda telah diverifikasi oleh Ketua RT. Anda kini dapat mengakses layanan warga.`,
        recipientUserId: targetUser.id,
        topic: FCMTopics.userPrivate(targetUser.id),
      });

      return NextResponse.json({
        success: true,
        message: `Warga ${targetUser.full_name} berhasil disetujui sebagai warga resmi.`,
        data: {
          id: targetUser.id,
          status: targetUser.status,
          verifiedAt: targetUser.verified_at,
        },
      });
    } else {
      // REJECT
      targetUser.status = "REJECTED";
      targetUser.rejection_note = rejectionNote || "Dokumen KTP atau data wilayah tidak sesuai.";
      saveStore(store);

      // Audit Log
      await recordAuditLog({
        userId: auth.userId,
        action: "REJECT_RESIDENT",
        resource: `USER:${targetUser.id}`,
        payload: { targetUserId: targetUser.id, rejectionNote: targetUser.rejection_note },
        ipAddress: ip,
      });

      // Send Push Notification
      await dispatchNotification({
        title: "Pendaftaran Belum Dapat Disetujui",
        body: `Catatan verifikator: ${targetUser.rejection_note}`,
        recipientUserId: targetUser.id,
        topic: FCMTopics.userPrivate(targetUser.id),
      });

      return NextResponse.json({
        success: true,
        message: `Pendaftaran warga telah ditolak dengan catatan.`,
        data: {
          id: targetUser.id,
          status: targetUser.status,
          rejectionNote: targetUser.rejection_note,
        },
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to verify resident" },
      { status: 500 }
    );
  }
}

