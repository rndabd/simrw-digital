import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthUser } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";
import { dispatchNotification, FCMTopics } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const store = getStore();
    const user = store.users.find((u) => u.id === auth.userId);
    if (!user) {
      return NextResponse.json({ success: false, message: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    // Syarat Mutlak: Warga Wajib Berstatus VERIFIED_ACTIVE
    if (user.status !== "VERIFIED_ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "Syarat Mutlak: Pengguna wajib berstatus Warga Terverifikasi Aktif untuk mengajukan peran kepengurusan.",
        },
        { status: 403 }
      );
    }

    const { requestedRole, targetRwId, targetRtId, skDocumentUrl } = await req.json();

    const allowedRoles = ["RT_CHAIR", "RT_STAFF", "RW_CHAIR", "RW_STAFF", "SECURITY"];
    if (!allowedRoles.includes(requestedRole)) {
      return NextResponse.json(
        { success: false, message: `Peran yang diajukan tidak valid: ${requestedRole}` },
        { status: 400 }
      );
    }

    // Check if already has pending request
    const existing = store.officer_requests.find(
      (r) => r.user_id === user.id && r.status === "PENDING"
    );
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Anda masih memiliki pengajuan kepengurusan yang sedang diproses." },
        { status: 409 }
      );
    }

    const newRequest = {
      id: crypto.randomUUID(),
      user_id: user.id,
      requested_role: requestedRole,
      target_rw_id: targetRwId || user.rw_id,
      target_rt_id: targetRtId || user.rt_id,
      sk_document_url: skDocumentUrl || "/uploads/sk-mandat.pdf",
      status: "PENDING" as const,
      created_at: new Date().toISOString(),
    };

    store.officer_requests.unshift(newRequest);
    saveStore(store);

    // Audit log
    await recordAuditLog({
      userId: user.id,
      action: "SUBMIT_OFFICER_ELEVATION",
      resource: "OFFICER_REQUEST",
      payload: { requestedRole, targetRtId: newRequest.target_rt_id },
    });

    // Notify appropriate reviewer
    const isRtLevel = requestedRole.startsWith("RT_") || requestedRole === "SECURITY";
    if (isRtLevel) {
      // Dispatched to RW Chair
      await dispatchNotification({
        title: "Pengajuan Pengurus RT Baru",
        body: `${user.full_name} mengajukan jabatan ${requestedRole}. Menunggu peninjauan Ketua RW.`,
        topic: FCMTopics.rwOfficers(newRequest.target_rw_id),
      });
    } else {
      // Dispatched to Super Admin
      await dispatchNotification({
        title: "Pengajuan Pengurus RW Baru",
        body: `${user.full_name} mengajukan jabatan ${requestedRole}. Menunggu peninjauan Super Admin.`,
        topic: "admin_broadcast",
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Pengajuan kepengurusan lingkungan berhasil dikirim. Menunggu verifikasi berjenjang.",
        data: newRequest,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit officer application" },
      { status: 500 }
    );
  }
}

