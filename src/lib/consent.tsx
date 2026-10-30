import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { policyVersion } from './legal.ts';

const storageKey = 'moecdn.consent';
const ConsentContext = createContext<{
  accepted: boolean;
  accept: () => void;
} | null>(null);

function readAcceptance() {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(storageKey) || 'null',
    );
    return (
      typeof saved === 'object' &&
      saved !== null &&
      'version' in saved &&
      saved.version === policyVersion &&
      'acceptedAt' in saved &&
      typeof saved.acceptedAt === 'string' &&
      Number.isFinite(Date.parse(saved.acceptedAt))
    );
  } catch {
    return false;
  }
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [accepted, setAccepted] = useState(readAcceptance);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null)
        setAccepted(readAcceptance());
    };
    addEventListener('storage', sync);
    return () => removeEventListener('storage', sync);
  }, []);
  function accept() {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          version: policyVersion,
          acceptedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // 禁用存储时，确认仍在当前页面会话内生效。
    }
    setAccepted(true);
  }
  return (
    <ConsentContext.Provider value={{ accepted, accept }}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const consent = useContext(ConsentContext);
  if (!consent) throw new Error('ConsentProvider is required');
  return consent;
}
