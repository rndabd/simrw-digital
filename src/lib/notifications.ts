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
    // In production, this calls FCM admin.messaging().send({ topic: ... })
    // Simulate latency < 50ms
    await new Promise((resolve) => setTimeout(resolve, 30));

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

