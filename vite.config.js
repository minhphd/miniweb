import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        designExplorer: fileURLToPath(new URL('./design-explorer.html', import.meta.url)),
        structureExplorer: fileURLToPath(new URL('./structure-explorer.html', import.meta.url)),
        structurePreview: fileURLToPath(new URL('./structure-preview.html', import.meta.url)),
      },
    },
  },
});
