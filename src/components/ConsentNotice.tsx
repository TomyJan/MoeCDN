import { useEffect, useRef, useState } from 'react';
import { Cookie } from 'lucide-react';
import { useConsent } from '../lib/consent.tsx';
import type { Translate } from '../lib/i18n.ts';
import { Button } from './ui.tsx';
import { SiteLink } from './SiteLink.tsx';

export function ConsentNotice({
  navigate,
  t,
}: {
  navigate: (path: string) => void;
  t: Translate;
}) {
  const { accepted, accept } = useConsent();
  const [mounted, setMounted] = useState(!accepted);
  const notice = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!accepted) {
      setMounted(true);
      return;
    }
    const timeout = setTimeout(() => setMounted(false), 220);
    return () => clearTimeout(timeout);
  }, [accepted]);
  useEffect(() => {
    const element = notice.current;
    if (!element) return;
    const update = () =>
      document.documentElement.style.setProperty(
        '--notice-space',
        element.offsetHeight +
          parseFloat(getComputedStyle(element).bottom) +
          16 +
          'px',
      );
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--notice-space');
    };
  }, [mounted]);
  if (!mounted) return null;
  return (
    <section
      ref={notice}
      id="cookie-notice"
      className="consent-notice"
      data-state={accepted ? 'closed' : 'open'}
      aria-labelledby="cookie-notice-title"
      inert={accepted}
    >
      <Cookie className="consent-icon" aria-hidden="true" />
      <div className="consent-body">
        <h2 id="cookie-notice-title">{t('cookieTitle')}</h2>
        <p>{t('cookieDescription')}</p>
        <p className="consent-agreement">
          {t('consentPrefix')}{' '}
          <SiteLink path="terms/" navigate={navigate}>
            {t('terms')}
          </SiteLink>
          {t('and')}
          <SiteLink path="privacy/" navigate={navigate}>
            {t('privacy')}
          </SiteLink>
          {t('consentSuffix')}
        </p>
      </div>
      <Button variant="secondary" className="consent-accept" onClick={accept}>
        {t('acceptAndContinue')}
      </Button>
    </section>
  );
}
