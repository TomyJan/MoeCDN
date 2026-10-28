import type { Entry, Sort } from './types.ts';
export function resourceUrl(path: string) {
  return '/' + path.split('/').map(encodeURIComponent).join('/');
}
export function readDirectoryPath(path: string): string | null {
  try {
    if (/%2f|%5c/i.test(path)) return null;
    const value = decodeURIComponent(path).replace(/^\//, '');
    if (
      value.split('/').some((p) => p === '..' || p === '.' || p.includes('\\'))
    )
      return null;
    return value;
  } catch {
    return null;
  }
}
export function selectEntries(
  entries: Entry[],
  path: string,
  query: string,
  scope: 'current' | 'global',
  sort: Sort,
) {
  const needle = query.trim().toLocaleLowerCase();
  return entries
    .filter((f) =>
      needle
        ? (scope === 'global' || f.path.startsWith(path)) &&
          f.path.toLocaleLowerCase().includes(needle)
        : f.parent === path,
    )
    .sort((a, b) => {
      if (a.dir !== b.dir) return a.dir ? -1 : 1;
      if (sort === 'size')
        return (b.size || 0) - (a.size || 0) || a.path.localeCompare(b.path);
      if (sort === 'date')
        return (
          (Date.parse(b.modifiedAt) || 0) - (Date.parse(a.modifiedAt) || 0) ||
          a.path.localeCompare(b.path)
        );
      return (
        a.name.localeCompare(b.name, 'zh-CN', { numeric: true }) *
        (sort === 'name-desc' ? -1 : 1)
      );
    });
}
export function fileType(f: Entry) {
  return f.name.split('.').pop()?.toLowerCase() || '';
}
export function iconName(f: Entry) {
  if (f.dir) return 'folder-base';
  const ext = fileType(f);
  if (/^(m?js|cjs|jsx|ts|tsx)$/.test(ext)) return 'javascript';
  if (/^(png|jpe?g|svg|gif|webp|avif|ico)$/.test(ext)) return 'image';
  if (/^(woff2?|ttf|otf)$/.test(ext)) return 'font';
  return (
    (
      {
        css: 'css',
        html: 'html',
        htm: 'html',
        md: 'markdown',
        pdf: 'pdf',
        json: 'json',
      } as Record<string, string>
    )[ext] || 'document'
  );
}
export function formatSize(n: number | null) {
  if (n === null) return '—';
  return n >= 1048576
    ? (n / 1048576).toFixed(2) + ' MB'
    : n >= 1024
      ? (n / 1024).toFixed(1) + ' KB'
      : n + ' B';
}
