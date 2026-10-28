import { test, expect } from '@playwright/test';

test('浏览器前进后退时收起移动目录抽屉', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  await page.locator('[data-file="lib/"]').click();
  const trigger = page.locator('#nav-toggle');
  await trigger.click();
  await page.goBack();
  await expect(page).toHaveURL('/');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.sidebar-backdrop')).toHaveCount(0);
  await page.goForward();
  await expect(page).toHaveURL('/lib/');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('移动抽屉通过 Escape、遮罩和目录导航关闭后归还焦点', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  const trigger = page.locator('#nav-toggle');
  await trigger.click();
  await page.locator('.sidebar-backdrop').focus();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page
    .locator('.sidebar-backdrop')
    .click({ position: { x: 350, y: 700 } });
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.locator('#tree .tree-name').filter({ hasText: /^lib$/ }).click();
  await expect(page).toHaveURL('/lib/');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.keyboard.press('/');
  await expect(page.locator('#query')).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('稍微下滚即可回顶，回到顶部后按钮消失', async ({ page }) => {
  await page.goto('/lib/ace/1.5.1/');
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
