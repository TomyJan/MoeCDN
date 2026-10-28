import { test, expect } from '@playwright/test';

for (const [component, file] of [
  ['CodePreview', 'sample.js'],
  ['PdfPreview', 'sample.pdf'],
]) {
  test(`${component} 加载失败只影响预览正文，重新加载后可恢复`, async ({
    page,
  }) => {
    const chunk = new RegExp(
      `/(?:_moecdn/assets/${component}-[^/]+\\.js|src/components/${component}\\.tsx)(?:\\?.*)?$`,
    );
    await page.route(chunk, (route) => route.abort('failed'));
    await page.goto('/test/');
    const opener = page.getByRole('button', {
      name: `预览文件 ${file}`,
      exact: true,
    });
    await opener.click();
    const dialog = page.locator('#preview-dialog');
    await expect(dialog.getByRole('alert')).toContainText('加载失败');
    await expect(
      dialog.getByRole('link', { name: '打开原文件', exact: true }),
    ).toBeVisible();
    await expect(page.locator('#rows')).not.toBeEmpty();
    await dialog.getByRole('button', { name: '关闭', exact: true }).click();
    await expect(opener).toBeFocused();
    await opener.click();
    await page.unroute(chunk);
    await dialog.getByRole('button', { name: '重新加载', exact: true }).click();
    await expect(dialog).toBeHidden();
    await opener.click();
    if (component === 'CodePreview')
      await expect(page.locator('.code-preview')).toContainText('const');
    else
      await expect(page.locator('.pdf-page canvas').first()).toHaveAttribute(
        'data-rendered',
        'true',
      );
  });
}
