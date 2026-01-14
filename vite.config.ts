import devtoolsJson from "vite-plugin-devtools-json";
import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    devtoolsJson({
      normalizeForWindowsContainer: true,
      uuid: "supportmail-dashboard-vite-config",
    }),
  ],
  server: {
    port: 5050,
    strictPort: true,
    cors: { credentials: true },
    allowedHosts: [".supportmail.dev", "dash.supportmail.dev", "localhost"],
  },

  optimizeDeps: {
    include: ["@sveltejs/kit", "clsx"],
    exclude: ["@lucide/svelte"],
  },

  appType: "custom",
  logLevel: "info",
});
