import { useState, useEffect } from 'react';
import { VaultState, VaultFilters } from '@/types/vault';

// LocalStorage keys
const STORAGE_KEYS = {
  query: 'ag_vault_query',
  filters: 'ag_vault_filters', 
  activeView: 'ag_vault_activeView',
  edits: 'ag_vault_edits',
  sort: 'ag_vault_sort'
};

export function useVaultState() {
  const [state, setState] = useState<VaultState>({
    query: '',
    filters: {},
    activeView: 'files',
    sort: 'name'
  });

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedQuery = localStorage.getItem(STORAGE_KEYS.query) || '';
      const savedFilters = localStorage.getItem(STORAGE_KEYS.filters);
      const savedView = localStorage.getItem(STORAGE_KEYS.activeView) as VaultState['activeView'] || 'files';
      const savedSort = localStorage.getItem(STORAGE_KEYS.sort) || 'name';

      setState({
        query: savedQuery,
        filters: savedFilters ? JSON.parse(savedFilters) : {},
        activeView: savedView,
        sort: savedSort
      });
    } catch (error) {
      console.warn('Failed to load vault state from localStorage:', error);
    }
  }, []);

  // Update query
  const setQuery = (query: string) => {
    setState(prev => ({ ...prev, query }));
    localStorage.setItem(STORAGE_KEYS.query, query);
  };

  // Update filters
  const setFilters = (filters: VaultFilters) => {
    setState(prev => ({ ...prev, filters }));
    localStorage.setItem(STORAGE_KEYS.filters, JSON.stringify(filters));
  };

  // Update active view
  const setActiveView = (activeView: VaultState['activeView']) => {
    setState(prev => ({ ...prev, activeView }));
    localStorage.setItem(STORAGE_KEYS.activeView, activeView);
  };

  // Update sort
  const setSort = (sort: string) => {
    setState(prev => ({ ...prev, sort }));
    localStorage.setItem(STORAGE_KEYS.sort, sort);
  };

  // Clear all state
  const clearState = () => {
    const clearedState: VaultState = {
      query: '',
      filters: {},
      activeView: 'files',
      sort: 'name'
    };
    setState(clearedState);
    Object.values(STORAGE_KEYS).forEach(key => {
      if (key !== STORAGE_KEYS.edits) { // Preserve edits
        localStorage.removeItem(key);
      }
    });
  };

  return {
    state,
    setQuery,
    setFilters,
    setActiveView, 
    setSort,
    clearState
  };
}

// Hook for managing edits
export function useVaultEdits() {
  const [edits, setEdits] = useState<Record<string, any>>({});

  useEffect(() => {
    try {
      const savedEdits = localStorage.getItem(STORAGE_KEYS.edits);
      if (savedEdits) {
        setEdits(JSON.parse(savedEdits));
      }
    } catch (error) {
      console.warn('Failed to load vault edits:', error);
    }
  }, []);

  const saveEdit = (itemId: string, editData: any) => {
    const newEdits = { ...edits, [itemId]: editData };
    setEdits(newEdits);
    localStorage.setItem(STORAGE_KEYS.edits, JSON.stringify(newEdits));
  };

  const getEdit = (itemId: string) => {
    return edits[itemId];
  };

  const clearEdit = (itemId: string) => {
    const newEdits = { ...edits };
    delete newEdits[itemId];
    setEdits(newEdits);
    localStorage.setItem(STORAGE_KEYS.edits, JSON.stringify(newEdits));
  };

  return { edits, saveEdit, getEdit, clearEdit };
}