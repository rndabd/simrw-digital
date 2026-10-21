import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthUser } from "@/lib/auth";
import { getStore, saveStore } from "@/lib/data-store";
import { FCMTopics, manageFCMTopicSubscription } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { token, platform = "WEB" } = await req.json();
    if (!token) {
      return NextResponse.json({ success: false, message: "Device token wajib diisi" }, { status: 400 });
    }

    const store = getStore();
    const existingIndex = store.device_tokens.findIndex((dt) => dt.token === token);

    if (existingIndex > -1) {
      store.device_tokens[existingIndex].user_id = auth.userId;
      store.device_tokens[existingIndex].is_active = true;
      store.device_tokens[existingIndex].updated_at = new Date().toISOString();
    } else {
      store.device_tokens.push({
        id: crypto.randomUUID(),
        user_id: auth.userId,
        token,
        platform,
        is_active: true,
        updated_at: new Date().toISOString(),
      });
    }

    // Subscribe to default citizen topics
    await manageFCMTopicSubscription([token], FCMTopics.rtAll(auth.rtId), "SUBSCRIBE");
    await manageFCMTopicSubscription([token], FCMTopics.rwAll(auth.rwId), "SUBSCRIBE");

    // If officer, also subscribe to officer topic
    if (auth.roles.some((r) => ["RT_CHAIR", "RT_STAFF"].includes(r))) {
      await manageFCMTopicSubscription([token], FCMTopics.rtOfficers(auth.rtId), "SUBSCRIBE");
    }
    if (auth.roles.some((r) => ["RW_CHAIR", "RW_STAFF"].includes(r))) {
      await manageFCMTopicSubscription([token], FCMTopics.rwOfficers(auth.rwId), "SUBSCRIBE");
    }

    saveStore(store);

    return NextResponse.json({
      success: true,
      message: "Device token registered & subscribed to FCM topics",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to register device token" },
      { status: 500 }
    );
  }
}

