import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit(), tailwindcss()],

  server: {
    port: 5050,
    cors: {
      credentials: true,
    },
  },

  appType: 'custom',
  clearScreen: true,
});
