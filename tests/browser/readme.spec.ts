import { test, expect } from '@playwright/test';

test('当前目录 README 渲染在列表后，目录导航和原文件可用且不进入搜索', async ({
  page,
  request,
}) => {
  await page.goto('/test/');
  const readme = page.locator('#directory-readme');
  await expect(
    readme.getByRole('heading', { name: '预览测试目录', exact: true }),
  ).toBeVisible();
  await expect(page.locator('#rows')).not.toContainText('README.md');
  const catalog = await (await request.get('/_moecdn/catalog.json')).json();
  expect(
    catalog.entries.some((file: { name: string }) =>
      /^readme\.md$/i.test(file.name),
    ),
  ).toBe(false);
  expect(catalog.readmes['test/'][0].path).toBe('test/README.md');
  expect((await request.get('/test/README.md')).ok()).toBe(true);
  await expect(readme.locator('img')).toHaveAttribute(
    'src',
    '/test/sample.png',
  );
  await expect(
    readme.getByRole('link', { name: 'JSON', exact: true }),
  ).toHaveAttribute('href', '/test/sample.json');
  const specialLink = readme.getByRole('link', {
    name: '带空格的中文文件',
    exact: true,
  });
  await expect(specialLink).toHaveAttribute(
    'href',
    '/test/%E4%B8%AD%E6%96%87%20%E7%A9%BA%E6%A0%BC%23%25.txt',
  );
  expect(
    (await request.get((await specialLink.getAttribute('href'))!)).ok(),
  ).toBe(true);
  await readme.getByRole('button', { name: '目录', exact: true }).click();
  await page.getByRole('menuitem', { name: '使用说明', exact: true }).click();
  await expect(
    readme.getByRole('heading', { name: '使用说明', exact: true }),
  ).toBeInViewport();
  await expect(page).toHaveURL('/test/');
  await readme.getByRole('link', { name: '子目录', exact: true }).click();
  await expect(page).toHaveURL('/test/nested/');
  await expect(
    readme.getByRole('heading', { name: '子目录说明', exact: true }),
  ).toBeVisible();
  await expect(readme).not.toContainText('这里集中放置');
  await page.getByRole('button', { name: '搜索', exact: true }).click();
  await page.locator('#query').fill('readme.md');
  await expect(page.locator('#search-empty')).toBeVisible();
  await expect(page.locator('#search-results')).not.toContainText('README.md');
  await page.keyboard.press('Escape');
  await expect(page.locator('#search-dialog')).toBeHidden();
  await page.goto('/');
  await expect(readme).toContainText('2026-10-28');
  await expect(readme).toContainText('恢复公开服务');
  await expect(readme).toContainText('2025-09-14');
  await expect(readme).toContainText('腾讯云 EdgeOne');
  await expect(readme).toContainText('Cloudflare');
  await expect(readme.locator('img')).toHaveAttribute(
    'src',
    'https://web-static.tomys.top/paycode/img/PayCode.png',
  );
  await expect(
    page
      .locator('.page-footer')
      .getByRole('link', { name: '鲁ICP备2021003464号-1', exact: true }),
  ).toHaveAttribute('href', 'https://beian.miit.gov.cn/');
});

test('README 清理脚本、危险链接和事件属性，目录标题不会覆盖应用节点', async ({
  page,
}) => {
  await page.route('**/test/README.md', (route) =>
    route.fulfill({
      contentType: 'text/markdown',
      body: '# 安全测试\n\n## root\n\n## root\n\n<script>window.__readmeExecuted = true</script>\n<img src="sample.png" onerror="window.__readmeExecuted = true">\n<a href="javascript:alert(1)">危险链接</a>\n<iframe src="https://example.com"></iframe>\n\n<a href="http://[">错误地址</a>\n\n[锚点](#root)',
    }),
  );
  await page.goto('/test/');
  const readme = page.locator('#directory-readme');
  await expect(
    readme.getByRole('heading', { name: '安全测试', exact: true }),
  ).toBeVisible();
  await expect(
    readme.locator('script, iframe, [onerror], [href^="javascript:"]'),
  ).toHaveCount(0);
  expect(await page.evaluate(() => '__readmeExecuted' in window)).toBe(false);
  expect(
    await readme
      .locator('h2')
      .evaluateAll((nodes) => nodes.map((node) => node.id)),
  ).toEqual(['readme-root', 'readme-root-1']);
  await expect(
    readme.getByRole('link', { name: '锚点', exact: true }),
  ).toHaveAttribute('href', '#readme-root');
});

test('窄屏根目录 README 和含备案号的页脚完整显示', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await expect(page.locator('#directory-readme')).toContainText('恢复公开服务');
  await page.getByRole('button', { name: '切换语言', exact: true }).click();
  await page
    .getByRole('menuitemradio', { name: 'English', exact: true })
    .click();
  const link = page.locator('.page-footer a').last();
  await link.scrollIntoViewIfNeeded();
  // 同帧测量，避免滚动或页面过渡使两次读取处于不同坐标系。
  expect(
    await page.locator('.page-footer').evaluate((footer) => {
      const bounds = footer.getBoundingClientRect();
      return [...footer.querySelectorAll('a')].every((link) => {
        const box = link.getBoundingClientRect();
        return (
          box.top >= bounds.top &&
          box.bottom <= bounds.bottom &&
          box.left >= bounds.left &&
          box.right <= bounds.right
        );
      });
    }),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
