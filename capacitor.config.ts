import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "id.web.rnd.simrw",
  appName: "SIM-RW Digital",
  webDir: "public",
  server: {
    url: "https://simrw.web.id",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;

