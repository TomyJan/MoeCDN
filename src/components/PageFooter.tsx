import type { Translate } from '../lib/i18n.ts';
import { SiteLink } from './SiteLink.tsx';

export function PageFooter({
  revision,
  path,
  navigate,
  t,
}: {
  revision?: string;
  path: string | null;
  navigate: (path: string) => void;
  t: Translate;
}) {
  return (
    <footer className="page-footer">
      <a
        href="https://github.com/TomyJan/MoeCDN"
        target="_blank"
        rel="noopener"
      >
        MoeCDN
      </a>
      {revision && (
        <>
          {' '}
          <a
            className="commit-link"
            href={'https://github.com/TomyJan/MoeCDN/commit/' + revision}
            target="_blank"
            rel="noopener"
          >
            {revision.slice(0, 8)}
          </a>
        </>
      )}
      {(['history', 'terms', 'privacy'] as const).map((page) => (
        <span className="footer-link" key={page}>
          {' | '}
          <SiteLink
            path={page + '/'}
            navigate={navigate}
            aria-current={path === page + '/' ? 'page' : undefined}
          >
            {t(page)}
          </SiteLink>
        </span>
      ))}
      {' | '}
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">
        鲁ICP备2021003464号-1
      </a>
    </footer>
  );
}
