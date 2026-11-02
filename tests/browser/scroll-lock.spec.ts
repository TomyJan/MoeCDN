import { test, expect, type Page } from '@playwright/test';

async function horizontalLayout(page: Page) {
  return page.evaluate(() =>
    ['body', '.topbar', 'main', '.back-to-top'].map((selector) => {
      const { x, width } = document
        .querySelector(selector)!
        .getBoundingClientRect();
      return { selector, x, width };
    }),
  );
}

test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

for (const width of [1280, 390]) {
  test(`${width}px 下打开和关闭浮层不改变页面横向布局`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ['/test/', '/lib/aplayer/1.10.1/']) {
      await page.goto(path);
      await expect(page.locator('#rows .file-name').first()).toBeVisible();
      await expect(page.locator('.back-to-top')).toHaveCSS('opacity', '0');
      const before = await horizontalLayout(page);
      for (const name of ['切换外观', '名称升序']) {
        await page.getByRole('button', { name, exact: true }).click();
        await expect(page.locator('body')).toHaveAttribute(
          'data-scroll-locked',
        );
        await expect.poll(() => horizontalLayout(page)).toEqual(before);
        await page.keyboard.press('Escape');
        await expect(page.locator('body')).not.toHaveAttribute(
          'data-scroll-locked',
        );
        await expect.poll(() => horizontalLayout(page)).toEqual(before);
      }
      await page.locator('#open-search').click();
      await expect(page.locator('#search-dialog')).toBeVisible();
      await expect.poll(() => horizontalLayout(page)).toEqual(before);
      // 搜索内部再开菜单，检查嵌套滚动锁没有重复补偿。
      await page.locator('.scope-picker button').click();
      await expect(page.getByRole('menu')).toBeVisible();
      await expect.poll(() => horizontalLayout(page)).toEqual(before);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('menu')).toHaveCount(0);
      await page.keyboard.press('Escape');
      await expect(page.locator('body')).not.toHaveAttribute(
        'data-scroll-locked',
      );
      await expect.poll(() => horizontalLayout(page)).toEqual(before);

      await page
        .getByRole('button', { name: /^预览文件 / })
        .first()
        .click();
      await expect(page.locator('#preview-dialog')).toBeVisible();
      await expect.poll(() => horizontalLayout(page)).toEqual(before);
      await page.keyboard.press('Escape');
      await expect(page.locator('body')).not.toHaveAttribute(
        'data-scroll-locked',
      );
      await expect.poll(() => horizontalLayout(page)).toEqual(before);

      if (width === 390) {
        await page.locator('#nav-toggle').click();
        await expect(page.locator('body')).toHaveAttribute(
          'data-scroll-locked',
        );
        await expect.poll(() => horizontalLayout(page)).toEqual(before);
        await page.keyboard.press('Escape');
        await expect(page.locator('body')).not.toHaveAttribute(
          'data-scroll-locked',
        );
        await expect.poll(() => horizontalLayout(page)).toEqual(before);
      }
    }
  });
}
