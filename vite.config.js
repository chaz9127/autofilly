import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'public/manifest.json', dest: '' },
        { src: 'public/background.js', dest: '' },
        { src: 'public/contentScript.js', dest: '' },
        { src: 'public/icons', dest: 'icons' }
      ]
    })
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  }
});
