import { test, expect } from '@playwright/test';

test('空锚点忽略空名称目标并回顶，Tab 从文档开头继续', async ({ page }) => {
  await page.route('**/test/sample.html', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<button>First</button><div style="height:1600px"></div><a name="">EmptyName</a><a href="#">Top</a>',
    }),
  );
  await page.goto('/test/');
  await page
    .getByRole('button', { name: '预览文件 sample.html', exact: true })
    .click();
  const frame = page.frameLocator('.render-pane');
  await frame.getByRole('link', { name: 'Top', exact: true }).click();
  await expect
    .poll(() => frame.locator('body').evaluate(() => scrollY))
    .toBe(0);
  await page.keyboard.press('Tab');
  await expect(frame.getByRole('button', { name: 'First' })).toBeFocused();
});

test('图片加载完成前点击锚点也不增加浏览记录', async ({ page }) => {
  let release!: () => void;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/test/sample.png', async (route) => {
    if (!route.request().frame().parentFrame()) return route.continue();
    await wait;
    await route.abort();
  });
  await page.route('**/test/sample.html', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<a href="#target">Jump</a><img src="sample.png"><div style="height:1600px"></div><h2 id="target">Target</h2>',
    }),
  );
  try {
    await page.goto('/test/');
    await page
      .getByRole('button', { name: '预览文件 sample.html', exact: true })
      .click();
    const frame = page.frameLocator('.render-pane');
    await expect(frame.getByRole('link', { name: 'Jump' })).toBeVisible();
    expect(
      await frame
        .locator('img')
        .evaluate((image: HTMLImageElement) => image.complete),
    ).toBe(false);
    const length = await page.evaluate(() => history.length);
    await frame.getByRole('link', { name: 'Jump' }).click();
    expect(await page.evaluate(() => history.length)).toBe(length);
    await expect
      .poll(() => frame.locator('body').evaluate(() => scrollY))
      .toBeGreaterThan(0);
  } finally {
    release();
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  }
});

test('原始 HTML 的表单字段不会遮蔽锚点处理所需的 DOM 方法', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/test/sample.html', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<form name="addEventListener"></form><form name="removeEventListener"></form><form name="getElementById"></form><form name="getElementsByName"></form><form name="defaultView"></form><a href="#target"><form><input type="hidden" name="closest">Jump</form></a><div style="height:1600px"></div><form id="target"><input name="focus"><input name="scrollIntoView"></form>',
    }),
  );
  await page.goto('/test/');
  await page
    .getByRole('button', { name: '预览文件 sample.html', exact: true })
    .click();
  const frame = page.frameLocator('.render-pane');
  const length = await page.evaluate(() => history.length);
  await frame
    .locator('a form')
    .evaluate((form) => HTMLElement.prototype.click.call(form));
  await expect
    .poll(() => frame.locator('body').evaluate(() => scrollY))
    .toBeGreaterThan(0);
  expect(await page.evaluate(() => history.length)).toBe(length);
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await expect(page.locator('#preview-dialog')).toBeHidden();
  expect(errors).toEqual([]);
});

test('HTML 文内跳转后 Tab 从目标位置继续', async ({ page }) => {
  await page.route('**/test/sample.html', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<a href="#target">Jump</a><button>Before</button><div style="height:1600px"></div><h2 id="target">Target</h2><button>After</button>',
    }),
  );
  await page.goto('/test/');
  await page
    .getByRole('button', { name: '预览文件 sample.html', exact: true })
    .click();
  const frame = page.frameLocator('.render-pane');
  await frame.getByRole('link', { name: 'Jump' }).click();
  await page.keyboard.press('Tab');
  await expect(frame.getByRole('button', { name: 'After' })).toBeFocused();
});

for (const extension of ['html', 'md']) {
  test(`${extension} 连续跳转文内锚点后关闭预览，一次后退返回上一目录`, async ({
    page,
  }) => {
    await page.route(`**/test/sample.${extension}`, (route) =>
      route.fulfill({
        contentType: extension === 'html' ? 'text/html' : 'text/markdown',
        body:
          extension === 'html'
            ? '<!doctype html><a href="#first">First</a> <a href="#second">Second</a><div style="height:1600px"></div><h2 id="first">One</h2><div style="height:600px"></div><h2 id="second">Two</h2>'
            : '[First](#first) · [Second](#second)\n\n' +
              'paragraph\n\n'.repeat(80) +
              '## First\n\nOne\n\n## Second\n\nTwo',
      }),
    );
    await page.goto('/');
    await page
      .getByRole('button', { name: '打开文件夹 test', exact: true })
      .click();
    const historyLength = await page.evaluate(() => history.length);
    await page
      .getByRole('button', {
        name: `预览文件 sample.${extension}`,
        exact: true,
      })
      .click();
    const frame = page.frameLocator('.render-pane');
    await frame.getByRole('link', { name: 'First', exact: true }).click();
    await expect
      .poll(() => frame.locator('body').evaluate(() => scrollY))
      .toBeGreaterThan(0);
    await frame.getByRole('link', { name: 'Second', exact: true }).click();
    await page.getByRole('button', { name: '关闭', exact: true }).click();
    await expect(page.locator('#preview-dialog')).toBeHidden();
    await page.goBack();
    await expect(page).toHaveURL('/');
    expect(await page.evaluate(() => history.length)).toBe(historyLength);
    await page.goForward();
    await expect(page).toHaveURL('/test/');
    await expect(page.locator('#title')).toHaveText('test');
  });

  test(`${extension} 预览的文内链接保留正文并滚动到标题，相对资源仍可加载`, async ({
    page,
  }) => {
    const content =
      extension === 'html'
        ? '<!doctype html><html><head><link rel="stylesheet" href="sample.css"></head><body><a href="#section">Jump</a><img src="sample.png"><div style="height:1600px"></div><h2 id="section">Target</h2><p>End</p></body></html>'
        : '[Jump](#section) · [中文](#中文标题) · [重复](#section-1)\n\n![image](sample.png)\n\n' +
          'paragraph\n\n'.repeat(80) +
          '## Section\n\nDestination\n\n## 中文标题\n\nDestination\n\n## Section\n\nEnd';
    await page.route(`**/test/sample.${extension}`, (route) =>
      route.fulfill({
        contentType: extension === 'html' ? 'text/html' : 'text/markdown',
        body: content,
      }),
    );
    await page.goto('/test/');
    await page
      .getByRole('button', {
        name: `预览文件 sample.${extension}`,
        exact: true,
      })
      .click();
    const frame = page.frameLocator('.render-pane');
    const target = frame
      .getByRole('heading', {
        name: extension === 'html' ? 'Target' : 'Section',
        exact: true,
      })
      .first();
    await expect(target).toBeAttached();
    await expect
      .poll(() =>
        frame
          .locator('img')
          .evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
      )
      .toBe(true);
    expect(
      await page
        .locator('.render-pane')
        .evaluate((frame: HTMLIFrameElement) =>
          frame.sandbox.contains('allow-scripts'),
        ),
    ).toBe(false);
    await frame.getByRole('link', { name: 'Jump', exact: true }).click();
    await expect(target).toBeAttached();
    await expect
      .poll(() => frame.locator('body').evaluate(() => scrollY))
      .toBeGreaterThan(0);
    expect(page.frames()[1].url()).toBe('about:srcdoc');
    if (extension === 'md') {
      for (const [label, id] of [
        ['中文', '中文标题'],
        ['重复', 'section-1'],
      ]) {
        await frame.getByRole('link', { name: label, exact: true }).click();
        await expect(frame.locator(`[id="${id}"]`)).toBeAttached();
        expect(page.frames()[1].url()).toBe('about:srcdoc');
      }
    }
    await page.getByRole('button', { name: '对照', exact: true }).click();
    await expect(page.locator('.source-pane')).toBeVisible();
    await expect(target).toBeAttached();
    await expect(page).toHaveURL('/test/');
  });
}
