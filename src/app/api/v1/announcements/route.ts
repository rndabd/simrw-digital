import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { dispatchNotification, FCMTopics } from "@/lib/notifications";
import { recordAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    const store = getStore();

    let list = [...store.announcements];

    // Filter by scope if authenticated
    if (auth) {
      list = list.filter((a) => {
        if (a.scope === "GLOBAL_BROADCAST") return true;
        if (a.scope === "RW_BROADCAST" && a.rw_id === auth.rwId) return true;
        if (a.scope === "RT_BROADCAST" && a.rt_id === auth.rtId) return true;
        if (a.scope === "OFFICER_ONLY") {
          return auth.roles.some((r) =>
            ["SUPER_ADMIN", "RW_CHAIR", "RW_STAFF", "RT_CHAIR", "RT_STAFF"].includes(r)
          );
        }
        return true;
      });
    }

    // Sort: pinned first, then newest
    list.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const enriched = list.map((item) => {
      const author = store.users.find((u) => u.id === item.author_id);
      return {
        ...item,
        authorName: author?.full_name || "Pengurus Warga",
      };
    });

    return NextResponse.json({
      success: true,
      data: enriched,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load announcements" },
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

    if (!hasPermission(auth, "broadcast:create")) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Tidak memiliki wewenang membuat pengumuman." },
        { status: 403 }
      );
    }

    const { title, content, scope = "RT_BROADCAST", isPinned = false, attachments = [] } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: "Judul dan isi pengumuman wajib diisi" },
        { status: 400 }
      );
    }

    const store = getStore();
    const newAnnouncement = {
      id: crypto.randomUUID(),
      rw_id: auth.rwId,
      rt_id: scope === "RT_BROADCAST" ? auth.rtId : undefined,
      author_id: auth.userId,
      title: title.trim(),
      content: content.trim(),
      scope,
      attachments: attachments || [],
      is_pinned: !!isPinned,
      created_at: new Date().toISOString(),
    };

    store.announcements.unshift(newAnnouncement);
    saveStore(store);

    // Audit log
    await recordAuditLog({
      userId: auth.userId,
      action: "CREATE_BROADCAST",
      resource: "ANNOUNCEMENT",
      payload: { title, scope },
    });

    // FCM Topic Dispatch Pipeline
    let targetTopic = FCMTopics.rwAll(auth.rwId);
    if (scope === "RT_BROADCAST" && auth.rtId) {
      targetTopic = FCMTopics.rtAll(auth.rtId);
    } else if (scope === "OFFICER_ONLY") {
      targetTopic = FCMTopics.rtOfficers(auth.rtId);
    }

    await dispatchNotification({
      title: `📢 ${title}`,
      body: content.length > 100 ? `${content.substring(0, 97)}...` : content,
      topic: targetTopic,
      data: {
        announcementId: newAnnouncement.id,
        scope,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Pengumuman berhasil disiarkan ke warga.",
        data: newAnnouncement,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create announcement" },
      { status: 500 }
    );
  }
}

