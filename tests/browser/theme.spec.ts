import { test, expect } from '@playwright/test';

for (const { system, label, background, foreground } of [
  {
    system: 'dark',
    label: '浅色',
    background: 'rgb(250, 250, 250)',
    foreground: 'rgb(36, 36, 36)',
  },
  {
    system: 'light',
    label: '深色',
    background: 'rgb(20, 20, 20)',
    foreground: 'rgb(233, 233, 233)',
  },
] as const) {
  test(`系统为 ${system} 时可手动切换${label}，刷新后保留实际配色`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: system });
    await page.goto('/');
    await page.getByRole('button', { name: '切换外观', exact: true }).click();
    await page.getByRole('menuitemradio', { name: label, exact: true }).click();
    await expect(page.locator('html')).toHaveCSS(
      'background-color',
      background,
    );
    await expect(page.locator('html')).toHaveCSS('color', foreground);
    await page.reload();
    await expect(page.locator('html')).toHaveCSS(
      'background-color',
      background,
    );
    await expect(page.locator('html')).toHaveCSS('color', foreground);
  });
}

test('恢复跟随系统后，实际配色随系统主题实时变化', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await page.getByRole('button', { name: '切换外观', exact: true }).click();
  await page.getByRole('menuitemradio', { name: '浅色', exact: true }).click();
  await page.getByRole('button', { name: '切换外观', exact: true }).click();
  await page
    .getByRole('menuitemradio', { name: '跟随系统', exact: true })
    .click();
  await expect(page.locator('html')).toHaveCSS(
    'background-color',
    'rgb(20, 20, 20)',
  );
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveCSS(
    'background-color',
    'rgb(250, 250, 250)',
  );
});
