import { useEffect, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { History } from 'lucide-react';
import { Button } from './ui.tsx';
import type { Translate } from '../lib/i18n.ts';

interface HistoryEntry {
  date: string;
  note?: string;
  changes: string[];
}

function inline(text: string) {
  return {
    __html: DOMPurify.sanitize(marked.parseInline(text, { async: false })),
  };
}

export function HistoryPage({ t }: { t: Translate }) {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/_moecdn/history.json', {
      signal: controller.signal,
      cache: 'no-cache',
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = (await response.json()) as HistoryEntry[];
        if (!Array.isArray(data)) throw new Error('Invalid history');
        if (!controller.signal.aborted) setEntries(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [attempt]);
  return (
    <section className="history-page" data-scroll-pending={!entries && !error}>
      <div className="heading">
        <div className="heading-main">
          <History aria-hidden="true" />
          <h1 id="title">{t('history')}</h1>
        </div>
      </div>
      {!entries ? (
        <div className="history-status" role="status">
          <p>{error ? t('loadFailed') : t('loading')}</p>
          {error && (
            <Button
              variant="secondary"
              onClick={() => {
                setError(false);
                setAttempt((value) => value + 1);
              }}
            >
              {t('retry')}
            </Button>
          )}
        </div>
      ) : (
        <div id="history" className="history-timeline">
          {entries.map((entry) => (
            <article className="history-entry" key={entry.date}>
              <h2>
                <time dateTime={entry.date}>{entry.date}</time>
              </h2>
              <div className="history-changes">
                {entry.note && <p className="history-note">{entry.note}</p>}
                <ul role="list">
                  {entry.changes.map((change, index) => (
                    <li key={index} dangerouslySetInnerHTML={inline(change)} />
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
