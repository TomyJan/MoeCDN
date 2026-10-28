import { Collapsible } from 'radix-ui';
import { ChevronRight, FolderOpen } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Entry } from '../lib/types.ts';
import type { Translate } from '../lib/i18n.ts';
import { Button, FileIcon } from './ui.tsx';
export function DirectoryTree({
  entries,
  path,
  navigate,
  t,
}: {
  entries: Entry[];
  path: string;
  navigate: (p: string) => void;
  t: Translate;
}) {
  const [expanded, setExpanded] = useState(new Set<string>());
  const children = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const file of entries)
      if (file.dir)
        map.set(file.parent, [...(map.get(file.parent) || []), file]);
    return map;
  }, [entries]);
  useEffect(() => {
    setExpanded((previous) => {
      const next = new Set(previous);
      let current = '';
      for (const segment of path.split('/').filter(Boolean)) {
        current += segment + '/';
        next.add(current);
      }
      return next;
    });
  }, [path]);
  function branch(parent: string, depth: number) {
    return children.get(parent)?.map((file) => (
      <Collapsible.Root
        key={file.path}
        open={expanded.has(file.path)}
        onOpenChange={(open) =>
          setExpanded((previous) => {
            const next = new Set(previous);
            if (open) next.add(file.path);
            else next.delete(file.path);
            return next;
          })
        }
      >
        <div
          className="tree-item"
          aria-current={file.path === path ? 'page' : undefined}
          style={{ '--depth': depth } as React.CSSProperties}
        >
          <Collapsible.Trigger asChild>
            <button
              className="tree-disclose"
              aria-label={`${expanded.has(file.path) ? t('collapse') : t('expand')} ${file.name}`}
              disabled={!children.get(file.path)?.length}
            >
              <ChevronRight />
            </button>
          </Collapsible.Trigger>
          <button className="tree-name" onClick={() => navigate(file.path)}>
            <FileIcon file={file} />
            <span>{file.name}</span>
          </button>
        </div>
        <Collapsible.Content className="tree-children radix-tree">
          {branch(file.path, depth + 1)}
        </Collapsible.Content>
      </Collapsible.Root>
    ));
  }
  return (
    <>
      <div className="sidebar-heading">
        <span>{t('directories')}</span>
        <Button
          id="collapse-tree"
          aria-label={t('collapseAll')}
          onClick={() => setExpanded(new Set())}
        >
          <ChevronRight />
        </Button>
      </div>
      <nav id="tree" aria-label={t('directories')}>
        <div
          className="tree-item"
          aria-current={path === '' ? 'page' : undefined}
        >
          <button className="tree-name root-tree" onClick={() => navigate('')}>
            <FolderOpen />
            <span>{t('allFiles')}</span>
          </button>
        </div>
        {branch('', 0)}
      </nav>
    </>
  );
}
