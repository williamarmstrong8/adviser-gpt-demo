import { useState, useEffect, useMemo, useCallback } from 'react';

const SEARCH_HISTORY_KEY = 'vault-search-history';
const HISTORY_EVENT = 'ag:vault:history-updated';
const MAX_HISTORY_ITEMS = 5;

export type SearchFilters = {
  strategies: string[];
  types: string[];
  tags: string[];
  statuses: string[];
};

export interface SearchHistoryItem {
  id: string;
  query: string;
  filters: SearchFilters;
  sort: string;
  timestamp: number;
  displayName?: string;
}

/** Safely read from localStorage (SSR/first paint safe). */
const read = (): SearchHistoryItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as SearchHistoryItem[]) : [];
  } catch {
    return [];
  }
};

/** Safely write to localStorage and notify other hook instances in this tab. */
const write = (next: SearchHistoryItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // ignore quota or serialization errors
  }
  // notify other hook instances in the same tab
  try {
    window.dispatchEvent(new Event(HISTORY_EVENT));
  } catch {
    // older browsers may not support Event constructor; fall back if needed
    const ev = document.createEvent?.('Event');
    if (ev) {
      ev.initEvent(HISTORY_EVENT, false, false);
      window.dispatchEvent(ev);
    }
  }
};

/** Generate a compact, human-friendly label for sidebar/history lists. */
const makeDisplayName = (
  query: string,
  filters: Partial<SearchFilters> | undefined,
  sort?: string
) => {
  const parts: string[] = [];
  const q = query?.trim();
  if (q) parts.push(`“${q}”`);
  if (filters?.strategies?.length) parts.push(`Strategies: ${filters.strategies.join(', ')}`);
  if (filters?.types?.length) parts.push(`Types: ${filters.types.join(', ')}`);
  if (filters?.tags?.length) parts.push(`Tags: ${filters.tags.slice(0, 3).join(', ')}`);
  if (filters?.statuses?.length) parts.push(`Status: ${filters.statuses.join(', ')}`);
  if (sort && sort !== 'relevance') parts.push(`Sort: ${sort}`);
  return parts.length ? parts.join(' · ') : 'All items';
};

/** Create a stable ID (works without crypto.randomUUID in older envs). */
const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function useSearchHistory() {
  // Local state mirrors localStorage and stays live via events
  const [history, setHistory] = useState<SearchHistoryItem[]>(() => read());

  // Keep all hook instances in sync:
  // 1) cross-tab via native 'storage' event
  // 2) same-tab via our custom HISTORY_EVENT
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onStorage = (e: StorageEvent) => {
      if (e.key === SEARCH_HISTORY_KEY) setHistory(read());
    };
    const onLocalEvent = () => setHistory(read());

    window.addEventListener('storage', onStorage);
    window.addEventListener(HISTORY_EVENT, onLocalEvent);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(HISTORY_EVENT, onLocalEvent);
    };
  }, []);

  /**
   * Add a new entry to history.
   * Signature matches existing usage: addToHistory(query, filters, sort)
   */
  const addToHistory = useCallback(
    (query: string, filters: Partial<SearchFilters> = {}, sort: string = 'relevance') => {
      setHistory(prev => {
        const nextItem: SearchHistoryItem = {
          id: makeId(),
          query: query ?? '',
          filters: {
            strategies: filters.strategies ?? [],
            types: filters.types ?? [],
            tags: filters.tags ?? [],
            statuses: filters.statuses ?? [],
          },
          sort: sort || 'relevance',
          timestamp: Date.now(),
          displayName: makeDisplayName(query, filters, sort),
        };

        // Optional small de-dupe: if the newest entry is identical, just bump its timestamp
        const [head, ...rest] = prev;
        if (
          head &&
          head.query === nextItem.query &&
          head.sort === nextItem.sort &&
          JSON.stringify(head.filters) === JSON.stringify(nextItem.filters)
        ) {
          const bumped = { ...head, timestamp: Date.now() };
          const next = [bumped, ...rest];
          write(next);
          return next;
        }

        const next = [nextItem, ...prev];
        write(next);
        return next;
      });
    },
    []
  );

  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => {
      const next = prev.filter(item => item.id !== id);
      write(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    write([]);
  }, []);

  const recentSearches = useMemo(() => history.slice(0, MAX_HISTORY_ITEMS), [history]);

  return {
    history,          // full list for HistoryPage
    recentSearches,   // top 5 for Sidebar
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
