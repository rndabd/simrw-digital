/**
 * Notification Service (BullMQ / Async Fan-out & FCM Topics Simulation)
 */

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  topic?: string;
  recipientUserId?: string;
}

export interface QueuedJob {
  id: string;
  payload: NotificationPayload;
  status: "QUEUED" | "PROCESSING" | "SENT" | "FAILED";
  attempts: number;
  createdAt: string;
  processedAt?: string;
}

// In-memory job queue & dispatch history
const notificationQueue: QueuedJob[] = [];
const notificationHistory: QueuedJob[] = [];

/**
 * Push notification job to asynchronous dispatch queue (Fan-out pipeline)
 */
export async function dispatchNotification(payload: NotificationPayload): Promise<QueuedJob> {
  const job: QueuedJob = {
    id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    payload,
    status: "QUEUED",
    attempts: 0,
    createdAt: new Date().toISOString(),
  };

  notificationQueue.push(job);

  // Trigger worker asynchronously without blocking HTTP response
  setTimeout(() => processNextNotification(), 100);

  return job;
}

/**
 * Worker processor simulating BullMQ worker & FCM HTTP v1 Topic broadcast
 */
async function processNextNotification() {
  const job = notificationQueue.shift();
  if (!job) return;

  job.status = "PROCESSING";
  job.attempts += 1;

  try {
    // If FCM_SERVER_KEY is configured in .env, dispatch live push notification to Firebase
    if (process.env.FCM_SERVER_KEY) {
      const recipient = job.payload.topic ? `/topics/${job.payload.topic}` : job.payload.recipientUserId;
      try {
        const fcmRes = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `key=${process.env.FCM_SERVER_KEY}`,
          },
          body: JSON.stringify({
            to: recipient,
            notification: {
              title: job.payload.title,
              body: job.payload.body,
              sound: "default",
            },
            data: job.payload.data || {},
          }),
        });
        const fcmJson = await fcmRes.json();
        console.log(`[FCM Live HTTP] Response for topic "${job.payload.topic}":`, fcmJson);
      } catch (fcmErr) {
        console.error(`[FCM Live HTTP] Send failed:`, fcmErr);
      }
    }

    job.status = "SENT";
    job.processedAt = new Date().toISOString();
    notificationHistory.unshift(job);

    // Keep history trimmed
    if (notificationHistory.length > 100) {
      notificationHistory.pop();
    }

    console.log(
      `[FCM Worker] Sent to topic/target: ${
        job.payload.topic || job.payload.recipientUserId
      } | Title: "${job.payload.title}"`
    );
  } catch (error) {
    job.status = "FAILED";
    notificationHistory.unshift(job);
    console.error(`[FCM Worker] Failed to send job ${job.id}:`, error);
  }
}

/**
 * Subscribe/Unsubscribe user device token to/from FCM topic
 */
export async function manageFCMTopicSubscription(
  tokens: string[],
  topic: string,
  action: "SUBSCRIBE" | "UNSUBSCRIBE"
) {
  console.log(`[FCM Topic] ${action} ${tokens.length} token(s) to topic: ${topic}`);

  if (process.env.FCM_SERVER_KEY && tokens.length > 0) {
    try {
      const actionUrl =
        action === "SUBSCRIBE"
          ? "https://iid.googleapis.com/iid/v1:batchAdd"
          : "https://iid.googleapis.com/iid/v1:batchRemove";
      await fetch(actionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `key=${process.env.FCM_SERVER_KEY}`,
        },
        body: JSON.stringify({
          to: `/topics/${topic}`,
          registration_tokens: tokens,
        }),
      });
    } catch (e) {
      console.error(`[FCM Topic Live Subscription Error]:`, e);
    }
  }

  return { success: true, topic, action, count: tokens.length };
}

/**
 * Standard Topic Helpers
 */
export const FCMTopics = {
  rwAll: (rwId: string) => `rw_${rwId}_all`,
  rtAll: (rtId: string) => `rt_${rtId}_all`,
  rwOfficers: (rwId: string) => `rw_${rwId}_officers`,
  rtOfficers: (rtId: string) => `rt_${rtId}_officers`,
  userPrivate: (userId: string) => `user_${userId}`,
};

export function getRecentNotifications() {
  return notificationHistory;
}

