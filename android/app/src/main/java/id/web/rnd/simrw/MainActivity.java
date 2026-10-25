package id.web.rnd.simrw;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private SwipeRefreshLayout swipeRefreshLayout;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null) {
            // 1. Caching & Offline Storage
            WebSettings settings = webView.getSettings();
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);

            try {
                ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
                NetworkInfo activeNetwork = cm != null ? cm.getActiveNetworkInfo() : null;
                boolean isConnected = activeNetwork != null && activeNetwork.isConnectedOrConnecting();

                if (!isConnected) {
                    settings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
                } else {
                    settings.setCacheMode(WebSettings.LOAD_DEFAULT);
                }
            } catch (Exception e) {
                settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            }

            // 2. Native SwipeRefreshLayout (Tarik ke bawah seperti Shopee / Bank)
            ViewParent parent = webView.getParent();
            if (parent instanceof ViewGroup) {
                ViewGroup viewGroup = (ViewGroup) parent;
                int index = viewGroup.indexOfChild(webView);
                viewGroup.removeView(webView);

                swipeRefreshLayout = new SwipeRefreshLayout(this);
                // Warna tema hijau zamrud & biru tua sesuai SIM-RW
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
                viewGroup.addView(swipeRefreshLayout, index);

                // Tarik ke bawah hanya aktif jika scroll halaman sudah di paling atas
                swipeRefreshLayout.setOnChildScrollUpCallback((parentLayout, child) -> {
                    return webView.getScrollY() > 0;
                });

                // Aksi refresh saat ditarik
                swipeRefreshLayout.setOnRefreshListener(() -> {
                    webView.reload();

                    // Hentikan animasi loading refresh setelah selesai atau timeout 2.5 detik
                    new Handler(Looper.getMainLooper()).postDelayed(() -> {
                        if (swipeRefreshLayout != null && swipeRefreshLayout.isRefreshing()) {
                            swipeRefreshLayout.setRefreshing(false);
                        }
                    }, 2500);
                });
            }
        }
    }
}
