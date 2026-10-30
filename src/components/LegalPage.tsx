import { BookOpen, ExternalLink, ShieldCheck } from 'lucide-react';
import {
  legalDocument,
  policyVersion,
  type LegalPageKind,
} from '../lib/legal.ts';
import type { Language } from '../lib/types.ts';
import type { Translate } from '../lib/i18n.ts';
import { SiteLink } from './SiteLink.tsx';

export function LegalPage({
  kind,
  lang,
  navigate,
  t,
}: {
  kind: LegalPageKind;
  lang: Language;
  navigate: (path: string) => void;
  t: Translate;
}) {
  const document = legalDocument(kind, lang);
  return (
    <section className="legal-page">
      <div className="heading">
        <div className="heading-main">
          {kind === 'terms' ? (
            <BookOpen aria-hidden="true" />
          ) : (
            <ShieldCheck aria-hidden="true" />
          )}
          <h1 id="title">{t(kind)}</h1>
        </div>
      </div>
      <nav className="legal-tabs" aria-label={t('legalDocuments')}>
        {(['terms', 'privacy'] as const).map((page) => (
          <SiteLink
            key={page}
            path={page + '/'}
            navigate={navigate}
            aria-current={kind === page ? 'page' : undefined}
          >
            {t(page)}
          </SiteLink>
        ))}
      </nav>
      <article className="legal-document">
        <p className="legal-updated">
          {t('lastUpdated')}{' '}
          <time dateTime={policyVersion}>{policyVersion}</time>
        </p>
        <p className="legal-introduction">{document.introduction}</p>
        {document.sections.map((section) => (
          <section
            className="legal-section"
            data-important={section.important || undefined}
            key={section.title}
          >
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
        <section className="legal-contact">
          <h2>{t('contactUs')}</h2>
          <p>{document.contact}</p>
          <a
            href="https://github.com/TomyJan/MoeCDN/issues"
            target="_blank"
            rel="noopener"
          >
            {t('contactIssues')} <ExternalLink aria-hidden="true" />
          </a>
          <p className="legal-contact-note">{document.contactNote}</p>
        </section>
      </article>
    </section>
  );
}
