import { useEffect, useState } from 'react';
import { apiFetch } from './api-client';

export type ConflictMatches = {
  cases: { id: string; reference: string; title: string; party: string }[];
  clients: { id: string; name: string }[];
};

const EMPTY: ConflictMatches = { cases: [], clients: [] };

/** Verifica (com debounce) se name/nif já surge como parte contrária ou cliente. Nunca bloqueia: falhas devolvem vazio. */
export function useConflictCheck(name: string, nif = ''): ConflictMatches {
  const [matches, setMatches] = useState(EMPTY);
  useEffect(() => {
    if (!name.trim() && !nif.trim()) { setMatches(EMPTY); return; }
    let active = true;
    const timer = setTimeout(() => {
      apiFetch<ConflictMatches>(`/conflicts/check?${new URLSearchParams({ name, nif })}`)
        .then((result) => { if (active) setMatches(result); })
        .catch(() => { if (active) setMatches(EMPTY); });
    }, 600);
    return () => { active = false; clearTimeout(timer); };
  }, [name, nif]);
  return matches;
}
