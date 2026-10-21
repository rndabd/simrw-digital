import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasRole } from "@/lib/auth";
import { getStore } from "@/lib/data-store";
import { decryptAES256GCM } from "@/lib/security";
import { recordAuditLog } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    if (!hasRole(auth, ["RT_CHAIR", "RT_STAFF", "RW_CHAIR", "SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Hanya pengurus yang dapat membuka NIK." },
        { status: 403 }
      );
    }

    const store = getStore();
    const user = store.users.find((u) => u.id === params.id);
    if (!user) {
      return NextResponse.json({ success: false, message: "Warga tidak ditemukan" }, { status: 404 });
    }

    // Decrypt NIK
    const unmaskedNik = decryptAES256GCM(user.nik_encrypted);

    // Record UU PDP Audit Log
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await recordAuditLog({
      userId: auth.userId,
      action: "VIEW_UNMASKED_NIK",
      resource: `USER:${user.id}`,
      payload: { targetUserId: user.id, targetName: user.full_name },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        fullName: user.full_name,
        nik: unmaskedNik,
        message: "Akses NIK telah dicatat dalam Audit Log UU PDP.",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to unmask NIK" },
      { status: 500 }
    );
  }
}

