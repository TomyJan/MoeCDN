import { test, expect } from '@playwright/test';

test('源码选区保留空行、缩进和末尾换行，切换显示选项后内容不变', async ({
  page,
}) => {
  const source = '\nconst message = `alpha\n\nbeta`;\n\n\n  // 中文缩进\n\n';
  await page.route('**/test/sample.js', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: source }),
  );
  await page.goto('/test/');
  await page
    .getByRole('button', { name: '预览文件 sample.js', exact: true })
    .click();
  const code = page.locator('.code-preview');
  await expect(code).toContainText('const message');
  const selected = () =>
    code.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      return selection.toString();
    });
  expect(await selected()).toBe(source);
  for (const option of ['语法高亮: 开', '显示行号: 开', '自动换行: 开']) {
    await page.getByRole('button', { name: option, exact: true }).click();
    expect(await selected()).toBe(source);
  }
});
