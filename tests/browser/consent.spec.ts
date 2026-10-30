import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('旧偏好记录损坏为 null 时条款和告知仍可使用', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('moecdn.preferences', 'null'),
  );
  await page.goto('/privacy/');
  await expect(
    page.getByRole('heading', { level: 1, name: '隐私政策' }),
  ).toBeVisible();
  await expect(page.locator('#cookie-notice')).toBeVisible();
});

test('新访客确认后开放预览和复制，刷新保留确认', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/test/');
  const notice = page.locator('#cookie-notice');
  const file = page.locator('[data-file="test/sample.js"]');
  const row = page.locator('#rows tr').filter({ has: file });
  const copy = row.getByRole('button', { name: '复制链接', exact: true });
  const advanced = row.getByRole('button', { name: '高级复制', exact: true });
  await expect(notice).toBeVisible();
  await expect(file).toBeDisabled();
  await expect(copy).toBeDisabled();
  await expect(advanced).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(notice).toBeVisible();
  await notice.getByRole('button', { name: '同意并继续' }).click();
  await expect(notice).toBeHidden();
  await expect(file).toBeEnabled();
  await copy.click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toMatch(/\/test\/sample\.js$/);
  await advanced.click();
  await expect(page.locator('#copy-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await file.click();
  await expect(page.locator('#preview-dialog')).toBeVisible();
  await page.reload();
  await expect(notice).toBeHidden();
  await expect(file).toBeEnabled();
});

test('告知和页脚均能阅读条款，不要求先确认，支持直达刷新和后退', async ({
  page,
}) => {
  await page.goto('/test/');
  const notice = page.locator('#cookie-notice');
  await notice.getByRole('link', { name: '用户协议', exact: true }).click();
  await expect(page).toHaveURL('/terms/');
  await expect(
    page.getByRole('heading', { level: 1, name: '用户协议' }),
  ).toBeVisible();
  await page
    .locator('.page-footer')
    .getByRole('link', { name: '隐私政策', exact: true })
    .click();
  await expect(page).toHaveURL('/privacy/');
  await expect(
    page.getByRole('heading', { level: 1, name: '隐私政策' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { level: 1, name: '隐私政策' }),
  ).toBeVisible();
  await expect(notice).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL('/terms/');
  await expect(
    page.getByRole('heading', { level: 1, name: '用户协议' }),
  ).toBeVisible();
});

test('搜索结果中的文件预览和复制同样需要确认', async ({ page }) => {
  await page.goto('/test/');
  await page.locator('#open-search').click();
  await page.locator('#query').fill('sample.js');
  const result = page.locator('.search-result').filter({
    has: page.getByRole('button', {
      name: '预览文件 sample.js',
      exact: true,
    }),
  });
  await expect(
    result.getByRole('button', { name: '预览文件 sample.js', exact: true }),
  ).toBeDisabled();
  await expect(
    result.getByRole('button', { name: '复制链接', exact: true }),
  ).toBeDisabled();
  await expect(
    result.getByRole('button', { name: '高级复制', exact: true }),
  ).toBeDisabled();
  await page.keyboard.press('Escape');
  await page
    .locator('#cookie-notice')
    .getByRole('button', { name: '同意并继续' })
    .click();
  await page.locator('#open-search').click();
  await expect(
    result.getByRole('button', { name: '预览文件 sample.js', exact: true }),
  ).toBeEnabled();
});

for (const saved of [
  'true',
  '{',
  JSON.stringify({ version: '2000-01-01', acceptedAt: '2026-10-30T00:00:00Z' }),
]) {
  test('无效或过期的确认记录不开放文件操作：' + saved, async ({ page }) => {
    await page.addInitScript(
      (value) => localStorage.setItem('moecdn.consent', value),
      saved,
    );
    await page.goto('/test/');
    await expect(page.locator('#cookie-notice')).toBeVisible();
    await expect(page.locator('[data-file="test/sample.js"]')).toBeDisabled();
  });
}

test('浏览器禁用本地存储时仍能在当前会话确认并使用文件', async ({ page }) => {
  await page.addInitScript(() => {
    for (const name of ['getItem', 'setItem'])
      Object.defineProperty(Storage.prototype, name, {
        configurable: true,
        value() {
          throw new DOMException('Unavailable', 'SecurityError');
        },
      });
  });
  // 原统计脚本会因存储限制报错；本例验证本站降级，不改变第三方行为。
  await page.goto('/test/');
  await page
    .locator('#cookie-notice')
    .getByRole('button', { name: '同意并继续' })
    .click();
  await expect(page.locator('[data-file="test/sample.js"]')).toBeEnabled();
  await page.locator('[data-file="test/sample.js"]').click();
  await expect(page.locator('#preview-dialog')).toBeVisible();
});

test('其他标签页确认或清除记录时同步更新，失效后关闭高级复制', async ({
  page,
  context,
}) => {
  await page.goto('/test/');
  const other = await context.newPage();
  await other.goto('/test/');
  await page
    .locator('#cookie-notice')
    .getByRole('button', { name: '同意并继续' })
    .click();
  await expect(other.locator('#cookie-notice')).toBeHidden();
  await other.locator('[data-advanced="test/sample.js"]').click();
  await expect(other.locator('#copy-dialog')).toBeVisible();
  await page.evaluate(() => localStorage.removeItem('moecdn.consent'));
  await expect(other.locator('#cookie-notice')).toBeVisible();
  await expect(other.locator('#copy-dialog')).toBeHidden();
  await expect(other.locator('[data-file="test/sample.js"]')).toBeDisabled();
});

test('资源索引不可用时条款及联系入口仍可独立阅读', async ({ page }) => {
  await page.route('**/_moecdn/catalog.json', (route) =>
    route.fulfill({ status: 503, body: 'Unavailable' }),
  );
  await page.goto('/privacy/');
  await expect(
    page.getByRole('heading', { level: 1, name: '隐私政策' }),
  ).toBeVisible();
  await expect(
    page.locator(
      '.legal-page a[href="https://github.com/TomyJan/MoeCDN/issues"]',
    ),
  ).toBeVisible();
  await page
    .locator('.page-footer')
    .getByRole('link', { name: '用户协议', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { level: 1, name: '用户协议' }),
  ).toBeVisible();
});

for (const viewport of [
  { width: 320, colorScheme: 'light' as const },
  { width: 390, colorScheme: 'dark' as const },
]) {
  test(
    '窄屏告知与页脚可完整操作：' +
      viewport.width +
      'px ' +
      viewport.colorScheme,
    async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: 740 });
      await page.emulateMedia({
        colorScheme: viewport.colorScheme,
        reducedMotion: 'reduce',
      });
      await page.goto('/terms/');
      const notice = page.locator('#cookie-notice');
      await expect(notice).toBeVisible();
      await page.locator('.page-footer').scrollIntoViewIfNeeded();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const box = await notice.boundingBox();
      expect(box && box.x >= 0 && box.x + box.width <= viewport.width).toBe(
        true,
      );
      const link = page
        .locator('.page-footer')
        .getByRole('link', { name: '隐私政策', exact: true });
      await link.click();
      await expect(page).toHaveURL('/privacy/');
      await notice.getByRole('button', { name: '同意并继续' }).click();
      await expect(notice).toBeHidden();
      await page.getByRole('button', { name: '切换语言' }).click();
      await page.getByRole('menuitemradio', { name: 'English' }).click();
      await expect(
        page.getByRole('heading', { level: 1, name: 'Privacy Policy' }),
      ).toBeVisible();
    },
  );
}
