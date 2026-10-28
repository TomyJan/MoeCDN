import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { resourceUrl } from './catalog.ts';

function slug(text: string) {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
      .replace(/\s+/g, '-') || 'section'
  );
}

export function renderReadme(text: string, path: string) {
  const html = DOMPurify.sanitize(marked.parse(text, { async: false }), {
    USE_PROFILES: { html: true },
    FORBID_TAGS: [
      'style',
      'iframe',
      'form',
      'input',
      'button',
      'textarea',
      'select',
    ],
    FORBID_ATTR: ['style', 'id', 'name'],
  });
  const document = new DOMParser().parseFromString(html, 'text/html');
  const used = new Set<string>();
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(
    (heading) => {
      const title = heading.textContent || '';
      const base = 'readme-' + slug(title);
      let id = base;
      for (let suffix = 1; used.has(id); suffix++) id = base + '-' + suffix;
      used.add(id);
      heading.id = id;
      heading.setAttribute('tabindex', '-1');
      return { id, title, depth: Number(heading.tagName.slice(1)) };
    },
  );
  const base = new URL(resourceUrl(path), location.origin);
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href]')) {
    const href = link.getAttribute('href')!;
    if (href.startsWith('#')) {
      let fragment = href.slice(1);
      try {
        fragment = decodeURIComponent(fragment);
      } catch {
        /* 保留不完整的原始片段。 */
      }
      link.setAttribute('href', '#readme-' + slug(fragment));
    } else {
      let url: URL;
      try {
        url = new URL(href, base);
      } catch {
        link.removeAttribute('href');
        continue;
      }
      link.setAttribute(
        'href',
        url.origin === location.origin
          ? url.pathname + url.search + url.hash
          : url.href,
      );
      if (url.origin !== location.origin || !url.pathname.endsWith('/')) {
        link.target = '_blank';
        link.rel = 'noopener';
      }
    }
  }
  for (const image of document.querySelectorAll<HTMLImageElement>('img')) {
    const src = image.getAttribute('src');
    if (src && !src.startsWith('data:')) {
      let url: URL;
      try {
        url = new URL(src, base);
      } catch {
        image.removeAttribute('src');
        continue;
      }
      image.setAttribute(
        'src',
        url.origin === location.origin ? url.pathname + url.search : url.href,
      );
    }
    image.removeAttribute('srcset');
    image.loading = 'lazy';
    image.decoding = 'async';
  }
  return { html: document.body.innerHTML, headings };
}
