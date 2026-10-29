import { useEffect, useRef } from 'react';

export function DocumentPreview({
  html,
  title,
}: {
  html: string;
  title: string;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const element = frame.current!;
    let currentDocument: Document | null = null;
    let unbind = () => {};
    const bind = () => {
      const document = element.contentDocument;
      if (document === currentDocument) return;
      unbind();
      unbind = () => {};
      currentDocument = document;
      if (!document) return;
      const followFragment: EventListener = (click) => {
        const event = click as MouseEvent;
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        // 原始 HTML 可用表单命名遮蔽 DOM 成员；调用父页面的原生方法。
        let link: Element | null;
        try {
          link = Element.prototype.closest.call(event.target, 'a[href]');
        } catch {
          return;
        }
        const href = link
          ? Element.prototype.getAttribute.call(link, 'href')?.trim()
          : null;
        if (!href) return;
        const fragment = href.startsWith('#')
          ? href.slice(1)
          : href.startsWith('about:srcdoc#')
            ? href.slice('about:srcdoc#'.length)
            : null;
        if (fragment === null) return;
        event.preventDefault();
        let id = fragment;
        try {
          id = decodeURIComponent(fragment);
        } catch {
          /* 不完整转义按原值查找。 */
        }
        let target: Element | null | undefined = id
          ? Document.prototype.getElementById.call(document, id) ||
            [...Document.prototype.getElementsByName.call(document, id)].find(
              (node) => node.tagName === 'A',
            )
          : null;
        const top = !target && (!id || id.toLowerCase() === 'top');
        if (top)
          target = Document.prototype.querySelector.call(document, 'body');
        if (target) {
          const prototype =
            target.namespaceURI === 'http://www.w3.org/2000/svg'
              ? SVGElement.prototype
              : HTMLElement.prototype;
          try {
            prototype.focus.call(target, { preventScroll: true });
            if (
              !Element.prototype.matches.call(target, ':focus') &&
              !Element.prototype.hasAttribute.call(target, 'tabindex')
            ) {
              Element.prototype.setAttribute.call(target, 'tabindex', '-1');
              prototype.focus.call(target, { preventScroll: true });
            }
          } catch {
            /* 非 HTML/SVG 目标仍可滚动。 */
          }
          if (top) window.scrollTo.call(element.contentWindow, 0, 0);
          else Element.prototype.scrollIntoView.call(target);
        }
      };
      EventTarget.prototype.addEventListener.call(
        document,
        'click',
        followFragment,
      );
      unbind = () =>
        EventTarget.prototype.removeEventListener.call(
          document,
          'click',
          followFragment,
        );
    };
    // load 可能被慢图片拖延；每帧只比较 Document 身份，换文档时提前绑定。
    let animation = 0;
    const watch = () => {
      bind();
      animation = requestAnimationFrame(watch);
    };
    element.addEventListener('load', bind);
    watch();
    return () => {
      cancelAnimationFrame(animation);
      element.removeEventListener('load', bind);
      unbind();
    };
  }, [html]);
  // 同源权限供父页面接管文内滚动；不授予脚本、弹窗或顶层导航权限。
  return (
    <iframe
      ref={frame}
      className="render-pane"
      sandbox="allow-same-origin"
      title={title}
      srcDoc={html}
    />
  );
}
