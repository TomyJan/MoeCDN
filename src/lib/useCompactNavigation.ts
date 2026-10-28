import { useLayoutEffect, useState, type RefObject } from 'react';

/** Compare available space with the links' full text widths in either layout. */
export function useCompactNavigation(header: RefObject<HTMLElement | null>) {
  const [compact, setCompact] = useState(false);
  useLayoutEffect(() => {
    const element = header.current;
    if (!element) return;
    const leading = element.querySelector<HTMLElement>('.top-leading')!;
    const actions = element.querySelector<HTMLElement>('.top-actions')!;
    const links = [...element.querySelectorAll<HTMLElement>('.nav-link')];
    function measure() {
      const style = getComputedStyle(element!);
      const padding =
        parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const textPadding = parseFloat(
        style.getPropertyValue('--nav-text-padding'),
      );
      const fullActionsWidth =
        actions.getBoundingClientRect().width +
        links.reduce((delta, link) => {
          const labelWidth = link
            .querySelector('span')!
            .getBoundingClientRect().width;
          return (
            delta +
            labelWidth +
            textPadding * 2 -
            link.getBoundingClientRect().width
          );
        }, 0);
      setCompact(
        leading.getBoundingClientRect().width +
          fullActionsWidth +
          padding +
          parseFloat(style.columnGap) >
          element!.clientWidth,
      );
    }
    const observer = new ResizeObserver(measure);
    [
      element,
      leading,
      actions,
      ...links.map((link) => link.querySelector('span')!),
    ].forEach((node) => observer.observe(node));
    measure();
    return () => observer.disconnect();
  }, [header]);
  return compact;
}
