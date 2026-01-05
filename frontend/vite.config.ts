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

// Custom onwarn to suppress "use client" directive warnings
const suppressUseClientWarning = {
  name: 'suppress-use-client-warning',
  config: () => ({
    build: {
      rollupOptions: {
        onwarn(warning, handler) {
          // Suppress the exact "use client" directive warning
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
            return;
          }
          // Also cover any import.meta deprecations
          if (warning.message.includes('import.meta')) {
            return;
          }
          // Pass all other warnings/errors to the default handler
          handler(warning);
        },
      },
    },
  }),
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [suppressUseClientWarning, react()],  // Our suppressor FIRST, then react()
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
    // Optional: Keep rollupOptions here if needed, but our plugin handles onwarn
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});