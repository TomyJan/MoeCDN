import { all, createLowlight } from 'lowlight';
import type { RootContent } from 'hast';

const lowlight = createLowlight(all);

export interface HighlightRange {
  from: number;
  to: number;
  classes: string;
}

export function highlightRanges(text: string, language: string) {
  const ranges: HighlightRange[] = [];
  let offset = 0;
  function visit(node: RootContent, classes: string[]) {
    if (node.type === 'element') {
      const next = [
        ...classes,
        ...((node.properties.className as string[]) || []),
      ].filter((name) => /^[a-zA-Z0-9_-]+$/.test(name));
      node.children.forEach((child) => visit(child, next));
    } else if (node.type === 'text') {
      if (classes.length && node.value.length)
        ranges.push({
          from: offset,
          to: offset + node.value.length,
          classes: classes.join(' '),
        });
      offset += node.value.length;
    }
  }
  lowlight
    .highlight(language, text)
    .children.forEach((node) => visit(node, []));
  return ranges;
}

function escape(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('\r', '&#13;');
}

// 仅生成转义后的文本和固定 span 标签，不接收源文件中的 HTML。
// 每行作为一个 HTML 片段交给浏览器，避免主线程构造数十万个 React token。
export function highlightLines(text: string, language: string) {
  const lines = [''];
  function visit(node: RootContent, classes: string[]) {
    if (node.type === 'element') {
      const next = [
        ...classes,
        ...((node.properties.className as string[]) || []),
      ].filter((name) => /^[a-zA-Z0-9_-]+$/.test(name));
      node.children.forEach((child) => visit(child, next));
    } else if (node.type === 'text') {
      node.value.split('\n').forEach((part, index) => {
        if (index) lines.push('');
        const escaped = escape(part);
        lines[lines.length - 1] +=
          classes.length && part
            ? `<span class="${classes.join(' ')}">${escaped}</span>`
            : escaped;
      });
    }
  }
  lowlight
    .highlight(language, text)
    .children.forEach((node) => visit(node, []));
  return lines;
}
