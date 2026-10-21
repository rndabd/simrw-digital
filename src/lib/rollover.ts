import crypto from "crypto";
import { getStore, saveStore } from "./data-store";
import { recordAuditLog } from "./audit";
import { dispatchNotification, FCMTopics, manageFCMTopicSubscription } from "./notifications";

export interface ExecuteRolloverParams {
  targetType: "RW" | "RT";
  targetRwId: string;
  targetRtId?: string;
  outgoingOfficerId: string;
  incomingOfficerId: string;
  periodFrom: string;
  periodTo: string;
  nextPeriodTo: string;
  closingCashBalance: number;
  handoverNotes: string;
  bastDocumentUrl?: string;
  executedByUserId: string;
  ipAddress?: string;
}

export async function executeLeadershipRollover(params: ExecuteRolloverParams) {
  const store = getStore();

  const rw = store.rws.find((r) => r.id === params.targetRwId);
  if (!rw) {
    throw new Error("Rukun Warga (RW) tidak ditemukan.");
  }

  const outgoing = store.users.find((u) => u.id === params.outgoingOfficerId);
  const incoming = store.users.find((u) => u.id === params.incomingOfficerId);

  if (!incoming) {
    throw new Error("Pejabat baru / pengganti tidak ditemukan.");
  }

  if (incoming.status !== "VERIFIED_ACTIVE") {
    throw new Error("Pejabat baru wajib berstatus Warga Terverifikasi Aktif.");
  }

  const roleName = params.targetType === "RW" ? "RW_CHAIR" : "RT_CHAIR";
  const targetRoleId = params.targetType === "RW" ? "role-rw-chair" : "role-rt-chair";

  // 1. Revoke officer role from outgoing officer (Demisioner)
  if (outgoing) {
    store.user_roles = store.user_roles.filter(
      (ur) => !(ur.user_id === outgoing.id && ur.role_id === targetRoleId)
    );

    // Unsubscribe outgoing officer device tokens from officer topic
    const outgoingTokens = store.device_tokens
      .filter((dt) => dt.user_id === outgoing.id && dt.is_active)
      .map((dt) => dt.token);

    if (outgoingTokens.length > 0) {
      const topic = params.targetType === "RW"
        ? FCMTopics.rwOfficers(params.targetRwId)
        : FCMTopics.rtOfficers(params.targetRtId || outgoing.rt_id);
      await manageFCMTopicSubscription(outgoingTokens, topic, "UNSUBSCRIBE");
    }
  }

  // 2. Assign officer role to incoming officer
  const existingMapping = store.user_roles.find(
    (ur) => ur.user_id === incoming.id && ur.role_id === targetRoleId
  );
  if (!existingMapping) {
    store.user_roles.push({
      id: crypto.randomUUID(),
      user_id: incoming.id,
      role_id: targetRoleId,
      assigned_at: new Date().toISOString(),
    });
  }

  // Subscribe incoming officer tokens to officer topic
  const incomingTokens = store.device_tokens
    .filter((dt) => dt.user_id === incoming.id && dt.is_active)
    .map((dt) => dt.token);

  if (incomingTokens.length > 0) {
    const topic = params.targetType === "RW"
      ? FCMTopics.rwOfficers(params.targetRwId)
      : FCMTopics.rtOfficers(params.targetRtId || incoming.rt_id);
    await manageFCMTopicSubscription(incomingTokens, topic, "SUBSCRIBE");
  }

  // 3. Update Organization tenure term
  const newTerm = `${params.periodTo}-${params.nextPeriodTo}`;
  if (params.targetType === "RW") {
    rw.term_period = newTerm;
  } else if (params.targetRtId) {
    const rt = store.rts.find((r) => r.id === params.targetRtId);
    if (rt) rt.term_period = newTerm;
  }

  // 4. Record Rollover & Handover BAST Entry
  const rolloverRecord = {
    id: crypto.randomUUID(),
    target_type: params.targetType,
    target_rw_id: params.targetRwId,
    target_rt_id: params.targetRtId,
    from_user_id: outgoing ? outgoing.id : "DEMISIONER",
    to_user_id: incoming.id,
    period_from: params.periodFrom,
    period_to: params.periodTo,
    next_period_to: params.nextPeriodTo,
    closing_cash_balance: params.closingCashBalance,
    handover_notes: params.handoverNotes,
    bast_document_url: params.bastDocumentUrl || "/uploads/bast-serah-terima.pdf",
    executed_by: params.executedByUserId,
    created_at: new Date().toISOString(),
  };

  store.rollovers.unshift(rolloverRecord);

  // 5. Publish automatic citizen announcement
  const announcementTitle = `Pemberitahuan Serah Terima Jabatan (Rollover) ${
    params.targetType === "RW" ? `Ketua RW ${rw.rw_number}` : `Ketua RT`
  } Periode ${newTerm}`;

  const announcementContent = `Telah dilaksanakan serah terima jabatan (BAST) dari kepengurusan masa bakti ${
    params.periodFrom
  }-${params.periodTo} kepada kepengurusan baru ${newTerm} yang dipimpin oleh ${
    incoming.full_name
  }. Saldo kas lingkungan yang dialihkan: Rp ${params.closingCashBalance.toLocaleString(
    "id-ID"
  )}. Catatan serah terima: "${params.handoverNotes}". Seluruh warga dapat mengakses layanan secara normal.`;

  const newAnn = {
    id: crypto.randomUUID(),
    rw_id: params.targetRwId,
    rt_id: params.targetRtId,
    author_id: incoming.id,
    title: announcementTitle,
    content: announcementContent,
    scope: params.targetType === "RW" ? ("RW_BROADCAST" as const) : ("RT_BROADCAST" as const),
    attachments: [rolloverRecord.bast_document_url],
    is_pinned: true,
    created_at: new Date().toISOString(),
  };
  store.announcements.unshift(newAnn);

  saveStore(store);

  // 6. Record Audit Log
  await recordAuditLog({
    userId: params.executedByUserId,
    action: "LEADERSHIP_ROLLOVER_COMPLETED",
    resource: `${params.targetType}:${params.targetType === "RW" ? params.targetRwId : params.targetRtId}`,
    payload: {
      fromUserId: params.outgoingOfficerId,
      toUserId: params.incomingOfficerId,
      term: newTerm,
      closingCash: params.closingCashBalance,
    },
    ipAddress: params.ipAddress || "127.0.0.1",
  });

  // 7. Push notification to citizens
  await dispatchNotification({
    title: `📢 ${announcementTitle}`,
    body: `Masa bakti baru ${newTerm} resmi dipimpin oleh ${incoming.full_name}.`,
    topic: params.targetType === "RW" ? FCMTopics.rwAll(params.targetRwId) : FCMTopics.rtAll(params.targetRtId!),
  });

  return rolloverRecord;
}

