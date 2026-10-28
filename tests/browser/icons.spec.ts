import { test, expect } from '@playwright/test';

test('文件图标按完整主题映射发布，搜索结果也显示对应图标', async ({
  page,
  request,
}) => {
  await page.goto('/test/');
  for (const [file, icon] of [
    ['sample.py', 'python'],
    ['sample.sql', 'database'],
    ['sample.sh', 'console'],
    ['sample.ts', 'typescript'],
  ]) {
    const image = page
      .getByRole('button', { name: `预览文件 ${file}`, exact: true })
      .locator('img');
    await expect(image).toHaveAttribute('src', `/_moecdn/icons/${icon}.svg`);
    expect((await request.get(`/_moecdn/icons/${icon}.svg`)).ok()).toBe(true);
  }
  await page.getByRole('button', { name: '切换外观', exact: true }).click();
  await page.getByRole('menuitemradio', { name: '浅色', exact: true }).click();
  const toml = page
    .getByRole('button', { name: '预览文件 sample.toml', exact: true })
    .locator('img');
  await expect(toml).toHaveAttribute('src', '/_moecdn/icons/toml_light.svg');
  expect((await request.get('/_moecdn/icons/toml_light.svg')).ok()).toBe(true);
  await page.getByRole('button', { name: '切换外观', exact: true }).click();
  await page.getByRole('menuitemradio', { name: '深色', exact: true }).click();
  await expect(toml).toHaveAttribute('src', '/_moecdn/icons/toml.svg');
});
