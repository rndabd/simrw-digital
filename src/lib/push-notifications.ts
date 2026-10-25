import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

/**
 * Inisialisasi Push Notifications untuk Android / iOS via Capacitor
 */
export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  if (!Capacitor.isPluginAvailable("PushNotifications")) {
    console.warn("[PushNotifications] Plugin PushNotifications tidak tersedia di platform ini");
    return;
  }

  try {
    // 1. Pasang listener terlebih dahulu sebelum meminta izin / registrasi
    await PushNotifications.removeAllListeners().catch(() => {});

    // Listener saat token FCM berhasil didapatkan
    PushNotifications.addListener("registration", async (token) => {
      console.log("[PushNotifications] Device token FCM berhasil dibuat:", token.value);
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

    // Listener saat terjadi error registrasi FCM
    PushNotifications.addListener("registrationError", (err) => {
      console.warn("[PushNotifications] Registrasi token dilewati/gagal:", err.error);
    });

    // Listener saat notifikasi masuk ketika aplikasi sedang dibuka (foreground)
    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("[PushNotifications] Notifikasi masuk di latar depan:", notification);
    });

    // Listener saat warga mengetuk/menekan notifikasi di status bar
    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      console.log("[PushNotifications] Notifikasi diketuk oleh pengguna:", action);
    });

    // 2. Cek izin notifikasi perangkat (Android 13+ POST_NOTIFICATIONS)
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== "granted") {
      console.warn("[PushNotifications] Izin notifikasi belum diberikan atau ditolak pengguna");
      return;
    }

    console.log("[PushNotifications] Izin notifikasi aktif (granted)");

    // 3. Hanya panggil register() jika kredensial FCM live telah dikonfigurasi secara eksplisit
    // Mencegah force-close native Android jika Firebase belum dihubungkan ke Google Cloud Console
    const isLiveFcmConfigured = typeof window !== "undefined" && (window as any).__ENABLE_FCM_REGISTRATION__ === true;
    if (isLiveFcmConfigured) {
      try {
        await PushNotifications.register();
      } catch (regError) {
        console.warn("[PushNotifications] Registrasi token FCM dilewati:", regError);
      }
    }
  } catch (err) {
    console.warn("[PushNotifications] Inisialisasi Push Notifications dilewati:", err);
  }
}

