import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasRole } from "@/lib/auth";
import { getStore } from "@/lib/data-store";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "RT"; // "RT" | "RW" | "ALL_RT"
    const targetRtId = searchParams.get("rtId");
    const targetRwId = searchParams.get("rwId") || auth.rwId;

    const store = getStore();

    const isRwUser = auth.roles.some((r) => r.startsWith("RW_") || r === "SUPER_ADMIN");
    const isRtUser = auth.roles.some((r) => r.startsWith("RT_"));

    // 1. RW INSPECTION OF ALL RTs IN THEIR RW
    if (scope === "ALL_RT") {
      if (!isRwUser) {
        return NextResponse.json(
          { success: false, message: "Akses ditolak. Hanya Pengurus RW yang dapat memeriksa seluruh laporan RT." },
          { status: 403 }
        );
      }

      const rtsInRw = store.rts.filter((r) => r.rw_id === targetRwId);
      const rtReports = rtsInRw.map((rt) => {
        const txs = store.cash_transactions.filter((tx) => tx.org_type === "RT" && tx.rt_id === rt.id);
        const initTx = txs.find((t) => t.category === "Saldo Awal Kas");
        const initialBalance = rt.initial_balance ?? (initTx ? initTx.amount : 0);
        const operationalIncome = txs.filter((t) => t.type === "INCOME" && t.category !== "Saldo Awal Kas").reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = txs.filter((t) => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
        const totalIncome = initialBalance + operationalIncome;
        const balance = totalIncome - totalExpense;

        const duesBills = store.bills.filter((b) => b.rt_id === rt.id);
        const duesPaid = duesBills.filter((b) => b.status === "PAID").reduce((sum, b) => sum + b.amount, 0);
        const duesPending = duesBills.filter((b) => b.status === "PENDING_VALIDATION").length;
        const duesUnpaid = duesBills.filter((b) => b.status === "UNPAID").length;

        const rtLeader = store.users.find((u) => u.rt_id === rt.id && store.user_roles.some((ur) => ur.user_id === u.id && ur.role_id === "role-rt-chair"));

        return {
          rtId: rt.id,
          rtNumber: rt.rt_number,
          leaderName: rtLeader?.full_name || "Ketua RT",
          initialBalance,
          operationalIncome,
          totalIncome,
          totalExpense,
          netBalance: balance,
          totalDuesCollected: duesPaid,
          pendingValidationCount: duesPending,
          unpaidCount: duesUnpaid,
          transactionCount: txs.length,
        };
      });

      return NextResponse.json({
        success: true,
        scope: "ALL_RT",
        rwId: targetRwId,
        data: rtReports,
      });
    }

    // 2. KAS TINGKAT RW
    if (scope === "RW") {
      if (!isRwUser) {
        return NextResponse.json(
          { success: false, message: "Akses ditolak. Hanya Pengurus RW yang berwenang mengakses Kas RW." },
          { status: 403 }
        );
      }

      const txs = store.cash_transactions.filter(
        (tx) => tx.org_type === "RW" && tx.rw_id === targetRwId
      );
      const rw = store.rws.find((r) => r.id === targetRwId);
      const initTx = txs.find((t) => t.category === "Saldo Awal Kas");
      const initialBalance = rw?.initial_balance ?? (initTx ? initTx.amount : 0);
      const operationalIncome = txs.filter((t) => t.type === "INCOME" && t.category !== "Saldo Awal Kas").reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = txs.filter((t) => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = initialBalance + operationalIncome;
      const balance = totalIncome - totalExpense;

      const rwBankAccount = {
        bankName: rw?.bank_name || "",
        accountNumber: rw?.bank_account_number || "",
        accountHolder: rw?.bank_account_holder || "",
        notes: rw?.bank_notes || "",
        isConfigured: Boolean(rw?.bank_name && rw?.bank_account_number),
      };

      return NextResponse.json({
        success: true,
        scope: "RW",
        rwId: targetRwId,
        summary: {
          initialBalance,
          operationalIncome,
          totalIncome,
          totalExpense,
          netBalance: balance,
          bankAccount: rwBankAccount,
        },
        bankAccount: rwBankAccount,
        transactions: txs,
      });
    }

    // 3. KAS TINGKAT RT (Dilihat oleh Pengurus RT, Pengurus RW, atau Warga RT bersangkutan)
    const effectiveRtId = targetRtId || auth.rtId;
    const canAccessRt = isRwUser || (auth.rtId === effectiveRtId);

    if (!canAccessRt) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Anda tidak berwenang melihat pembukuan kas RT ini." },
        { status: 403 }
      );
    }

    const txs = store.cash_transactions.filter(
      (tx) => tx.org_type === "RT" && tx.rt_id === effectiveRtId
    );
    const rt = store.rts.find((r) => r.id === effectiveRtId);
    const initTx = txs.find((t) => t.category === "Saldo Awal Kas");
    const initialBalance = rt?.initial_balance ?? (initTx ? initTx.amount : 0);
    const operationalIncome = txs.filter((t) => t.type === "INCOME" && t.category !== "Saldo Awal Kas").reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = txs.filter((t) => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = initialBalance + operationalIncome;
    const balance = totalIncome - totalExpense;

    const rtBankAccount = {
      bankName: rt?.bank_name || "",
      accountNumber: rt?.bank_account_number || "",
      accountHolder: rt?.bank_account_holder || "",
      notes: rt?.bank_notes || "",
      isConfigured: Boolean(rt?.bank_name && rt?.bank_account_number),
    };

    return NextResponse.json({
      success: true,
      scope: "RT",
      rtId: effectiveRtId,
      rtNumber: rt?.rt_number || "-",
      summary: {
        initialBalance,
        operationalIncome,
        totalIncome,
        totalExpense,
        netBalance: balance,
        bankAccount: rtBankAccount,
      },
      bankAccount: rtBankAccount,
      transactions: txs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load finances" },
      { status: 500 }
    );
  }
}

