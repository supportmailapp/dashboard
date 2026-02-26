import { sentrySvelteKit } from "@sentry/sveltekit";
import devtoolsJson from "vite-plugin-devtools-json";
import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  console.log("Sentr yauth token", env.SENTRY_AUTH_TOKEN?.slice(0, 5) + "...");

  return {
    build: {
      sourcemap: "hidden",
    },
    plugins: [
      sentrySvelteKit({
        org: "lukez-dev",
        project: "supportmail-dashboard",
        adapter: "node",
        authToken: env.SENTRY_AUTH_TOKEN,
        autoUploadSourceMaps: true,
        sourcemaps: {
          filesToDeleteAfterUpload: ["./**/*.map", ".svelte-kit/**/*.map"],
        },
      }),
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
  };
});
