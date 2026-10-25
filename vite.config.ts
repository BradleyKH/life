import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths so the build works when served from a subpath (e.g. GitHub Pages).
  base: './',
  // three.js alone is ~600 kB minified; one chunk is fine for a single-page app.
  build: { chunkSizeWarningLimit: 800 },
});
