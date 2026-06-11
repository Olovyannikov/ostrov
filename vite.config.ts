import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// The React app is deployed under <Pages root>/app/ (the static prototypes live at the root).
// On GitHub Pages the project root is /ostrov/, so the React base is /ostrov/app/.
// Locally (dev/preview) we keep base '/' for convenience.
const base = process.env.GH_PAGES ? '/ostrov/app/' : '/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist/app',
    emptyOutDir: true,
  },
});
