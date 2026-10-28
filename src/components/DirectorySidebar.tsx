import { useEffect, useState, type ReactNode } from 'react';
import { Dialog } from 'radix-ui';
import type { Translate } from '../lib/i18n.ts';

const mobileQuery = '(max-width: 600px)';

export function DirectorySidebar({
  open,
  onOpenChange,
  restoreFocus,
  t,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restoreFocus: () => void;
  t: Translate;
  children: ReactNode;
}) {
  const [mobile, setMobile] = useState(() => matchMedia(mobileQuery).matches);
  useEffect(() => {
    const media = matchMedia(mobileQuery);
    const change = () => {
      setMobile(media.matches);
      if (!media.matches) onOpenChange(false);
    };
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, [onOpenChange]);

  if (!mobile)
    return (
      <aside id="sidebar" className="sidebar">
        {children}
      </aside>
    );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="sidebar-backdrop" />
        <Dialog.Content
          asChild
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreFocus();
          }}
        >
          <aside id="sidebar" className="sidebar mobile-open">
            <Dialog.Title className="sr-only">{t('directoryNav')}</Dialog.Title>
            {children}
          </aside>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
