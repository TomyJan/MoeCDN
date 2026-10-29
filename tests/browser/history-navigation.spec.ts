import { test, expect, type Page } from '@playwright/test';

test('旧 hash 路由安全迁移，畸形路径显示不存在而不白屏', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#//example.com/');
  await expect(page.getByRole('heading', { name: '目录不存在' })).toBeVisible();
  await page.getByRole('button', { name: '返回根目录' }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/#/lib/jquery/');
  await expect(page).toHaveURL('/lib/jquery/');
  await expect(page.locator('#title')).toHaveText('jquery');
  await page.goto('/#/missing?query#fragment/');
  await expect(page).toHaveURL('/missing%3Fquery%23fragment/');
  await expect(page.getByRole('heading', { name: '目录不存在' })).toBeVisible();
  expect(errors).toEqual([]);
});

async function searchFolder(page: Page, query: string, name: string) {
  await page.keyboard.press('/');
  await page.locator('#query').fill(query);
  await page.getByRole('button', { name: '当前目录', exact: true }).click();
  await page.getByRole('menuitemradio', { name: '全站', exact: true }).click();
  await page
    .getByRole('button', { name: `打开文件夹 ${name}`, exact: true })
    .first()
    .click();
}

test('普通 HTTP 域名下可打开目录并导航', async ({ page, baseURL }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('http://moecdn.test/**', async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({
      url: new URL(url.pathname + url.search, baseURL).href,
    });
    await route.fulfill({ response });
  });
  await page.goto('http://moecdn.test/lib/jquery/');
  expect(await page.evaluate(() => isSecureContext)).toBe(false);
  await expect(page.locator('#title')).toHaveText('jquery');
  await page.getByRole('button', { name: '根目录', exact: true }).click();
  await expect(page).toHaveURL('http://moecdn.test/');
  await expect(page.locator('#rows')).toContainText('lib');
  expect(errors).toEqual([]);
});

test('后退到异步加载的更新历史，内容加载后恢复滚动位置', async ({ page }) => {
  await page.goto('/history/');
  await expect(page.locator('#history')).toContainText('网站正式上线');
  await page.locator('.page-footer').scrollIntoViewIfNeeded();
  const scroll = await page.evaluate(() => scrollY);
  expect(scroll).toBeGreaterThan(500);
  await page.keyboard.press('/');
  await page.locator('#query').fill('jquery');
  await page
    .getByRole('button', { name: '打开文件夹 jquery', exact: true })
    .first()
    .click();
  await expect(page).toHaveURL('/lib/jquery/');

  let release!: () => void;
  const response = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/_moecdn/history.json', async (route) => {
    await response;
    await route.continue();
  });
  await page.goBack();
  await expect(page).toHaveURL('/history/');
  await expect(page.locator('#history')).toHaveCount(0);
  release();
  await expect(page.locator('#history')).toContainText('网站正式上线');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(scroll);
});

test('前进后退恢复各历史条目的续载数量和滚动位置，新导航仍从顶部开始', async ({
  page,
}) => {
  await page.goto('/lib/ace/1.5.1/');
  await expect(page.locator('#rows tr')).toHaveCount(100);
  await page.locator('#load-sentinel').scrollIntoViewIfNeeded();
  await expect(page.locator('#rows tr')).toHaveCount(200);
  await page.evaluate(() => scrollTo(0, 8000));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(8000);

  await searchFolder(page, 'jquery', 'jquery');
  await expect(page).toHaveURL('/lib/jquery/');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.goBack();
  await expect(page).toHaveURL('/lib/ace/1.5.1/');
  await expect(page.locator('#rows tr')).toHaveCount(200);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(8000);
  await page.goForward();
  await expect(page).toHaveURL('/lib/jquery/');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);

  await searchFolder(page, 'ace/1.5.1/', '1.5.1');
  await expect(page).toHaveURL('/lib/ace/1.5.1/');
  await expect(page.locator('#rows tr')).toHaveCount(100);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.evaluate(() => scrollTo(0, 1000));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(1000);
  await page.goBack();
  await expect(page).toHaveURL('/lib/jquery/');
  await page.goBack();
  await expect(page).toHaveURL('/lib/ace/1.5.1/');
  await expect(page.locator('#rows tr')).toHaveCount(200);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(8000);
  await page.goForward();
  await expect(page).toHaveURL('/lib/jquery/');
  await page.goForward();
  await expect(page).toHaveURL('/lib/ace/1.5.1/');
  await expect(page.locator('#rows tr')).toHaveCount(100);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(1000);
});

test('选择排序后立即后退，恢复原排序和续载位置，菜单回焦不覆盖滚动', async ({
  page,
}) => {
  await page.goto('/lib/ace/1.5.1/');
  await expect(page.locator('#rows tr')).toHaveCount(100);
  await page.locator('#load-sentinel').scrollIntoViewIfNeeded();
  await expect(page.locator('#rows tr')).toHaveCount(200);
  await page.evaluate(() => scrollTo(0, 8000));
  await searchFolder(page, 'jquery', 'jquery');
  await expect(page).toHaveURL('/lib/jquery/');
  await page.locator('.sort-trigger').click();
  await page.getByRole('menuitem', { name: '时间', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('menuitemradio', { name: '最旧', exact: true }).click();
  await page.goBack();
  await expect(page).toHaveURL('/lib/ace/1.5.1/');
  await expect(page.locator('#rows tr')).toHaveCount(200);
  await expect(page.locator('.sort-trigger')).toHaveAccessibleName('名称升序');
  await expect(page.locator('.sort-trigger')).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(8000);
});
