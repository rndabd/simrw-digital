import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasRole } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "RT";
    const targetRtId = searchParams.get("rtId") || auth.rtId;
    const targetRwId = searchParams.get("rwId") || auth.rwId;

    const store = getStore();

    if (scope === "RW") {
      const rw = store.rws.find((r) => r.id === targetRwId);
      const isConfigured = Boolean(rw?.bank_account_number && rw?.bank_name);
      return NextResponse.json({
        success: true,
        data: {
          orgType: "RW",
          orgId: targetRwId,
          orgLabel: rw ? `RW ${rw.rw_number}` : "RW",
          bankName: rw?.bank_name || "",
          accountNumber: rw?.bank_account_number || "",
          accountHolder: rw?.bank_account_holder || "",
          notes: rw?.bank_notes || "",
          isConfigured,
        },
      });
    }

    // Default: RT scope
    const rt = store.rts.find((r) => r.id === targetRtId);
    const isConfigured = Boolean(rt?.bank_account_number && rt?.bank_name);

    return NextResponse.json({
      success: true,
      data: {
        orgType: "RT",
        orgId: targetRtId,
        orgLabel: rt ? `RT ${rt.rt_number}` : "RT",
        bankName: rt?.bank_name || "",
        accountNumber: rt?.bank_account_number || "",
        accountHolder: rt?.bank_account_holder || "",
        notes: rt?.bank_notes || "",
        isConfigured,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memuat rekening kas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const isAuthorized = hasRole(auth, [
      "RT_CHAIR",
      "RT_TREASURER",
      "RT_STAFF",
      "RW_CHAIR",
      "RW_TREASURER",
      "RW_STAFF",
      "SUPER_ADMIN",
    ]);

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Hanya Pengurus (Ketua/Bendahara) yang dapat mengubah rekening kas." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { bankName, accountNumber, accountHolder, notes, orgType = "RT", rtId, rwId } = body;

    if (!bankName?.trim() || !accountNumber?.trim() || !accountHolder?.trim()) {
      return NextResponse.json(
        { success: false, message: "Nama Bank, Nomor Rekening, dan Nama Pemilik Rekening (a.n) wajib diisi." },
        { status: 400 }
      );
    }

    const store = getStore();

    if (orgType === "RW" || hasRole(auth, ["RW_CHAIR", "RW_TREASURER", "SUPER_ADMIN"])) {
      if (orgType === "RW") {
        const targetRwId = rwId || auth.rwId;
        const rw = store.rws.find((r) => r.id === targetRwId);
        if (!rw) {
          return NextResponse.json({ success: false, message: "Wilayah RW tidak ditemukan." }, { status: 404 });
        }

        rw.bank_name = bankName.trim();
        rw.bank_account_number = accountNumber.trim();
        rw.bank_account_holder = accountHolder.trim();
        rw.bank_notes = notes?.trim() || "";

        saveStore(store);

        await recordAuditLog({
          userId: auth.userId,
          action: "UPDATE_RW_BANK_ACCOUNT",
          resource: `RW:${targetRwId}`,
          payload: { bankName, accountNumber, accountHolder },
        });

        return NextResponse.json({
          success: true,
          message: "Rekening kas RW berhasil diperbarui!",
          data: {
            bankName: rw.bank_name,
            accountNumber: rw.bank_account_number,
            accountHolder: rw.bank_account_holder,
            notes: rw.bank_notes,
          },
        });
      }
    }

    // Update RT Bank Account
    const targetRtId = rtId || auth.rtId;
    const rt = store.rts.find((r) => r.id === targetRtId);
    if (!rt) {
      return NextResponse.json({ success: false, message: "Satuan unit RT tidak ditemukan." }, { status: 404 });
    }

    rt.bank_name = bankName.trim();
    rt.bank_account_number = accountNumber.trim();
    rt.bank_account_holder = accountHolder.trim();
    rt.bank_notes = notes?.trim() || "";

    saveStore(store);

    await recordAuditLog({
      userId: auth.userId,
      action: "UPDATE_RT_BANK_ACCOUNT",
      resource: `RT:${targetRtId}`,
      payload: { bankName, accountNumber, accountHolder },
    });

    return NextResponse.json({
      success: true,
      message: "Rekening tujuan transfer kas RT berhasil diperbarui!",
      data: {
        bankName: rt.bank_name,
        accountNumber: rt.bank_account_number,
        accountHolder: rt.bank_account_holder,
        notes: rt.bank_notes,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memperbarui rekening kas" },
      { status: 500 }
    );
  }
}

