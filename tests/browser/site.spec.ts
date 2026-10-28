import { test, expect } from '@playwright/test';

test('PDF 使用安全的页面渲染器显示真实内容', async ({ page }) => {
  await page.goto('/web-static/public/other/');
  await page
    .getByRole('button', { name: '预览文件 how2ask.pdf', exact: true })
    .click();
  const canvas = page.locator('.pdf-page canvas[data-rendered="true"]').first();
  await expect(canvas).toBeVisible({ timeout: 15000 });
  expect(
    await canvas.evaluate((element: HTMLCanvasElement) => {
      const pixels = element
        .getContext('2d')!
        .getImageData(0, 0, element.width, element.height).data;
      return pixels.some((value, index) => index % 4 !== 3 && value < 180);
    }),
  ).toBe(true);
  await expect(page.locator('#preview-body iframe')).toHaveCount(0);
});

test('真实路径直达、刷新、前进后退与原始 index.html 共存', async ({
  page,
  request,
}) => {
  await page.goto('/lib/');
  await expect(page.locator('#title')).toHaveText('lib');
  await page
    .getByRole('button', { name: '打开文件夹 jquery', exact: true })
    .click();
  await expect(page).toHaveURL(/\/lib\/jquery\/$/);
  await page.reload();
  await expect(page.locator('#title')).toHaveText('jquery');
  await page.goBack();
  await expect(page.locator('#title')).toHaveText('lib');
  await page.goForward();
  await expect(page.locator('#title')).toHaveText('jquery');
  const raw = await request.get(
    '/web-static/public/wordpress-argon-theme/latest/assets/vendor/svg-loaders/index.html',
  );
  expect(raw.ok()).toBeTruthy();
  expect(await raw.text()).not.toContain('id="root"');
  await page.goto(
    '/web-static/public/wordpress-argon-theme/latest/assets/vendor/svg-loaders/',
  );
  await expect(page.locator('#title')).toHaveText('svg-loaders');
  expect((await request.get('/missing-file.js')).status()).toBe(404);
});

test('递归搜索、范围切换、空状态与目录树', async ({ page }) => {
  await page.goto('/lib/jquery/');
  await page.locator('#query').fill('jquery.js');
  await expect(page.locator('#rows tr')).not.toHaveCount(0);
  await expect(page.locator('#rows')).toContainText('3.6.0');
  await page.locator('#query').fill('test.css');
  await expect(page.locator('#empty')).toBeVisible();
  await page.getByRole('button', { name: '当前目录', exact: true }).click();
  await page.getByRole('menuitemradio', { name: '全站', exact: true }).click();
  await expect(page.locator('#rows')).toContainText('test.css');
  await expect(
    page.getByRole('button', { name: '收起 lib', exact: true }),
  ).toHaveAttribute('aria-expanded', 'true');
});

test('共享高级复制浮层记住选择、按类型隐藏选项、同按钮开关', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  const trigger = page.locator('[data-advanced="test.css"]');
  await trigger.click();
  await page.locator('#include-sri').check();
  await page.locator('#include-cors').check();
  await expect(page.locator('#copy-output')).toHaveValue(/integrity="sha384-/);
  await page.getByRole('button', { name: '文件直链', exact: true }).click();
  await expect(page.locator('#include-sri')).toBeHidden();
  await expect(page.locator('#copy-output')).not.toHaveValue(/integrity=/);
  await page.getByRole('button', { name: 'HTML 标签', exact: true }).click();
  await expect(page.locator('#include-sri')).toBeChecked();
  await page.locator('#copy-confirm').click();
  await expect(page.locator('#copy-confirm')).toHaveAttribute(
    'data-copied',
    'true',
  );
  await expect(page.locator('#copy-confirm')).toHaveAttribute(
    'data-copied',
    'false',
    { timeout: 2000 },
  );
  await trigger.click();
  await expect(page.locator('#copy-dialog')).toBeHidden();
  await page.locator('[data-advanced="README.md"]').click();
  await expect(
    page.getByRole('button', { name: 'HTML 标签', exact: true }),
  ).toBeHidden();
});

test('弹窗预览、渲染对照和元数据，不执行 HTML 脚本', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: '预览文件 README.md', exact: true })
    .click();
  await expect(page.locator('#preview-dialog')).toBeVisible();
  await expect(page.locator('.code-preview')).toContainText('MoeCDN');
  await page.getByRole('button', { name: '对照', exact: true }).click();
  await expect(page.locator('.render-pane')).toBeVisible();
  await expect(page.locator('.render-pane')).toHaveAttribute('sandbox', '');
  await expect(page.locator('#preview-properties')).not.toContainText('创建');
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page
    .getByRole('button', { name: '预览文件 favicon.ico', exact: true })
    .click();
  await expect(page.locator('#preview-extra')).toContainText('×');
});

test('语言主题切换和窄屏无溢出', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '切换语言', exact: true }).click();
  await page
    .getByRole('menuitemradio', { name: 'English', exact: true })
    .click();
  await expect(page.locator('#title')).toHaveText('All files');
  await page.getByRole('button', { name: 'Appearance', exact: true }).click();
  await page.getByRole('menuitemradio', { name: 'Light', exact: true }).click();
  await page.reload();
  await expect(page.locator('#title')).toHaveText('All files');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 800 });
    await page.locator('[data-advanced="test.css"]').click();
    const box = await page.locator('#copy-dialog').boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.keyboard.press('Escape');
  }
});

test('接近底部自动加载，不显示手动按钮', async ({ page }) => {
  await page.goto('/lib/');
  await page.locator('#query').fill('.js');
  await expect(page.locator('#rows tr')).toHaveCount(100);
  await page.locator('#load-sentinel').scrollIntoViewIfNeeded();
  await expect
    .poll(() => page.locator('#rows tr').count())
    .toBeGreaterThan(100);
  await expect(
    page.getByRole('button', { name: /显示更多|加载更多/ }),
  ).toHaveCount(0);
});

test('预览中复用复制浮层并阻止待预览网页执行脚本', async ({ page }) => {
  await page.route('**/404.html', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html><head><title>unsafe</title></head><body><p>HTML preview</p><script>parent.__executed=true;document.body.textContent="EXECUTED"</script></body></html>',
    }),
  );
  await page.goto('/');
  await page
    .getByRole('button', { name: '预览文件 404.html', exact: true })
    .click();
  await page.getByRole('button', { name: '渲染', exact: true }).click();
  await expect(page.frameLocator('.render-pane').locator('p')).toHaveText(
    'HTML preview',
  );
  expect(await page.evaluate(() => '__executed' in window)).toBe(false);
  await page.locator('#preview-advanced').click();
  await expect(page.locator('#copy-dialog')).toBeVisible();
  await page.locator('#preview-advanced').click();
  await expect(page.locator('#copy-dialog')).toBeHidden();
  await page.getByRole('button', { name: '关闭', exact: true }).click();
});
