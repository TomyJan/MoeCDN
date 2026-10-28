import { test, expect } from '@playwright/test';

const cssDirectory = '/lib/aplayer/1.10.1/';
const cssFile = 'lib/aplayer/1.10.1/APlayer.min.css';
const markdownDirectory = '/web-static/private/tomyjan-website/mirrorsite/';
const markdownFile =
  'web-static/private/tomyjan-website/mirrorsite/MirrorStie-README.md';
const htmlDirectory =
  '/web-static/public/wordpress-argon-theme/latest/assets/vendor/svg-loaders/';

test('更新历史独立页面支持直达刷新，读取历史记录并返回目录', async ({
  page,
  request,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: '更新历史', exact: true }).click();
  await expect(page).toHaveURL(/\/history\/$/);
  await expect(
    page.getByRole('heading', { name: '更新历史', exact: true }),
  ).toBeVisible();
  await expect(page.locator('#history')).toContainText('网站正式上线');
  await expect(page.locator('#history')).toContainText('纯静态');
  await page.reload();
  await expect(page.locator('#history')).toContainText('2022-05-28');
  expect(
    await page
      .locator('.history-entry')
      .first()
      .evaluate((entry) => {
        const date = entry.querySelector('time')!.getBoundingClientRect();
        const line = entry
          .querySelector('.history-changes')!
          .getBoundingClientRect();
        return line.left - date.right <= 20;
      }),
  ).toBe(true);
  const data = await request.get('/_moecdn/history.json');
  expect(data.ok()).toBe(true);
  expect((await data.json()).at(-1).date).toBe('2022-05-28');
  await page.getByRole('button', { name: '根目录', exact: true }).click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('#rows')).toContainText('lib');
});

test('复合排序菜单按字段选择升降序并更新真实列表', async ({ page }) => {
  await page.goto('/lib/aplayer/1.10.1/');
  await page.getByRole('button', { name: '名称升序', exact: true }).click();
  await page.getByRole('menuitem', { name: '体积', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('menuitemradio', { name: '最小', exact: true }).click();
  await expect(
    page.getByRole('button', { name: '体积最小', exact: true }),
  ).toBeVisible();
  const ascending = await page.locator('#rows .file-name').allTextContents();
  await page.getByRole('button', { name: '体积最小', exact: true }).click();
  await page.getByRole('menuitem', { name: '体积', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('menuitemradio', { name: '最大', exact: true }).click();
  await expect(page.locator('#rows .file-name')).toHaveCount(ascending.length);
  expect(await page.locator('#rows .file-name').allTextContents()).toEqual(
    [...ascending].reverse(),
  );
  await page.getByRole('button', { name: '体积最大', exact: true }).click();
  await page.getByRole('menuitem', { name: '时间', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('menuitemradio', { name: '最旧', exact: true }).click();
  await expect(
    page.getByRole('button', { name: '时间最旧', exact: true }),
  ).toBeVisible();
});

test('窄屏排序的两层菜单完整位于视口中', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(cssDirectory);
    await page.getByRole('button', { name: '名称升序', exact: true }).click();
    await page.getByRole('menuitem', { name: '体积', exact: true }).click();
    const menu = page.getByRole('menu', { name: '体积', exact: true });
    await expect(menu).toBeVisible();
    await expect
      .poll(async () => (await menu.boundingBox())!.x)
      .toBeGreaterThanOrEqual(0);
    await expect
      .poll(async () => {
        const box = (await menu.boundingBox())!;
        return box.x + box.width;
      })
      .toBeLessThanOrEqual(width);
    await page
      .getByRole('menuitemradio', { name: '最小', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: '体积最小', exact: true }),
    ).toBeVisible();
  }
});

test('PDF 使用安全的页面渲染器显示真实内容', async ({ page }) => {
  await page.goto('/web-static/public/other/');
  await page
    .getByRole('button', { name: '预览文件 how2ask.pdf', exact: true })
    .click();
  const canvas = page.locator('.pdf-page canvas[data-rendered="true"]').first();
  await expect(canvas).toBeVisible({ timeout: 15000 });
  expect(
    await canvas.evaluate((element: HTMLCanvasElement) => {
      const pixels = element
        .getContext('2d')!
        .getImageData(0, 0, element.width, element.height).data;
      return pixels.some((value, index) => index % 4 !== 3 && value < 180);
    }),
  ).toBe(true);
  await expect(page.locator('#preview-body iframe')).toHaveCount(0);
});

test('真实路径直达、刷新、前进后退与原始 index.html 共存', async ({
  page,
  request,
}) => {
  await page.goto('/lib/');
  await expect(page.locator('#title')).toHaveText('lib');
  await page
    .getByRole('button', { name: '打开文件夹 jquery', exact: true })
    .click();
  await expect(page).toHaveURL(/\/lib\/jquery\/$/);
  await page.reload();
  await expect(page.locator('#title')).toHaveText('jquery');
  await page.goBack();
  await expect(page.locator('#title')).toHaveText('lib');
  await page.goForward();
  await expect(page.locator('#title')).toHaveText('jquery');
  const raw = await request.get(
    '/web-static/public/wordpress-argon-theme/latest/assets/vendor/svg-loaders/index.html',
  );
  expect(raw.ok()).toBeTruthy();
  expect(await raw.text()).not.toContain('id="root"');
  await page.goto(
    '/web-static/public/wordpress-argon-theme/latest/assets/vendor/svg-loaders/',
  );
  await expect(page.locator('#title')).toHaveText('svg-loaders');
  expect((await request.get('/missing-file.js')).status()).toBe(404);
});

test('递归搜索、范围切换、空状态与目录树', async ({ page }) => {
  await page.goto('/lib/jquery/');
  await page.getByRole('button', { name: '搜索', exact: true }).click();
  await page.locator('#query').fill('jquery.js');
  await expect(page.locator('.search-result')).not.toHaveCount(0);
  await expect(page.locator('#search-results')).toContainText('3.6.0');
  await page.locator('#query').fill('APlayer.min.css');
  await expect(page.locator('#search-empty')).toBeVisible();
  await page.getByRole('button', { name: '当前目录', exact: true }).click();
  await page.getByRole('menuitemradio', { name: '全站', exact: true }).click();
  await expect(page.locator('#search-results')).toContainText(
    'APlayer.min.css',
  );
  await expect(page.getByRole('menu')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.locator('#search-dialog')).toBeHidden();
  await expect(
    page.getByRole('button', { name: '收起 lib', exact: true }),
  ).toHaveAttribute('aria-expanded', 'true');
});

test('共享高级复制浮层记住选择、按类型隐藏选项、同按钮开关', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(cssDirectory);
  const trigger = page.locator(`[data-advanced="${cssFile}"]`);
  await trigger.click();
  await page.locator('#include-sri').check();
  await page.locator('#include-cors').check();
  await expect(page.locator('#copy-output')).toHaveValue(/integrity="sha384-/);
  await page.getByRole('button', { name: '文件直链', exact: true }).click();
  await expect(page.locator('#include-sri')).toBeHidden();
  await expect(page.locator('#copy-output')).not.toHaveValue(/integrity=/);
  await page.getByRole('button', { name: 'HTML 标签', exact: true }).click();
  await expect(page.locator('#include-sri')).toBeChecked();
  await page.locator('#copy-confirm').click();
  await expect(page.locator('#copy-confirm')).toHaveAttribute(
    'data-copied',
    'true',
  );
  await expect(page.locator('#copy-confirm')).toHaveAttribute(
    'data-copied',
    'false',
    { timeout: 2000 },
  );
  await trigger.click();
  await expect(page.locator('#copy-dialog')).toBeHidden();
  await page.goto(markdownDirectory);
  await page.locator(`[data-advanced="${markdownFile}"]`).click();
  await expect(
    page.getByRole('button', { name: 'HTML 标签', exact: true }),
  ).toBeHidden();
});

test('弹窗预览、渲染对照和元数据，不执行 HTML 脚本', async ({ page }) => {
  await page.goto(markdownDirectory);
  await page
    .getByRole('button', { name: '预览文件 MirrorStie-README.md', exact: true })
    .click();
  await expect(page.locator('#preview-dialog')).toBeVisible();
  await expect(
    page.getByRole('button', { name: '渲染', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.render-pane')).toBeVisible();
  await page.getByRole('button', { name: '源码', exact: true }).click();
  await expect(page.locator('.code-preview')).not.toBeEmpty();
  await page.getByRole('button', { name: '对照', exact: true }).click();
  await expect(page.locator('.render-pane')).toBeVisible();
  await expect(page.locator('.render-pane')).toHaveAttribute('sandbox', '');
  await expect(page.locator('#preview-properties')).not.toContainText('创建');
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.goto('/web-static/public/wordpress-argon-theme/latest/');
  await page
    .getByRole('button', { name: '预览文件 screenshot.png', exact: true })
    .click();
  await expect(page.locator('#preview-extra')).toContainText('×');
});

test('语言主题切换和窄屏无溢出', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '切换语言', exact: true }).click();
  await page
    .getByRole('menuitemradio', { name: 'English', exact: true })
    .click();
  await expect(page.locator('#title')).toHaveText('All files');
  await page.getByRole('button', { name: 'Appearance', exact: true }).click();
  await page.getByRole('menuitemradio', { name: 'Light', exact: true }).click();
  await page.reload();
  await expect(page.locator('#title')).toHaveText('All files');
  await page.goto(cssDirectory);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 800 });
    await page.locator(`[data-advanced="${cssFile}"]`).click();
    const box = await page.locator('#copy-dialog').boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.keyboard.press('Escape');
  }
});

test('接近底部自动加载，不显示手动按钮', async ({ page }) => {
  await page.goto('/lib/ace/1.5.1/');
  await expect(page.locator('#rows tr')).toHaveCount(100);
  await page.locator('#load-sentinel').scrollIntoViewIfNeeded();
  await expect
    .poll(() => page.locator('#rows tr').count())
    .toBeGreaterThan(100);
  await expect(
    page.getByRole('button', { name: /显示更多|加载更多/ }),
  ).toHaveCount(0);
});

test('预览中复用复制浮层并阻止待预览网页执行脚本', async ({ page }) => {
  await page.route('**/svg-loaders/index.html', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html><head><title>unsafe</title></head><body><p>HTML preview</p><script>parent.__executed=true;document.body.textContent="EXECUTED"</script></body></html>',
    }),
  );
  await page.goto(htmlDirectory);
  await page
    .getByRole('button', { name: '预览文件 index.html', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: '渲染', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.frameLocator('.render-pane').locator('p')).toHaveText(
    'HTML preview',
  );
  expect(await page.evaluate(() => '__executed' in window)).toBe(false);
  await page.locator('#preview-advanced').click();
  await expect(page.locator('#copy-dialog')).toBeVisible();
  await page.locator('#preview-advanced').click();
  await expect(page.locator('#copy-dialog')).toBeHidden();
  await page.getByRole('button', { name: '关闭', exact: true }).click();
});

test('源码开关默认开启，分别控制高亮、行号和长行换行', async ({ page }) => {
  const source =
    '/* 多行注释\n安全预览 */\n.example { color: red; }\n' +
    '.long { content: "' +
    '宽度测试 abc '.repeat(80) +
    '"; }';
  await page.route('**/APlayer.min.css', (route) =>
    route.fulfill({ contentType: 'text/css', body: source }),
  );
  await page.goto(cssDirectory);
  await page
    .getByRole('button', { name: '预览文件 APlayer.min.css', exact: true })
    .click();
  for (const name of ['语法高亮: 开', '显示行号: 开', '自动换行: 开']) {
    await expect(
      page.getByRole('button', { name, exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
  }
  const lines = page.locator('.code-line');
  await expect(lines).toHaveCount(4);
  expect(await page.locator('.line-content').allTextContents()).toEqual(
    source.split('\n'),
  );
  await expect(lines.nth(1).locator('.hljs-comment')).toContainText('安全预览');
  const line = page.locator('.line-content').last();
  const wrapped = (await line.boundingBox())!.height;
  await page.getByRole('button', { name: '自动换行: 开', exact: true }).click();
  await expect
    .poll(async () => (await line.boundingBox())!.height)
    .toBeLessThan(wrapped);
  await page.getByRole('button', { name: '语法高亮: 开', exact: true }).click();
  await expect(page.locator('.code-preview [class^="hljs-"]')).toHaveCount(0);
  await expect(page.locator('.line-number')).toHaveCount(4);
  await page.getByRole('button', { name: '显示行号: 开', exact: true }).click();
  await expect(page.locator('.line-number')).toHaveCount(0);
  expect(await page.locator('.line-content').allTextContents()).toEqual(
    source.split('\n'),
  );
  await page.getByRole('button', { name: '语法高亮: 关', exact: true }).click();
  await expect(lines.nth(1).locator('.hljs-comment')).toContainText('安全预览');
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await expect(page.locator('#preview-dialog')).toBeHidden();
  await page
    .getByRole('button', { name: '预览文件 APlayer.min.css', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: '显示行号: 开', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('大源码和极多行文本简化显示，保留完整正文并可关闭', async ({ page }) => {
  await page.goto('/lib/mathjax/3.2.2/es5/');
  await page
    .getByRole('button', {
      name: '预览文件 tex-chtml-full-speech.js',
      exact: true,
    })
    .click();
  await expect(page.locator('.source-options')).toHaveCount(0);
  await expect(page.locator('.code-preview')).toContainText('MathJax');
  await expect(page.locator('.code-preview [class^="hljs-"]')).toHaveCount(0);
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await expect(page.locator('#preview-dialog')).toBeHidden();
  const text = '// 短行\n'.repeat(6000);
  await page.route('**/APlayer.min.css', (route) =>
    route.fulfill({ contentType: 'text/css', body: text }),
  );
  await page.goto(cssDirectory);
  await page
    .getByRole('button', { name: '预览文件 APlayer.min.css', exact: true })
    .click();
  await expect(page.locator('.source-options')).toHaveCount(0);
  await expect(page.locator('.code-preview')).toHaveText(text, {
    useInnerText: false,
  });
  await expect(page.locator('.code-preview span')).toHaveCount(0);
});

test('预览开关仅显示当前模式和文件支持的操作', async ({ page }) => {
  await page.goto('/test/');
  await page
    .getByRole('button', { name: '预览文件 sample.txt', exact: true })
    .click();
  await expect(page.getByRole('button', { name: /^语法高亮:/ })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: '显示行号: 开', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: '自动换行: 开', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.goto(markdownDirectory);
  await page
    .getByRole('button', { name: '预览文件 MirrorStie-README.md', exact: true })
    .click();
  await expect(page.locator('.source-options')).toHaveCount(0);
  await page.getByRole('button', { name: '源码', exact: true }).click();
  await expect(page.locator('.source-options button')).toHaveCount(3);
  await page.getByRole('button', { name: '显示行号: 开', exact: true }).click();
  await page.getByRole('button', { name: '渲染', exact: true }).click();
  await expect(page.locator('.source-options')).toHaveCount(0);
  await page.getByRole('button', { name: '对照', exact: true }).click();
  await expect(
    page.getByRole('button', { name: '显示行号: 关', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.goto('/test/');
  await page
    .getByRole('button', { name: '预览文件 sample.png', exact: true })
    .click();
  await expect(page.locator('.source-options')).toHaveCount(0);
});
