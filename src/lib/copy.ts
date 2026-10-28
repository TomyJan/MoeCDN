import type { Entry, HashAlgorithm } from './types.ts';
import { resourceUrl } from './catalog.ts';
export type CopyFormat = 'url' | 'html' | 'markdown' | 'hash';
export type CopyOptions = {
  format: CopyFormat;
  hash: HashAlgorithm;
  sri: boolean;
  cors: boolean;
};
export function copyCapabilities(file: Entry) {
  const script = /\.(m?js|cjs|css)$/i.test(file.name);
  const hash = Boolean(file.hashes && Object.values(file.hashes).length);
  return {
    html: script || /\.(png|jpe?g|gif|svg|webp|avif|ico)$/i.test(file.name),
    sri: script && hash,
    hash,
  };
}
export function buildCopy(file: Entry, options: CopyOptions, origin: string) {
  const url = new URL(resourceUrl(file.path), origin).href;
  const digest = file.hashes?.[options.hash];
  const script = /\.(m?js|cjs)$/i.test(file.name),
    style = /\.css$/i.test(file.name);
  const supports = script || style;
  const escape = (v: string) =>
    v
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;');
  if (options.format === 'hash') return digest?.hex || '';
  if (options.format === 'markdown')
    return `[${file.name.replace(/[\\[\]]/g, '\\$&')}](${url.replaceAll('(', '%28').replaceAll(')', '%29')})`;
  if (options.format !== 'html' || !copyCapabilities(file).html) return url;
  const includeSri = supports && options.sri && digest;
  const attrs =
    (includeSri ? ` integrity="${options.hash}-${digest.b64}"` : '') +
    (supports && (options.cors || includeSri)
      ? ' crossorigin="anonymous"'
      : '');
  if (script)
    return `<script${/\.mjs$/i.test(file.name) ? ' type="module"' : ''} src="${escape(url)}"${attrs}></script>`;
  if (style) return `<link rel="stylesheet" href="${escape(url)}"${attrs}>`;
  return `<img src="${escape(url)}" alt="">`;
}
