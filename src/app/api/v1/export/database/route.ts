import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";
import { decryptAES256GCM } from "@/lib/security";
import { formatRoleName } from "@/lib/formatters";

export const dynamic = "force-dynamic";

function escapeCsv(val: any, asFormulaText = false): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/\r\n|\r|\n/g, " ").trim();
  if (!str) return '""';
  if (asFormulaText) {
    // Treat as exact text in Excel, keeping 16-digit NIK/KK without scientific truncation
    return `="` + str.replace(/"/g, '""') + `"`;
  }
  return `"` + str.replace(/"/g, '""') + `"`;
}

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Silakan masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    const store = getStore();
    const currentUser = store.users.find((u) => u.id === auth.userId);

    const isSuperAdmin = auth.roles.includes("SUPER_ADMIN");
    const isRwOfficer = auth.roles.some((r) => r.startsWith("RW_"));
    const isRtOfficer = auth.roles.some((r) => r.startsWith("RT_"));

    if (!isSuperAdmin && !isRwOfficer && !isRtOfficer) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses ditolak. Hanya Pengurus RT/RW dan Super Administrator yang berhak mengekspor database warga dan kepengurusan.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const exportType = (searchParams.get("type") || "all").toLowerCase(); // "all" | "warga" | "pengurus"
    const exportFormat = (searchParams.get("format") || "csv").toLowerCase(); // "csv" | "json"
    const reqRwId = searchParams.get("rw_id");
    const reqRtId = searchParams.get("rt_id");

    // Determine jurisdiction boundary
    let targetRwId: string | null = null;
    let targetRtId: string | null = null;

    if (isSuperAdmin) {
      targetRwId = reqRwId || null;
      targetRtId = reqRtId || null;
    } else if (isRwOfficer) {
      targetRwId = currentUser?.rw_id || auth.rwId || null;
      targetRtId = reqRtId || null;
    } else {
      // RT Officer strictly limited to their RT
      targetRwId = currentUser?.rw_id || auth.rwId || null;
      targetRtId = currentUser?.rt_id || auth.rtId || null;
    }

    // Lookup caches
    const rwMap = new Map<string, any>();
    (store.rws || []).forEach((rw) => rwMap.set(rw.id, rw));

    const rtMap = new Map<string, any>();
    (store.rts || []).forEach((rt) => rtMap.set(rt.id, rt));

    const roleMap = new Map<string, any>();
    (store.roles || []).forEach((role) => roleMap.set(role.id, role));

    // 1. FILTER & COMPILE RESIDENTS (DATA WARGA)
    let masterResidents = store.master_residents || [];
    if (targetRwId) {
      masterResidents = masterResidents.filter((r) => r.rw_id === targetRwId);
    }
    if (targetRtId) {
      masterResidents = masterResidents.filter((r) => r.rt_id === targetRtId);
    }

    // Map app users to check registered status
    const appUsersByNik = new Map<string, any>();
    const appUsersByPhone = new Map<string, any>();
    (store.users || []).forEach((u) => {
      if (u.phone_number) appUsersByPhone.set(u.phone_number, u);
      if (u.nik_encrypted) {
        try {
          const dec = decryptAES256GCM(u.nik_encrypted);
          if (dec) appUsersByNik.set(dec, u);
        } catch {
          // ignore
        }
      }
    });

    // Relation order for sorting
    const relationOrder: Record<string, number> = {
      KEPALA_KELUARGA: 1,
      ISTRI: 2,
      ANAK: 3,
      ORANG_TUA: 4,
      FAMILI_LAIN: 5,
    };

    const formattedWarga = masterResidents
      .slice()
      .sort((a, b) => {
        if (a.kk_number !== b.kk_number) return a.kk_number.localeCompare(b.kk_number);
        const orderA = relationOrder[a.family_relation] || 99;
        const orderB = relationOrder[b.family_relation] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.full_name.localeCompare(b.full_name);
      })
      .map((r, index) => {
        const rwObj = rwMap.get(r.rw_id);
        const rtObj = rtMap.get(r.rt_id);
        const matchedUser = appUsersByNik.get(r.nik) || (r.phone_number ? appUsersByPhone.get(r.phone_number) : null);

        let appStatus = "Belum Terdaftar";
        if (matchedUser) {
          if (matchedUser.status === "VERIFIED_ACTIVE") appStatus = "Akun Aktif Terverifikasi";
          else if (matchedUser.status === "PENDING_VERIFICATION") appStatus = "Menunggu Verifikasi";
          else if (matchedUser.status === "UNVERIFIED") appStatus = "Belum Verifikasi Nomor/Email";
          else appStatus = matchedUser.status;
        }

        const genderLabel = r.gender === "LAKI_LAKI" ? "Laki-laki" : "Perempuan";
        const relationLabel = (r.family_relation || "").replace(/_/g, " ");

        return {
          no: index + 1,
          id: r.id,
          kk_number: r.kk_number,
          nik: r.nik,
          full_name: r.full_name,
          gender: genderLabel,
          family_relation: relationLabel,
          birth_place: r.birth_place || "-",
          birth_date: r.birth_date || "-",
          religion: r.religion || "-",
          occupation: r.occupation || "-",
          residence_status: r.residence_status || "TETAP",
          mutation_status: r.mutation_status || "AKTIF",
          mutation_date: r.mutation_date || "-",
          mutation_note: r.mutation_note || "-",
          address_street: r.address_street || "-",
          rt_number: rtObj ? `RT ${rtObj.rt_number}` : "-",
          rw_number: rwObj ? `RW ${rwObj.rw_number}` : "-",
          village: rwObj?.village || "Ciheulang",
          district: rwObj?.district || "Ciparay",
          phone_number: r.phone_number || matchedUser?.phone_number || "-",
          app_status: appStatus,
          created_at: r.created_at || "-",
        };
      });

    // 2. FILTER & COMPILE OFFICERS (DATA PENGURUS)
    const officerUsers: any[] = [];
    const allUsers = store.users || [];
    const userRoles = store.user_roles || [];
    const officerRequests = store.officer_requests || [];

    // Priority rank for sorting officers in report
    const roleRank: Record<string, number> = {
      SUPER_ADMIN: 1,
      RW_CHAIR: 2,
      RW_VICE_CHAIR: 3,
      RW_SECRETARY: 4,
      RW_TREASURER: 5,
      RW_SECURITY: 6,
      RW_DEVELOPMENT: 7,
      RW_DEVELOPMENT_INFRA: 7,
      RW_SOCIAL: 8,
      RW_SOCIAL_HEALTH: 8,
      RW_ENVIRONMENT: 9,
      RW_YOUTH: 10,
      RW_YOUTH_SPORTS: 10,
      RW_RELATIONS: 11,
      RW_GOVERNMENT_RELATION: 11,
      RW_STAFF: 12,
      RT_CHAIR: 20,
      RT_VICE_CHAIR: 21,
      RT_SECRETARY: 22,
      RT_TREASURER: 23,
      RT_SECURITY: 24,
      RT_DEVELOPMENT: 25,
      RT_SOCIAL: 26,
      RT_YOUTH: 27,
      RT_STAFF: 28,
    };

    allUsers.forEach((u) => {
      // Find roles for this user
      const assignedRoleIds = userRoles.filter((ur) => ur.user_id === u.id).map((ur) => ur.role_id);
      const userRoleObjs = assignedRoleIds.map((id) => roleMap.get(id)).filter(Boolean);
      const userRoleNames = userRoleObjs.map((r) => r.name);

      // Check if user has an officer role
      const isOfficerUser = userRoleNames.some(
        (r) => r.startsWith("RW_") || r.startsWith("RT_") || r === "SUPER_ADMIN"
      );

      if (!isOfficerUser) return;

      // Filter by target jurisdiction
      if (targetRwId && u.rw_id !== targetRwId && !userRoleNames.includes("SUPER_ADMIN")) {
        return;
      }
      if (targetRtId && u.rt_id !== targetRtId && !userRoleNames.some((r) => r.startsWith("RW_") || r === "SUPER_ADMIN")) {
        return;
      }

      // Determine main officer role
      const officerRoles = userRoleNames.filter(
        (r) => r.startsWith("RW_") || r.startsWith("RT_") || r === "SUPER_ADMIN"
      );
      officerRoles.sort((a, b) => (roleRank[a] || 99) - (roleRank[b] || 99));
      const mainRoleKey = officerRoles[0] || "OFFICER";

      const rwObj = rwMap.get(u.rw_id);
      const rtObj = rtMap.get(u.rt_id);

      let decryptedNik = "-";
      if (u.nik_encrypted) {
        try {
          decryptedNik = decryptAES256GCM(u.nik_encrypted);
        } catch {
          decryptedNik = "-";
        }
      }

      // Tingkat
      let tingkat = "RW";
      if (mainRoleKey === "SUPER_ADMIN") tingkat = "KELURAHAN";
      else if (mainRoleKey.startsWith("RT_")) tingkat = "RT";

      // Jabatan formatted
      let jabatanText = formatRoleName(mainRoleKey);
      if (mainRoleKey === "RW_CHAIR" && rwObj) jabatanText = `Ketua RW ${rwObj.rw_number}`;
      else if (mainRoleKey === "RW_VICE_CHAIR" && rwObj) jabatanText = `Wakil Ketua RW ${rwObj.rw_number}`;
      else if (mainRoleKey === "RW_SECRETARY" && rwObj) jabatanText = `Sekretaris RW ${rwObj.rw_number}`;
      else if (mainRoleKey === "RW_TREASURER" && rwObj) jabatanText = `Bendahara RW ${rwObj.rw_number}`;
      else if (mainRoleKey === "RT_CHAIR" && rtObj) jabatanText = `Ketua RT ${rtObj.rt_number}`;
      else if (mainRoleKey === "RT_VICE_CHAIR" && rtObj) jabatanText = `Wakil Ketua RT ${rtObj.rt_number}`;
      else if (mainRoleKey === "RT_SECRETARY" && rtObj) jabatanText = `Sekretaris RT ${rtObj.rt_number}`;
      else if (mainRoleKey === "RT_TREASURER" && rtObj) jabatanText = `Bendahara RT ${rtObj.rt_number}`;

      // Masa bakti
      const masaBakti = rwObj?.term_period || rtObj?.term_period || "2021-2026";

      // Status SK / Legalitas
      const approvedReq = officerRequests.find(
        (or) => or.user_id === u.id && or.status === "APPROVED"
      );
      const skStatus = approvedReq ? "SK Disahkan & Legal" : "Pejabat Terdaftar Resmi";

      officerUsers.push({
        id: u.id,
        user_id: u.id,
        full_name: u.full_name,
        nik: decryptedNik,
        role_key: mainRoleKey,
        role_rank: roleRank[mainRoleKey] || 99,
        jabatan: jabatanText,
        tingkat,
        rt_number: rtObj ? `RT ${rtObj.rt_number}` : "-",
        rw_number: rwObj ? `RW ${rwObj.rw_number}` : "-",
        term_period: masaBakti,
        phone_number: u.phone_number || "-",
        email: u.email || "-",
        address: u.address_block || "-",
        sk_status: skStatus,
        account_status: u.status === "VERIFIED_ACTIVE" ? "Aktif Bertugas" : u.status,
        created_at: u.created_at || "-",
      });
    });

    officerUsers.sort((a, b) => a.role_rank - b.role_rank || a.full_name.localeCompare(b.full_name));

    const formattedPengurus = officerUsers.map((o, idx) => ({
      no: idx + 1,
      ...o,
    }));

    // Record audit log
    await recordAuditLog({
      userId: auth.userId,
      action: "EXPORT_DATABASE",
      resource: "DATABASE_WARGA_DAN_PENGURUS",
      payload: {
        exportType,
        exportFormat,
        targetRwId,
        targetRtId,
        totalWarga: formattedWarga.length,
        totalPengurus: formattedPengurus.length,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    // 3. RETURN JSON IF REQUESTED
    if (exportFormat === "json") {
      return NextResponse.json({
        success: true,
        metadata: {
          generatedAt: new Date().toISOString(),
          exportedBy: {
            userId: auth.userId,
            fullName: auth.fullName,
            roles: auth.roles,
          },
          jurisdiction: {
            rwId: targetRwId,
            rtId: targetRtId,
          },
          totalResidents: formattedWarga.length,
          totalOfficers: formattedPengurus.length,
        },
        data: {
          officers: exportType === "warga" ? [] : formattedPengurus,
          residents: exportType === "pengurus" ? [] : formattedWarga,
        },
      });
    }

    // 4. GENERATE CLEAN RFC-4180 COMPATIBLE CSV WITH UTF-8 BOM
    const lines: string[] = [];
    const dateStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const timeStr = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Territory description
    let wilayahText = "Seluruh Wilayah Kelurahan Sukamaju";
    if (targetRwId) {
      const rwObj = rwMap.get(targetRwId);
      const rwNumber = rwObj ? `RW ${rwObj.rw_number}` : "";
      if (targetRtId) {
        const rtObj = rtMap.get(targetRtId);
        const rtNumber = rtObj ? `RT ${rtObj.rt_number}` : "";
        wilayahText = `${rtNumber} / ${rwNumber} Komplek Giri Ciheulang, Ciparay`;
      } else {
        wilayahText = `${rwNumber} Komplek Giri Ciheulang, Ciparay`;
      }
    }

    // Header metadata lines
    lines.push(`"MASTER DATABASE SISTEM INFORMASI MANAJEMEN RUKUN WARGA (SIM-RW DIGITAL)"`);
    lines.push(`"Wilayah:","${wilayahText.replace(/"/g, '""')}"`);
    lines.push(`"Tanggal Unduh:","${dateStr} Pukul ${timeStr} WIB"`);
    lines.push(`"Diunduh Oleh:","${(auth.fullName || "Pengurus Resmi").replace(/"/g, '""')} (${formatRoleName(auth.roles[0])})"`);
    lines.push(`"Kepatuhan Hukum:","Kerahasiaan Data Kependudukan Sesuai UU PDP No. 27 Tahun 2022"`);
    lines.push("");

    // SECTION A: DATA PENGURUS
    if (exportType === "all" || exportType === "pengurus") {
      lines.push(`"========================================================================================="`);
      lines.push(`"BAGIAN 1: STRUKTUR RESMI KEPENGURUSAN LINGKUNGAN (RW & RT)"`);
      lines.push(`"Total Pengurus Terdaftar:","${formattedPengurus.length} Pejabat"`);
      lines.push(`"========================================================================================="`);

      const officerHeaders = [
        "No",
        "Nama Lengkap Pejabat",
        "NIK",
        "Jabatan / Amanah",
        "Tingkat",
        "Unit RT",
        "Wilayah RW",
        "Masa Bakti",
        "Nomor WhatsApp / HP",
        "Email",
        "Alamat Domisili",
        "Status Legalitas SK",
        "Status Akun SIM-RW",
        "Tanggal Terdaftar",
      ];
      lines.push(officerHeaders.map((h) => escapeCsv(h)).join(","));

      if (formattedPengurus.length === 0) {
        lines.push(`"Belum ada pejabat/pengurus terdaftar pada unit wilayah ini."`);
      } else {
        formattedPengurus.forEach((o) => {
          const row = [
            escapeCsv(o.no),
            escapeCsv(o.full_name),
            escapeCsv(o.nik, true), // Formula text for 16-digit NIK
            escapeCsv(o.jabatan),
            escapeCsv(o.tingkat),
            escapeCsv(o.rt_number),
            escapeCsv(o.rw_number),
            escapeCsv(o.term_period),
            escapeCsv(o.phone_number, true), // Formula text for phone
            escapeCsv(o.email),
            escapeCsv(o.address),
            escapeCsv(o.sk_status),
            escapeCsv(o.account_status),
            escapeCsv(o.created_at ? o.created_at.split("T")[0] : "-"),
          ];
          lines.push(row.join(","));
        });
      }

      lines.push("");
      lines.push("");
    }

    // SECTION B: DATA WARGA (SENSUS & BUKU INDUK)
    if (exportType === "all" || exportType === "warga") {
      lines.push(`"========================================================================================="`);
      lines.push(`"BAGIAN 2: BUKU INDUK & SENSUS KEPENDUDUKAN SELURUH WARGA"`);
      lines.push(`"Total Jiwa / Warga Terdata:","${formattedWarga.length} Jiwa"`);
      lines.push(`"========================================================================================="`);

      const residentHeaders = [
        "No",
        "Nomor Kartu Keluarga (KK)",
        "Nomor Induk Kependudukan (NIK)",
        "Nama Lengkap Warga",
        "Jenis Kelamin",
        "Hubungan Keluarga",
        "Tempat Lahir",
        "Tanggal Lahir",
        "Agama",
        "Pekerjaan",
        "Status Domisili",
        "Status Mutasi",
        "Tanggal Mutasi",
        "Keterangan Mutasi",
        "Alamat / Blok Rumah",
        "Unit RT",
        "Wilayah RW",
        "Desa / Kelurahan",
        "Kecamatan",
        "Nomor WhatsApp / HP",
        "Status Akun SIM-RW",
        "Tanggal Input Data",
      ];
      lines.push(residentHeaders.map((h) => escapeCsv(h)).join(","));

      if (formattedWarga.length === 0) {
        lines.push(`"Belum ada data warga/jiwa yang diinput pada sensus kependudukan unit ini."`);
      } else {
        formattedWarga.forEach((w) => {
          const row = [
            escapeCsv(w.no),
            escapeCsv(w.kk_number, true), // KK 16-digit text
            escapeCsv(w.nik, true), // NIK 16-digit text
            escapeCsv(w.full_name),
            escapeCsv(w.gender),
            escapeCsv(w.family_relation),
            escapeCsv(w.birth_place),
            escapeCsv(w.birth_date),
            escapeCsv(w.religion),
            escapeCsv(w.occupation),
            escapeCsv(w.residence_status),
            escapeCsv(w.mutation_status),
            escapeCsv(w.mutation_date),
            escapeCsv(w.mutation_note),
            escapeCsv(w.address_street),
            escapeCsv(w.rt_number),
            escapeCsv(w.rw_number),
            escapeCsv(w.village),
            escapeCsv(w.district),
            escapeCsv(w.phone_number, true),
            escapeCsv(w.app_status),
            escapeCsv(w.created_at ? w.created_at.split("T")[0] : "-"),
          ];
          lines.push(row.join(","));
        });
      }
    }

    // Prepend UTF-8 BOM (\uFEFF)
    const csvContent = "\uFEFF" + lines.join("\r\n");

    const dateFile = new Date().toISOString().split("T")[0];
    const filename = `Database_SIM-RW_${exportType.toUpperCase()}_${dateFile}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    console.error("Export database error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan internal saat mengekspor database: " + (error?.message || error),
      },
      { status: 500 }
    );
  }
}

