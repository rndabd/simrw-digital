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
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

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
                    // Jika koneksi gagal, muat halaman offline interaktif
                    view.loadUrl("file:///android_asset/public/offline.html");
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
                String currentUrl = webView.getUrl();
                if (currentUrl != null && currentUrl.contains("offline.html")) {
                    webView.loadUrl("https://simrw.web.id");
                } else {
                    webView.reload();
                }

                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    if (swipeRefreshLayout != null && swipeRefreshLayout.isRefreshing()) {
                        swipeRefreshLayout.setRefreshing(false);
                    }
                }, 2000);
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
