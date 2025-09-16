import { useState, useEffect } from 'react';

const SEARCH_HISTORY_KEY = 'vault-search-history';
const MAX_HISTORY_ITEMS = 5; // Show only 5 most recent items

export interface SearchHistoryItem {
  id: string;
  query: string;
  filters: {
    strategies: string[];
    types: string[];
    tags: string[];
    statuses: string[];
  };
  sort: string;
  timestamp: number;
  displayName: string; // Human-readable name for the search
}

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  const generateDisplayName = (query: string, filters: SearchHistoryItem['filters']): string => {
    const hasQuery = query.trim();
    const hasFilters = filters.strategies.length > 0 || filters.types.length > 0 || 
                      filters.tags.length > 0 || filters.statuses.length > 0;
    
    if (hasQuery && hasFilters) {
      return `"${query}" + filters`;
    } else if (hasQuery) {
      return `"${query}"`;
    } else if (hasFilters) {
      const filterParts = [];
      if (filters.strategies.length > 0) filterParts.push(`${filters.strategies.length} strategy`);
      if (filters.types.length > 0) filterParts.push(`${filters.types.length} type`);
      if (filters.tags.length > 0) filterParts.push(`${filters.tags.length} tag`);
      if (filters.statuses.length > 0) filterParts.push(`${filters.statuses.length} status`);
      return `Filtered: ${filterParts.join(', ')}`;
    } else {
      return 'All results';
    }
  };

  const addToHistory = (
    query: string,
    filters: SearchHistoryItem['filters'],
    sort: string = 'relevance'
  ) => {
    // Don't add empty searches
    const hasQuery = query.trim();
    const hasFilters = filters.strategies.length > 0 || filters.types.length > 0 || 
                      filters.tags.length > 0 || filters.statuses.length > 0;
    
    if (!hasQuery && !hasFilters) return;

    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query: query.trim(),
      filters,
      sort,
      timestamp: Date.now(),
      displayName: generateDisplayName(query, filters)
    };

    // Remove any existing identical searches and add new one at the beginning
    const filteredHistory = history.filter(item => 
      !(item.query === newItem.query && 
        JSON.stringify(item.filters) === JSON.stringify(newItem.filters) &&
        item.sort === newItem.sort)
    );

    const newHistory = [newItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
    
    setHistory(newHistory);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  const removeFromHistory = (id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  };

  const getRecentSearches = () => {
    return history.slice(0, MAX_HISTORY_ITEMS);
  };

  return {
    history,
    recentSearches: getRecentSearches(),
    addToHistory,
    clearHistory,
    removeFromHistory,
  };
}