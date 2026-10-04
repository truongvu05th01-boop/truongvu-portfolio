import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Build as a single IIFE bundle so we can embed it in a vanilla HTML page
  build: {
    // Output to ../lanyard-dist so the parent portfolio can reference it
    outDir: '../lanyard-dist',
    emptyOutDir: true,
    // Inline everything into a single JS bundle + single CSS file
    rollupOptions: {
      input: 'src/main.jsx',
      output: {
        // IIFE so it runs immediately — no ES module needed
        format: 'iife',
        entryFileNames: 'lanyard-widget.js',
        assetFileNames: 'lanyard-widget[extname]',
        // Bundle everything, don't externalize
        inlineDynamicImports: true,
      },
    },
    // Inline all assets as data URIs (including .glb files)
    assetsInlineLimit: 10000000, // 10MB limit to force .glb inline as base64
  },
  // Configure asset handling so .glb files get embedded as base64 data URIs
  assetsInclude: ['**/*.glb'],
});
