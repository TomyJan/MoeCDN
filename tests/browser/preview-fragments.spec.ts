import { test, expect } from '@playwright/test';

for (const extension of ['html', 'md']) {
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
    await expect(page.locator('.render-pane')).toHaveAttribute('sandbox', '');
    await frame.getByRole('link', { name: 'Jump', exact: true }).click();
    await expect(target).toBeAttached();
    await expect
      .poll(() => frame.locator('body').evaluate(() => scrollY))
      .toBeGreaterThan(0);
    expect(page.frames()[1].url()).toBe('about:srcdoc#section');
    if (extension === 'md') {
      for (const [label, id] of [
        ['中文', '中文标题'],
        ['重复', 'section-1'],
      ]) {
        await frame.getByRole('link', { name: label, exact: true }).click();
        await expect(frame.locator(`[id="${id}"]`)).toBeAttached();
        expect(decodeURIComponent(page.frames()[1].url())).toBe(
          `about:srcdoc#${id}`,
        );
      }
    }
    await page.getByRole('button', { name: '对照', exact: true }).click();
    await expect(page.locator('.source-pane')).toBeVisible();
    await expect(target).toBeAttached();
    await expect(page).toHaveURL('/test/');
  });
}
