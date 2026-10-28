import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from 'react';
import { Dialog } from 'radix-ui';
import {
  Code,
  Eye,
  Columns2,
  CodeXml,
  ExternalLink,
  Download,
  X,
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { Entry } from '../lib/types.ts';
import type { Translate } from '../lib/i18n.ts';
import { fileType, formatSize, resourceUrl } from '../lib/catalog.ts';
import { Button, CopyButton, FileIcon } from './ui.tsx';

const PdfPreview = lazy(() => import('./PdfPreview.tsx'));

function escapeAttribute(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;');
}
export function Preview({
  file,
  open,
  t,
  close,
  advanced,
  theme,
  lang,
  children,
}: {
  file: Entry;
  open: boolean;
  t: Translate;
  close: () => void;
  advanced: (f: Entry, e: MouseEvent<HTMLButtonElement>) => void;
  theme: string;
  lang: string;
  children?: React.ReactNode;
}) {
  const [mode, setMode] = useState<'source' | 'render' | 'split'>('source');
  const [text, setText] = useState<string | null>(null),
    [error, setError] = useState(false),
    [encoding, setEncoding] = useState(''),
    [extra, setExtra] = useState('');
  const [fontLoaded, setFontLoaded] = useState(false);
  const ext = fileType(file),
    url = resourceUrl(file.path);
  const image = /^(png|jpe?g|webp|gif|svg|ico|avif)$/.test(ext);
  const media = /^(mp4|webm|ogg|mp3|wav|m4a|flac)$/.test(ext);
  const font = /^(woff2?|ttf|otf)$/.test(ext);
  const document = /^(html?|md)$/.test(ext);
  const isText =
    /^(m?js|cjs|css|html?|md|json|txt|xml|ya?ml|ts|tsx|jsx|csv|log|ini|conf|toml|sh|py|php|vue|svelte|sql|map)$/.test(
      ext,
    ) || file.name === 'LICENSE';
  const tooLarge = (file.size || 0) > 2 * 1024 * 1024;
  useEffect(() => {
    const abort = new AbortController();
    if (isText && !tooLarge) {
      void fetch(url, { signal: abort.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          const bytes = new Uint8Array(await response.arrayBuffer());
          if (abort.signal.aborted) return;
          let decoded: string;
          try {
            decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
            setEncoding('UTF-8');
          } catch {
            decoded = new TextDecoder('gb18030').decode(bytes);
            setEncoding('GB18030');
          }
          setText(decoded);
        })
        .catch(() => {
          if (!abort.signal.aborted) setError(true);
        });
    }
    let loaded: FontFace | null = null;
    if (font) {
      const face = new FontFace('moecdn-preview', `url("${url}")`);
      void face
        .load()
        .then((value) => {
          if (!abort.signal.aborted) {
            loaded = value;
            window.document.fonts.add(value);
            setFontLoaded(true);
          }
        })
        .catch(() => {
          if (!abort.signal.aborted) setError(true);
        });
    }
    return () => {
      abort.abort();
      if (loaded) window.document.fonts.delete(loaded);
    };
  }, [url, font, isText, tooLarge]);
  const rendered = useMemo(() => {
    if (!document || text === null) return '';
    const base = new URL(url, location.origin).href.replace(/[^/]*$/, '');
    const baseTag = `<base href="${escapeAttribute(base)}">`;
    if (ext === 'md') {
      const content = DOMPurify.sanitize(marked.parse(text, { async: false }), {
        FORBID_TAGS: ['style', 'iframe', 'form'],
        FORBID_ATTR: ['style'],
      });
      const dark =
        theme === 'dark' ||
        (theme === 'system' &&
          matchMedia('(prefers-color-scheme: dark)').matches);
      return `<!doctype html><html><head><meta charset="utf-8">${baseTag}<link rel="stylesheet" href="${location.origin}/_moecdn/preview-fonts.css"><style>body{margin:0;padding:24px 28px;font:14px/1.8 'Source Code Pro',MiSans,system-ui,sans-serif;background:${dark ? '#181818' : '#fff'};color:${dark ? '#e7e7e7' : '#292929'};overflow-wrap:anywhere}img{max-width:100%}pre{overflow:auto;padding:15px;background:${dark ? '#252525' : '#f4f4f4'};border-radius:7px}a{color:${dark ? '#6bc8c8' : '#007c7c'}}table{border-collapse:collapse}td,th{border:1px solid #888;padding:8px}code{font-family:inherit}blockquote{padding-left:18px;border-left:3px solid #888}</style></head><body>${content}</body></html>`;
    }
    return /<head(?:\s[^>]*)?>/i.test(text)
      ? text.replace(/<head(?:\s[^>]*)?>/i, (match) => match + baseTag)
      : baseTag + text;
  }, [text, document, ext, url, theme]);
  function duration(value: number) {
    if (!Number.isFinite(value) || value <= 0) return;
    if (value < 1) setExtra(value.toFixed(2) + ' s');
    else {
      const seconds = Math.floor(value),
        hours = Math.floor(seconds / 3600);
      setExtra(
        (hours
          ? hours +
            ':' +
            String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
          : Math.floor(seconds / 60)) +
          ':' +
          String(seconds % 60).padStart(2, '0'),
      );
    }
  }
  const unavailable = (
    <div className="preview-unavailable">
      <CodeXml />
      <h3>{error ? t('loadFailed') : t('unsupported')}</h3>
      <p>{t('unsupportedHint')}</p>
    </div>
  );
  let body;
  if (error) body = unavailable;
  else if (image)
    body = (
      <div className="preview-image">
        <img
          src={url}
          alt={file.name}
          onLoad={(event) =>
            setExtra(
              `${event.currentTarget.naturalWidth} × ${event.currentTarget.naturalHeight}`,
            )
          }
          onError={() => setError(true)}
        />
      </div>
    );
  else if (media) {
    const Component = /^(mp4|webm)$/.test(ext) ? 'video' : 'audio';
    body = (
      <div className="preview-media">
        <Component
          controls
          src={url}
          preload="metadata"
          onLoadedMetadata={(event) => duration(event.currentTarget.duration)}
          onDurationChange={(event) => duration(event.currentTarget.duration)}
          onError={() => setError(true)}
        />
      </div>
    );
  } else if (ext === 'pdf')
    body = (
      <Suspense
        fallback={<div className="preview-loading">{t('previewLoading')}</div>}
      >
        <PdfPreview
          key={url}
          url={url}
          loading={t('previewLoading')}
          failed={t('loadFailed')}
        />
      </Suspense>
    );
  else if (font)
    body = (
      <div
        className="font-preview"
        style={{
          fontFamily: fontLoaded
            ? 'moecdn-preview, MiSans, sans-serif'
            : undefined,
        }}
      >
        <p style={{ fontSize: 42 }}>山川异域，风月同天。</p>
        <p style={{ fontSize: 32 }}>
          The quick brown fox jumps over the lazy dog.
        </p>
        <p style={{ fontSize: 24 }}>0123456789 · Aa Bb Cc</p>
      </div>
    );
  else if (!isText || tooLarge) body = unavailable;
  else if (text === null)
    body = <div className="preview-loading">{t('previewLoading')}</div>;
  else
    body = (
      <>
        {mode !== 'render' && (
          <div className="source-pane">
            <pre className="code-preview">
              <code>{text}</code>
            </pre>
          </div>
        )}
        {mode !== 'source' && document && (
          <iframe
            className="render-pane"
            sandbox=""
            referrerPolicy="no-referrer"
            title={file.name}
            srcDoc={rendered}
          />
        )}
      </>
    );
  const timestamp = file.modifiedAt
    ? new Date(file.modifiedAt)
        .toLocaleString(lang === 'en' ? 'sv-SE' : 'zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
        .replaceAll('/', '-')
    : '—';
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="preview-overlay" />
        <Dialog.Content
          id="preview-dialog"
          className="preview-dialog radix-preview"
          aria-describedby={undefined}
        >
          <header className="preview-header">
            <div className="preview-filename">
              <FileIcon file={file} />
              <Dialog.Title asChild>
                <h2 id="preview-name">{file.name}</h2>
              </Dialog.Title>
            </div>
            <div className="preview-tools">
              {document && (
                <div
                  id="preview-modes"
                  className="preview-modes"
                  role="group"
                  aria-label={t('render')}
                >
                  {(
                    [
                      { key: 'source', icon: <Code /> },
                      { key: 'render', icon: <Eye /> },
                      { key: 'split', icon: <Columns2 /> },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.key}
                      aria-label={t(option.key)}
                      aria-pressed={mode === option.key}
                      onClick={() => setMode(option.key)}
                    >
                      {option.icon}
                      <span className="mode-label">{t(option.key)}</span>
                    </button>
                  ))}
                </div>
              )}
              <CopyButton
                id="preview-copy"
                value={new URL(url, location.origin).href}
                t={t}
              />
              <Button
                id="preview-advanced"
                data-advanced={file.path}
                aria-label={t('advanced')}
                title={t('advanced')}
                onClick={(event) => advanced(file, event)}
              >
                <CodeXml />
              </Button>
              <a
                id="preview-original"
                className="icon-button"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('original')}
                title={t('original')}
              >
                <ExternalLink />
              </a>
              <a
                className="icon-button"
                href={url + '?download=1'}
                download={file.name}
                aria-label={t('download')}
                title={t('download')}
              >
                <Download />
              </a>
              <span className="tool-divider" />
              <Dialog.Close asChild>
                <Button aria-label={t('close')} title={t('close')}>
                  <X />
                </Button>
              </Dialog.Close>
            </div>
          </header>
          <div
            id="preview-body"
            className={
              'preview-body' +
              (mode === 'split'
                ? ' is-split'
                : mode === 'render'
                  ? ' is-render'
                  : '')
            }
          >
            {body}
          </div>
          <footer id="preview-properties" className="preview-properties">
            <div className="property-left">
              <span>{formatSize(file.size)}</span>
              <span title={t('modified')}>{timestamp}</span>
            </div>
            <div className="property-right">
              <span id="preview-extra">{extra}</span>
              <span>{encoding}</span>
              <span>
                {(
                  {
                    js: 'JavaScript',
                    md: 'Markdown',
                    html: 'HTML',
                    htm: 'HTML',
                    txt: 'Text',
                  } as Record<string, string>
                )[ext] || ext.toUpperCase()}
              </span>
            </div>
          </footer>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
