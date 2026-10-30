import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  use: {
    channel: 'chromium',
    baseURL: 'http://127.0.0.1:4179',
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
    storageState: {
      cookies: [],
      origins: [
        {
          origin: 'http://127.0.0.1:4179',
          localStorage: [
            {
              name: 'moecdn.consent',
              value: JSON.stringify({
                version: '2026-10-30',
                acceptedAt: '2026-10-30T00:00:00Z',
              }),
            },
          ],
        },
      ],
    },
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: {
    command: 'pnpm build && pnpm preview',
    url: 'http://127.0.0.1:4179',
    reuseExistingServer: false,
    timeout: 180000,
  },
});
