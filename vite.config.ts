import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resourceMiddleware } from './scripts/server.ts';
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'resource-files',
      configureServer(server) {
        server.middlewares.use(resourceMiddleware('resources'));
      },
    },
  ],
  build: { assetsDir: '_moecdn/assets', sourcemap: false },
  server: { host: '127.0.0.1' },
});
