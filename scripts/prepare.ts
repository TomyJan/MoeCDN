import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createIndex } from './indexer.ts';
import type { Catalog } from '../src/lib/types.ts';
export const icons = [
  'folder-base',
  'javascript',
  'css',
  'html',
  'image',
  'markdown',
  'pdf',
  'font',
  'json',
  'document',
];
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
  const entries = await createIndex('resources', {
    modifiedAt: async (path, sha) =>
      metadata[path]?.sha256 === sha && metadata[path].modifiedAt
        ? metadata[path].modifiedAt
        : dates.get(path),
  });
  const tooLarge = entries.find((f) => (f.size || 0) > 25 * 1024 * 1024);
  if (tooLarge) throw new Error(`资源超过 EO 单文件限制：${tooLarge.path}`);
  const catalog = { entries, revision, builtAt: new Date().toISOString() };
  await mkdir('public/_moecdn/icons', { recursive: true });
  await cp('src/assets/favicon.ico', 'public/favicon.ico');
  await cp('data/history.json', 'public/_moecdn/history.json');
  await writeFile('public/_moecdn/catalog.json', JSON.stringify(catalog));
  await Promise.all(
    icons.map((name) =>
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
  await cp(
    'node_modules/@fontsource/source-code-pro/files/source-code-pro-latin-400-normal.woff2',
    'public/_moecdn/source-code-pro.woff2',
  );
  await cp(
    'node_modules/@fontsource/source-code-pro/LICENSE',
    'public/_moecdn/licenses/source-code-pro-LICENSE',
  );
  const sans = await readFile('src/assets/misans.css', 'utf8');
  await writeFile(
    'public/_moecdn/preview-fonts.css',
    sans +
      '\n@font-face{font-family:"Source Code Pro";font-style:normal;font-weight:400;font-display:swap;src:url("/_moecdn/source-code-pro.woff2") format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;}',
  );
  console.log(
    `索引：${entries.filter((f) => !f.dir).length} 个文件，${entries.filter((f) => f.dir).length} 个目录`,
  );
  return catalog;
}
