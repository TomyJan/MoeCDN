import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { Features } from 'lightningcss';
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
  css: {
    // 降级后的媒体查询忽略手动 color-scheme，保留原生主题取色。
    lightningcss: { exclude: Features.LightDark },
  },
  build: { assetsDir: '_moecdn/assets', sourcemap: false },
  server: { host: '127.0.0.1' },
});
