import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthUser, hasRole } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";
import { dispatchNotification, FCMTopics } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const store = getStore();
    let requests = [...store.fund_requests];

    // Filter based on role
    if (hasRole(auth, ["RW_CHAIR", "RW_STAFF", "SUPER_ADMIN"])) {
      requests = requests.filter((r) => r.rw_id === auth.rwId);
    } else if (hasRole(auth, ["RT_CHAIR", "RT_STAFF"])) {
      requests = requests.filter((r) => r.rt_id === auth.rtId);
    } else {
      requests = requests.filter((r) => r.applicant_user_id === auth.userId);
    }

    const enriched = requests.map((item) => {
      const applicant = store.users.find((u) => u.id === item.applicant_user_id);
      const rt = store.rts.find((r) => r.id === item.rt_id);
      const rw = store.rws.find((r) => r.id === item.rw_id);
      const rtReviewer = store.users.find((u) => u.id === item.rt_reviewed_by);
      const rwReviewer = store.users.find((u) => u.id === item.rw_reviewed_by);

      return {
        ...item,
        applicantName: applicant?.full_name || "Pemohon",
        rtNumber: rt?.rt_number || "-",
        rwNumber: rw?.rw_number || "-",
        rtReviewerName: rtReviewer?.full_name,
        rwReviewerName: rwReviewer?.full_name,
      };
    });

    return NextResponse.json({
      success: true,
      data: enriched,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load fund requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { title, amount, purpose, documentUrl } = await req.json();

    if (!title || !amount || !purpose) {
      return NextResponse.json(
        { success: false, message: "Judul kegiatan, nominal anggaran dana, dan tujuan wajib diisi." },
        { status: 400 }
      );
    }

    const store = getStore();
    const isChair = hasRole(auth, ["RT_CHAIR"]);

    // If initiated directly by Ketua RT, it skips RT approval and goes directly to PENDING_RW_APPROVAL!
    const initialStatus = isChair ? "PENDING_RW_APPROVAL" : "PENDING_RT_APPROVAL";

    const newRequest = {
      id: crypto.randomUUID(),
      rw_id: auth.rwId,
      rt_id: auth.rtId,
      applicant_user_id: auth.userId,
      title: title.trim(),
      amount: Number(amount),
      purpose: purpose.trim(),
      document_url: documentUrl || "/uploads/proposal-rab.pdf",
      status: initialStatus as any,
      rt_reviewed_by: isChair ? auth.userId : undefined,
      rt_reviewed_at: isChair ? new Date().toISOString() : undefined,
      created_at: new Date().toISOString(),
    };

    store.fund_requests.unshift(newRequest);
    saveStore(store);

    await recordAuditLog({
      userId: auth.userId,
      action: "SUBMIT_FUND_REQUEST",
      resource: `FUND_REQUEST:${newRequest.id}`,
      payload: { title, amount, initialStatus },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    // Send push notification
    if (initialStatus === "PENDING_RW_APPROVAL") {
      await dispatchNotification({
        title: "Pengajuan Dana Masuk ke Tingkat RW",
        body: `Ketua RT ${auth.rtId} mengajukan dana "${title}" sebesar Rp ${Number(amount).toLocaleString("id-ID")}. Menunggu persetujuan Pengurus RW.`,
        topic: FCMTopics.rwOfficers(auth.rwId),
      });
    } else {
      await dispatchNotification({
        title: "Proposal Dana Masuk ke Ketua RT",
        body: `Ada pengajuan dana "${title}" sebesar Rp ${Number(amount).toLocaleString("id-ID")}. Menunggu persetujuan Ketua RT.`,
        topic: FCMTopics.rtOfficers(auth.rtId),
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: isChair
          ? "Pengajuan dana berhasil diajukan dan diteruskan ke Pengurus RW untuk peninjauan."
          : "Pengajuan dana berhasil dikirim ke Ketua RT untuk peninjauan tahap 1.",
        data: newRequest,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit fund request" },
      { status: 500 }
    );
  }
}

