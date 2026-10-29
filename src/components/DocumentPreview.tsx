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
    const bindings = new Map<Document, () => void>();
    const bind = (document: Document, context: Window) => {
      const followLink: EventListener = (click) => {
        const event = click as MouseEvent;
        if (
          event.defaultPrevented ||
          event.button !== (event.type === 'auxclick' ? 1 : 0)
        )
          return;
        // 原始 HTML 可用表单命名遮蔽 DOM 成员；调用父页面的原生方法。
        let link: Element | null;
        try {
          link = Element.prototype.closest.call(
            event.target,
            'a[*|href], area[href]',
          );
        } catch {
          return;
        }
        const href = link
          ? (
              Element.prototype.getAttribute.call(link, 'href') ??
              Element.prototype.getAttributeNS.call(
                link,
                'http://www.w3.org/1999/xlink',
                'href',
              )
            )?.trim()
          : null;
        if (href == null) return;
        const fragment = href.startsWith('#')
          ? href.slice(1)
          : href.startsWith('about:srcdoc#')
            ? href.slice('about:srcdoc#'.length)
            : null;
        event.preventDefault();
        if (fragment === null) {
          // 从父页面打开普通链接，避免 iframe 导航写入目录的联合历史。
          try {
            const base = Object.getOwnPropertyDescriptor(
              Node.prototype,
              'baseURI',
            )!.get!.call(link);
            const url = new URL(href, base);
            if (['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol))
              window.open(url.href, '_blank', 'noopener');
          } catch {
            /* 无效地址保持当前预览。 */
          }
          return;
        }
        if (
          event.button !== 0 ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
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
          if (top) window.scrollTo.call(context, 0, 0);
          else Element.prototype.scrollIntoView.call(target);
        }
      };
      const forwardEscape: EventListener = (keydown) => {
        const event = keydown as KeyboardEvent;
        if (
          event.key !== 'Escape' ||
          event.defaultPrevented ||
          event.isComposing
        )
          return;
        // iframe 键盘事件不会冒泡到外层，让弹窗处理关闭及焦点恢复。
        if (
          !element.dispatchEvent(
            new KeyboardEvent('keydown', {
              key: 'Escape',
              code: 'Escape',
              bubbles: true,
              cancelable: true,
            }),
          )
        )
          event.preventDefault();
      };
      const listeners: [string, EventListener][] = [
        ['click', followLink],
        ['auxclick', followLink],
        ['keydown', forwardEscape],
      ];
      for (const [type, listener] of listeners)
        EventTarget.prototype.addEventListener.call(document, type, listener);
      return () => {
        for (const [type, listener] of listeners)
          EventTarget.prototype.removeEventListener.call(
            document,
            type,
            listener,
          );
      };
    };
    const refresh = () => {
      const active = new Set<Document>();
      const visit = (context: Window | null) => {
        if (!context) return;
        try {
          const document = context.document;
          active.add(document);
          if (!bindings.has(document))
            bindings.set(document, bind(document, context));
        } catch {
          /* 跨域或不允许同源访问的沙箱文档不可接管。 */
        }
        try {
          // Window 子上下文包含 iframe、object 和 embed，也覆盖多层嵌套。
          for (let index = 0; index < context.length; index++)
            visit(context[index]);
        } catch {
          /* 子上下文可能在遍历中被移除。 */
        }
      };
      visit(element.contentWindow);
      for (const [document, unbind] of bindings)
        if (!active.has(document)) {
          unbind();
          bindings.delete(document);
        }
    };
    // load 可能被慢图片拖延；每帧比较文档身份，及时绑定并清理已替换的文档。
    let animation = 0;
    const watch = () => {
      refresh();
      animation = requestAnimationFrame(watch);
    };
    element.addEventListener('load', refresh);
    watch();
    return () => {
      cancelAnimationFrame(animation);
      element.removeEventListener('load', refresh);
      for (const unbind of bindings.values()) unbind();
      bindings.clear();
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
