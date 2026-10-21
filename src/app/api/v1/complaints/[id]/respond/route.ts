import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Silakan masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    const isOfficer = auth.roles.some((r) => r.startsWith("RT_") || r.startsWith("RW_") || r === "SUPER_ADMIN");
    if (!isOfficer) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Hanya pengurus RT/RW yang dapat menanggapi pengaduan." },
        { status: 403 }
      );
    }

    const store = getStore();
    const complaint = (store.complaints || []).find((c) => c.id === params.id);
    if (!complaint) {
      return NextResponse.json(
        { success: false, message: "Pengaduan tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { status, officer_response } = body;

    if (!status || !["DIPROSES", "SELESAI", "DITOLAK"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Status tidak valid. Pilihan: DIPROSES, SELESAI, atau DITOLAK." },
        { status: 400 }
      );
    }

    const currentUser = store.users.find((u) => u.id === auth.userId);
    complaint.status = status;
    if (officer_response) {
      complaint.officer_response = officer_response.trim();
    }
    complaint.updated_at = new Date().toISOString();

    if (status === "SELESAI") {
      complaint.resolved_at = new Date().toISOString();
      complaint.resolved_by = auth.userId;
    }

    saveStore(store);

    await recordAuditLog({
      userId: auth.userId,
      action: "RESPOND_COMPLAINT",
      resource: "COMPLAINT",
      payload: {
        ticketNumber: complaint.ticket_number,
        title: complaint.title,
        status,
        statusNote: officer_response || `Status diubah menjadi ${status}`,
        responderName: currentUser?.full_name || "Pengurus RT",
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    const statusLabels: Record<string, string> = {
      DIPROSES: "Sedang Ditangani",
      SELESAI: "Selesai Dituntaskan",
      DITOLAK: "Ditolak / Diarsipkan",
    };

    return NextResponse.json({
      success: true,
      message: `Status tiket ${complaint.ticket_number} berhasil diperbarui menjadi ${statusLabels[status] || status}.`,
      data: complaint,
    });
  } catch (error: any) {
    console.error("Error responding to complaint:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memperbarui pengaduan." },
      { status: 500 }
    );
  }
}

