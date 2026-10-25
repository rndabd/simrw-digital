import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data-store";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface OfficerCardData {
  id: string;
  name: string;
  role: string;
  roleKey: string;
  subrole: string;
  phone: string;
  address: string;
  avatarUrl?: string;
  tupoksi: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const store = getStore();

    // 1. Tentukan RW target
    let targetRwId = searchParams.get("rwId");
    if (!targetRwId) {
      const auth = getAuthUser(req);
      if (auth) {
        const user = store.users.find((u) => u.id === auth.userId);
        if (user && user.rw_id) {
          targetRwId = user.rw_id;
        }
      }
    }

    let activeRw = targetRwId ? store.rws.find((r) => r.id === targetRwId) : null;
    if (!activeRw) {
      activeRw = store.rws.find((r) => r.status === "ACTIVE") || store.rws[0] || null;
    }

    if (!activeRw) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "Belum ada wilayah RW terdaftar dalam sistem.",
      });
    }

    // 2. Kumpulkan pengguna & peran pada RW ini
    const rwUsers = store.users.filter(
      (u) => u.rw_id === activeRw!.id && u.status === "VERIFIED_ACTIVE"
    );

    const getOfficerByRole = (roleName: string, roleTitle: string, subrole: string, tupoksi: string): OfficerCardData | null => {
      // Cari role_id untuk roleName
      const roleDef = store.roles.find((r) => r.name === roleName);
      if (!roleDef) return null;

      // Cari user yang memiliki role ini
      const userRole = store.user_roles.find((ur) => {
        if (ur.role_id !== roleDef.id) return false;
        return rwUsers.some((u) => u.id === ur.user_id);
      });

      if (!userRole) return null;

      const user = rwUsers.find((u) => u.id === userRole.user_id);
      if (!user) return null;

      const rt = store.rts.find((r) => r.id === user.rt_id);
      const rtText = rt ? `RT ${rt.rt_number} ` : "";

      return {
        id: user.id,
        name: user.full_name,
        role: roleTitle,
        roleKey: roleName,
        subrole,
        phone: user.phone_number,
        address: user.address_block ? `${user.address_block} (${rtText}RW ${activeRw!.rw_number})` : `${rtText}RW ${activeRw!.rw_number}`,
        avatarUrl: user.avatar_url,
        tupoksi,
      };
    };

    // Pimpinan RW
    const pimpinanRw = getOfficerByRole(
      "RW_CHAIR",
      `Ketua RW ${activeRw.rw_number}`,
      "Penanggung Jawab Wilayah & Kebijakan Lingkungan",
      "Memimpin penyelenggaraan urusan kerukunan warga, menjembatani hubungan dengan pemerintah desa/kelurahan, dan mengoordinasikan pelaksanaan program kerja seluruh RT."
    );

    const wakilRw = getOfficerByRole(
      "RW_VICE_CHAIR",
      `Wakil Ketua RW ${activeRw.rw_number}`,
      "Membidangi Operasional & Pengawasan RT",
      "Membantu Ketua RW dalam pengawasan lapangan, perumusan kebijakan teknis, dan mewakili pimpinan saat berhalangan hadir."
    );

    // Sekretariat & Keuangan
    const sekretaris = getOfficerByRole(
      "RW_SECRETARY",
      `Sekretaris RW ${activeRw.rw_number}`,
      "Administrasi & Persuratan Warga",
      "Pengelolaan surat pengantar, data sensus kependudukan, arsip notulensi musyawarah warga, dan administrasi digital."
    );

    const bendahara = getOfficerByRole(
      "RW_TREASURER",
      `Bendahara RW ${activeRw.rw_number}`,
      "Pengelolaan Kas & Pembukuan",
      "Pencatatan buku kas RW, verifikasi pengajuan dana kegiatan RT, rekonsiliasi iuran lingkungan, dan laporan transparansi berkala."
    );

    const sekretariatKeuangan = [
      {
        roleKey: "RW_SECRETARY",
        defaultRole: `Sekretaris RW ${activeRw.rw_number}`,
        defaultSubrole: "Administrasi & Persuratan Warga",
        tupoksi: "Pengelolaan surat pengantar, data sensus kependudukan, arsip notulensi musyawarah warga, dan administrasi digital.",
        officer: sekretaris,
      },
      {
        roleKey: "RW_TREASURER",
        defaultRole: `Bendahara RW ${activeRw.rw_number}`,
        defaultSubrole: "Pengelolaan Kas & Pembukuan",
        tupoksi: "Pencatatan buku kas RW, verifikasi pengajuan dana kegiatan RT, rekonsiliasi iuran lingkungan, dan laporan transparansi berkala.",
        officer: bendahara,
      },
    ];

    // Seksi-seksi Operasional RW
    const seksiDefinitions = [
      {
        roleKey: "RW_SECURITY",
        role: "Seksi Keamanan & Ketertiban",
        subrole: "Koordinator Pos Ronda & Kamtibmas",
        badgeColor: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200",
        iconType: "SHIELD",
        tupoksi: "Patroli ronda malam lingkungan, pengawasan portal masuk tamu, respon cepat sinyal darurat SOS, dan koordinasi dengan aparat berwenang.",
      },
      {
        roleKey: "RW_DEVELOPMENT",
        role: "Seksi Pembangunan & Sarpras",
        subrole: "Pemeliharaan CCTV & Fasilitas Umum",
        badgeColor: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200",
        iconType: "BUILDING",
        tupoksi: "Pemeliharaan lampu penerangan jalan, saluran drainase air hujan, perbaikan jalan paving, dan instalasi fasilitas publik warga.",
      },
      {
        roleKey: "RW_SOCIAL",
        role: "Seksi Sosial & Kesehatan",
        subrole: "Pelayanan Masyarakat & Posyandu",
        badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200",
        iconType: "STETHOSCOPE",
        tupoksi: "Pemeriksaan kesehatan lansia berkala, penimbangan balita Posyandu, program santunan sosial, dan penanganan kegawatdaruratan warga.",
      },
      {
        roleKey: "RW_ENVIRONMENT",
        role: "Seksi Kebersihan & Lingkungan",
        subrole: "Pengangkutan Sampah & Drainase",
        badgeColor: "bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950 dark:text-teal-200",
        iconType: "SPARKLES",
        tupoksi: "Jadwal rit pengangkutan sampah, kerja bakti berkala, pemilahan bank sampah organik/anorganik, dan perawatan taman penghijauan.",
      },
      {
        roleKey: "RW_YOUTH",
        role: "Seksi Karang Taruna & Pemuda",
        subrole: "Kegiatan Olahraga & Kepemudaan",
        badgeColor: "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200",
        iconType: "AWARD",
        tupoksi: "Penyelenggaraan turnamen olahraga warga, kepanitiaan HUT RI, bakti sosial kepemudaan, dan digitalisasi media informasi warga.",
      },
      {
        roleKey: "RW_RELATIONS",
        role: "Seksi Hubungan Masyarakat (Humas)",
        subrole: "Komunikasi Publik & Pengumuman",
        badgeColor: "bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200",
        iconType: "HEART",
        tupoksi: "Penyampaian maklumat warga, hubungan antarlembaga, dan sosialisasi program kerja lingkungan.",
      },
    ];

    const seksiOperasional = seksiDefinitions.map((def) => {
      const officer = getOfficerByRole(def.roleKey, def.role, def.subrole, def.tupoksi);
      return {
        ...def,
        officer,
      };
    });

    // Jajaran RT Unit
    const rtUnitsInRw = store.rts
      .filter((r) => r.rw_id === activeRw!.id)
      .sort((a, b) => (a.rt_number || "").localeCompare(b.rt_number || ""));

    const roleRtChair = store.roles.find((r) => r.name === "RT_CHAIR");

    const jajaranRt = rtUnitsInRw.map((rt) => {
      let chairUser = null;
      if (roleRtChair) {
        const chairMapping = store.user_roles.find((ur) => {
          if (ur.role_id !== roleRtChair.id) return false;
          const u = store.users.find((user) => user.id === ur.user_id);
          return u && u.rt_id === rt.id && u.status === "VERIFIED_ACTIVE";
        });
        if (chairMapping) {
          chairUser = store.users.find((u) => u.id === chairMapping.user_id) || null;
        }
      }

      // Hitung jumlah warga di RT ini
      const citizenCount = store.users.filter(
        (u) => u.rt_id === rt.id && u.status === "VERIFIED_ACTIVE"
      ).length;

      return {
        rtId: rt.id,
        rtNumber: rt.rt_number,
        rtTitle: `RT ${rt.rt_number}`,
        citizenCount,
        chair: chairUser
          ? {
              id: chairUser.id,
              name: chairUser.full_name,
              role: `Ketua RT ${rt.rt_number}`,
              phone: chairUser.phone_number,
              address: chairUser.address_block || `Wilayah RT ${rt.rt_number}`,
              avatarUrl: chairUser.avatar_url,
            }
          : null,
      };
    });

    // Kontak Pengurus: Menggabungkan seluruh pengurus yang aktif terdaftar
    const allRegisteredOfficers: Array<{
      id: string;
      name: string;
      role: string;
      phone: string;
      address: string;
      avatarUrl?: string;
    }> = [];

    if (pimpinanRw) allRegisteredOfficers.push(pimpinanRw);
    if (wakilRw) allRegisteredOfficers.push(wakilRw);
    if (sekretaris) allRegisteredOfficers.push(sekretaris);
    if (bendahara) allRegisteredOfficers.push(bendahara);

    seksiOperasional.forEach((s) => {
      if (s.officer) allRegisteredOfficers.push(s.officer);
    });

    jajaranRt.forEach((rt) => {
      if (rt.chair) allRegisteredOfficers.push(rt.chair);
    });

    return NextResponse.json({
      success: true,
      data: {
        rw: {
          id: activeRw.id,
          number: activeRw.rw_number,
          village: activeRw.village,
          district: activeRw.district,
          city: activeRw.city,
          termPeriod: activeRw.term_period,
        },
        pimpinanRw,
        wakilRw,
        sekretariatKeuangan,
        seksiOperasional,
        jajaranRt,
        allContacts: allRegisteredOfficers,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load officer structure" },
      { status: 500 }
    );
  }
}

