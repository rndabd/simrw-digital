import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthUser, hasRole } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const {
      orgType = "RT", // "RT" | "RW"
      type, // "INCOME" | "EXPENSE"
      amount,
      category,
      description,
      date = new Date().toISOString().split("T")[0],
      proofDocUrl,
    } = await req.json();

    if (!type || !amount || !category || !description) {
      return NextResponse.json(
        { success: false, message: "Tipe transaksi, jumlah nominal, kategori, dan deskripsi wajib diisi." },
        { status: 400 }
      );
    }

    if (orgType === "RW" && !hasRole(auth, ["RW_CHAIR", "RW_STAFF", "SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Hanya Pengurus RW yang berwenang mencatat transaksi Kas RW." },
        { status: 403 }
      );
    }

    if (orgType === "RT" && !hasRole(auth, ["RT_CHAIR", "RT_STAFF", "SUPER_ADMIN"])) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Hanya Pengurus RT yang berwenang mencatat transaksi Kas RT." },
        { status: 403 }
      );
    }

    const store = getStore();

    const newTx = {
      id: crypto.randomUUID(),
      org_type: orgType,
      rw_id: auth.rwId,
      rt_id: orgType === "RT" ? auth.rtId : undefined,
      type: type as "INCOME" | "EXPENSE",
      amount: Number(amount),
      category: category.trim(),
      description: description.trim(),
      date,
      recorded_by: auth.userId,
      proof_doc_url: proofDocUrl,
    };

    store.cash_transactions.unshift(newTx);
    saveStore(store);

    await recordAuditLog({
      userId: auth.userId,
      action: `RECORD_${orgType}_TRANSACTION`,
      resource: `CASH_TRANSACTION:${newTx.id}`,
      payload: { orgType, type, amount, category, description },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      message: `Transaksi kas ${orgType} (${type === "INCOME" ? "Pemasukan" : "Pengeluaran"}) sebesar Rp ${Number(amount).toLocaleString("id-ID")} berhasil dicatat ke buku kas.`,
      data: newTx,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to record cash transaction" },
      { status: 500 }
    );
  }
}

