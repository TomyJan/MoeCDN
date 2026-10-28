import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import {
  ArrowUp,
  ChevronRight,
  CodeXml,
  House,
  Monitor,
  Moon,
  NotebookPen,
  PanelLeft,
  Search,
  SearchX,
  Sun,
} from 'lucide-react';
import type { Catalog, Entry, Language, Sort, Theme } from './lib/types.ts';
import {
  formatSize,
  readDirectoryPath,
  resourceUrl,
  selectEntries,
} from './lib/catalog.ts';
import { translator } from './lib/i18n.ts';
import {
  Button,
  CopyButton,
  FileIcon,
  IconThemeContext,
  Menu,
} from './components/ui.tsx';
import { DirectoryTree } from './components/DirectoryTree.tsx';
import { DirectorySidebar } from './components/DirectorySidebar.tsx';
import { AdvancedCopy, type CopyTarget } from './components/AdvancedCopy.tsx';
import { Preview } from './components/Preview.tsx';
import { HistoryPage } from './components/HistoryPage.tsx';
import { SortMenu } from './components/SortMenu.tsx';
import { SearchDialog } from './components/SearchDialog.tsx';
import { DirectoryReadme } from './components/DirectoryReadme.tsx';
import { useCompactNavigation } from './lib/useCompactNavigation.ts';

function preferences(): { lang?: Language; theme?: Theme } {
  try {
    return JSON.parse(localStorage.getItem('moecdn.preferences') || '{}');
  } catch {
    return {};
  }
}
function currentPath() {
  if (location.hash.startsWith('#/')) {
    const target = location.hash.slice(1);
    if (readDirectoryPath(target) !== null)
      history.replaceState(null, '', target);
  }
  return readDirectoryPath(location.pathname);
}
export function App() {
  const header = useRef<HTMLElement>(null);
  const compactLinks = useCompactNavigation(header);
  const [catalog, setCatalog] = useState<Catalog | null>(null),
    [error, setError] = useState(false),
    [attempt, setAttempt] = useState(0);
  const [lang, setLang] = useState<Language>(() =>
    preferences().lang === 'en' ? 'en' : 'zh-CN',
  );
  const [theme, setTheme] = useState<Theme>(() => {
    const value = preferences().theme;
    return value === 'light' || value === 'dark' ? value : 'system';
  });
  const [systemDark, setSystemDark] = useState(
    () => matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const [path, setPath] = useState<string | null>(currentPath);
  const [sort, setSort] = useState<Sort>('name');
  const [expandedDirectories, setExpandedDirectories] = useState(
    new Set<string>(),
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [limit, setLimit] = useState(100),
    [loadingMore, setLoadingMore] = useState(false);
  const [preview, setPreview] = useState<Entry | null>(null),
    [copy, setCopy] = useState<CopyTarget | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false),
    [navHidden, setNavHidden] = useState(false),
    [backTop, setBackTop] = useState(false);
  const serial = useRef(0),
    sentinel = useRef<HTMLDivElement>(null),
    main = useRef<HTMLElement>(null),
    navTrigger = useRef<HTMLButtonElement>(null),
    searchTrigger = useRef<HTMLButtonElement>(null),
    previewTrigger = useRef<HTMLButtonElement | null>(null),
    direction = useRef(1);
  const t = translator(lang),
    entries = catalog?.entries;
  const scheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const change = () => setSystemDark(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    document.documentElement.style.colorScheme = scheme;
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(
        'moecdn.preferences',
        JSON.stringify({ lang, theme }),
      );
    } catch {
      /* 存储被禁用时仍可使用。 */
    }
  }, [lang, theme, scheme]);
  useEffect(() => {
    const abort = new AbortController();
    void fetch('/_moecdn/catalog.json', {
      signal: abort.signal,
      cache: 'no-cache',
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = (await response.json()) as Catalog;
        if (!Array.isArray(data.entries)) throw new Error('Invalid catalog');
        setCatalog(data);
        setError(false);
      })
      .catch(() => {
        if (!abort.signal.aborted) setError(true);
      });
    return () => abort.abort();
  }, [attempt]);
  useEffect(() => {
    const pop = () => {
      direction.current = -1;
      setPath(currentPath());
      setSearchOpen(false);
      setLimit(100);
      setPreview(null);
      setCopy(null);
      setMobileNav(false);
    };
    addEventListener('popstate', pop);
    return () => removeEventListener('popstate', pop);
  }, []);
  useEffect(() => {
    if (!copy?.closing) return;
    const timeout = setTimeout(
      () => setCopy((value) => (value?.serial === copy.serial ? null : value)),
      150,
    );
    return () => clearTimeout(timeout);
  }, [copy]);
  useEffect(() => {
    if (!preview || previewOpen) return;
    const timeout = setTimeout(() => setPreview(null), 150);
    return () => clearTimeout(timeout);
  }, [preview, previewOpen]);
  useEffect(() => {
    let previous = scrollY;
    const scroll = () => {
      const y = scrollY;
      setBackTop(y > 80);
      if (Math.abs(y - previous) > 7) {
        setNavHidden(y > previous && y > 90 && !preview && !mobileNav);
        previous = y;
      }
      if (y < 50) setNavHidden(false);
    };
    addEventListener('scroll', scroll, { passive: true });
    return () => removeEventListener('scroll', scroll);
  }, [preview, mobileNav]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        (event.key === '/' ||
          ((event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === 'k')) &&
        !preview &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (event.target as HTMLElement).tagName,
        ) &&
        !(event.target as HTMLElement).isContentEditable
      ) {
        event.preventDefault();
        setSearchOpen(true);
        setCopy(null);
        setMobileNav(false);
      }
      if (event.key === 'Escape') setMobileNav(false);
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [preview]);
  const normalized =
    path === '' ? '' : path && (path.endsWith('/') ? path : path + '/');
  useEffect(() => {
    setExpandedDirectories((previous) => {
      const next = new Set(previous);
      let current = '';
      for (const segment of (normalized || '').split('/').filter(Boolean)) {
        current += segment + '/';
        next.add(current);
      }
      return next;
    });
  }, [normalized]);
  const isHistory = normalized === 'history/';
  const readme = catalog?.readmes?.[normalized || '']?.[0];
  const exists =
    normalized !== null &&
    (normalized === '' ||
      isHistory ||
      entries?.some((f) => f.dir && f.path === normalized));
  useEffect(() => {
    if (exists && path !== normalized && normalized !== null) {
      history.replaceState(null, '', resourceUrl(normalized));
      setPath(normalized);
    }
  }, [exists, normalized, path]);
  const visible = useMemo(
    () => selectEntries(entries || [], normalized || '', '', 'current', sort),
    [entries, normalized, sort],
  );
  useEffect(() => {
    setLimit(100);
    setLoadingMore(false);
  }, [path, sort]);
  useEffect(() => {
    if (!main.current || matchMedia('(prefers-reduced-motion: reduce)').matches)
      return;
    const animation = main.current.animate(
      [
        { opacity: 0.25, transform: `translateX(${direction.current * 20}px)` },
        { opacity: 1, transform: 'translateX(0)' },
      ],
      { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' },
    );
    return () => animation.cancel();
  }, [path]);
  useEffect(() => {
    if (!sentinel.current || limit >= visible.length) return;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      (list) => {
        if (!list.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setLoadingMore(true);
        timeout = setTimeout(() => {
          setLimit((value) => value + 100);
          setLoadingMore(false);
        }, 160);
      },
      { rootMargin: '280px' },
    );
    observer.observe(sentinel.current);
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [visible.length, limit, path, sort]);
  function navigate(next: string) {
    if (next !== normalized) {
      direction.current = next.startsWith(normalized || '') ? 1 : -1;
      history.pushState(null, '', resourceUrl(next));
      setPath(next);
      window.scrollTo({ top: 0 });
    }
    setSearchOpen(false);
    setLimit(100);
    setPreview(null);
    setCopy(null);
    setMobileNav(false);
  }
  function advanced(file: Entry, event: MouseEvent<HTMLButtonElement>) {
    const anchor = event.currentTarget;
    setCopy((previous) =>
      previous?.file.path === file.path && !previous.closing
        ? { ...previous, closing: true }
        : { file, anchor, serial: ++serial.current },
    );
  }
  const folderCount = visible.filter((f) => f.dir).length,
    fileCount = visible.length - folderCount;
  const stats = [
    folderCount ? `${folderCount} ${t('folders')}` : '',
    fileCount ? `${fileCount} ${t('files')}` : '',
    fileCount ? formatSize(visible.reduce((n, f) => n + (f.size || 0), 0)) : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const segments = (normalized || '').split('/').filter(Boolean);
  const popup = copy ? (
    <AdvancedCopy
      key={copy.serial}
      target={copy}
      close={() =>
        setCopy((value) => (value ? { ...value, closing: true } : null))
      }
      t={t}
    />
  ) : null;
  const popupInPreview = Boolean(copy?.anchor.closest('#preview-dialog'));
  const popupInSearch = Boolean(copy?.anchor.closest('#search-dialog'));
  const themeIcon =
    theme === 'system' ? <Monitor /> : theme === 'dark' ? <Moon /> : <Sun />;
  return (
    <IconThemeContext.Provider value={scheme}>
      <div id="app">
        <header
          ref={header}
          data-compact-links={compactLinks}
          className={'topbar' + (navHidden ? ' nav-hidden' : '')}
        >
          <a
            className="brand"
            href="/"
            aria-label="MoeCDN"
            onClick={(event) => {
              if (
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              event.preventDefault();
              navigate('');
            }}
          >
            <img className="brand-icon" src="/favicon.ico" alt="" />
            <span>MoeCDN</span>
            <span className="domain">cdn.amoe.cc</span>
          </a>
          <div className="top-actions">
            <a
              className="nav-link"
              href="https://vov.moe"
              aria-label={t('home')}
              title={t('home')}
              target="_blank"
              rel="noopener"
            >
              <House />
              <span>{t('home')}</span>
            </a>
            <a
              className="nav-link"
              href="https://blog.tomys.top"
              aria-label={t('blog')}
              title={t('blog')}
              target="_blank"
              rel="noopener"
            >
              <NotebookPen />
              <span>{t('blog')}</span>
            </a>
            <Button
              ref={navTrigger}
              id="nav-toggle"
              className="mobile-only"
              aria-label={t('directoryNav')}
              aria-expanded={mobileNav}
              onClick={() => setMobileNav(!mobileNav)}
            >
              <PanelLeft />
            </Button>
            <Menu
              label={t('language')}
              value={lang}
              onChange={(value) => setLang(value as Language)}
              options={[
                { value: 'zh-CN', label: '简体中文', icon: <span>中</span> },
                { value: 'en', label: 'English', icon: <span>EN</span> },
              ]}
            >
              <span className="language-glyph">
                {lang === 'zh-CN' ? '中' : 'EN'}
              </span>
            </Menu>
            <Menu
              label={t('appearance')}
              value={theme}
              onChange={(value) => setTheme(value as Theme)}
              options={[
                { value: 'system', label: t('system'), icon: <Monitor /> },
                { value: 'light', label: t('light'), icon: <Sun /> },
                { value: 'dark', label: t('dark'), icon: <Moon /> },
              ]}
            >
              {themeIcon}
            </Menu>
          </div>
        </header>
        {!catalog ? (
          <main className="app-state">
            <Search />
            <p>{error ? t('loadFailed') : t('loading')}</p>
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
          </main>
        ) : (
          <>
            <div className="layout">
              <DirectorySidebar
                open={mobileNav}
                onOpenChange={setMobileNav}
                restoreFocus={() => {
                  if (!searchOpen)
                    navTrigger.current?.focus({ preventScroll: true });
                }}
                t={t}
              >
                <DirectoryTree
                  entries={catalog.entries}
                  path={normalized || ''}
                  navigate={navigate}
                  expanded={expandedDirectories}
                  setExpanded={setExpandedDirectories}
                  t={t}
                />
              </DirectorySidebar>
              <main
                ref={main}
                className={isHistory ? 'history-main' : undefined}
              >
                <nav
                  id="breadcrumbs"
                  className="breadcrumbs"
                  aria-label={t('directories')}
                >
                  <button aria-label={t('root')} onClick={() => navigate('')}>
                    <House />
                  </button>
                  {segments.map((part, index) => (
                    <span className="breadcrumb-part" key={index}>
                      <ChevronRight />
                      <button
                        onClick={() =>
                          navigate(segments.slice(0, index + 1).join('/') + '/')
                        }
                        aria-current={
                          index === segments.length - 1 ? 'page' : undefined
                        }
                      >
                        {isHistory ? t('history') : part}
                      </button>
                    </span>
                  ))}
                </nav>
                {!exists ? (
                  <div id="empty" className="empty-state">
                    <SearchX />
                    <h1>{t('notFound')}</h1>
                    <Button variant="secondary" onClick={() => navigate('')}>
                      {t('backRoot')}
                    </Button>
                  </div>
                ) : isHistory ? (
                  <HistoryPage t={t} />
                ) : (
                  <>
                    <div className="heading">
                      <div className="heading-main">
                        {normalized && (
                          <FileIcon
                            file={{
                              name: '',
                              path: normalized,
                              parent: '',
                              dir: true,
                              size: null,
                              modifiedAt: '',
                            }}
                          />
                        )}
                        <div>
                          <h1 id="title">{segments.at(-1) || t('allFiles')}</h1>
                        </div>
                      </div>
                      <Button
                        ref={searchTrigger}
                        id="open-search"
                        aria-label={t('searchTitle')}
                        title={t('searchTitle')}
                        onClick={() => {
                          setCopy(null);
                          setSearchOpen(true);
                        }}
                      >
                        <Search />
                      </Button>
                    </div>
                    <div className="list-toolbar">
                      <div id="result-count" aria-live="polite" hidden={!stats}>
                        {stats}
                      </div>
                      <SortMenu value={sort} onChange={setSort} t={t} />
                    </div>
                    <table className="file-table">
                      <thead>
                        <tr>
                          <th scope="col">{t('name')}</th>
                          <th scope="col" className="size-column">
                            {t('size')}
                          </th>
                          <th scope="col" className="date-column">
                            {t('time')}
                          </th>
                          <th scope="col" className="action-column">
                            {t('actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody id="rows">
                        {visible.slice(0, limit).map((file) => (
                          <tr key={file.path}>
                            <td>
                              <button
                                className="file-name"
                                data-file={file.path}
                                aria-label={`${file.dir ? t('openFolder') : t('previewFile')} ${file.name}`}
                                onClick={(event) => {
                                  if (file.dir) navigate(file.path);
                                  else {
                                    previewTrigger.current =
                                      event.currentTarget;
                                    setCopy(null);
                                    setPreview(file);
                                    setPreviewOpen(true);
                                  }
                                }}
                              >
                                <FileIcon file={file} />
                                <span className="file-label">
                                  <span>{file.name}</span>
                                </span>
                              </button>
                            </td>
                            <td className="size-column">
                              {formatSize(file.size)}
                            </td>
                            <td className="date-column">
                              {file.modifiedAt.slice(0, 10) || '—'}
                            </td>
                            <td className="action-column">
                              <div className="row-actions">
                                <CopyButton
                                  t={t}
                                  label={
                                    file.dir
                                      ? t('copyDirectory')
                                      : t('copyLink')
                                  }
                                  value={
                                    new URL(
                                      resourceUrl(file.path),
                                      location.origin,
                                    ).href
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
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!visible.length && (
                      <div id="empty" className="empty-state">
                        <SearchX />
                        <h2>{t('empty')}</h2>
                      </div>
                    )}
                    <div className="list-footer">
                      <span
                        id="load-status"
                        role="status"
                        hidden={!loadingMore}
                      >
                        {t('loading')}
                      </span>
                    </div>
                    <div id="load-sentinel" ref={sentinel} aria-hidden="true" />
                    {readme && (
                      <DirectoryReadme
                        key={readme.path}
                        file={readme}
                        navigate={navigate}
                        t={t}
                      />
                    )}
                  </>
                )}
              </main>
            </div>
            <footer className="page-footer">
              <a
                href="https://github.com/TomyJan/MoeCDN"
                target="_blank"
                rel="noopener"
              >
                MoeCDN
              </a>
              {catalog.revision && (
                <>
                  {' '}
                  <a
                    className="commit-link"
                    href={
                      'https://github.com/TomyJan/MoeCDN/commit/' +
                      catalog.revision
                    }
                    target="_blank"
                    rel="noopener"
                  >
                    {catalog.revision.slice(0, 8)}
                  </a>
                </>
              )}
              {' | '}
              <a
                href="/history/"
                aria-current={isHistory ? 'page' : undefined}
                onClick={(event) => {
                  if (
                    event.button !== 0 ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                  )
                    return;
                  event.preventDefault();
                  navigate('history/');
                }}
              >
                {t('history')}
              </a>
              {' | '}
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener"
              >
                鲁ICP备2021003464号-1
              </a>
            </footer>
            <SearchDialog
              key={normalized}
              open={searchOpen}
              onOpenChange={(open) => {
                setSearchOpen(open);
                if (!open) setCopy(null);
              }}
              trigger={searchTrigger}
              fallbackTrigger={navTrigger}
              entries={catalog.entries}
              path={isHistory ? '' : normalized || ''}
              navigate={navigate}
              preview={(file, anchor) => {
                previewTrigger.current = anchor;
                setCopy(null);
                setPreview(file);
                setPreviewOpen(true);
              }}
              advanced={advanced}
              t={t}
            >
              {popupInSearch && popup}
            </SearchDialog>
          </>
        )}
        {preview && (
          <Preview
            key={preview.path}
            file={preview}
            open={previewOpen}
            t={t}
            lang={lang}
            theme={scheme}
            restoreFocus={() => {
              if (previewTrigger.current?.isConnected)
                previewTrigger.current.focus();
              else searchTrigger.current?.focus();
            }}
            close={() => {
              setPreviewOpen(false);
              setCopy(null);
            }}
            advanced={advanced}
          >
            {popupInPreview && popup}
          </Preview>
        )}
        {!popupInPreview && !popupInSearch && popup}
        <Button
          id="back-to-top"
          className={'back-to-top' + (backTop ? ' visible' : '')}
          aria-label={t('backTop')}
          inert={!backTop}
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'instant'
                : 'smooth',
            })
          }
        >
          <ArrowUp />
        </Button>
        <span className="sr-only" aria-live="polite">
          {catalog ? '' : t('loading')}
        </span>
      </div>
    </IconThemeContext.Provider>
  );
}
