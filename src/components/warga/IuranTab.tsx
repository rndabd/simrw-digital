"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, CheckCircle2, Clock, QrCode, Receipt, ShieldCheck, Upload, AlertCircle, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function IuranTab() {
  const { user } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [rtFinance, setRtFinance] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payingBill, setPayingBill] = useState<any | null>(null);
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState<string | null>(null);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/bills");
      const json = await res.json();
      if (json.success) {
        setBills(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRtFinance = async () => {
    try {
      const res = await fetch("/api/v1/finances?scope=RT");
      const json = await res.json();
      if (json.success && json.summary) {
        setRtFinance(json.summary);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBills();
    fetchRtFinance();
  }, []);

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBill) return;

    setIsSubmittingPay(true);
    setPaySuccessMsg(null);

    try {
      const res = await fetch(`/api/v1/bills/${payingBill.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proofUrl: `/uploads/bukti-transfer-${user?.id?.substring(0, 5)}.jpg`,
          paymentMethod: "TRANSFER_MANDIRI",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPaySuccessMsg("Bukti pembayaran berhasil dikirim! Status kini PENDING VALIDASI BENDAHARA RT.");
        setTimeout(() => {
          setPayingBill(null);
          setPaySuccessMsg(null);
          fetchBills();
        }, 2500);
      } else {
        alert(json.message || "Gagal mengirimkan pembayaran");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmittingPay(false);
    }
  };

  const totalUnpaid = bills.filter((b) => b.status === "UNPAID").reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-5 pb-20">
      <div>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <CreditCard className="w-4 h-4 text-emerald-600" />
          Iuran & Kas Lingkungan Warga
        </h2>
        <p className="text-xs text-slate-500">
          Transparansi iuran kebersihan, penerangan jalan, dan kas keamanan RT setempat.
        </p>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="text-xs text-emerald-100 font-medium">Tagihan Iuran Tertunda</div>
            <div className="text-3xl font-extrabold tracking-tight mt-1">
              Rp {totalUnpaid.toLocaleString("id-ID")}
            </div>
          </div>
          <div className="text-xs text-emerald-200 mt-4 flex items-center gap-1.5 pt-3 border-t border-emerald-500/40">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            Rekening Kas RT: Bank Mandiri (131-00-1234567-8) a/n Kas Lingkungan RT
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2 flex flex-col justify-center">
          <div className="text-xs font-bold text-slate-700 uppercase">Alur Pembayaran Warga</div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            1. Bayar via Transfer / QRIS.<br />
            2. Unggah bukti transfer.<br />
            3. <strong>Divalidasi oleh Bendahara RT</strong>.<br />
            4. Saldo otomatis masuk ke Kas RT.
          </p>
        </div>
      </div>

      {/* Transparansi Kas RT Warga (Keterbukaan Publik) */}
      {rtFinance && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Transparansi Kas RT {user?.rt?.number || "02"} (Keterbukaan Publik)
            </div>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Kas Aktif
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold">Saldo Awal Kas:</span>
              <span className="font-bold text-slate-800 font-mono text-xs">
                Rp {(rtFinance.initialBalance ?? 0).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] text-emerald-700 block font-semibold">Total Pemasukan:</span>
              <span className="font-bold text-emerald-800 font-mono text-xs">
                Rp {(rtFinance.totalIncome ?? 0).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] text-rose-700 block font-semibold">Total Pengeluaran:</span>
              <span className="font-bold text-rose-800 font-mono text-xs">
                Rp {(rtFinance.totalExpense ?? 0).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 text-white border border-emerald-500/30">
              <span className="text-[10px] text-emerald-300 block font-semibold">Saldo Kas Riil:</span>
              <span className="font-bold text-emerald-400 font-mono text-xs">
                Rp {(rtFinance.netBalance ?? 0).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payingBill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmPayment}
            className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3.5 shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="text-sm font-extrabold text-slate-900">
                Konfirmasi Pembayaran Iuran
              </div>
              <button
                type="button"
                onClick={() => setPayingBill(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Tutup
              </button>
            </div>

            {paySuccessMsg ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{paySuccessMsg}</span>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="text-slate-500">Iuran Periode:</div>
                  <div className="font-bold text-slate-900">
                    Iuran Kebersihan & Keamanan ({payingBill.month} {payingBill.year})
                  </div>
                  <div className="text-sm font-extrabold text-emerald-800">
                    Rp {payingBill.amount.toLocaleString("id-ID")}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs space-y-1">
                  <div className="font-bold text-emerald-950">Rekening Tujuan Transfer:</div>
                  <div className="font-mono text-emerald-800 font-bold">Bank Mandiri: 131-00-1234567-8</div>
                  <div className="text-[10px] text-emerald-700">a/n Kas Lingkungan RT Setempat</div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Lampirkan Bukti Transfer / Resi
                  </label>
                  <div className="p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>struk-transfer-mandiri.jpg (Terlampir)</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-900 text-[11px] font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Setelah dikirim, Bendahara RT akan memvalidasi bukti Anda sebelum status menjadi Lunas.</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {isSubmittingPay ? "Mengirimkan Bukti..." : "Kirim Bukti Pembayaran ke Bendahara RT"}
                </button>
              </>
            )}
          </form>
        </div>
      )}

      {/* Daftar Tagihan */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
          Daftar Tagihan Iuran Warga
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-xs text-slate-500">Memuat data iuran...</div>
        ) : bills.length === 0 ? (
          <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            Tidak ada tagihan yang ditemukan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Iuran Kebersihan & Keamanan ({bill.month} {bill.year})
                    </div>
                    <div className="text-base font-extrabold text-emerald-800 mt-0.5">
                      Rp {bill.amount.toLocaleString("id-ID")}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      bill.status === "PAID"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : bill.status === "PENDING_VALIDATION"
                        ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                        : bill.status === "REJECTED"
                        ? "bg-rose-100 text-rose-800 border border-rose-300"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {bill.status === "PAID"
                      ? "Lunas Terverifikasi"
                      : bill.status === "PENDING_VALIDATION"
                      ? "Menunggu Validasi Bendahara RT"
                      : bill.status === "REJECTED"
                      ? "Bukti Ditolak"
                      : "Belum Bayar"}
                  </span>
                </div>

                {bill.rejection_note && (
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 text-xs flex items-center gap-1.5 border border-rose-200">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Catatan Bendahara: {bill.rejection_note}</span>
                  </div>
                )}

                {bill.status === "UNPAID" || bill.status === "REJECTED" ? (
                  <button
                    onClick={() => setPayingBill(bill)}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98"
                  >
                    <QrCode className="w-4 h-4" />
                    Bayar & Kirim Bukti Transfer
                  </button>
                ) : bill.status === "PENDING_VALIDATION" ? (
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-900 text-xs flex items-center gap-2 border border-amber-200">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Bukti pembayaran telah terkirim pada {new Date(bill.paid_at).toLocaleTimeString("id-ID")}. Menunggu konfirmasi bendahara RT.</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Divalidasi oleh Bendahara RT
                    </span>
                    <button
                      onClick={() =>
                        alert(
                          `Kwitansi Resmi SIM-RW:\nNo: TRX-${bill.id}\nWarga: ${user?.fullName}\nPeriode: ${bill.month} ${bill.year}\nJumlah: Rp ${bill.amount.toLocaleString("id-ID")}\nStatus: LUNAS SAH`
                        )
                      }
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold hover:underline"
                    >
                      <Receipt className="w-3.5 h-3.5" /> Unduh Kwitansi
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
