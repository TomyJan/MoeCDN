import { test, expect } from '@playwright/test';

const nestedMarkdown = '> '.repeat(10000) + 'nested';

test('深度嵌套 Markdown 预览失败仅显示局部错误且保留文件操作', async ({
  page,
}) => {
  await page.route('**/test/sample.md', (route) =>
    route.fulfill({ contentType: 'text/markdown', body: nestedMarkdown }),
  );
  await page.goto('/test/');
  const opener = page.getByRole('button', {
    name: '预览文件 sample.md',
    exact: true,
  });
  await opener.click();
  const dialog = page.locator('#preview-dialog');
  await expect(dialog.getByRole('alert')).toContainText('Markdown');
  await expect(
    dialog.getByRole('link', { name: '打开原文件', exact: true }),
  ).toHaveAttribute('href', '/test/sample.md');
  const download = page.waitForEvent('download');
  await dialog.getByRole('link', { name: '下载', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('sample.md');
  await dialog.getByRole('button', { name: '关闭', exact: true }).click();
  await expect(opener).toBeFocused();
  await expect(page.locator('#rows')).not.toBeEmpty();
});

test('深度嵌套目录 README 显示局部错误并可重试恢复', async ({ page }) => {
  let broken = true;
  await page.route('**/test/README.md', (route) =>
    route.fulfill({
      contentType: 'text/markdown',
      body: broken ? nestedMarkdown : '# Recovered README',
    }),
  );
  await page.goto('/test/');
  const readme = page.locator('#directory-readme');
  await expect(readme.getByRole('alert')).toContainText('Markdown');
  await expect(page.locator('#rows')).not.toBeEmpty();
  await expect(
    readme.getByRole('link', { name: 'README.md', exact: true }),
  ).toHaveAttribute('href', '/test/README.md');
  broken = false;
  await readme.getByRole('button', { name: '重试', exact: true }).click();
  await expect(
    readme.getByRole('heading', { name: 'Recovered README', exact: true }),
  ).toBeVisible();
});

for (const shortcut of ['/', 'ControlOrMeta+k']) {
  test(`长目录 ${shortcut} 搜索关闭后返回文件调用者并继续 Tab`, async ({
    page,
  }) => {
    await page.goto('/lib/ace/1.5.1/');
    const opener = page.locator('#rows [data-file]').nth(40);
    await opener.focus();
    await opener.scrollIntoViewIfNeeded();
    const scroll = await page.evaluate(() => window.scrollY);
    expect(scroll).toBeGreaterThan(1500);
    await page.keyboard.press(shortcut);
    await expect(page.locator('#query')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(opener).toBeFocused();
    await page.keyboard.press('Tab');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scroll);
  });
}

test('快捷搜索的调用者移除后回退到有效搜索按钮', async ({ page }) => {
  await page.goto('/test/');
  const opener = page.locator('#rows [data-file]').first();
  await opener.focus();
  await page.keyboard.press('/');
  await expect(page.locator('#query')).toBeFocused();
  await opener.evaluate((element) => element.remove());
  await page.keyboard.press('Escape');
  await expect(page.locator('#open-search')).toBeFocused();
});

test('PDF 逐页浏览释放远页画布并支持返回、快速滚动、缩放和重开', async ({
  browser,
}) => {
  test.setTimeout(90000);
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto('/web-static/public/other/');
    const opener = page.getByRole('button', {
      name: '预览文件 how2ask.pdf',
      exact: true,
    });
    await opener.click();
    const pages = page.locator('.pdf-page');
    await expect(pages).toHaveCount(17);
    for (let index = 0; index < 17; index++) {
      await pages
        .nth(index)
        .evaluate((element) => element.scrollIntoView({ block: 'center' }));
      await expect(pages.nth(index).locator('canvas')).toHaveAttribute(
        'data-rendered',
        'true',
        { timeout: 15000 },
      );
    }
    await expect
      .poll(() =>
        page
          .locator('.pdf-page canvas')
          .evaluateAll(
            (canvases) =>
              canvases.filter(
                (canvas) =>
                  (canvas as HTMLCanvasElement).width > 0 &&
                  (canvas as HTMLCanvasElement).height > 0,
              ).length,
          ),
      )
      .toBeLessThanOrEqual(4);
    const sizes = await page.locator('.pdf-page canvas').evaluateAll((nodes) =>
      nodes.map((node) => ({
        width: (node as HTMLCanvasElement).width,
        height: (node as HTMLCanvasElement).height,
      })),
    );
    expect(Math.max(...sizes.map((size) => size.width))).toBeLessThanOrEqual(
      1800,
    );
    expect(
      sizes.reduce((pixels, size) => pixels + size.width * size.height, 0),
    ).toBeLessThan(25000000);
    await expect(pages.first().locator('canvas')).toHaveAttribute('width', '0');
    const height = await pages
      .first()
      .evaluate((element) => element.getBoundingClientRect().height);
    expect(height).toBeGreaterThan(500);
    await pages
      .first()
      .evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await expect(pages.first().locator('canvas')).toHaveAttribute(
      'data-rendered',
      'true',
    );
    for (const index of [16, 0, 15, 1, 16, 0]) {
      await pages
        .nth(index)
        .evaluate((element) => element.scrollIntoView({ block: 'center' }));
      await page.setViewportSize({
        width: index % 2 ? 1150 : 1280,
        height: 900,
      });
    }
    await expect(pages.first().locator('canvas')).toHaveAttribute(
      'data-rendered',
      'true',
    );
    await expect(page.locator('.pdf-document [role="alert"]')).toHaveCount(0);
    // 改变尺寸后立即关闭，覆盖尚未完成的重绘与文档销毁。
    await page.setViewportSize({ width: 1000, height: 900 });
    await page.getByRole('button', { name: '关闭', exact: true }).click();
    await opener.click();
    await expect(pages.first().locator('canvas')).toHaveAttribute(
      'data-rendered',
      'true',
    );
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
