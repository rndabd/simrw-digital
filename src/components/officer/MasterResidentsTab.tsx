"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  RotateCw,
  Phone,
  Home,
  Tag,
  Calendar,
  X,
  Check,
} from "lucide-react";

export default function MasterResidentsTab() {
  const { user } = useAuth();
  const [residents, setResidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterResidence, setFilterResidence] = useState("ALL");
  const [filterMutation, setFilterMutation] = useState("ALL");

  // State for Add / Edit Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKk, setFormKk] = useState("");
  const [formNik, setFormNik] = useState("");
  const [formName, setFormName] = useState("");
  const [formGender, setFormGender] = useState<"LAKI_LAKI" | "PEREMPUAN">("LAKI_LAKI");
  const [formBirthDate, setFormBirthDate] = useState("1990-01-01");
  const [formBirthPlace, setFormBirthPlace] = useState("");
  const [formReligion, setFormReligion] = useState("ISLAM");
  const [formOccupation, setFormOccupation] = useState("");
  const [formRelation, setFormRelation] = useState("KEPALA_KELUARGA");
  const [formResidenceStatus, setFormResidenceStatus] = useState("TETAP");
  const [formAddress, setFormAddress] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for Mutation Modal
  const [showMutationModal, setShowMutationModal] = useState(false);
  const [selectedMutationResident, setSelectedMutationResident] = useState<any | null>(null);
  const [mutationStatus, setMutationStatus] = useState("PINDAH_KELUAR");
  const [mutationDate, setMutationDate] = useState(new Date().toISOString().split("T")[0]);
  const [mutationNote, setMutationNote] = useState("");
  const [isSubmittingMutation, setIsSubmittingMutation] = useState(false);

  // Unmasked NIK state for privacy
  const [unmaskedNiks, setUnmaskedNiks] = useState<Record<string, boolean>>({});

  const fetchResidents = async () => {
    setIsLoading(true);
    try {
      let url = "/api/v1/residents?";
      if (search) url += `q=${encodeURIComponent(search)}&`;
      if (filterResidence !== "ALL") url += `residence_status=${filterResidence}&`;
      if (filterMutation !== "ALL") url += `mutation_status=${filterMutation}&`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setResidents(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, [search, filterResidence, filterMutation]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormKk("");
    setFormNik("");
    setFormName("");
    setFormGender("LAKI_LAKI");
    setFormBirthDate("1990-01-01");
    setFormBirthPlace("");
    setFormReligion("ISLAM");
    setFormOccupation("");
    setFormRelation("KEPALA_KELUARGA");
    setFormResidenceStatus("TETAP");
    setFormAddress("");
    setFormPhone("");
    setShowFormModal(true);
  };

  const handleOpenEditModal = (r: any) => {
    setEditingId(r.id);
    setFormKk(r.kk_number);
    setFormNik(r.nik);
    setFormName(r.full_name);
    setFormGender(r.gender);
    setFormBirthDate(r.birth_date || "1990-01-01");
    setFormBirthPlace(r.birth_place || "");
    setFormReligion(r.religion || "ISLAM");
    setFormOccupation(r.occupation || "");
    setFormRelation(r.family_relation);
    setFormResidenceStatus(r.residence_status);
    setFormAddress(r.address_street);
    setFormPhone(r.phone_number || "");
    setShowFormModal(true);
  };

  const handleSaveResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKk || !formNik || !formName) {
      alert("No. KK, NIK, dan Nama Lengkap wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/v1/residents/${editingId}` : "/api/v1/residents";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kk_number: formKk,
          nik: formNik,
          full_name: formName,
          gender: formGender,
          birth_date: formBirthDate,
          birth_place: formBirthPlace,
          religion: formReligion,
          occupation: formOccupation,
          family_relation: formRelation,
          residence_status: formResidenceStatus,
          address_street: formAddress,
          phone_number: formPhone,
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setShowFormModal(false);
        fetchResidents();
      } else {
        alert(json.message || "Gagal menyimpan data penduduk.");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResident = async (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus data penduduk "${name}" dari Buku Induk RT?`)) return;
    try {
      const res = await fetch(`/api/v1/residents/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchResidents();
      } else {
        alert(json.message || "Gagal menghapus data.");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleOpenMutation = (r: any) => {
    setSelectedMutationResident(r);
    setMutationStatus(r.mutation_status || "PINDAH_KELUAR");
    setMutationDate(r.mutation_date || new Date().toISOString().split("T")[0]);
    setMutationNote(r.mutation_note || "");
    setShowMutationModal(true);
  };

  const handleSaveMutation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMutationResident) return;

    setIsSubmittingMutation(true);
    try {
      const res = await fetch(`/api/v1/residents/${selectedMutationResident.id}/mutation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mutation_status: mutationStatus,
          mutation_date: mutationDate,
          mutation_note: mutationNote,
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setShowMutationModal(false);
        fetchResidents();
      } else {
        alert(json.message || "Gagal mencatat mutasi.");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmittingMutation(false);
    }
  };

  const getRelationBadge = (rel: string) => {
    switch (rel) {
      case "KEPALA_KELUARGA":
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-200">Kepala Keluarga</span>;
      case "ISTRI":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">Istri</span>;
      case "ANAK":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">Anak</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">{rel}</span>;
    }
  };

  const getMutationBadge = (status: string) => {
    switch (status) {
      case "AKTIF":
        return <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-100 text-emerald-800">Aktif Domisili</span>;
      case "PINDAH_KELUAR":
        return <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-rose-100 text-rose-800 border border-rose-300">Pindah Keluar</span>;
      case "PINDAH_MASUK":
        return <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-teal-100 text-teal-800 border border-teal-300">Pindah Masuk</span>;
      case "MENINGGAL":
        return <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-slate-200 text-slate-800">Meninggal</span>;
      case "LAHIR":
        return <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-sky-100 text-sky-800">Kelahiran</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white">Buku Induk & Sensus Kependudukan RT/RW</h2>
            <p className="text-[11px] text-slate-300">
              Pengelolaan master data seluruh jiwa dan kartu keluarga (KK) yang diinput resmi oleh kepengurusan.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all active:scale-95 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Input Penduduk Baru</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, NIK, No. KK, atau alamat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterResidence}
              onChange={(e) => setFilterResidence(e.target.value)}
              className="text-xs p-2 rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="ALL">Semua Status Tinggal</option>
              <option value="TETAP">Warga Tetap</option>
              <option value="KONTRAK">Warga Kontrak</option>
              <option value="KOST">Kost</option>
            </select>

            <select
              value={filterMutation}
              onChange={(e) => setFilterMutation(e.target.value)}
              className="text-xs p-2 rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="ALL">Semua Kondisi Mutasi</option>
              <option value="AKTIF">Aktif Domisili</option>
              <option value="PINDAH_MASUK">Pindah Masuk</option>
              <option value="PINDAH_KELUAR">Pindah Keluar</option>
              <option value="MENINGGAL">Meninggal Dunia</option>
            </select>

            <button
              onClick={fetchResidents}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 shrink-0"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1 border-t border-slate-100">
          <span>Menampilkan: <strong className="text-slate-800">{residents.length} Jiwa Terdaftar</strong></span>
          <span className="text-[10px] text-emerald-700 font-semibold">Tersimpan Aman Enkripsi UU PDP</span>
        </div>
      </div>

      {/* Residents Table */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-500">Memuat data kependudukan...</div>
      ) : residents.length === 0 ? (
        <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center space-y-2 shadow-xs">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="text-sm font-bold text-slate-800">Data Penduduk Masih Kosong / Tidak Ditemukan</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Gunakan tombol &quot;Input Penduduk Baru&quot; untuk mencatat data warga hasil sensus atau registrasi manual RT.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3.5">Nama & Hubungan</th>
                <th className="py-3 px-3">No. KK & NIK</th>
                <th className="py-3 px-3">Kelamin / Usia</th>
                <th className="py-3 px-3">Status Tinggal</th>
                <th className="py-3 px-3">Alamat Rumah</th>
                <th className="py-3 px-3">Status Mutasi</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {residents.map((r) => {
                const isUnmasked = unmaskedNiks[r.id];
                const displayNik = isUnmasked ? r.nik : r.maskedNik;

                let age = "-";
                if (r.birth_date) {
                  const birthYear = parseInt(r.birth_date.split("-")[0], 10);
                  if (!isNaN(birthYear)) {
                    age = `${new Date().getFullYear() - birthYear} Thn`;
                  }
                }

                return (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="font-extrabold text-slate-900 text-xs">{r.full_name}</div>
                      <div className="mt-1 flex items-center gap-1">
                        {getRelationBadge(r.family_relation)}
                        <span className="text-[10.5px] text-slate-400">• {r.occupation || "Lainnya"}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px]">
                      <div className="text-slate-500 text-[10px]">KK: {r.maskedKk}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-slate-800 font-bold">{displayNik}</span>
                        <button
                          onClick={() => setUnmaskedNiks((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                          className="text-slate-400 hover:text-emerald-700"
                          title={isUnmasked ? "Sembunyikan NIK" : "Buka sensor NIK (UU PDP)"}
                        >
                          {isUnmasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-[11px] text-slate-700">
                      <div>{r.gender === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}</div>
                      <div className="text-slate-400 text-[10px]">{age}</div>
                    </td>

                    <td className="py-3 px-3 text-[11px]">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {r.residence_status === "TETAP" ? "Warga Tetap" : r.residence_status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-[11px] text-slate-600 max-w-[180px] truncate" title={r.address_street}>
                      {r.address_street}
                      {r.phone_number && <div className="text-[10px] text-emerald-700 font-mono">WA: {r.phone_number}</div>}
                    </td>

                    <td className="py-3 px-3 text-[11px]">
                      {getMutationBadge(r.mutation_status || "AKTIF")}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenMutation(r)}
                          className="p-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50"
                          title="Catat Mutasi Pindah/Kematian"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(r)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                          title="Edit Data"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteResident(r.id, r.full_name)}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL INPUT / EDIT PENDUDUK */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {editingId ? "Perbarui Data Penduduk" : "Input Penduduk Baru ke Sensus RT"}
                  </h3>
                  <p className="text-[10.5px] text-slate-500">Form pencatatan resmi Buku Induk Lingkungan RT</p>
                </div>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveResident} className="space-y-3">
              {/* No KK & NIK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nomor Kartu Keluarga (KK - 16 Digit) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    placeholder="327301xxxxxxxxxx"
                    value={formKk}
                    onChange={(e) => setFormKk(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nomor Induk Kependudukan (NIK - 16 Digit) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    placeholder="327301xxxxxxxxxx"
                    value={formNik}
                    onChange={(e) => setFormNik(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nama Lengkap Sesuai KTP *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama warga..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Hubungan Keluarga & Jenis Kelamin */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Hubungan Keluarga
                  </label>
                  <select
                    value={formRelation}
                    onChange={(e) => setFormRelation(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="KEPALA_KELUARGA">Kepala Keluarga</option>
                    <option value="ISTRI">Istri</option>
                    <option value="ANAK">Anak</option>
                    <option value="ORANG_TUA">Orang Tua / Mertua</option>
                    <option value="FAMILI_LAIN">Famili Lain</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="LAKI_LAKI">Laki-laki</option>
                    <option value="PEREMPUAN">Perempuan</option>
                  </select>
                </div>
              </div>

              {/* Tanggal Lahir & Tempat Lahir */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    required
                    value={formBirthDate}
                    onChange={(e) => setFormBirthDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    placeholder="Kota kelahiran..."
                    value={formBirthPlace}
                    onChange={(e) => setFormBirthPlace(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
              </div>

              {/* Agama & Pekerjaan */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Agama
                  </label>
                  <select
                    value={formReligion}
                    onChange={(e) => setFormReligion(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="ISLAM">Islam</option>
                    <option value="KRISTEN">Kristen Protestan</option>
                    <option value="KATOLIK">Katolik</option>
                    <option value="HINDU">Hindu</option>
                    <option value="BUDDHA">Buddha</option>
                    <option value="KONGHUCU">Konghucu</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Pekerjaan
                  </label>
                  <input
                    type="text"
                    placeholder="Karyawan, Guru, dll..."
                    value={formOccupation}
                    onChange={(e) => setFormOccupation(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
              </div>

              {/* Status Tempat Tinggal & No HP */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Status Tempat Tinggal
                  </label>
                  <select
                    value={formResidenceStatus}
                    onChange={(e) => setFormResidenceStatus(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="TETAP">Warga Tetap</option>
                    <option value="KONTRAK">Kontrak / Sewa</option>
                    <option value="KOST">Kost</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    placeholder="08xxxxxxxx"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium font-mono"
                  />
                </div>
              </div>

              {/* Alamat Lengkap */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Alamat Lengkap / Blok & No. Rumah
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Gang Kenanga Blok C2 No. 14 RT 02"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? "Menyimpan ke Buku Induk..." : "Simpan Data Penduduk Sekarang"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MUTASI PENDUDUK */}
      {showMutationModal && selectedMutationResident && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <RotateCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Catat Mutasi Penduduk</h3>
                  <p className="text-[10px] text-slate-500">Pembaruan perpindahan / perubahan status warga</p>
                </div>
              </div>
              <button
                onClick={() => setShowMutationModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-0.5">
              <div className="text-slate-400 text-[10px]">Warga Yang Dimutasi:</div>
              <div className="font-extrabold text-slate-900">{selectedMutationResident.full_name}</div>
              <div className="font-mono text-[10.5px] text-slate-500">NIK: {selectedMutationResident.maskedNik}</div>
            </div>

            <form onSubmit={handleSaveMutation} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Status Mutasi Baru
                </label>
                <select
                  value={mutationStatus}
                  onChange={(e) => setMutationStatus(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                >
                  <option value="AKTIF">Warga Aktif Kembali</option>
                  <option value="PINDAH_KELUAR">Pindah Keluar (Pindah Domisili ke Luar RT)</option>
                  <option value="PINDAH_MASUK">Pindah Masuk (Warga Baru Masuk ke RT)</option>
                  <option value="MENINGGAL">Meninggal Dunia</option>
                  <option value="LAHIR">Kelahiran Baru</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tanggal Efektif Mutasi
                </label>
                <input
                  type="date"
                  required
                  value={mutationDate}
                  onChange={(e) => setMutationDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan / Keterangan Mutasi
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Pindah tugas ke Surabaya, No. SK Pindah: 474/2026..."
                  value={mutationNote}
                  onChange={(e) => setMutationNote(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingMutation}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmittingMutation ? "Menyimpan Mutasi..." : "Sahkan Pencatatan Mutasi"}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

