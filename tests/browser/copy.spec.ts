import { test, expect } from '@playwright/test';

test('高级复制支持键盘进入、切换格式和退出恢复焦点', async ({ page }) => {
  await page.goto('/test/');
  const trigger = page.locator('[data-advanced="test/sample.js"]');
  await trigger.focus();
  await page.keyboard.press('Enter');
  const popup = page.locator('#copy-dialog');
  await expect(popup).toBeVisible();
  await expect(
    popup.getByRole('button', { name: '文件直链', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(popup.locator('#copy-output')).toHaveValue(
    /\/test\/sample\.js$/,
  );
  await page.keyboard.press('Tab');
  await expect(popup).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(popup).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('启用 SRI 时同步勾选并锁定 CORS，取消后保留独立选择', async ({ page }) => {
  await page.goto('/test/');
  await page.locator('[data-advanced="test/sample.js"]').click();
  const sri = page.locator('#include-sri');
  const cors = page.locator('#include-cors');
  await sri.check();
  await expect(cors).toBeChecked();
  await expect(cors).toBeDisabled();
  await expect(page.locator('#copy-output')).toHaveValue(
    /integrity=.*crossorigin="anonymous"/,
  );
  await sri.uncheck();
  await expect(cors).toBeEnabled();
  await expect(cors).not.toBeChecked();
  await cors.check();
  await sri.check();
  await sri.uncheck();
  await expect(cors).toBeChecked();
});

test('切换另一文件的高级复制后，焦点留在新浮层', async ({ page }) => {
  await page.goto('/test/');
  await page.clock.install();
  await page.locator('[data-advanced="test/sample.js"]').click();
  await page.locator('[data-advanced="test/sample.css"]').click();
  await page.clock.runFor(300);
  const popup = page.locator('#copy-dialog');
  await expect(popup.locator('#copy-output')).toHaveValue(/sample\.css/);
  await expect(
    popup.getByRole('button', { name: '文件直链', exact: true }),
  ).toBeFocused();
});

test('关闭动画中打开另一文件时，旧浮层不抢回焦点', async ({ page }) => {
  await page.goto('/test/');
  await page.locator('[data-advanced="test/sample.js"]').click();
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.keyboard.press('Escape');
  await page.locator('[data-advanced="test/sample.css"]').click();
  await page.clock.runFor(300);
  const popup = page.locator('#copy-dialog');
  await expect(popup.locator('#copy-output')).toHaveValue(/sample\.css/);
  await expect(
    popup.getByRole('button', { name: '文件直链', exact: true }),
  ).toBeFocused();
});
