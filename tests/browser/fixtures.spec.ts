import { test, expect } from '@playwright/test';

test('测试目录提供可预览的图片、媒体、PDF、字体和可下载的二进制', async ({
  page,
  request,
}) => {
  await page.goto('/test/');
  for (const extension of ['png', 'jpg', 'webp', 'gif', 'svg']) {
    await page
      .getByRole('button', {
        name: `预览文件 sample.${extension}`,
        exact: true,
      })
      .click();
    await expect(page.locator('#preview-extra')).toContainText('×');
    await page.getByRole('button', { name: '关闭', exact: true }).click();
    await expect(page.locator('#preview-dialog')).toBeHidden();
  }
  for (const extension of ['wav', 'mp3', 'mp4', 'webm']) {
    await page
      .getByRole('button', {
        name: `预览文件 sample.${extension}`,
        exact: true,
      })
      .click();
    await expect
      .poll(() =>
        page
          .locator('audio, video')
          .evaluate((el: HTMLMediaElement) => el.duration),
      )
      .toBeGreaterThan(0);
    await page.getByRole('button', { name: '关闭', exact: true }).click();
    await expect(page.locator('#preview-dialog')).toBeHidden();
  }
  await page
    .getByRole('button', { name: '预览文件 sample.pdf', exact: true })
    .click();
  await expect(
    page.locator('.pdf-page canvas[data-rendered="true"]'),
  ).toBeVisible();
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await expect(page.locator('#preview-dialog')).toBeHidden();
  await page
    .getByRole('button', { name: '预览文件 sample.woff2', exact: true })
    .click();
  await expect(page.locator('.font-preview')).toHaveCSS(
    'font-family',
    /moecdn-preview/,
  );
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await expect(page.locator('#preview-dialog')).toBeHidden();
  await page
    .getByRole('button', { name: '预览文件 sample.zip', exact: true })
    .click();
  await expect(page.locator('.preview-unavailable')).toBeVisible();
  const zip = await request.get('/test/sample.zip');
  expect(zip.ok()).toBe(true);
  expect((await zip.body()).subarray(0, 2).toString()).toBe('PK');
  const special = await request.get(
    '/test/' + encodeURIComponent('中文 空格#%.txt'),
  );
  expect(await special.text()).toContain('特殊文件名');
});
