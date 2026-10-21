import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";
import { maskNik, maskKK } from "@/lib/security";

export async function PUT(
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
        { success: false, message: "Hanya pengurus RT/RW yang dapat memperbarui data penduduk." },
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
    const {
      full_name,
      gender,
      birth_date,
      birth_place,
      religion,
      occupation,
      family_relation,
      residence_status,
      address_street,
      phone_number,
      kk_number,
    } = body;

    if (full_name) resident.full_name = full_name.trim();
    if (gender) resident.gender = gender;
    if (birth_date) resident.birth_date = birth_date;
    if (birth_place !== undefined) resident.birth_place = birth_place.trim();
    if (religion) resident.religion = religion;
    if (occupation !== undefined) resident.occupation = occupation.trim();
    if (family_relation) resident.family_relation = family_relation;
    if (residence_status) resident.residence_status = residence_status;
    if (address_street) resident.address_street = address_street.trim();
    if (phone_number !== undefined) resident.phone_number = phone_number.trim();
    if (kk_number && /^\d{16}$/.test(kk_number.trim())) resident.kk_number = kk_number.trim();

    resident.updated_at = new Date().toISOString();
    saveStore(store);

    await recordAuditLog({
      userId: auth.userId,
      action: "UPDATE_MASTER_RESIDENT",
      resource: "MASTER_RESIDENT",
      payload: {
        residentName: resident.full_name,
        maskedNik: maskNik(resident.nik),
        maskedKk: maskKK(resident.kk_number),
        familyRelation: resident.family_relation,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      message: `Pembaruan data penduduk atas nama ${resident.full_name} berhasil disimpan.`,
      data: {
        ...resident,
        maskedNik: maskNik(resident.nik),
        maskedKk: maskKK(resident.kk_number),
      },
    });
  } catch (error: any) {
    console.error("Error updating resident:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memperbarui data penduduk." },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
        { success: false, message: "Hanya pengurus RT/RW yang dapat menghapus data penduduk." },
        { status: 403 }
      );
    }

    const store = getStore();
    const index = (store.master_residents || []).findIndex((r) => r.id === params.id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Data penduduk tidak ditemukan." },
        { status: 404 }
      );
    }

    const deleted = store.master_residents[index];
    store.master_residents.splice(index, 1);
    saveStore(store);

    await recordAuditLog({
      userId: auth.userId,
      action: "DELETE_MASTER_RESIDENT",
      resource: "MASTER_RESIDENT",
      payload: {
        residentName: deleted.full_name,
        maskedNik: maskNik(deleted.nik),
        maskedKk: maskKK(deleted.kk_number),
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      message: `Data penduduk atas nama ${deleted.full_name} berhasil dihapus dari Buku Induk RT.`,
    });
  } catch (error: any) {
    console.error("Error deleting resident:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menghapus data penduduk." },
      { status: 500 }
    );
  }
}

