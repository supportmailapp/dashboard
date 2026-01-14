import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      out: "build",
      precompress: false,
    }),
    alias: {
      $ui: "src/lib/components/ui",
      $lib: "src/lib",
      $stores: "src/lib/stores",
      $db: "src/lib/server/db",
      $v1Api: "src/routes/api/v1",
    },
    csp: {
      mode: "auto",
      directives: {
        "frame-ancestors": [
          "'self'",
          "https:\/\/*.paddle.com",
          "localhost",
          "data:",
          "https:\/\/*.suportmail.dev",
        ],
      },
    },
    prerender: { handleHttpError: "warn", origin: "https://supportmail.dev" },
  },
  vitePlugin: {
    inspector:
      process.env.NODE_ENV === "development"
        ? {
            toggleKeyCombo: "control-shift",
          }
        : false,
  },
};

export default config;
