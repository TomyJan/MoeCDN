import { test, expect } from '@playwright/test';

for (const source of [
  'const a=1;\rconst b=2;\rconst c=3;\r',
  'const a=1;\r\nconst b=2;\rconst c=3;\n',
]) {
  test(`CR 换行按逻辑行显示，复制保留原始换行 ${JSON.stringify(source)}`, async ({
    page,
  }) => {
    await page.route('**/test/sample.js', (route) =>
      route.fulfill({ contentType: 'text/javascript', body: source }),
    );
    await page.goto('/test/');
    await page
      .getByRole('button', { name: '预览文件 sample.js', exact: true })
      .click();
    const code = page.locator('.code-preview');
    await expect(code).toHaveAttribute('aria-busy', 'false');
    for (let index = 0; index < 2; index++) {
      await expect(page.locator('.line-number')).toHaveText([
        '1',
        '2',
        '3',
        '4',
      ]);
      await expect(page.locator('.line-content').nth(1)).toContainText(
        'const b=2;',
      );
      const copied = await code.evaluate((element) => {
        const selection = getSelection()!;
        const range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
        const data = new DataTransfer();
        element.dispatchEvent(
          new ClipboardEvent('copy', {
            bubbles: true,
            cancelable: true,
            clipboardData: data,
          }),
        );
        return data.getData('text/plain');
      });
      expect(copied).toBe(source);
      const partial = await code.evaluate((element) => {
        const lines = element.querySelectorAll('.line-content');
        const range = document.createRange();
        range.setStartBefore(lines[1]);
        range.setEndAfter(lines[2]);
        getSelection()!.removeAllRanges();
        getSelection()!.addRange(range);
        const data = new DataTransfer();
        element.dispatchEvent(
          new ClipboardEvent('copy', {
            bubbles: true,
            cancelable: true,
            clipboardData: data,
          }),
        );
        return data.getData('text/plain');
      });
      expect(partial).toBe(source.slice(source.indexOf('const b')));
      if (!index)
        await page
          .getByRole('button', { name: '语法高亮: 开', exact: true })
          .click();
    }
  });
}

test('CRLF 多行 token 高亮不增加空行，切换高亮后文本和选区保持一致', async ({
  page,
}) => {
  const source = '/* multi\r\nline */\r\nconst answer = 42;\r\n';
  await page.route('**/test/sample.js', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: source }),
  );
  await page.goto('/test/');
  await page
    .getByRole('button', { name: '预览文件 sample.js', exact: true })
    .click();
  const code = page.locator('.code-preview');
  await expect(code).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('.code-line')).toHaveCount(4);
  expect((await page.locator('.line-content').allTextContents()).join('')).toBe(
    source,
  );
  const coloredHeight = (await page
    .locator('.code-line')
    .first()
    .boundingBox())!.height;
  const selected = () =>
    code.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      return selection.toString();
    });
  const coloredSelection = await selected();
  await page.getByRole('button', { name: '语法高亮: 开', exact: true }).click();
  expect((await page.locator('.line-content').allTextContents()).join('')).toBe(
    source,
  );
  expect(await selected()).toBe(coloredSelection);
  expect((await page.locator('.code-line').first().boundingBox())!.height).toBe(
    coloredHeight,
  );
});

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
