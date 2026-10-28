import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import type { Entry, HashAlgorithm } from '../src/lib/types.ts';

export async function createIndex(
  root: string,
  options: {
    modifiedAt?: (path: string, sha256: string) => Promise<string | undefined>;
  } = {},
): Promise<Entry[]> {
  const entries: Entry[] = [];
  async function visit(parent: string) {
    const children = await readdir(join(root, parent), { withFileTypes: true });
    children.sort((a, b) => a.name.localeCompare(b.name, 'en'));
    for (const child of children) {
      if (child.name.startsWith('.') || child.isSymbolicLink()) continue;
      if (!child.isDirectory() && !child.isFile()) continue;
      const path = parent + child.name + (child.isDirectory() ? '/' : '');
      if (path.startsWith('_moecdn/'))
        throw new Error('资源目录 _moecdn 为程序保留，请重命名该资源目录。');
      const info = await stat(join(root, path));
      const entry: Entry = {
        name: child.name,
        path,
        parent,
        dir: child.isDirectory(),
        size: child.isDirectory() ? null : info.size,
        modifiedAt: info.mtime.toISOString(),
      };
      if (!entry.dir) {
        const raw = await readFile(join(root, path));
        entry.hashes = Object.fromEntries(
          (['sha256', 'sha384', 'sha512'] as HashAlgorithm[]).map((alg) => {
            const digest = createHash(alg).update(raw).digest();
            return [
              alg,
              { hex: digest.toString('hex'), b64: digest.toString('base64') },
            ];
          }),
        );
        entry.modifiedAt =
          (await options.modifiedAt?.(path, entry.hashes.sha256!.hex)) ||
          entry.modifiedAt;
        const time = Date.parse(entry.modifiedAt);
        entry.modifiedAt = Number.isNaN(time)
          ? info.mtime.toISOString()
          : new Date(time).toISOString();
      }
      entries.push(entry);
      if (entry.dir) {
        await visit(path);
        const dates = entries
          .filter((f) => f.parent === path)
          .map((f) => f.modifiedAt)
          .sort();
        entry.modifiedAt = dates.at(-1) || '';
      }
    }
  }
  await visit('');
  return entries;
}
