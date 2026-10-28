import { highlightLines, highlightRanges } from './highlight.ts';

self.onmessage = (
  event: MessageEvent<{ text: string; language: string; ranges?: boolean }>,
) => {
  try {
    self.postMessage(
      event.data.ranges
        ? { ranges: highlightRanges(event.data.text, event.data.language) }
        : { lines: highlightLines(event.data.text, event.data.language) },
    );
  } catch {
    self.postMessage({ error: true });
  }
};
