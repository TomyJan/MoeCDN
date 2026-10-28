import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Compartment,
  EditorState,
  StateEffect,
  StateField,
} from '@codemirror/state';
import {
  Decoration,
  EditorView,
  keymap,
  lineNumbers as gutter,
  type DecorationSet,
} from '@codemirror/view';
import type { HighlightRange } from '../lib/highlight.ts';

const setTokens = StateEffect.define<HighlightRange[]>();
const tokens = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(value, transaction) {
    for (const effect of transaction.effects)
      if (effect.is(setTokens))
        return Decoration.set(
          effect.value.map((range) =>
            Decoration.mark({ class: range.classes }).range(
              range.from,
              range.to,
            ),
          ),
          true,
        );
    return value.map(transaction.changes);
  },
  provide: (field) => EditorView.decorations.from(field),
});

export default function VirtualCodePreview({
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
  const host = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<EditorView | null>(null);
  const numbers = useRef(new Compartment());
  const wrapping = useRef(new Compartment());
  const [busy, setBusy] = useState(false);
  useLayoutEffect(() => {
    if (!host.current) return;
    const starts = [0];
    for (const match of text.matchAll(/\r\n?|\n/g))
      starts.push(match.index + match[0].length);
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: text,
        extensions: [
          EditorState.readOnly.of(true),
          tokens,
          numbers.current.of([]),
          wrapping.current.of([]),
          EditorView.contentAttributes.of({
            'aria-label': label,
            'aria-readonly': 'true',
          }),
          keymap.of([
            {
              key: 'Mod-a',
              run: (current) => {
                current.dispatch({
                  selection: { anchor: 0, head: current.state.doc.length },
                });
                return true;
              },
            },
            ...(['Mod-Home', 'Mod-End'] as const).map((key) => ({
              key,
              run: (current: EditorView) => {
                const position =
                  key === 'Mod-Home' ? 0 : current.state.doc.length;
                current.dispatch({
                  selection: { anchor: position },
                  scrollIntoView: true,
                });
                return true;
              },
            })),
          ]),
          EditorView.domEventHandlers({
            copy: (event, current) => {
              const selection = current.state.selection.main;
              if (selection.empty || !event.clipboardData) return false;
              const rawOffset = (position: number) => {
                const line = current.state.doc.lineAt(position);
                return starts[line.number - 1] + position - line.from;
              };
              event.clipboardData.setData(
                'text/plain',
                text.slice(rawOffset(selection.from), rawOffset(selection.to)),
              );
              event.preventDefault();
              return true;
            },
          }),
          EditorView.theme({
            '&': { height: '100%', font: 'inherit' },
            '&.cm-focused': { outline: 'none' },
            '.cm-scroller': {
              overflow: 'auto',
              font: 'inherit',
              lineHeight: '1.8',
            },
            '.cm-content': { padding: '24px 0', caretColor: 'transparent' },
            '.cm-line': { padding: '0 24px' },
            '.cm-gutters': {
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--muted)',
            },
            '.cm-gutterElement': { minWidth: '40px', padding: '0 8px' },
            '.cm-cursor': { display: 'none' },
          }),
        ],
      }),
    });
    setView(editor);
    return () => {
      editor.destroy();
    };
  }, [text, label]);
  useEffect(() => {
    view?.dispatch({
      effects: [
        numbers.current.reconfigure(lineNumbers ? gutter() : []),
        wrapping.current.reconfigure(wrap ? EditorView.lineWrapping : []),
      ],
    });
  }, [view, lineNumbers, wrap]);
  useEffect(() => {
    if (!view) return;
    view.dispatch({ effects: setTokens.of([]) });
    if (!highlight || !language) {
      setBusy(false);
      return;
    }
    let active = true;
    let worker: Worker | undefined;
    setBusy(true);
    const failed = () => {
      if (active) {
        setBusy(false);
        onHighlightError();
      }
      worker?.terminate();
    };
    const timeout = setTimeout(failed, 10_000);
    try {
      worker = new Worker(
        new URL('../lib/highlight.worker.ts', import.meta.url),
        { type: 'module' },
      );
      worker.onmessage = (
        event: MessageEvent<{ ranges?: HighlightRange[] }>,
      ) => {
        clearTimeout(timeout);
        if (active && event.data.ranges) {
          view.dispatch({ effects: setTokens.of(event.data.ranges) });
          setBusy(false);
          worker?.terminate();
        } else failed();
      };
      worker.onerror = (event) => {
        event.preventDefault();
        failed();
      };
      worker.onmessageerror = failed;
      worker.postMessage({
        text: view.state.doc.toString(),
        language,
        ranges: true,
      });
    } catch {
      failed();
    }
    return () => {
      active = false;
      clearTimeout(timeout);
      worker?.terminate();
    };
  }, [view, language, highlight, onHighlightError]);
  return (
    <div
      ref={host}
      className="code-preview virtual-code-preview"
      data-wrap={wrap}
      aria-busy={busy}
    />
  );
}
