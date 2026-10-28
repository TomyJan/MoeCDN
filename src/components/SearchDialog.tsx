import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { Collapsible, Dialog } from 'radix-ui';
import {
  ChevronDown,
  CodeXml,
  FolderSearch,
  Globe,
  Search,
  SearchX,
  X,
} from 'lucide-react';
import type { Entry } from '../lib/types.ts';
import type { Translate } from '../lib/i18n.ts';
import { formatSize, resourceUrl, selectEntries } from '../lib/catalog.ts';
import { Button, CopyButton, FileIcon, Menu } from './ui.tsx';

export function SearchDialog({
  open,
  onOpenChange,
  trigger,
  entries,
  path,
  navigate,
  preview,
  advanced,
  t,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: RefObject<HTMLButtonElement | null>;
  entries: Entry[];
  path: string;
  navigate: (path: string) => void;
  preview: (file: Entry, anchor: HTMLButtonElement) => void;
  advanced: (file: Entry, event: MouseEvent<HTMLButtonElement>) => void;
  t: Translate;
  children?: ReactNode;
}) {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'current' | 'global'>('current');
  const [limit, setLimit] = useState(100);
  const [loadingMore, setLoadingMore] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<HTMLDivElement | null>(null);
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const navigating = useRef(false);
  const matches = useMemo(
    () =>
      query.trim() ? selectEntries(entries, path, query, scope, 'name') : [],
    [entries, path, query, scope],
  );

  useEffect(() => {
    setLimit(100);
    setLoadingMore(false);
  }, [query, scope, path]);
  useEffect(() => {
    if (results) results.scrollTop = 0;
  }, [results, query, scope, path]);
  useEffect(() => {
    if (!open || !sentinel || limit >= matches.length) return;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      (list) => {
        if (!list.some((item) => item.isIntersecting)) return;
        observer.disconnect();
        setLoadingMore(true);
        timeout = setTimeout(() => {
          setLimit((count) => count + 100);
          setLoadingMore(false);
        }, 160);
      },
      { root: results, rootMargin: '160px' },
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [open, results, sentinel, matches.length, limit, query, scope, path]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="search-overlay" />
        <Dialog.Content
          id="search-dialog"
          className="search-dialog"
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            navigating.current = false;
            input.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (!navigating.current) trigger.current?.focus();
          }}
        >
          <Dialog.Title className="sr-only">{t('searchTitle')}</Dialog.Title>
          <div className="searchbox" role="search">
            <Search aria-hidden="true" />
            <input
              ref={input}
              type="search"
              id="query"
              aria-label={t('search')}
              placeholder={t('search')}
              value={query}
              autoComplete="off"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  const first = results?.querySelector<HTMLButtonElement>(
                    '.search-result-name',
                  );
                  if (first) {
                    event.preventDefault();
                    first.focus();
                  }
                }
              }}
            />
            {query && (
              <Button
                id="clear-search"
                aria-label={t('clear')}
                title={t('clear')}
                onClick={() => {
                  setQuery('');
                  input.current?.focus();
                }}
              >
                <X />
              </Button>
            )}
            <div className="scope-picker">
              <Menu
                label={t(scope)}
                value={scope}
                className="text-button"
                onChange={(value) => setScope(value as 'current' | 'global')}
                options={[
                  {
                    value: 'current',
                    label: t('current'),
                    icon: <FolderSearch />,
                  },
                  { value: 'global', label: t('global'), icon: <Globe /> },
                ]}
              >
                <span>{t(scope)}</span>
                <ChevronDown className="menu-chevron" aria-hidden="true" />
              </Menu>
            </div>
            <Dialog.Close asChild>
              <Button
                className="search-close"
                aria-label={t('close')}
                title={t('close')}
              >
                <X />
              </Button>
            </Dialog.Close>
          </div>
          <Collapsible.Root open={Boolean(query.trim())} asChild>
            <Collapsible.Content
              id="search-results"
              className="search-results"
              ref={setResults}
            >
              <div className="search-results-header" aria-live="polite">
                {matches.length} {t('results')}
              </div>
              {matches.length ? (
                <ul
                  className="search-result-list"
                  onKeyDown={(event) => {
                    if (
                      !['ArrowDown', 'ArrowUp'].includes(event.key) ||
                      !(event.target as HTMLElement).closest(
                        '.search-result-name',
                      )
                    )
                      return;
                    event.preventDefault();
                    const buttons = [
                      ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
                        '.search-result-name',
                      ),
                    ];
                    const index = buttons.indexOf(
                      event.target as HTMLButtonElement,
                    );
                    const next = index + (event.key === 'ArrowDown' ? 1 : -1);
                    if (next < 0) input.current?.focus();
                    else buttons[Math.min(next, buttons.length - 1)]?.focus();
                  }}
                >
                  {matches.slice(0, limit).map((file) => (
                    <li className="search-result" key={file.path}>
                      <button
                        className="search-result-name"
                        aria-label={`${file.dir ? t('openFolder') : t('previewFile')} ${file.name}`}
                        onClick={(event) => {
                          if (file.dir) {
                            navigating.current = true;
                            navigate(file.path);
                          } else preview(file, event.currentTarget);
                        }}
                      >
                        <FileIcon file={file} />
                        <span>
                          <strong>{file.name}</strong>
                          <small>
                            {file.parent ? resourceUrl(file.parent) : '/'}
                          </small>
                        </span>
                      </button>
                      {!file.dir && (
                        <span className="search-result-size">
                          {formatSize(file.size)}
                        </span>
                      )}
                      <div className="row-actions">
                        <CopyButton
                          t={t}
                          label={file.dir ? t('copyDirectory') : t('copyLink')}
                          value={
                            new URL(resourceUrl(file.path), location.origin)
                              .href
                          }
                        />
                        {!file.dir && (
                          <Button
                            data-advanced={file.path}
                            aria-label={t('advanced')}
                            title={t('advanced')}
                            onClick={(event) => advanced(file, event)}
                          >
                            <CodeXml />
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div id="search-empty" className="search-empty">
                  <SearchX />
                  <p>{t('noResults')}</p>
                  {scope === 'current' && (
                    <Button variant="text" onClick={() => setScope('global')}>
                      {t('searchGlobal')}
                    </Button>
                  )}
                </div>
              )}
              <div
                className="search-load-status"
                role="status"
                hidden={!loadingMore}
              >
                {t('loading')}
              </div>
              <div ref={setSentinel} aria-hidden="true" />
            </Collapsible.Content>
          </Collapsible.Root>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
