import { test, expect } from '@playwright/test';

test('十万行文本限制可见节点，行号及换行可切换并能复制完整内容', async ({
  page,
  context,
}) => {
  const text = 'line\r\n'.repeat(100_000);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.route('**/test/sample.txt', (route) =>
    route.fulfill({ contentType: 'text/plain', body: text }),
  );
  await page.goto('/test/');
  await page
    .getByRole('button', { name: '预览文件 sample.txt', exact: true })
    .click();
  await expect(page.locator('.code-preview')).toContainText('line');
  expect(
    await page
      .locator('.code-preview')
      .evaluate((element) => element.querySelectorAll('*').length),
  ).toBeLessThan(1000);
  await expect(page.locator('.cm-lineNumbers')).toBeVisible();
  await page.getByRole('button', { name: '显示行号: 开', exact: true }).click();
  await expect(page.locator('.cm-lineNumbers')).toHaveCount(0);
  await page.getByRole('button', { name: '自动换行: 开', exact: true }).click();
  await expect(page.locator('.code-preview')).toHaveAttribute(
    'data-wrap',
    'false',
  );
  await page.locator('.cm-content').focus();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.insertText('unexpected edit');
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('ControlOrMeta+c');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text);
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await expect(page.locator('#preview-dialog')).toBeHidden();
});

test('多行源码滚动到末尾仍正确高亮，可切换并复制完整原文', async ({
  page,
  context,
}) => {
  const text = '// 注释\r\n'.repeat(6000) + 'const ending = 42;\r\n';
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.route('**/test/sample.js', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: text }),
  );
  await page.goto('/test/');
  await page
    .getByRole('button', { name: '预览文件 sample.js', exact: true })
    .click();
  await expect(
    page.locator('.code-preview .hljs-comment').first(),
  ).toBeAttached();
  await page.locator('.cm-content').focus();
  await page.keyboard.press('ControlOrMeta+End');
  await expect(page.locator('.cm-content .hljs-keyword')).toHaveText('const');
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('ControlOrMeta+c');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text);
  await page.getByRole('button', { name: '语法高亮: 开', exact: true }).click();
  await expect(page.locator('.code-preview [class^="hljs-"]')).toHaveCount(0);
});

test('压缩 JS 保留三个开关，真正高亮、显示行号并可切换换行', async ({
  page,
}) => {
  await page.goto('/lib/jquery/3.6.0/');
  await page
    .getByRole('button', { name: '预览文件 jquery.min.js', exact: true })
    .click();
  for (const name of ['语法高亮: 开', '显示行号: 开', '自动换行: 开'])
    await expect(
      page.getByRole('button', { name, exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.locator('.code-preview .hljs-keyword').first(),
  ).toBeAttached();
  await expect(page.locator('.line-number')).toHaveCount(3);
  const code = page.locator('.code-preview');
  await page.getByRole('button', { name: '自动换行: 开', exact: true }).click();
  await expect(code).toHaveAttribute('data-wrap', 'false');
  await page.getByRole('button', { name: '显示行号: 开', exact: true }).click();
  await expect(page.locator('.line-number')).toHaveCount(0);
  await page.getByRole('button', { name: '语法高亮: 开', exact: true }).click();
  await expect(code.locator('[class^="hljs-"]')).toHaveCount(0);
});

test('常见语言、别名和无扩展名文件可预览，纯文本不假装支持高亮', async ({
  page,
}) => {
  const cases = [
    ['APP.JS', 'const answer = 42;'],
    ['module.cjs', 'module.exports = 42;'],
    ['module.mjs', 'export const answer = 42;'],
    ['module.mts', 'const answer: number = 42;'],
    ['module.cts', 'const answer: number = 42;'],
    ['style.less', '@color: red; .example { color: @color; }'],
    ['style.scss', '$color: red; .example { color: $color; }'],
    ['example.rs', 'fn main() { let answer = 42; }'],
    ['script.py', 'def hello():\n    return 42'],
    ['query.sql', 'SELECT id FROM users WHERE id = 42;'],
    ['run.sh', '#!/bin/sh\necho "hello"'],
    ['app.tsx', 'const App = () => <div>Hello</div>;'],
    ['app.jsx', 'const App = () => <div>Hello</div>;'],
    ['Dockerfile', 'FROM node:alpine\nRUN echo hello'],
    ['Makefile', 'all:\n\techo hello'],
    ['.env.production', 'PORT=3000'],
    ['settings.jsonc', '// configuration\n{"port": 3000}'],
    ['license', 'Permission is hereby granted'],
    ['messages.po', 'msgid "Hello"\nmsgstr "你好"'],
    ['view.ftl', '<div>${message}</div>'],
    ['lyrics.lrc', '[00:01.00]Hello'],
  ] as const;
  await page.route('**/_moecdn/catalog.json', async (route) => {
    const response = await route.fetch();
    const catalog = await response.json();
    catalog.entries.push(
      ...cases.map(([name, text]) => ({
        name,
        path: 'test/' + name,
        parent: 'test/',
        dir: false,
        size: text.length,
        modifiedAt: '',
      })),
    );
    await route.fulfill({ json: catalog });
  });
  for (const [name, text] of cases)
    await page.route('**/test/' + name, (route) =>
      route.fulfill({ contentType: 'text/plain', body: text }),
    );
  await page.goto('/test/');
  for (const [name, text] of cases) {
    await page
      .getByRole('button', { name: `预览文件 ${name}`, exact: true })
      .click();
    await expect
      .poll(async () =>
        (await page.locator('.line-content').allTextContents()).join(''),
      )
      .toBe(text);
    for (const label of ['显示行号: 开', '自动换行: 开'])
      await expect(
        page.getByRole('button', { name: label, exact: true }),
      ).toBeVisible();
    if (['license', 'messages.po', 'view.ftl', 'lyrics.lrc'].includes(name)) {
      await expect(
        page.getByRole('button', { name: /^语法高亮:/ }),
      ).toHaveCount(0);
    } else {
      await expect(
        page.getByRole('button', { name: '语法高亮: 开', exact: true }),
      ).toBeVisible();
      await expect(
        page.locator('.code-preview [class^="hljs-"]').first(),
      ).toBeAttached();
    }
    await page.getByRole('button', { name: '关闭', exact: true }).click();
  }
});

test('高亮线程加载失败不影响正文和其他开关，可以重试恢复', async ({ page }) => {
  const worker =
    /\/(?:_moecdn\/assets\/highlight\.worker-[^/]+\.js|src\/lib\/highlight\.worker\.ts)(?:\?.*)?$/;
  await page.route(worker, (route) => route.abort('failed'));
  await page.goto('/test/');
  await page
    .getByRole('button', { name: '预览文件 sample.js', exact: true })
    .click();
  await expect(page.locator('.code-preview')).toContainText('const');
  await expect(
    page.getByRole('button', { name: '语法高亮: 关', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.line-number').first()).toBeVisible();
  await page.getByRole('button', { name: '自动换行: 开', exact: true }).click();
  await expect(page.locator('.code-preview')).toHaveAttribute(
    'data-wrap',
    'false',
  );
  await page.unroute(worker);
  await page.getByRole('button', { name: '语法高亮: 关', exact: true }).click();
  await expect(
    page.locator('.code-preview .hljs-keyword').first(),
  ).toBeAttached();
  await expect(page.locator('#preview-properties [role="status"]')).toHaveCount(
    0,
  );
});

test('关闭预览会停止未完成的高亮，后续文件预览不受影响', async ({ page }) => {
  const worker =
    /\/(?:_moecdn\/assets\/highlight\.worker-[^/]+\.js|src\/lib\/highlight\.worker\.ts)(?:\?.*)?$/;
  const requests: { abort: () => Promise<void> }[] = [];
  await page.route(worker, (route) => {
    requests.push({ abort: () => route.abort() });
  });
  await page.goto('/test/');
  await page
    .getByRole('button', { name: '预览文件 sample.js', exact: true })
    .click();
  await expect(page.locator('.code-preview')).toHaveAttribute(
    'aria-busy',
    'true',
  );
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await expect(page.locator('#preview-dialog')).toBeHidden();
  for (const request of requests) await request.abort();
  await page.unroute(worker);
  await page
    .getByRole('button', { name: '预览文件 sample.py', exact: true })
    .click();
  await expect(
    page.locator('.code-preview .hljs-keyword').first(),
  ).toBeAttached();
  await expect(
    page.getByRole('button', { name: '语法高亮: 开', exact: true }),
  ).toBeVisible();
});
