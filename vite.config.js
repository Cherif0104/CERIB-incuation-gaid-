import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 7000, // port personnalisé demandé
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
