package id.web.rnd.simrw;

import android.Manifest;
import android.os.Build;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Logger;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "PushNotifications",
    permissions = @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "receive")
)
public class SafePushNotificationsPlugin extends Plugin {

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            JSObject permissionsResultJSON = new JSObject();
            permissionsResultJSON.put("receive", "granted");
            call.resolve(permissionsResultJSON);
        } else {
            super.checkPermissions(call);
        }
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU || getPermissionState("receive") == PermissionState.GRANTED) {
            JSObject permissionsResultJSON = new JSObject();
            permissionsResultJSON.put("receive", "granted");
            call.resolve(permissionsResultJSON);
        } else {
            requestPermissionForAlias("receive", call, "permissionsCallback");
        }
    }

    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        this.checkPermissions(call);
    }

    @PluginMethod
    public void register(PluginCall call) {
        Logger.info("PushNotifications", "register() safe stub invoked - preventing native crash when FCM project not yet active");
        call.resolve();
    }

    @PluginMethod
    public void unregister(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void getDeliveredNotifications(PluginCall call) {
        JSObject result = new JSObject();
        result.put("notifications", new JSArray());
        call.resolve(result);
    }

    @PluginMethod
    public void removeDeliveredNotifications(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void removeAllDeliveredNotifications(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void createChannel(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void deleteChannel(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void listChannels(PluginCall call) {
        JSObject result = new JSObject();
        result.put("channels", new JSArray());
        call.resolve(result);
    }
}

