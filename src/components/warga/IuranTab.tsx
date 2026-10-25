"use client";

import React, { useState, useEffect, useRef } from "react";
import { CreditCard, CheckCircle2, Clock, QrCode, Receipt, ShieldCheck, Upload, AlertCircle, FileText, Camera, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function IuranTab() {
  const { user } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [rtFinance, setRtFinance] = useState<any | null>(null);
  const [bankAccount, setBankAccount] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payingBill, setPayingBill] = useState<any | null>(null);
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState<string | null>(null);

  // Camera & Proof State
  const cameraProofRef = useRef<HTMLInputElement>(null);
  const galleryProofRef = useRef<HTMLInputElement>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
        if (json.summary.bankAccount) {
          setBankAccount(json.summary.bankAccount);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBankAccount = async () => {
    try {
      const res = await fetch("/api/v1/finances/bank-account?scope=RT");
      const json = await res.json();
      if (json.success && json.data) {
        setBankAccount(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBills();
    fetchRtFinance();
    fetchBankAccount();
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
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white">Iuran & Kas Lingkungan Warga</h2>
            <p className="text-[11px] text-slate-200 font-medium">
              Transparansi iuran kebersihan, penerangan jalan, dan kas keamanan RT setempat.
            </p>
          </div>
        </div>
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
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>
              {bankAccount?.isConfigured
                ? `Rekening Kas RT: ${bankAccount.bankName} (${bankAccount.accountNumber}) a/n ${bankAccount.accountHolder}`
                : "Rekening Kas RT: Belum dikonfigurasi oleh Pengurus RT"}
            </span>
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
              <span className="text-[10px] text-slate-700 block font-bold">Saldo Awal Kas:</span>
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
                className="text-slate-600 hover:text-slate-900 text-xs font-extrabold"
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
                  <div className="text-slate-700 font-bold">Iuran Periode:</div>
                  <div className="font-bold text-slate-900">
                    Iuran Kebersihan & Keamanan ({payingBill.month} {payingBill.year})
                  </div>
                  <div className="text-sm font-extrabold text-emerald-800">
                    Rp {payingBill.amount.toLocaleString("id-ID")}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs space-y-1.5">
                  <div className="font-bold text-emerald-950">Rekening Tujuan Transfer Kas:</div>
                  {bankAccount?.isConfigured ? (
                    <>
                      <div className="font-mono text-emerald-900 font-extrabold text-sm flex items-center justify-between">
                        <span>{bankAccount.bankName}: {bankAccount.accountNumber}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(bankAccount.accountNumber);
                              alert("Nomor rekening berhasil disalin ke clipboard!");
                            }
                          }}
                          className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition shadow-2xs"
                        >
                          Salin No. Rek
                        </button>
                      </div>
                      <div className="text-[11px] text-emerald-800 font-bold">a/n {bankAccount.accountHolder}</div>
                      {bankAccount.notes && (
                        <div className="text-[10px] text-slate-600 italic mt-1 pt-1 border-t border-emerald-200">
                          Catatan: {bankAccount.notes}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-amber-800 font-medium">
                      Pengurus RT belum mengatur rekening bank tujuan transfer. Silakan konfirmasi ke Bendahara RT Anda.
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Lampirkan Bukti Transfer / Resi (Kamera / Galeri)
                  </label>
                  <input
                    ref={cameraProofRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleProofChange}
                  />
                  <input
                    ref={galleryProofRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProofChange}
                  />

                  {proofPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
                      <img
                        src={proofPreview}
                        alt="Bukti Resi Transfer"
                        className="w-full h-36 object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setProofPreview(null)}
                        className="absolute top-4 right-4 w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md text-xs transition"
                        title="Hapus Bukti"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="mt-1 text-center">
                        <span className="text-[10px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Bukti Resi Terlampir
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => cameraProofRef.current?.click()}
                        className="py-2.5 px-3 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-xs"
                      >
                        <Camera className="w-4 h-4 text-emerald-600" />
                        <span>Foto Resi via Kamera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => galleryProofRef.current?.click()}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95"
                      >
                        <Upload className="w-4 h-4 text-slate-700" />
                        <span>Pilih Berkas Galeri</span>
                      </button>
                    </div>
                  )}
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
        <div className="flex items-center gap-1.5 px-1">
          <div className="text-xs font-extrabold text-white uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-xs border border-white/10 shadow-sm">
            Daftar Tagihan Iuran Warga
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-xs text-slate-700 font-bold">Memuat data iuran...</div>
        ) : bills.length === 0 ? (
          <div className="p-8 bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-md text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-sm font-extrabold text-slate-800">
              Belum Ada Tagihan Iuran Terbit
            </div>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Pengurus RT belum menerbitkan tagihan iuran untuk periode saat ini. Tagihan akan otomatis tampil di sini saat diterbitkan oleh Bendahara atau Ketua RT.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className="p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-md space-y-3"
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
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs text-slate-700 font-medium">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Divalidasi oleh Bendahara RT
                    </span>
                    <button
                      onClick={() =>
                        alert(
                          `Kwitansi Resmi SIM-RW:\nNo: TRX-${bill.id}\nWarga: ${user?.fullName}\nPeriode: ${bill.month} ${bill.year}\nJumlah: Rp ${bill.amount.toLocaleString("id-ID")}\nStatus: LUNAS SAH`
                        )
                      }
                      className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-bold hover:underline"
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
