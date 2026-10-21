import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Silakan masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "all";
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    const store = getStore();
    const currentUser = store.users.find((u) => u.id === auth.userId);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    const isOfficer = auth.roles.some((r) => r.startsWith("RT_") || r.startsWith("RW_") || r === "SUPER_ADMIN");
    const isRwOfficer = auth.roles.some((r) => r.startsWith("RW_") || r === "SUPER_ADMIN");

    let results = store.complaints || [];

    // If citizen requests only their own complaints
    if (scope === "my" || !isOfficer) {
      results = results.filter((c) => c.user_id === currentUser.id);
    } else {
      // Officers filter by their jurisdiction
      if (!isRwOfficer) {
        results = results.filter((c) => c.rt_id === currentUser.rt_id);
      } else {
        results = results.filter((c) => c.rw_id === currentUser.rw_id);
      }
    }

    if (status) {
      results = results.filter((c) => c.status === status);
    }

    if (category) {
      results = results.filter((c) => c.category === category);
    }

    // Sort by created_at DESC
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      success: true,
      data: results,
      total: results.length,
    });
  } catch (error: any) {
    console.error("Error fetching complaints:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat daftar pengaduan." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const store = getStore();
    const currentUser = store.users.find((u) => u.id === auth.userId);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { title, description, category, location, location_notes, priority, photo_url } = body;
    const finalLocation = location || location_notes;

    if (!title || !description || !category || !finalLocation) {
      return NextResponse.json(
        { success: false, message: "Judul, kategori, lokasi, dan uraian pengaduan wajib diisi." },
        { status: 400 }
      );
    }

    // Generate ticket number: ADU-YYYYMM-XXX
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const countToday = (store.complaints || []).length + 1;
    const ticket_number = `ADU-${dateStr}-${String(countToday).padStart(3, "0")}`;

    const newComplaint = {
      id: `comp-${crypto.randomUUID()}`,
      ticket_number,
      rw_id: currentUser.rw_id,
      rt_id: currentUser.rt_id,
      user_id: currentUser.id,
      author_name: currentUser.full_name,
      author_phone: currentUser.phone_number,
      category: category || "LAINNYA",
      title: title.trim(),
      description: description.trim(),
      location: finalLocation.trim(),
      photo_url: photo_url || undefined,
      priority: priority || "NORMAL",
      status: "MENUNGGU" as const,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    if (!store.complaints) store.complaints = [];
    store.complaints.unshift(newComplaint);
    saveStore(store);

    await recordAuditLog({
      userId: currentUser.id,
      action: "SUBMIT_COMPLAINT",
      resource: "COMPLAINT",
      payload: {
        ticketNumber: ticket_number,
        title: newComplaint.title,
        category: newComplaint.category,
        location: newComplaint.location,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      message: `Pengaduan berhasil disampaikan dengan nomor tiket resmi: ${ticket_number}. Segera ditinjau oleh pengurus lingkungan RT.`,
      data: newComplaint,
    });
  } catch (error: any) {
    console.error("Error creating complaint:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menyampaikan pengaduan." },
      { status: 500 }
    );
  }
}
