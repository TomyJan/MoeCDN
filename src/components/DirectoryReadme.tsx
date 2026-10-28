import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { DropdownMenu } from 'radix-ui';
import { FileText, List } from 'lucide-react';
import type { Entry } from '../lib/types.ts';
import type { Translate } from '../lib/i18n.ts';
import { readDirectoryPath, resourceUrl } from '../lib/catalog.ts';
import { renderReadme } from '../lib/markdown.ts';
import { Button } from './ui.tsx';

export function DirectoryReadme({
  file,
  navigate,
  t,
}: {
  file: Entry;
  navigate: (path: string) => void;
  t: Translate;
}) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const article = useRef<HTMLElement>(null);
  const selectedHeading = useRef<string | null>(null);
  const content = useMemo(
    () => (text === null ? null : renderReadme(text, file.path)),
    [text, file.path],
  );
  useEffect(() => {
    const abort = new AbortController();
    void fetch(resourceUrl(file.path), {
      signal: abort.signal,
      cache: 'no-cache',
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const bytes = await response.arrayBuffer();
        let decoded: string;
        try {
          decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        } catch {
          decoded = new TextDecoder('gb18030').decode(bytes);
        }
        if (!abort.signal.aborted) setText(decoded);
      })
      .catch(() => {
        if (!abort.signal.aborted) setError(true);
      });
    return () => abort.abort();
  }, [file.path, attempt]);
  function scrollTo(id: string) {
    const heading = [
      ...(article.current?.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6') ||
        []),
    ].find((node) => node.id === id);
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({
      block: 'start',
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }
  function followLink(event: MouseEvent<HTMLDivElement>) {
    if (
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const link = (event.target as Element).closest('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (!href) return;
    if (href.startsWith('#readme-')) {
      event.preventDefault();
      scrollTo(href.slice(1));
      return;
    }
    const url = new URL(link.href);
    if (
      url.origin === location.origin &&
      url.pathname.endsWith('/') &&
      !url.hash &&
      !url.search &&
      !link.target
    ) {
      const path = readDirectoryPath(url.pathname);
      if (path !== null) {
        event.preventDefault();
        navigate(path);
      }
    }
  }
  return (
    <article
      id="directory-readme"
      ref={article}
      className="directory-readme"
      aria-label={file.name}
    >
      <header className="readme-header">
        <FileText aria-hidden="true" />
        <a
          href={resourceUrl(file.path)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {file.name}
        </a>
        {!!content?.headings.length && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button
                aria-label={t('readmeContents')}
                title={t('readmeContents')}
              >
                <List />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="menu radix-menu readme-menu"
                align="end"
                sideOffset={8}
                collisionPadding={12}
                onCloseAutoFocus={(event) => {
                  if (!selectedHeading.current) return;
                  event.preventDefault();
                  scrollTo(selectedHeading.current);
                  selectedHeading.current = null;
                }}
              >
                {content.headings.map((heading) => (
                  <DropdownMenu.Item
                    key={heading.id}
                    className="menu-option"
                    style={{ paddingLeft: 12 + (heading.depth - 1) * 12 }}
                    onSelect={() => {
                      selectedHeading.current = heading.id;
                    }}
                  >
                    {heading.title}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </header>
      {content ? (
        <div
          className="readme-body"
          onClick={followLink}
          dangerouslySetInnerHTML={{ __html: content.html }}
        />
      ) : (
        <div className="readme-status" role="status">
          {error ? t('loadFailed') : t('loading')}
          {error && (
            <Button
              variant="secondary"
              onClick={() => {
                setError(false);
                setAttempt((value) => value + 1);
              }}
            >
              {t('retry')}
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
