import { defineConfig } from 'vite';

export default defineConfig({
  base: '/power-game-v19/',
  root: '.',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: 'index.html',
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    open: false,
    port: 3000,
  },
});