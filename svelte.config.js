import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $ui: "src/lib/components/ui",
      $lib: "src/lib",
      $stores: "src/lib/stores",
      $db: "src/lib/server/db",
    },
  },
};

export default config;
