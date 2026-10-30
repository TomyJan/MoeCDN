import { access, readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import type { Catalog } from '../src/lib/types.ts';
const catalog: Catalog = JSON.parse(
  await readFile('dist/_moecdn/catalog.json', 'utf8'),
);
assert(
  !(await access('dist/edgeone.json').then(
    () => true,
    () => false,
  )),
  '部署配置仅保留在仓库根目录，不应发布到 dist/',
);
for (const file of [
  ...catalog.entries,
  ...Object.values(catalog.readmes || {}).flat(),
]) {
  if (file.dir) {
    assert((await stat('dist/' + file.path)).isDirectory());
    continue;
  }
  const digest = createHash('sha256')
    .update(await readFile('dist/' + file.path))
    .digest('hex');
  assert.equal(digest, file.hashes?.sha256?.hex, file.path);
}
assert(
  (await readFile('dist/_moecdn/app.html', 'utf8')).includes(
    '/_moecdn/assets/',
  ),
);
for (const path of ['terms', 'privacy']) {
  assert(
    (await readFile('dist/' + path + '/index.html', 'utf8')).includes(
      '/_moecdn/assets/',
    ),
    path + ' 页面必须生成独立静态入口',
  );
}
console.log(
  `发布验证通过：${catalog.entries.filter((f) => !f.dir).length} 个原文件字节一致`,
);
