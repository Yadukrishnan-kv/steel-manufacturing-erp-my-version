// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import path from 'path';

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: {
//       '@': path.resolve(__dirname, './src'),
//     },
//   },
//   server: {
//     port: 5173,
//     host: true,
//     proxy: {
//       '/api': {
//         target: 'http://localhost:3000',
//         changeOrigin: true,
//       },
//     },
//   },
//   build: {
//     outDir: 'dist',
//     sourcemap: true,
//   },
//   test: {
//     globals: true,
//     environment: 'jsdom',
//     setupFiles: ['./src/test/setup.ts'],
//   },
// });

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        // Suppress the common "Module level directives cause errors when bundled" warning
        // This is triggered by "use client" in files (harmless for client-side React apps)
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return;
        }
        // Also suppress any import.meta-related deprecations if present
        if (warning.message.includes('import.meta')) {
          return;
        }
        // Let all other warnings/errors show (so real problems aren't hidden)
        if (defaultHandler) {
          defaultHandler(warning);
        }
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});