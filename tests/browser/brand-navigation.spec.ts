import { test, expect } from '@playwright/test';

test('品牌链接保留 Ctrl/Cmd 新标签页行为，普通点击仍在站内导航', async ({
  page,
  context,
}) => {
  await page.goto('/lib/jquery/');
  const brand = page.getByRole('link', { name: 'MoeCDN', exact: true }).first();
  const [opened] = await Promise.all([
    context.waitForEvent('page'),
    brand.click({ modifiers: ['ControlOrMeta'] }),
  ]);
  await expect(opened).toHaveURL('/');
  await expect(page).toHaveURL('/lib/jquery/');
  await opened.close();
  await brand.click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('#rows')).toContainText('lib');
});
