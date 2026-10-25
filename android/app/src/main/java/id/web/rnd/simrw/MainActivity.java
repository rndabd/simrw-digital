package id.web.rnd.simrw;

import android.net.http.SslError;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.coordinatorlayout.widget.CoordinatorLayout;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    private SwipeRefreshLayout swipeRefreshLayout;
    private long lastBackPressTime = 0;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Pasang crash protector native untuk mencegah force close dari library FCM / PushNotifications
        final Thread.UncaughtExceptionHandler defaultHandler = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
            String msg = throwable != null ? throwable.getMessage() : "";
            if (msg != null && (msg.contains("Firebase") || msg.contains("FirebaseApp") || msg.contains("PushNotifications") || msg.contains("FIS_AUTH_ERROR"))) {
                android.util.Log.e("SIM-RW", "Suppressed native crash from PushNotifications/Firebase: " + msg);
                return;
            }
            if (defaultHandler != null) {
                defaultHandler.uncaughtException(thread, throwable);
            }
        });

        super.onCreate(savedInstanceState);

        Bridge bridge = getBridge();
        if (bridge == null) return;

        WebView webView = bridge.getWebView();
        if (webView == null) return;

        // 1. WebSettings: Cache, DOM Storage, Database, File access
        WebSettings settings = webView.getSettings();
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setJavaScriptEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // Cek konektivitas jaringan: gunakan cache offline jika tidak ada koneksi
        android.net.ConnectivityManager cm = (android.net.ConnectivityManager) getSystemService(android.content.Context.CONNECTIVITY_SERVICE);
        android.net.NetworkInfo activeNetwork = cm != null ? cm.getActiveNetworkInfo() : null;
        boolean isOnline = activeNetwork != null && activeNetwork.isConnectedOrConnecting();

        if (!isOnline) {
            settings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
        } else {
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        }

        // 2. Custom BridgeWebViewClient: Mencegah blank screen saat ada SSL Error atau kendala jaringan
        bridge.setWebViewClient(new BridgeWebViewClient(bridge) {
            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                // Sangat penting untuk Android 13: Abaikan SSL mismatch/self-signed cert agar tidak blank
                handler.proceed();
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request != null && request.isForMainFrame()) {
                    // Coba muat dari cache lokal terlebih dahulu
                    settings.setCacheMode(WebSettings.LOAD_CACHE_ONLY);
                    String currentUrl = view.getUrl();
                    if (currentUrl != null && !currentUrl.contains("offline.html")) {
                        view.reload();
                    } else {
                        // Jika cache belum tersedia, muat Offline App Shell UI bawaan APK
                        view.loadUrl("file:///android_asset/public/offline.html");
                    }
                }
            }
        });

        // 3. Native Pull-To-Refresh (SwipeRefreshLayout)
        ViewParent parent = webView.getParent();
        if (parent instanceof ViewGroup) {
            ViewGroup viewGroup = (ViewGroup) parent;
            int index = viewGroup.indexOfChild(webView);
            viewGroup.removeView(webView);

            swipeRefreshLayout = new SwipeRefreshLayout(this);
            swipeRefreshLayout.setColorSchemeColors(
                0xFF059669, // Emerald 600
                0xFF0D9488, // Teal 600
                0xFF1E293B  // Slate 800
            );

            swipeRefreshLayout.addView(
                webView,
                new ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
            );

            ViewGroup.LayoutParams lp;
            if (parent instanceof CoordinatorLayout) {
                lp = new CoordinatorLayout.LayoutParams(
                    CoordinatorLayout.LayoutParams.MATCH_PARENT,
                    CoordinatorLayout.LayoutParams.MATCH_PARENT
                );
            } else {
                lp = new ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                );
            }
            viewGroup.addView(swipeRefreshLayout, index, lp);

            // canScrollVertically(-1) mengembalikan true jika halaman sedang di-scroll ke bawah (bukan di pucuk atas)
            swipeRefreshLayout.setOnChildScrollUpCallback((parentLayout, child) -> {
                if (webView != null) {
                    return webView.getScrollY() > 0 || webView.canScrollVertically(-1);
                }
                return false;
            });

            swipeRefreshLayout.setOnRefreshListener(() -> {
                android.net.ConnectivityManager refreshCm = (android.net.ConnectivityManager) getSystemService(android.content.Context.CONNECTIVITY_SERVICE);
                android.net.NetworkInfo refreshNet = refreshCm != null ? refreshCm.getActiveNetworkInfo() : null;
                boolean canConnect = refreshNet != null && refreshNet.isConnectedOrConnecting();

                if (canConnect) {
                    settings.setCacheMode(WebSettings.LOAD_DEFAULT);
                    String currentUrl = webView.getUrl();
                    if (currentUrl != null && currentUrl.contains("offline.html")) {
                        webView.loadUrl("https://simrw.web.id");
                    } else {
                        webView.reload();
                    }
                } else {
                    settings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
                    webView.reload();
                }

                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    if (swipeRefreshLayout != null && swipeRefreshLayout.isRefreshing()) {
                        swipeRefreshLayout.setRefreshing(false);
                    }
                }, 1500);
            });
        }
    }

    @Override
    public void onBackPressed() {
        Bridge bridge = getBridge();
        if (bridge != null) {
            WebView webView = bridge.getWebView();
            if (webView != null && webView.canGoBack()) {
                webView.goBack();
                return;
            }
        }

        long currentTime = System.currentTimeMillis();
        if (currentTime - lastBackPressTime < 2000) {
            super.onBackPressed();
        } else {
            lastBackPressTime = currentTime;
            Toast.makeText(
                this,
                "Tekan sekali lagi untuk keluar dari aplikasi",
                Toast.LENGTH_SHORT
            ).show();
        }
    }
}
