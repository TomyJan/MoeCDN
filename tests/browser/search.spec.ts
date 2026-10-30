import { test, expect } from '@playwright/test';

for (const path of ['/history/', '/missing-directory/']) {
  test(`${path} 从移动目录打开快捷搜索，关闭后回焦目录按钮`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto(path);
    const trigger = page.locator('#nav-toggle');
    await trigger.click();
    await expect(
      page.getByRole('dialog', { name: '目录导航', exact: true }),
    ).toBeVisible();
    await page.keyboard.press('/');
    await expect(page.locator('#query')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#search-dialog')).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test(`${path} 关闭快捷搜索后恢复原焦点和滚动位置`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('#open-search')).toHaveCount(0);
    const opener = page.locator('footer a[href="/history/"]');
    await opener.focus();
    const scroll = await page.evaluate(() => window.scrollY);
    await page.keyboard.press('/');
    await expect(page.locator('#query')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#search-dialog')).toBeHidden();
    await expect(opener).toBeFocused();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scroll);
  });
}

test('从移动目录打开搜索后立即按 Esc，也能关闭并恢复焦点', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/missing-directory/');
  const trigger = page.locator('#nav-toggle');
  await trigger.click();
  await expect(
    page.getByRole('dialog', { name: '目录导航', exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    const escapeOnFocus = (event: FocusEvent) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.id !== 'query') return;
      document.removeEventListener('focusin', escapeOnFocus, true);
      document.documentElement.dataset.searchEscapeDispatched = 'true';
      input.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        }),
      );
    };
    document.addEventListener('focusin', escapeOnFocus, true);
  });
  await page.keyboard.press('/');
  await expect(page.locator('html')).toHaveAttribute(
    'data-search-escape-dispatched',
    'true',
  );
  await expect(page.locator('#search-dialog')).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('关闭进行中的搜索续载后重开，不残留加载提示且仍可续载', async ({
  page,
}) => {
  await page.goto('/');
  const trigger = page.locator('#open-search');
  await trigger.click();
  await page.locator('#query').fill('.js');
  await expect(page.locator('.search-result')).toHaveCount(100);
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.locator('#search-results').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  const loading = page.locator('.search-load-status');
  await expect(loading).toBeVisible();
  await page.keyboard.press('Escape');
  await page.clock.runFor(500);
  await trigger.click();
  await expect(page.locator('#query')).toHaveValue('.js');
  await expect(page.locator('.search-result')).toHaveCount(100);
  await expect(loading).toBeHidden();
  await page.locator('#search-results').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(loading).toBeVisible();
  await page.clock.runFor(500);
  await expect(page.locator('.search-result')).toHaveCount(200);
  await expect(loading).toBeHidden();
});

test('标题按钮打开搜索浮层，独立结果递归搜索且背景目录不变', async ({
  page,
}) => {
  await page.goto('/lib/jquery/');
  const trigger = page.getByRole('button', { name: '搜索', exact: true });
  await expect(page.locator('#query')).toHaveCount(0);
  await expect(page.locator('#copy-directory')).toHaveCount(0);
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: '搜索', exact: true });
  await expect(dialog).toBeVisible();
  await expect(page.locator('#query')).toBeFocused();
  await expect(page.locator('#search-results')).toBeHidden();
  await page.locator('#query').fill('jquery.js');
  await expect(page.locator('#search-results')).toContainText('3.6.0');
  await expect(page.locator('#rows')).not.toContainText('jquery.js');
  expect(
    await dialog.evaluate((element) => {
      const input = element
        .querySelector('.searchbox')!
        .getBoundingClientRect();
      const results = element
        .querySelector('#search-results')!
        .getBoundingClientRect();
      return results.top > input.bottom && input.top < innerHeight / 3;
    }),
  ).toBe(true);
  await page.locator('#query').fill('APlayer.min.css');
  await expect(page.locator('#search-empty')).toBeVisible();
  await page.getByRole('button', { name: '当前目录', exact: true }).click();
  await page.getByRole('menuitemradio', { name: '全站', exact: true }).click();
  await expect(page.getByRole('menu')).toBeHidden();
  await expect(page.locator('#search-results')).toContainText(
    'APlayer.min.css',
  );
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page).toHaveURL('/lib/jquery/');
});

test('搜索结果可预览和高级复制，关闭预览后返回搜索，目录结果正常跳转', async ({
  page,
}) => {
  await page.goto('/test/');
  await page.keyboard.press('/');
  await page.locator('#query').fill('sample.py');
  const results = page.locator('#search-results');
  await results.getByRole('button', { name: '高级复制', exact: true }).click();
  await expect(page.locator('#copy-dialog')).toBeVisible();
  await results.getByRole('button', { name: '高级复制', exact: true }).click();
  await expect(page.locator('#copy-dialog')).toBeHidden();
  await results
    .getByRole('button', { name: '预览文件 sample.py', exact: true })
    .click();
  await expect(page.locator('#preview-dialog')).toBeVisible();
  await page
    .locator('#preview-dialog')
    .getByRole('button', { name: '关闭', exact: true })
    .click();
  await expect(page.locator('#query')).toHaveValue('sample.py');
  await expect(
    results.getByRole('button', { name: '预览文件 sample.py', exact: true }),
  ).toBeFocused();
  await page.locator('#query').fill('nested');
  await results
    .getByRole('button', { name: '打开文件夹 nested', exact: true })
    .click();
  await expect(page).toHaveURL('/test/nested/');
  await expect(page.locator('#search-dialog')).toBeHidden();
  await expect(page.locator('#rows')).toContainText('child.txt');
});

test('窄屏搜索可清空、切换范围、点击遮罩关闭，结果自动续载', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  await page.getByRole('button', { name: '搜索', exact: true }).click();
  await page.locator('#query').fill('.js');
  await expect(page.locator('.search-result')).toHaveCount(100);
  await page.locator('#search-results').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(page.locator('.search-result')).toHaveCount(200);
  expect(
    await page.locator('#search-dialog').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return (
        rect.left >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight
      );
    }),
  ).toBe(true);
  await page.getByRole('button', { name: '清空搜索', exact: true }).click();
  await expect(page.locator('#search-results')).toBeHidden();
  await expect(page.locator('#query')).toBeFocused();
  await page.locator('.search-overlay').click({ position: { x: 5, y: 5 } });
  await expect(page.locator('#search-dialog')).toBeHidden();
});

test('保留查询关闭重开搜索后，仍能自动续载', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: '搜索', exact: true });
  await trigger.click();
  await page.locator('#query').fill('.js');
  await expect(page.locator('.search-result')).toHaveCount(100);
  await page.keyboard.press('Escape');
  await expect(page.locator('#search-dialog')).toBeHidden();
  await trigger.click();
  await expect(page.locator('#query')).toHaveValue('.js');
  await page.locator('#search-results').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(page.locator('.search-result')).toHaveCount(200);
});
