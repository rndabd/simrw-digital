import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getStore } from "@/lib/data-store";
import { decryptAES256GCM, maskKK, maskNik } from "@/lib/security";

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

    // 1. Filter Master Residents by scope
    let residents = store.master_residents || [];
    if (!isRwOfficer) {
      residents = residents.filter((r) => r.rt_id === currentUser.rt_id);
    } else if (rwId) {
      residents = residents.filter((r) => r.rw_id === rwId);
    } else {
      residents = residents.filter((r) => r.rw_id === currentUser.rw_id);
    }

    if (rtId) {
      residents = residents.filter((r) => r.rt_id === rtId);
    }

    // Only active or recently mutated
    const activeResidents = residents.filter((r) => r.mutation_status !== "PINDAH_KELUAR" && r.mutation_status !== "MENINGGAL");

    // 2. Group Master Residents by KK Number
    const masterKkMap = new Map<
      string,
      {
        kkNumber: string;
        headOfFamily: string;
        members: any[];
        address: string;
        phone?: string;
        rtNumber: string;
      }
    >();

    for (const res of activeResidents) {
      const rtObj = store.rts.find((r) => r.id === res.rt_id);
      const rtNumber = rtObj ? rtObj.rt_number : "02";

      if (!masterKkMap.has(res.kk_number)) {
        masterKkMap.set(res.kk_number, {
          kkNumber: res.kk_number,
          headOfFamily: res.family_relation === "KEPALA_KELUARGA" ? res.full_name : "",
          members: [res],
          address: res.address_street,
          phone: res.phone_number,
          rtNumber,
        });
      } else {
        const item = masterKkMap.get(res.kk_number)!;
        item.members.push(res);
        if (res.family_relation === "KEPALA_KELUARGA") {
          item.headOfFamily = res.full_name;
        }
        if (!item.phone && res.phone_number) {
          item.phone = res.phone_number;
        }
      }
    }

    // Ensure all KKs have a head of family name
    masterKkMap.forEach((data) => {
      if (!data.headOfFamily && data.members.length > 0) {
        data.headOfFamily = data.members[0].full_name;
      }
    });

    // 3. Map Registered App Users by their decrypted KK Number
    let usersList = store.users || [];
    if (!isRwOfficer) {
      usersList = usersList.filter((u) => u.rt_id === currentUser.rt_id);
    } else if (rwId) {
      usersList = usersList.filter((u) => u.rw_id === rwId);
    } else {
      usersList = usersList.filter((u) => u.rw_id === currentUser.rw_id);
    }

    if (rtId) {
      usersList = usersList.filter((u) => u.rt_id === rtId);
    }

    // Exclude Super Admin from citizen KK reconciliation
    usersList = usersList.filter((u) => u.id !== "user-super-admin");

    const appUsersByKk = new Map<string, any[]>();
    const allUserKks = new Set<string>();

    for (const user of usersList) {
      let userKk = "";
      if (user.household_id) {
        const hh = (store.households || []).find((h) => h.id === user.household_id);
        if (hh?.kk_number_enc) {
          try {
            userKk = decryptAES256GCM(hh.kk_number_enc);
          } catch {}
        }
      }

      if (userKk) {
        allUserKks.add(userKk);
        const userObj = {
          id: user.id,
          fullName: user.full_name,
          phoneNumber: user.phone_number,
          status: user.status,
          registeredAt: user.created_at,
          householdId: user.household_id,
          userKk,
        };

        if (!appUsersByKk.has(userKk)) {
          appUsersByKk.set(userKk, [userObj]);
        } else {
          appUsersByKk.get(userKk)!.push(userObj);
        }
      }
    }

    // 4. Build Category A (Matched KKs) and Category B (Unregistered in App)
    const matchedKks: any[] = [];
    const unregisteredAppKks: any[] = [];

    masterKkMap.forEach((masterData, kk) => {
      const registeredUsers = appUsersByKk.get(kk) || [];

      if (registeredUsers.length > 0) {
        matchedKks.push({
          kkNumber: masterData.kkNumber,
          maskedKk: maskKK(masterData.kkNumber),
          headOfFamily: masterData.headOfFamily,
          totalMembers: masterData.members.length,
          address: masterData.address,
          rtNumber: masterData.rtNumber,
          status: "MATCHED",
          statusLabel: "Terdaftar di Aplikasi",
          registeredUsersCount: registeredUsers.length,
          registeredUsers: registeredUsers.map((u) => ({
            id: u.id,
            name: u.fullName,
            phone: u.phoneNumber,
            status: u.status === "VERIFIED_ACTIVE" ? "Aktif" : "Menunggu Verifikasi",
          })),
          familyMembers: masterData.members.map((m) => ({
            name: m.full_name,
            relation: m.family_relation,
            maskedNik: maskNik(m.nik),
          })),
        });
      } else {
        unregisteredAppKks.push({
          kkNumber: masterData.kkNumber,
          maskedKk: maskKK(masterData.kkNumber),
          headOfFamily: masterData.headOfFamily,
          totalMembers: masterData.members.length,
          address: masterData.address,
          phone: masterData.phone || "-",
          rtNumber: masterData.rtNumber,
          status: "UNREGISTERED_IN_APP",
          statusLabel: "Belum Punya Akun Aplikasi",
          actionNote: "Perlu sosialisasi / jemput bola pembuatan akun SIM-RW",
          familyMembers: masterData.members.map((m) => ({
            name: m.full_name,
            relation: m.family_relation,
            maskedNik: maskNik(m.nik),
          })),
        });
      }
    });

    // 5. Build Category C: Registered in App but NOT in Master Census
    const unregisteredMasterKks: any[] = [];

    for (const user of usersList) {
      let userKk = "";
      if (user.household_id) {
        const hh = (store.households || []).find((h) => h.id === user.household_id);
        if (hh?.kk_number_enc) {
          try {
            userKk = decryptAES256GCM(hh.kk_number_enc);
          } catch {}
        }
      }

      if (userKk && !masterKkMap.has(userKk)) {
        // Find household address if available
        const hh = (store.households || []).find((h) => h.id === user.household_id);
        const address = hh?.address_block || "Alamat Sesuai Akun";
        const rtObj = store.rts.find((r) => r.id === user.rt_id);

        unregisteredMasterKks.push({
          userId: user.id,
          userName: user.full_name,
          userPhone: user.phone_number,
          userStatus: user.status === "VERIFIED_ACTIVE" ? "Aktif" : "Menunggu Verifikasi RT",
          kkNumber: userKk,
          maskedKk: maskKK(userKk),
          address,
          rtNumber: rtObj ? rtObj.rt_number : "02",
          registeredAt: user.created_at,
          status: "NOT_IN_MASTER_CENSUS",
          statusLabel: "Belum Tercatat di Buku Induk RT",
          actionNote: "Warga sudah mendaftar aplikasi tetapi data KK belum dimasukkan oleh pengurus ke sensus RT.",
        });
      }
    }

    const totalMasterKk = masterKkMap.size;
    const totalMatched = matchedKks.length;
    const digitalAdoptionRate = totalMasterKk > 0 ? Math.round((totalMatched / totalMasterKk) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalMasterKk,
          totalMatchedKk: totalMatched,
          totalUnregisteredAppKk: unregisteredAppKks.length,
          totalUnregisteredMasterKk: unregisteredMasterKks.length,
          digitalAdoptionRate,
        },
        matchedKks,
        unregisteredAppKks,
        unregisteredMasterKks,
      },
    });
  } catch (error: any) {
    console.error("Error in reconciliation engine:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memproses rekonsiliasi data kependudukan." },
      { status: 500 }
    );
  }
}
