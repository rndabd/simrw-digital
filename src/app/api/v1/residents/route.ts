import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";
import { maskNik, maskKK, validateNikFormat } from "@/lib/security";
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
    const q = searchParams.get("q")?.toLowerCase();
    const rtId = searchParams.get("rt_id");
    const rwId = searchParams.get("rw_id");
    const mutationStatus = searchParams.get("mutation_status");
    const residenceStatus = searchParams.get("residence_status");
    const kk = searchParams.get("kk");

    const store = getStore();
    const currentUser = store.users.find((u) => u.id === auth.userId);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    const isRwOfficer = auth.roles.some((r) => r.startsWith("RW_") || r === "SUPER_ADMIN");
    const isOfficer = auth.roles.some((r) => r.startsWith("RT_") || r.startsWith("RW_") || r === "SUPER_ADMIN");

    let list = store.master_residents || [];

    // Jurisdiction boundary
    if (!isRwOfficer) {
      list = list.filter((r) => r.rt_id === currentUser.rt_id);
    } else if (rwId) {
      list = list.filter((r) => r.rw_id === rwId);
    } else {
      list = list.filter((r) => r.rw_id === currentUser.rw_id);
    }

    if (rtId) {
      list = list.filter((r) => r.rt_id === rtId);
    }

    if (mutationStatus) {
      list = list.filter((r) => r.mutation_status === mutationStatus);
    }

    if (residenceStatus) {
      list = list.filter((r) => r.residence_status === residenceStatus);
    }

    if (kk) {
      list = list.filter((r) => r.kk_number === kk);
    }

    if (q) {
      list = list.filter(
        (r) =>
          r.full_name.toLowerCase().includes(q) ||
          r.nik.includes(q) ||
          r.kk_number.includes(q) ||
          r.address_street.toLowerCase().includes(q) ||
          (r.occupation && r.occupation.toLowerCase().includes(q))
      );
    }

    // Sort by KK, then family relation (Kepala Keluarga first)
    const relationOrder: Record<string, number> = {
      KEPALA_KELUARGA: 1,
      ISTRI: 2,
      ANAK: 3,
      ORANG_TUA: 4,
      FAMILI_LAIN: 5,
    };

    list.sort((a, b) => {
      if (a.kk_number !== b.kk_number) return a.kk_number.localeCompare(b.kk_number);
      return (relationOrder[a.family_relation] || 99) - (relationOrder[b.family_relation] || 99);
    });

    // Mask PII if not high-privilege
    const sanitized = list.map((r) => ({
      ...r,
      maskedNik: maskNik(r.nik),
      maskedKk: maskKK(r.kk_number),
    }));

    return NextResponse.json({
      success: true,
      data: sanitized,
      total: sanitized.length,
    });
  } catch (error: any) {
    console.error("Error fetching master residents:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data penduduk." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
        { success: false, message: "Akses ditolak. Hanya kepengurusan RT/RW yang berwenang menginput data penduduk." },
        { status: 403 }
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
    const {
      kk_number,
      nik,
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
      rt_id,
      rw_id,
      mutation_status,
      mutation_date,
      mutation_note,
    } = body;

    if (!kk_number || !nik || !full_name || !gender || !family_relation) {
      return NextResponse.json(
        { success: false, message: "Nomor KK, NIK, nama lengkap, jenis kelamin, dan hubungan keluarga wajib diisi." },
        { status: 400 }
      );
    }

    const cleanNik = String(nik).trim();
    const cleanKk = String(kk_number).trim();

    if (!/^\d{16}$/.test(cleanNik)) {
      return NextResponse.json(
        { success: false, message: "Format NIK tidak valid. Harus tepat 16 digit angka numerik." },
        { status: 400 }
      );
    }

    if (!/^\d{16}$/.test(cleanKk)) {
      return NextResponse.json(
        { success: false, message: "Format No. KK tidak valid. Harus tepat 16 digit angka numerik." },
        { status: 400 }
      );
    }

    // Check duplicate NIK in master_residents
    const existing = (store.master_residents || []).find((r) => r.nik === cleanNik);
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: `NIK ${maskNik(cleanNik)} sudah terdaftar atas nama ${existing.full_name} di RT ini.`,
        },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const targetRtId = rt_id || currentUser.rt_id;
    const targetRwId = rw_id || currentUser.rw_id;

    const newResident = {
      id: `res-${crypto.randomUUID()}`,
      rw_id: targetRwId,
      rt_id: targetRtId,
      kk_number: cleanKk,
      nik: cleanNik,
      full_name: full_name.trim(),
      gender: gender as "LAKI_LAKI" | "PEREMPUAN",
      birth_place: birth_place ? birth_place.trim() : undefined,
      birth_date: birth_date || "1990-01-01",
      religion: religion || "ISLAM",
      occupation: occupation ? occupation.trim() : "Lainnya",
      family_relation: family_relation as any,
      residence_status: (residence_status || "TETAP") as any,
      mutation_status: (mutation_status || "AKTIF") as any,
      mutation_date: mutation_date || undefined,
      mutation_note: mutation_note || undefined,
      address_street: address_street ? address_street.trim() : "Lingkungan RT Setempat",
      phone_number: phone_number ? phone_number.trim() : undefined,
      input_by: currentUser.id,
      created_at: now,
      updated_at: now,
    };

    if (!store.master_residents) store.master_residents = [];
    store.master_residents.push(newResident);
    saveStore(store);

    await recordAuditLog({
      userId: currentUser.id,
      action: "ADD_MASTER_RESIDENT",
      resource: "MASTER_RESIDENT",
      payload: {
        residentName: newResident.full_name,
        maskedNik: maskNik(cleanNik),
        maskedKk: maskKK(cleanKk),
        familyRelation: newResident.family_relation,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      message: `Data penduduk atas nama ${newResident.full_name} berhasil disimpan dalam Buku Induk RT.`,
      data: {
        ...newResident,
        maskedNik: maskNik(cleanNik),
        maskedKk: maskKK(cleanKk),
      },
    });
  } catch (error: any) {
    console.error("Error adding resident:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menambahkan data penduduk." },
      { status: 500 }
    );
  }
}
