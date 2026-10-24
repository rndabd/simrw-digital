import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

/**
 * Inisialisasi Push Notifications untuk Android / iOS via Capacitor
 */
export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    // 1. Cek izin notifikasi perangkat
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== "granted") {
      console.warn("[PushNotifications] Izin notifikasi ditolak oleh pengguna");
      return;
    }

    // 2. Daftarkan perangkat ke FCM
    await PushNotifications.register();

    // 3. Listener saat token FCM berhasil didapatkan
    PushNotifications.addListener("registration", async (token) => {
      console.log("[PushNotifications] Device token berhasil dibuat:", token.value);
      try {
        await fetch("/api/v1/notifications/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: token.value, platform: "ANDROID" }),
        });
      } catch (e) {
        console.error("[PushNotifications] Gagal mengirim token ke server:", e);
      }
    });

    // 4. Listener saat terjadi error registrasi FCM
    PushNotifications.addListener("registrationError", (err) => {
      console.warn("[PushNotifications] Registrasi token gagal (biasanya karena google-services.json belum dimasukkan):", err.error);
    });

    // 5. Listener saat notifikasi masuk ketika aplikasi sedang dibuka (foreground)
    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("[PushNotifications] Notifikasi masuk di latar depan:", notification);
    });

    // 6. Listener saat warga mengetuk/menekan notifikasi di status bar
    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      console.log("[PushNotifications] Notifikasi diketuk oleh pengguna:", action);
    });
  } catch (err) {
    console.warn("[PushNotifications] Inisialisasi Push Notifications dilewati:", err);
  }
}

