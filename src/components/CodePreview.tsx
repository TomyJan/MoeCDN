import { useMemo, type ReactNode } from 'react';
import { common, createLowlight } from 'lowlight';
import type { RootContent } from 'hast';
import { syntaxLanguage } from '../lib/syntax.ts';

const lowlight = createLowlight(common);

// Flatten token leaves rather than splitting HTML: multiline tokens keep their
// classes on each logical line, and resource text is always escaped by React.
function tokenLines(nodes: RootContent[]) {
  const lines: ReactNode[][] = [[]];
  function visit(node: RootContent, classes: string[]) {
    if (node.type === 'element') {
      const next = [
        ...classes,
        ...((node.properties.className as string[]) || []),
      ];
      node.children.forEach((child) => visit(child, next));
    } else if (node.type === 'text') {
      node.value.split('\n').forEach((part, index) => {
        if (index) lines.push([]);
        const line = lines.at(-1)!;
        line.push(
          classes.length ? (
            <span key={line.length} className={classes.join(' ')}>
              {part}
            </span>
          ) : (
            part
          ),
        );
      });
    }
  }
  nodes.forEach((node) => visit(node, []));
  return lines;
}

export default function CodePreview({
  text,
  extension,
  highlight,
  lineNumbers,
  wrap,
  simple,
}: {
  text: string;
  extension: string;
  highlight: boolean;
  lineNumbers: boolean;
  wrap: boolean;
  simple: boolean;
}) {
  const lines = useMemo(() => {
    if (simple) return [];
    const language = syntaxLanguage(extension);
    if (highlight && language && lowlight.registered(language)) {
      return tokenLines(lowlight.highlight(language, text).children);
    }
    return text.split('\n').map((line) => [line]);
  }, [text, extension, highlight, simple]);
  if (simple)
    return (
      <pre className="code-preview" data-wrap={wrap} data-simple="true">
        {text}
      </pre>
    );
  return (
    <pre className="code-preview" data-wrap={wrap}>
      <code>
        {lines.map((line, index) => (
          <span className="code-line" key={index}>
            {lineNumbers && (
              <span className="line-number" aria-hidden="true">
                {index + 1}
              </span>
            )}
            <span className="line-content">{line}</span>
          </span>
        ))}
      </code>
    </pre>
  );
}
