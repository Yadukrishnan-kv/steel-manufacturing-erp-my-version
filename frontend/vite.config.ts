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
        // Suppress the "use client" directive warnings that cause Vercel build failures
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return;
        }
        // Optional: Also suppress import.meta deprecations if they appear
        if (warning.message.includes('import.meta')) {
          return;
        }
        // Pass through all other warnings/errors
        defaultHandler(warning);
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});

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

