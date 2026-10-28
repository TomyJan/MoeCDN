import { test, expect } from '@playwright/test';

test('稍微下滚即可回顶，回到顶部后按钮消失', async ({ page }) => {
  await page.goto('/lib/');
  await page.locator('#query').fill('.js');
  await expect(page.locator('#rows tr')).toHaveCount(100);
  await page.evaluate(() => window.scrollTo(0, 110));
  const back = page.getByRole('button', { name: '回到顶部', exact: true });
  await expect(back).not.toHaveAttribute('inert');
  await expect(back).toHaveCSS('opacity', '1');
  await back.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(back).toHaveAttribute('inert');
  await expect(back).toHaveCSS('opacity', '0');
});

test('导航文字仅在空间不足时收为图标，扩宽及语言切换后重新判断', async ({
  page,
}) => {
  await page.setViewportSize({ width: 500, height: 800 });
  await page.goto('/');
  for (const label of ['主页', '博客']) {
    await expect(
      page.locator('.nav-link span', { hasText: label }),
    ).toBeVisible();
  }
  await page.setViewportSize({ width: 320, height: 800 });
  await expect(page.locator('.nav-link > svg').first()).toBeVisible();
  await expect(page.locator('.nav-link span').first()).toBeHidden();
  for (const label of ['主页', '博客']) {
    await expect(
      page.getByRole('link', { name: label, exact: true }),
    ).toBeVisible();
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 500, height: 800 });
  await expect(page.locator('.nav-link span').first()).toBeVisible();
  await page.getByRole('button', { name: '切换语言', exact: true }).click();
  await page
    .getByRole('menuitemradio', { name: 'English', exact: true })
    .click();
  await expect(
    page.getByRole('link', { name: 'Home', exact: true }).locator('span'),
  ).toBeVisible();
  await page.setViewportSize({ width: 320, height: 800 });
  await expect(page.locator('.nav-link span').first()).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
