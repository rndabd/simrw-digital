import crypto from "crypto";
import { getStore, saveStore } from "./data-store";

export interface LogAuditParams {
  userId?: string;
  action: string;
  resource: string;
  payload?: any;
  ipAddress?: string;
}

/**
 * Record UU PDP Compliance Audit Log
 */
export async function recordAuditLog({
  userId,
  action,
  resource,
  payload,
  ipAddress = "127.0.0.1",
}: LogAuditParams) {
  try {
    const store = getStore();
    const entry = {
      id: crypto.randomUUID(),
      user_id: userId,
      action,
      resource,
      payload: payload || null,
      ip_address: ipAddress,
      timestamp: new Date().toISOString(),
    };

    store.audit_logs.unshift(entry);
    // Keep max 1000 logs in local storage
    if (store.audit_logs.length > 1000) {
      store.audit_logs = store.audit_logs.slice(0, 1000);
    }
    saveStore(store);
    return entry;
  } catch (err) {
    console.error("Failed to record audit log:", err);
    return null;
  }
}

