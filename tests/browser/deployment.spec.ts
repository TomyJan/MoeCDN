import { test, expect } from '@playwright/test';

test('部署配置不作为静态资源公开', async ({ request }) => {
  expect((await request.get('/edgeone.json')).status()).toBe(404);
});
