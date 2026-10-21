import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getStore } from "@/lib/data-store";

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
    const rtId = searchParams.get("rt_id");
    const rwId = searchParams.get("rw_id");

    const store = getStore();
    const currentUser = store.users.find((u) => u.id === auth.userId);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    const isRwOfficer = auth.roles.some((r) => r.startsWith("RW_") || r === "SUPER_ADMIN");

    let list = store.master_residents || [];

    // Jurisdiction filtering
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

    const now = new Date();
    const currentYear = now.getFullYear();

    // Active residents
    const activeResidents = list.filter((r) => r.mutation_status === "AKTIF" || !r.mutation_status);
    const totalJiwa = activeResidents.length;

    // Unique KKs
    const uniqueKks = Array.from(new Set(activeResidents.map((r) => r.kk_number)));
    const totalKk = uniqueKks.length;

    // Gender breakdown
    const maleCount = activeResidents.filter((r) => r.gender === "LAKI_LAKI").length;
    const femaleCount = activeResidents.filter((r) => r.gender === "PEREMPUAN").length;

    // Age groups calculation helper
    const ageGroups = {
      balita: 0, // 0 - 5
      anak: 0, // 6 - 17
      produktif: 0, // 18 - 59
      lansia: 0, // 60+
    };

    activeResidents.forEach((r) => {
      let age = 30; // default fallback
      if (r.birth_date) {
        const birthYear = parseInt(r.birth_date.split("-")[0], 10);
        if (!isNaN(birthYear)) {
          age = currentYear - birthYear;
        }
      }
      if (age <= 5) ageGroups.balita++;
      else if (age <= 17) ageGroups.anak++;
      else if (age <= 59) ageGroups.produktif++;
      else ageGroups.lansia++;
    });

    // Residence status
    const residenceStats = {
      tetap: activeResidents.filter((r) => r.residence_status === "TETAP").length,
      kontrak: activeResidents.filter((r) => r.residence_status === "KONTRAK").length,
      kost: activeResidents.filter((r) => r.residence_status === "KOST").length,
    };

    // Mutation counts
    const mutations = {
      pindahKeluar: list.filter((r) => r.mutation_status === "PINDAH_KELUAR").length,
      pindahMasuk: list.filter((r) => r.mutation_status === "PINDAH_MASUK").length,
      meninggal: list.filter((r) => r.mutation_status === "MENINGGAL").length,
      lahir: list.filter((r) => r.mutation_status === "LAHIR").length,
    };

    // Recent mutation events
    const recentMutations = list
      .filter((r) => r.mutation_status && r.mutation_status !== "AKTIF")
      .map((r) => ({
        id: r.id,
        fullName: r.full_name,
        gender: r.gender,
        mutationStatus: r.mutation_status,
        mutationDate: r.mutation_date || r.updated_at.split("T")[0],
        mutationNote: r.mutation_note || "Pencatatan mutasi kependudukan",
        address: r.address_street,
      }))
      .sort((a, b) => new Date(b.mutationDate).getTime() - new Date(a.mutationDate).getTime())
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        totalKk,
        totalJiwa,
        maleCount,
        femaleCount,
        malePercent: totalJiwa > 0 ? Math.round((maleCount / totalJiwa) * 100) : 0,
        femalePercent: totalJiwa > 0 ? Math.round((femaleCount / totalJiwa) * 100) : 0,
        ageGroups,
        residenceStats,
        mutations,
        recentMutations,
      },
    });
  } catch (error: any) {
    console.error("Error computing population statistics:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat statistik penduduk." },
      { status: 500 }
    );
  }
}
