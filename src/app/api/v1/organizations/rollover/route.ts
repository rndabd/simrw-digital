import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasRole } from "@/lib/auth";
import { getStore } from "@/lib/data-store";
import { executeLeadershipRollover } from "@/lib/rollover";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    // Rollover can only be triggered by Super Admin (for RW) or RW Chair / Super Admin (for RT)
    const {
      targetType = "RW",
      targetRwId,
      targetRtId,
      outgoingOfficerId,
      incomingOfficerId,
      periodFrom,
      periodTo,
      nextPeriodTo,
      closingCashBalance = 0,
      handoverNotes = "",
      bastDocumentUrl,
    } = await req.json();

    if (targetType === "RW" && !hasRole(auth, ["SUPER_ADMIN"])) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses ditolak. Serah terima jabatan (Rollover) tingkat RW wajib disahkan oleh Super Admin / Kelurahan.",
        },
        { status: 403 }
      );
    }

    if (targetType === "RT" && !hasRole(auth, ["RW_CHAIR", "SUPER_ADMIN"])) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses ditolak. Rollover tingkat RT wajib disahkan oleh Ketua RW atau Super Admin.",
        },
        { status: 403 }
      );
    }

    if (!targetRwId || !outgoingOfficerId || !incomingOfficerId || !periodFrom || !periodTo || !nextPeriodTo) {
      return NextResponse.json(
        { success: false, message: "Data serah terima jabatan (BAST) tidak lengkap." },
        { status: 400 }
      );
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const result = await executeLeadershipRollover({
      targetType,
      targetRwId,
      targetRtId,
      outgoingOfficerId,
      incomingOfficerId,
      periodFrom,
      periodTo,
      nextPeriodTo,
      closingCashBalance: Number(closingCashBalance) || 0,
      handoverNotes,
      bastDocumentUrl,
      executedByUserId: auth.userId,
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: `Proses Rollover Masa Bakti 5 Tahun (${periodTo}-${nextPeriodTo}) berhasil dieksekusi secara otomatis.`,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengeksekusi rollover." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const store = getStore();

    const enriched = store.rollovers.map((r) => {
      const rw = store.rws.find((item) => item.id === r.target_rw_id);
      const rt = r.target_rt_id ? store.rts.find((item) => item.id === r.target_rt_id) : null;
      const outgoing = store.users.find((u) => u.id === r.from_user_id);
      const incoming = store.users.find((u) => u.id === r.to_user_id);
      const executor = store.users.find((u) => u.id === r.executed_by);

      return {
        ...r,
        rwNumber: rw?.rw_number || "-",
        village: rw?.village || "-",
        rtNumber: rt?.rt_number || "-",
        outgoingName: outgoing?.full_name || "Demisioner",
        incomingName: incoming?.full_name || "Pejabat Baru",
        executorName: executor?.full_name || "Super Admin Kelurahan",
      };
    });

    return NextResponse.json({
      success: true,
      data: enriched,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load rollover history" },
      { status: 500 }
    );
  }
}

