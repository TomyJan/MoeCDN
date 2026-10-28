import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createIndex } from '../scripts/indexer.ts';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((p) => rm(p, { recursive: true, force: true })),
  );
});
async function fixture() {
  const p = await mkdtemp(join(tmpdir(), 'moecdn-test-'));
  roots.push(p);
  return p;
}
describe('构建真实资源索引', () => {
  it('将时区偏移规范化，目录时间采用子项的真实最新时间', async () => {
    const root = await fixture();
    await mkdir(join(root, 'dir'));
    await writeFile(join(root, 'dir', 'earlier.txt'), 'a');
    await writeFile(join(root, 'dir', 'later.txt'), 'b');
    const entries = await createIndex(root, {
      modifiedAt: async (path) =>
        path.includes('earlier')
          ? '2026-10-28T23:00:00+08:00'
          : '2026-10-28T17:00:00Z',
    });
    expect(entries.find((f) => f.path === 'dir/earlier.txt')?.modifiedAt).toBe(
      '2026-10-28T15:00:00.000Z',
    );
    expect(entries.find((f) => f.path === 'dir/')?.modifiedAt).toBe(
      '2026-10-28T17:00:00.000Z',
    );
  });
  it('按原字节计算哈希并保留特殊路径、空目录和指定修改时间', async () => {
    const root = await fixture();
    await mkdir(join(root, '空 目录'), { recursive: true });
    await writeFile(join(root, '空 目录', '中文#%.js'), 'abc');
    const index = await createIndex(root, {
      modifiedAt: async () => '2024-01-02T03:04:05.000Z',
    });
    const file = index.find((f) => f.path === '空 目录/中文#%.js')!;
    expect(file.size).toBe(3);
    expect(file.hashes?.sha256?.hex).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    expect(file.modifiedAt).toBe('2024-01-02T03:04:05.000Z');
    expect(index.find((f) => f.path === '空 目录/')?.dir).toBe(true);
  });
  it('资源更新后重新计算内容，不发布隐藏文件或符号链接', async () => {
    const root = await fixture();
    await writeFile(join(root, 'a.txt'), 'abc');
    await writeFile(join(root, '.env'), 'secret');
    await mkdir(join(root, '.git'));
    await writeFile(join(root, '.git', 'config'), 'secret');
    await symlink(join(root, '.git'), join(root, 'escape'), 'junction');
    const before = await createIndex(root);
    await writeFile(join(root, 'a.txt'), 'changed');
    const after = await createIndex(root);
    expect(after.map((f) => f.path)).toEqual(['a.txt']);
    expect(before[0].hashes?.sha256?.hex).not.toBe(
      after[0].hashes?.sha256?.hex,
    );
  });
});
