import { useLayoutEffect, useRef, useState, type SetStateAction } from 'react';
import { readDirectoryPath, resourceUrl } from './catalog.ts';
import type { Sort } from './types.ts';

interface DirectoryView {
  path: string | null;
  sort: Sort;
  limit: number;
}
interface Snapshot extends DirectoryView {
  left: number;
  top: number;
}

function currentPath() {
  if (location.hash.startsWith('#/')) {
    const target = location.hash.slice(1);
    const path = readDirectoryPath(target);
    if (path === null) return null;
    history.replaceState(history.state, '', resourceUrl(path));
    return path;
  }
  return readDirectoryPath(location.pathname);
}

function createEntryId() {
  return crypto.getRandomValues(new Uint32Array(4)).join('-');
}

function entryId() {
  const existing: unknown = history.state?.moecdnEntry;
  if (typeof existing === 'string') return existing;
  const id = createEntryId();
  history.replaceState({ ...history.state, moecdnEntry: id }, '');
  return id;
}

export function useDirectoryHistory(ready: boolean) {
  const [view, setView] = useState<DirectoryView>(() => ({
    path: currentPath(),
    sort: 'name',
    limit: 100,
  }));
  const snapshots = useRef(new Map<string, Snapshot>());
  const active = useRef({ id: '', view });
  const restore = useRef<{ left: number; top: number } | null>(null);

  // 接管同文档历史滚动，避免浏览器在旧列表仍不足高时提前截短位置。
  useLayoutEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    active.current.id = entryId();
    const pop = () => {
      snapshots.current.set(active.current.id, {
        ...active.current.view,
        left: scrollX,
        top: scrollY,
      });
      active.current.id = entryId();
      const saved = snapshots.current.get(active.current.id);
      restore.current = saved || { left: 0, top: 0 };
      setView({
        path: currentPath(),
        sort: saved?.sort ?? active.current.view.sort,
        limit: saved?.limit ?? 100,
      });
    };
    addEventListener('popstate', pop);
    return () => {
      removeEventListener('popstate', pop);
      history.scrollRestoration = previous;
    };
  }, []);

  useLayoutEffect(() => {
    active.current.view = view;
    const target = restore.current;
    if (!ready || !target) return;
    const stop = () => {
      observer.disconnect();
      removeEventListener('resize', apply);
      for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown'])
        removeEventListener(event, cancel);
    };
    const cancel = () => {
      restore.current = null;
      stop();
    };
    const apply = () => {
      if (restore.current !== target) return;
      // 历史记录、README 等可能仍在加载，等页面足够高再恢复。
      if (target.top > document.documentElement.scrollHeight - innerHeight + 1)
        return;
      window.scrollTo({
        left: target.left,
        top: target.top,
        behavior: 'instant',
      });
      cancel();
    };
    const observer = new ResizeObserver(apply);
    observer.observe(document.body);
    addEventListener('resize', apply);
    // 等待内容时一旦用户开始操作，便不再覆盖其滚动位置。
    for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown'])
      addEventListener(event, cancel, { passive: true });
    apply();
    return stop;
  }, [ready, view]);

  function navigate(path: string) {
    snapshots.current.set(active.current.id, {
      ...active.current.view,
      left: scrollX,
      top: scrollY,
    });
    const id = createEntryId();
    history.pushState({ moecdnEntry: id }, '', resourceUrl(path));
    active.current.id = id;
    restore.current = { left: 0, top: 0 };
    setView((previous) => ({ ...previous, path, limit: 100 }));
  }

  return {
    ...view,
    navigate,
    setPath: (path: string) => setView((previous) => ({ ...previous, path })),
    setSort: (sort: Sort) =>
      setView((previous) => ({ ...previous, sort, limit: 100 })),
    setLimit: (limit: SetStateAction<number>) =>
      setView((previous) => ({
        ...previous,
        limit: typeof limit === 'function' ? limit(previous.limit) : limit,
      })),
  };
}
