import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DropdownMenu, Tooltip } from 'radix-ui';
import { Check, Copy } from 'lucide-react';
import type { Translate } from '../lib/i18n.ts';
import type { Entry } from '../lib/types.ts';
import { iconName } from '../lib/catalog.ts';
import { useConsent } from '../lib/consent.tsx';
export const IconThemeContext = createContext<'light' | 'dark'>('light');
const buttonVariants = cva(
  'transition-colors focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        icon: 'icon-button',
        text: 'text-button',
        secondary: 'button secondary',
      },
    },
    defaultVariants: { variant: 'icon' },
  },
);
export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'icon' | 'text' | 'secondary';
  }
>(function Button({ className, variant, type = 'button', ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={twMerge(clsx(buttonVariants({ variant }), className))}
      {...props}
    />
  );
});
export function FileIcon({
  file,
  className,
}: {
  file: Entry;
  className?: string;
}) {
  const theme = useContext(IconThemeContext);
  return (
    <img
      className={className}
      src={`/_moecdn/icons/${theme === 'light' && file.iconLight ? file.iconLight : iconName(file)}.svg`}
      alt=""
      loading="lazy"
    />
  );
}
export function CopyButton({
  value,
  t,
  label,
  id,
  className,
}: {
  value: string;
  t: Translate;
  label?: string;
  id?: string;
  className?: string;
}) {
  const { accepted } = useConsent();
  const [copied, setCopied] = useState(false),
    [failed, setFailed] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    [],
  );
  return (
    <Tooltip.Root
      open={failed}
      onOpenChange={(open) => {
        if (!open) setFailed(false);
      }}
    >
      <Tooltip.Trigger asChild>
        <Button
          ref={trigger}
          id={id}
          disabled={!accepted}
          className={clsx(className, copied && 'copy-success')}
          aria-label={copied ? t('copied') : label || t('copyLink')}
          title={
            !accepted
              ? t('acceptRequired')
              : failed
                ? t('copyFailed')
                : label || t('copyLink')
          }
          data-copied={copied}
          onClick={async () => {
            if (!accepted) return;
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setFailed(false);
              if (timeout.current) clearTimeout(timeout.current);
              timeout.current = setTimeout(() => setCopied(false), 1000);
            } catch {
              setFailed(true);
              const area =
                document.querySelector<HTMLTextAreaElement>('#copy-output');
              area?.focus();
              area?.select();
            }
          }}
        >
          {copied ? <Check key="success" /> : <Copy key="copy" />}
        </Button>
      </Tooltip.Trigger>
      {failed && (
        <Tooltip.Portal
          container={
            trigger.current?.closest<HTMLElement>(
              '#preview-dialog, #search-dialog',
            ) || document.body
          }
        >
          <Tooltip.Content
            className="copy-error"
            role="status"
            side="top"
            align="end"
            sideOffset={8}
            collisionPadding={12}
            hideWhenDetached
            onEscapeKeyDown={() => setFailed(false)}
            onPointerDownOutside={() => setFailed(false)}
          >
            {t('copyFailed')}
          </Tooltip.Content>
        </Tooltip.Portal>
      )}
    </Tooltip.Root>
  );
}
export function Menu({
  label,
  value,
  options,
  onChange,
  children,
  className = 'icon-button',
  arrow = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; icon: ReactNode }[];
  onChange: (v: string) => void;
  children: ReactNode;
  className?: string;
  arrow?: boolean;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className={className} aria-label={label}>
          {children}
          {arrow && <span aria-hidden="true">⌄</span>}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="menu radix-menu"
          sideOffset={8}
          align="end"
          collisionPadding={10}
        >
          <DropdownMenu.RadioGroup value={value} onValueChange={onChange}>
            {options.map((option) => (
              <DropdownMenu.RadioItem
                className="menu-option"
                key={option.value}
                value={option.value}
              >
                <span className="menu-icon" aria-hidden="true">
                  {option.icon}
                </span>
                <span>{option.label}</span>
                <DropdownMenu.ItemIndicator className="menu-check">
                  <Check />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
export function AnimatedRegion({
  open,
  children,
  id,
}: {
  open: boolean;
  children: ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="animated-region" data-open={open} inert={!open}>
      <div className="animated-region-inner">{children}</div>
    </div>
  );
}
