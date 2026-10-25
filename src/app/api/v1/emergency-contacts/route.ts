import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { recordAuditLog } from "@/lib/audit";

const defaultWilayahContacts = (village: string = "Ciheulang", district: string = "Ciparay", city: string = "Kab. Bandung") => [
  {
    name: `Ambulans Siaga & Puskesmas DTP ${district}`,
    category: "MEDIS & AMBULANS",
    phone: "0225950045",
    altPhone: "119",
    notes: `Pelayanan Medis Darurat 24 Jam, Bidan Siaga & Rujukan Ambulans ${district}`,
    type: "WILAYAH" as const,
  },
  {
    name: `Polsek ${district} (SPKT Siaga 24 Jam)`,
    category: "KEPOLISIAN / KAMTIBMAS",
    phone: "0225950110",
    altPhone: "110",
    notes: "Pengaduan Kriminalitas, Penindakan Keamanan, Mediasi & Call Center 110",
    type: "WILAYAH" as const,
  },
  {
    name: `Bripka Mulyadi (Bhabinkamtibmas ${village})`,
    category: "BHABINKAMTIBMAS POLRI",
    phone: "081299991122",
    notes: `Pembina Kamtibmas Wilayah Desa/Kelurahan ${village}`,
    type: "WILAYAH" as const,
  },
  {
    name: `Pemadam Kebakaran Pos ${district}`,
    category: "PEMADAM KEBAKARAN (DAMKAR)",
    phone: "0225950113",
    altPhone: "113",
    notes: "Diskar PB: Penyelamatan Api, Evakuasi Satwa Berbahaya & Bencana Darurat",
    type: "WILAYAH" as const,
  },
  {
    name: `PLN Gangguan & Bahaya Listrik ${district}`,
    category: "GANGGUAN LISTRIK",
    phone: "123",
    altPhone: "022123",
    notes: "Kabel Putus, Trafo Meledak, Korsleting Bahaya & Padam Tidak Terjadwal",
    type: "WILAYAH" as const,
  },
  {
    name: `Koramil / Babinsa TNI AD (${district})`,
    category: "BABINSA KORAMIL",
    phone: "0225950220",
    notes: `Mitra Kamtibmas Teritorial & Bantuan Tanggap Bencana Koramil ${district}`,
    type: "WILAYAH" as const,
  },
  {
    name: `BPBD ${city} (Pusdalops Bencana)`,
    category: "TANGGAP BENCANA BPBD",
    phone: "02285872525",
    notes: "Penanganan Bencana Banjir, Tanah Longsor, Pohon Tumbang & Cuaca Ekstrem",
    type: "WILAYAH" as const,
  },
];

export async function GET(req: NextRequest) {
  try {
    const store = getStore();
    const auth = getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const requestedRwId = searchParams.get("rw_id") || auth?.rwId || store.rws[0]?.id || "";

    const rw = store.rws.find((r) => r.id === requestedRwId) || store.rws[0];
    const village = rw?.village || "Desa";
    const district = rw?.district || "Kecamatan";
    const city = rw?.city || "Kota";
    const rwNum = rw?.rw_number || "";

    if (!store.emergency_contacts) {
      store.emergency_contacts = [];
    }
    if (!store.wilayah_configs) {
      store.wilayah_configs = [];
    }

    // Strictly filter contacts belonging ONLY to this specific RW
    let rwContacts = store.emergency_contacts.filter((c) => c.rw_id === requestedRwId);

    // If this RW does not have contacts yet, initialize official public service contacts
    if (rwContacts.length === 0 && requestedRwId) {
      const now = new Date().toISOString();
      const seedWilayah = defaultWilayahContacts(village, district, city).map((item, idx) => ({
        id: `wilayah-${requestedRwId}-${idx + 1}-${Date.now()}`,
        rw_id: requestedRwId,
        name: item.name,
        category: item.category,
        phone: item.phone,
        altPhone: item.altPhone,
        notes: item.notes,
        type: item.type,
        created_at: now,
        updated_at: now,
      }));

      store.emergency_contacts.push(...seedWilayah);
      saveStore(store);
      rwContacts = store.emergency_contacts.filter((c) => c.rw_id === requestedRwId);
    }

    // Get custom wilayah name config specific to this RW
    const wilayahConfig = store.wilayah_configs.find((w) => w.rw_id === requestedRwId);
    const wilayahName = wilayahConfig?.wilayah_name || `Kecamatan ${district} & ${city}`;

    return NextResponse.json({
      success: true,
      data: {
        rw_id: requestedRwId,
        wilayah_name: wilayahName,
        contacts: rwContacts,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load emergency contacts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const store = getStore();
    const auth = getAuthUser(req);
    const body = await req.json();
    const { action } = body;

    // Determine target RW strictly from request body or authenticated user's RW
    const targetRwId = body.rw_id || auth?.rwId || "rw-05-coblong";

    if (!store.emergency_contacts) store.emergency_contacts = [];
    if (!store.wilayah_configs) store.wilayah_configs = [];

    if (action === "CREATE") {
      const { name, category, phone, altPhone, notes, type } = body.contact || {};
      if (!name || !phone) {
        return NextResponse.json(
          { success: false, message: "Nama dan nomor telepon wajib diisi" },
          { status: 400 }
        );
      }

      const newId = `emg-${targetRwId}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const now = new Date().toISOString();
      const newContact = {
        id: newId,
        rw_id: targetRwId, // Bound strictly to this RW
        name,
        category: category || (type === "WILAYAH" ? "INSTANSI WILAYAH" : "INTERNAL RW"),
        phone,
        altPhone: altPhone || undefined,
        notes: notes || "",
        type: (type === "WILAYAH" ? "WILAYAH" : "INTERNAL") as "WILAYAH" | "INTERNAL",
        created_at: now,
        updated_at: now,
      };

      store.emergency_contacts.push(newContact);
      saveStore(store);

      await recordAuditLog({
        userId: auth?.userId || "officer",
        action: "CREATE_EMERGENCY_CONTACT",
        resource: "EMERGENCY_CONTACT",
        ipAddress: req.ip || "127.0.0.1",
        payload: { id: newId, rw_id: targetRwId, name, type },
      });

      return NextResponse.json({
        success: true,
        message: "Kontak darurat berhasil ditambahkan untuk RW Anda",
        data: store.emergency_contacts.filter((c) => c.rw_id === targetRwId),
      });
    }

    if (action === "UPDATE") {
      const { id, contact } = body;
      if (!id || !contact) {
        return NextResponse.json(
          { success: false, message: "ID kontak dan data pembaruan diperlukan" },
          { status: 400 }
        );
      }

      const idx = store.emergency_contacts.findIndex((c) => c.id === id);
      if (idx === -1) {
        return NextResponse.json(
          { success: false, message: "Kontak darurat tidak ditemukan" },
          { status: 404 }
        );
      }

      // Security check: ensure contact belongs to targetRwId
      if (store.emergency_contacts[idx].rw_id !== targetRwId && !auth?.roles?.includes("SUPER_ADMIN")) {
        return NextResponse.json(
          { success: false, message: "Akses ditolak: Anda hanya dapat mengubah kontak milik RW Anda sendiri" },
          { status: 403 }
        );
      }

      store.emergency_contacts[idx] = {
        ...store.emergency_contacts[idx],
        name: contact.name ?? store.emergency_contacts[idx].name,
        category: contact.category ?? store.emergency_contacts[idx].category,
        phone: contact.phone ?? store.emergency_contacts[idx].phone,
        altPhone: contact.altPhone !== undefined ? contact.altPhone : store.emergency_contacts[idx].altPhone,
        notes: contact.notes !== undefined ? contact.notes : store.emergency_contacts[idx].notes,
        type: contact.type ?? store.emergency_contacts[idx].type,
        updated_at: new Date().toISOString(),
      };

      saveStore(store);

      await recordAuditLog({
        userId: auth?.userId || "officer",
        action: "UPDATE_EMERGENCY_CONTACT",
        resource: "EMERGENCY_CONTACT",
        ipAddress: req.ip || "127.0.0.1",
        payload: { id, rw_id: targetRwId, updated: store.emergency_contacts[idx] },
      });

      return NextResponse.json({
        success: true,
        message: "Kontak darurat berhasil diperbarui untuk RW Anda",
        data: store.emergency_contacts.filter((c) => c.rw_id === targetRwId),
      });
    }

    if (action === "DELETE") {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ success: false, message: "ID kontak diperlukan" }, { status: 400 });
      }

      const target = store.emergency_contacts.find((c) => c.id === id);
      if (!target) {
        return NextResponse.json({ success: false, message: "Kontak darurat tidak ditemukan" }, { status: 404 });
      }

      // Security check: ensure contact belongs to targetRwId
      if (target.rw_id !== targetRwId && !auth?.roles?.includes("SUPER_ADMIN")) {
        return NextResponse.json(
          { success: false, message: "Akses ditolak: Anda tidak dapat menghapus kontak milik RW lain" },
          { status: 403 }
        );
      }

      store.emergency_contacts = store.emergency_contacts.filter((c) => c.id !== id);
      saveStore(store);

      await recordAuditLog({
        userId: auth?.userId || "officer",
        action: "DELETE_EMERGENCY_CONTACT",
        resource: "EMERGENCY_CONTACT",
        ipAddress: req.ip || "127.0.0.1",
        payload: { id, rw_id: targetRwId },
      });

      return NextResponse.json({
        success: true,
        message: "Kontak darurat berhasil dihapus dari RW Anda",
        data: store.emergency_contacts.filter((c) => c.rw_id === targetRwId),
      });
    }

    if (action === "SET_WILAYAH") {
      const { wilayah_name } = body;
      if (!wilayah_name) {
        return NextResponse.json(
          { success: false, message: "Nama wilayah diperlukan" },
          { status: 400 }
        );
      }

      // Strictly isolated per RW
      const existingIdx = store.wilayah_configs.findIndex((w) => w.rw_id === targetRwId);
      if (existingIdx !== -1) {
        store.wilayah_configs[existingIdx].wilayah_name = wilayah_name;
      } else {
        store.wilayah_configs.push({
          rw_id: targetRwId,
          wilayah_name,
        });
      }

      saveStore(store);

      await recordAuditLog({
        userId: auth?.userId || "officer",
        action: "SET_WILAYAH_NAME",
        resource: "WILAYAH_CONFIG",
        ipAddress: req.ip || "127.0.0.1",
        payload: { rw_id: targetRwId, wilayah_name },
      });

      return NextResponse.json({
        success: true,
        message: `Nama wilayah berhasil disimpan khusus untuk RW Anda`,
        data: { rw_id: targetRwId, wilayah_name },
      });
    }

    if (action === "RESET_DEFAULT") {
      const rw = store.rws.find((r) => r.id === targetRwId) || store.rws[0];
      const village = rw?.village || "Ciheulang";
      const district = rw?.district || "Ciparay";
      const city = rw?.city || "Kab. Bandung";
      const rwNum = rw?.rw_number || "15";

      // Remove existing contacts ONLY for target RW (does not touch other RWs!)
      store.emergency_contacts = store.emergency_contacts.filter((c) => c.rw_id !== targetRwId);

      const now = new Date().toISOString();
      const seedWilayah = defaultWilayahContacts(village, district, city).map((item, idx) => ({
        id: `wilayah-${targetRwId}-${idx + 1}-${Date.now()}`,
        rw_id: targetRwId,
        name: item.name,
        category: item.category,
        phone: item.phone,
        altPhone: item.altPhone,
        notes: item.notes,
        type: item.type,
        created_at: now,
        updated_at: now,
      }));

      store.emergency_contacts.push(...seedWilayah);

      // Reset wilayah config only for target RW
      const existingIdx = store.wilayah_configs.findIndex((w) => w.rw_id === targetRwId);
      if (existingIdx !== -1) {
        store.wilayah_configs[existingIdx].wilayah_name = `Kecamatan ${district} & ${city}`;
      }

      saveStore(store);

      return NextResponse.json({
        success: true,
        message: "Kontak darurat RW Anda berhasil dikembalikan ke template awal",
        data: {
          rw_id: targetRwId,
          wilayah_name: `Kecamatan ${district} & ${city}`,
          contacts: store.emergency_contacts.filter((c) => c.rw_id === targetRwId),
        },
      });
    }

    return NextResponse.json(
      { success: false, message: `Aksi ${action} tidak dikenali` },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process emergency contact action" },
      { status: 500 }
    );
  }
}

