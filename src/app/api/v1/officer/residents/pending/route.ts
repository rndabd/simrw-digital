import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasRole } from "@/lib/auth";
import { getStore } from "@/lib/data-store";
import { decryptAES256GCM, maskNik } from "@/lib/security";
import { generatePresignedUrl } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    if (!hasRole(auth, ["RT_CHAIR", "RT_STAFF", "RW_CHAIR", "SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, message: "Hanya pengurus RT/RW yang dapat mengakses antrean verifikasi warga." },
        { status: 403 }
      );
    }

    const store = getStore();

    // Filter pending users in same RT (or all if RW/Super Admin)
    let pendingUsers = store.users.filter(
      (u) => u.status === "PENDING_VERIFICATION" || u.status === "UNVERIFIED"
    );

    if (auth.roles.includes("RT_CHAIR") || auth.roles.includes("RT_STAFF")) {
      pendingUsers = pendingUsers.filter((u) => u.rt_id === auth.rtId);
    } else if (auth.roles.includes("RW_CHAIR") || auth.roles.includes("RW_STAFF")) {
      pendingUsers = pendingUsers.filter((u) => u.rw_id === auth.rwId);
    }

    const mapped = pendingUsers.map((u) => {
      let masked = "327301******0000";
      try {
        const plain = decryptAES256GCM(u.nik_encrypted);
        masked = maskNik(plain);
      } catch {}

      const rt = store.rts.find((r) => r.id === u.rt_id);
      const rw = store.rws.find((r) => r.id === u.rw_id);
      const hh = u.household_id
        ? store.households.find((h) => h.id === u.household_id)
        : null;

      // Generate 5-minute pre-signed URL for KTP photo
      const ktpPresignedUrl = u.ktp_doc_url?.startsWith("/uploads")
        ? u.ktp_doc_url // Static sample fallback
        : generatePresignedUrl(u.ktp_doc_url, 300);

      return {
        id: u.id,
        fullName: u.full_name,
        phoneNumber: u.phone_number,
        maskedNik: masked,
        status: u.status,
        addressBlock: hh?.address_block || "RT Setempat",
        rtNumber: rt?.rt_number || "02",
        rwNumber: rw?.rw_number || "05",
        ktpPresignedUrl,
        createdAt: u.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      count: mapped.length,
      data: mapped,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch pending residents" },
      { status: 500 }
    );
  }
}

