import type { AnchorHTMLAttributes } from 'react';
import { resourceUrl } from '../lib/catalog.ts';

export function SiteLink({
  path,
  navigate,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> & {
  path: string;
  navigate: (path: string) => void;
}) {
  return (
    <a
      {...props}
      href={resourceUrl(path)}
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
        navigate(path);
      }}
    />
  );
}
