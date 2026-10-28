import { lazy, Suspense, useEffect, useMemo, useState } from 'react';

const VirtualCodePreview = lazy(() => import('./VirtualCodePreview.tsx'));

export default function CodePreview({
  text,
  language,
  highlight,
  lineNumbers,
  wrap,
  onHighlightError,
  label,
}: {
  text: string;
  language?: string;
  highlight: boolean;
  lineNumbers: boolean;
  wrap: boolean;
  onHighlightError: () => void;
  label: string;
}) {
  const large = useMemo(() => {
    if (text.length > 200_000) return true;
    let lines = 1;
    for (
      let index = text.indexOf('\n');
      index !== -1;
      index = text.indexOf('\n', index + 1)
    )
      if (++lines > 5000) return true;
    return false;
  }, [text]);
  const plain = useMemo(() => (large ? [] : text.split('\n')), [text, large]);
  const [highlighted, setHighlighted] = useState<{
    text: string;
    language: string;
    lines: string[];
  } | null>(null);
  useEffect(() => {
    if (
      !highlight ||
      large ||
      !language ||
      (highlighted?.text === text && highlighted.language === language)
    )
      return;
    let worker: Worker | undefined;
    let active = true;
    const failed = () => {
      if (active) onHighlightError();
      worker?.terminate();
    };
    const timeout = setTimeout(failed, 10_000);
    try {
      worker = new Worker(
        new URL('../lib/highlight.worker.ts', import.meta.url),
        { type: 'module' },
      );
      worker.onmessage = (event: MessageEvent<{ lines?: string[] }>) => {
        clearTimeout(timeout);
        if (active && event.data.lines) {
          setHighlighted({ text, language, lines: event.data.lines });
          worker?.terminate();
        } else failed();
      };
      worker.onerror = (event) => {
        event.preventDefault();
        failed();
      };
      worker.onmessageerror = failed;
      worker.postMessage({ text, language });
    } catch {
      failed();
    }
    return () => {
      active = false;
      clearTimeout(timeout);
      worker?.terminate();
    };
  }, [text, language, highlight, highlighted, onHighlightError, large]);
  if (large)
    return (
      <Suspense fallback={<pre className="code-preview">{text}</pre>}>
        <VirtualCodePreview
          text={text}
          language={language}
          highlight={highlight}
          lineNumbers={lineNumbers}
          wrap={wrap}
          onHighlightError={onHighlightError}
          label={label}
        />
      </Suspense>
    );
  const colored =
    highlight && highlighted?.text === text && highlighted.language === language
      ? highlighted.lines
      : null;
  return (
    <pre
      className="code-preview"
      data-wrap={wrap}
      aria-busy={highlight && Boolean(language) && !colored}
    >
      <code>
        {plain.map((line, index) => (
          <span className="code-line" key={index}>
            {lineNumbers && (
              <span className="line-number" aria-hidden="true">
                {index + 1}
              </span>
            )}
            {colored ? (
              <span
                className="line-content"
                dangerouslySetInnerHTML={{
                  __html:
                    colored[index] + (index < plain.length - 1 ? '\n' : ''),
                }}
              />
            ) : (
              <span className="line-content">
                {line}
                {index < plain.length - 1 ? '\n' : null}
              </span>
            )}
          </span>
        ))}
      </code>
    </pre>
  );
}
