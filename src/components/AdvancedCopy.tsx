import { useState } from 'react';
import { Popover } from 'radix-ui';
import { CodeXml, Fingerprint, Link, Text } from 'lucide-react';
import type { Entry, HashAlgorithm } from '../lib/types.ts';
import type { Translate } from '../lib/i18n.ts';
import { buildCopy, copyCapabilities, type CopyFormat } from '../lib/copy.ts';
import { AnimatedRegion, CopyButton } from './ui.tsx';
export type CopyTarget = {
  file: Entry;
  anchor: HTMLElement;
  serial: number;
  closing?: boolean;
};
export function AdvancedCopy({
  target,
  close,
  t,
}: {
  target: CopyTarget;
  close: () => void;
  t: Translate;
}) {
  const capabilities = copyCapabilities(target.file);
  const [format, setFormat] = useState<CopyFormat>(
    capabilities.html ? 'html' : 'url',
  );
  const [hash, setHash] = useState<HashAlgorithm>('sha384');
  const [sri, setSri] = useState(false),
    [cors, setCors] = useState(false);
  const script = /\.(m?js|cjs|css)$/i.test(target.file.name);
  const optionsVisible = format === 'html' && script;
  const hashVisible =
    capabilities.hash && (format === 'hash' || (optionsVisible && sri));
  const output = buildCopy(
    target.file,
    { format, hash, sri, cors },
    location.origin,
  );
  const formats = [
    { value: 'url' as const, label: t('url'), icon: <Link /> },
    ...(capabilities.html
      ? [{ value: 'html' as const, label: t('html'), icon: <CodeXml /> }]
      : []),
    { value: 'markdown' as const, label: t('markdown'), icon: <Text /> },
    ...(capabilities.hash
      ? [{ value: 'hash' as const, label: t('digest'), icon: <Fingerprint /> }]
      : []),
  ];
  const container =
    target.anchor.closest<HTMLElement>('#preview-dialog, #search-dialog') ||
    document.body;
  return (
    <Popover.Root
      open={!target.closing}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <Popover.Anchor virtualRef={{ current: target.anchor }} />
      <Popover.Portal container={container}>
        <Popover.Content
          id="copy-dialog"
          className="copy-popup radix-copy"
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={10}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            target.anchor.focus();
          }}
          onInteractOutside={(event) => {
            if ((event.target as HTMLElement).closest('[data-advanced]'))
              event.preventDefault();
          }}
          aria-label={t('advanced')}
        >
          <div className="copy-content">
            <fieldset>
              <legend>{t('format')}</legend>
              <div
                className="choice-grid format-grid"
                style={{
                  gridTemplateColumns: `repeat(${formats.length},minmax(0,1fr))`,
                }}
              >
                {formats.map((option) => (
                  <button
                    key={option.value}
                    className="choice"
                    aria-pressed={format === option.value}
                    onClick={() => setFormat(option.value)}
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <AnimatedRegion id="options-region" open={optionsVisible}>
              <div className="advanced-options">
                {capabilities.sri && (
                  <label className="check-option">
                    <input
                      id="include-sri"
                      type="checkbox"
                      checked={sri}
                      onChange={(e) => setSri(e.target.checked)}
                    />
                    <span>{t('sri')}</span>
                  </label>
                )}
                <label className="check-option">
                  <input
                    id="include-cors"
                    type="checkbox"
                    checked={cors}
                    onChange={(e) => setCors(e.target.checked)}
                  />
                  <span>crossorigin="anonymous"</span>
                </label>
              </div>
            </AnimatedRegion>
            <AnimatedRegion id="hash-region" open={hashVisible}>
              <fieldset>
                <legend>{t('hash')}</legend>
                <div className="choice-grid hash-grid">
                  {(['sha256', 'sha384', 'sha512'] as const)
                    .filter((algorithm) => target.file.hashes?.[algorithm])
                    .map((algorithm) => (
                      <button
                        key={algorithm}
                        className="choice"
                        aria-pressed={hash === algorithm}
                        onClick={() => setHash(algorithm)}
                      >
                        {algorithm.replace('sha', 'SHA-')}
                      </button>
                    ))}
                </div>
              </fieldset>
            </AnimatedRegion>
            <div className="copy-output-wrap">
              <textarea
                id="copy-output"
                aria-label={t('copy')}
                value={output}
                readOnly
                spellCheck={false}
              />
              <CopyButton
                id="copy-confirm"
                value={output}
                t={t}
                label={t('copy')}
              />
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
