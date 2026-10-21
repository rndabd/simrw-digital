import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";
import { maskNik, maskKK } from "@/lib/security";

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
        { success: false, message: "Hanya pengurus RT/RW yang dapat mencatat mutasi penduduk." },
        { status: 403 }
      );
    }

    const store = getStore();
    const resident = (store.master_residents || []).find((r) => r.id === params.id);
    if (!resident) {
      return NextResponse.json(
        { success: false, message: "Data penduduk tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { mutation_status, mutation_date, mutation_note } = body;

    if (!mutation_status || !["AKTIF", "PINDAH_KELUAR", "PINDAH_MASUK", "MENINGGAL", "LAHIR"].includes(mutation_status)) {
      return NextResponse.json(
        { success: false, message: "Status mutasi tidak valid. Pilihan: AKTIF, PINDAH_KELUAR, PINDAH_MASUK, MENINGGAL, LAHIR." },
        { status: 400 }
      );
    }

    resident.mutation_status = mutation_status;
    resident.mutation_date = mutation_date || new Date().toISOString().split("T")[0];
    resident.mutation_note = mutation_note ? mutation_note.trim() : undefined;
    resident.updated_at = new Date().toISOString();

    saveStore(store);

    const mutationLabels: Record<string, string> = {
      AKTIF: "Warga Aktif Kembali",
      PINDAH_KELUAR: "Pindah Keluar Domisili",
      PINDAH_MASUK: "Pindah Masuk Domisili",
      MENINGGAL: "Meninggal Dunia",
      LAHIR: "Kelahiran Baru",
    };

    await recordAuditLog({
      userId: auth.userId,
      action: "RECORD_RESIDENT_MUTATION",
      resource: "MASTER_RESIDENT",
      payload: {
        residentName: resident.full_name,
        maskedNik: maskNik(resident.nik),
        mutationType: mutationLabels[mutation_status] || mutation_status,
        notes: resident.mutation_note || `Tanggal mutasi: ${resident.mutation_date}`,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      message: `Status mutasi ${resident.full_name} berhasil dicatat sebagai "${mutationLabels[mutation_status]}".`,
      data: resident,
    });
  } catch (error: any) {
    console.error("Error recording mutation:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mencatat mutasi penduduk." },
      { status: 500 }
    );
  }
}

