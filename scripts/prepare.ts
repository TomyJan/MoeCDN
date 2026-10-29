import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createIndex } from './indexer.ts';
import type { Catalog, Entry } from '../src/lib/types.ts';
import { resolveFileIcons } from './icons.ts';
export async function prepare(): Promise<Catalog> {
  const metadata: Record<string, { sha256: string; modifiedAt?: string }> =
    JSON.parse(
      await readFile('resources/.metadata.json', 'utf8').catch(() => '{}'),
    );
  const dates = new Map<string, string>();
  let revision = '';
  try {
    revision = execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
    }).trim();
    const log = execFileSync(
      'git',
      [
        '-c',
        'core.quotepath=false',
        'log',
        '--format=@@%cI',
        '--name-only',
        '--',
        'resources',
      ],
      { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
    );
    let date = '';
    for (const line of log.split('\n')) {
      if (line.startsWith('@@')) date = line.slice(2);
      else if (line.startsWith('resources/') && !dates.has(line.slice(10)))
        dates.set(line.slice(10), date);
    }
  } catch {
    /* 源码压缩包可构建，时间回退到资源文件自身。 */
  }
  const readmes: Record<string, Entry[]> = {};
  const entries = await createIndex('resources', {
    onReadme: (file) => {
      (readmes[file.parent] ||= []).push(file);
    },
    modifiedAt: async (path, sha) =>
      metadata[path]?.sha256 === sha && metadata[path].modifiedAt
        ? metadata[path].modifiedAt
        : dates.get(path),
  });
  const tooLarge = [...entries, ...Object.values(readmes).flat()].find(
    (f) => (f.size || 0) > 25 * 1024 * 1024,
  );
  if (tooLarge) throw new Error(`资源超过 EO 单文件限制：${tooLarge.path}`);
  for (const files of Object.values(readmes))
    files.sort(
      (a, b) => Number(b.name === 'README.md') - Number(a.name === 'README.md'),
    );
  const icons = new Set(['folder-base', 'document']);
  for (const file of [...entries, ...Object.values(readmes).flat()]) {
    if (file.dir) continue;
    Object.assign(file, resolveFileIcons(file.name));
    icons.add(file.icon!);
    if (file.iconLight) icons.add(file.iconLight);
  }
  const catalog = {
    entries,
    readmes,
    revision,
    builtAt: new Date().toISOString(),
  };
  await mkdir('public/_moecdn/icons', { recursive: true });
  await cp('src/assets/favicon.ico', 'public/favicon.ico');
  await cp('data/history.json', 'public/_moecdn/history.json');
  await writeFile('public/_moecdn/catalog.json', JSON.stringify(catalog));
  await Promise.all(
    [...icons].map((name) =>
      cp(
        `node_modules/material-icon-theme/icons/${name}.svg`,
        `public/_moecdn/icons/${name}.svg`,
      ),
    ),
  );
  await mkdir('public/_moecdn/licenses', { recursive: true });
  for (const directory of ['cmaps', 'standard_fonts', 'wasm', 'iccs']) {
    await cp(
      `node_modules/pdfjs-dist/${directory}`,
      `public/_moecdn/pdf/${directory}`,
      { recursive: true },
    );
  }
  await cp(
    'node_modules/pdfjs-dist/LICENSE',
    'public/_moecdn/licenses/pdfjs-LICENSE',
  );
  await cp(
    'design/licenses/material-icon-theme-LICENSE',
    'public/_moecdn/licenses/material-icon-theme-LICENSE',
  );
  console.log(
    `索引：${entries.filter((f) => !f.dir).length} 个文件，${entries.filter((f) => f.dir).length} 个目录`,
  );
  return catalog;
}
