import { useState, useEffect, useCallback } from 'react';
import { VaultState, VaultFilters, QuestionItem } from '@/types/vault';
import { useChangeHistory } from './useChangeHistory';
import { useUserProfile } from './useUserProfile';

// LocalStorage keys
const STORAGE_KEYS = {
  query: 'ag_vault_query',
  filters: 'ag_vault_filters', 
  activeView: 'ag_vault_activeView',
  edits: 'ag_vault_edits',
  sort: 'ag_vault_sort',
  showArchived: 'ag_vault_showArchived'
};

export function useVaultState() {
  const [state, setState] = useState<VaultState>({
    query: '',
    filters: {},
    activeView: 'files',
    sort: 'name',
    showArchived: false
  });

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedQuery = localStorage.getItem(STORAGE_KEYS.query) || '';
      const savedFilters = localStorage.getItem(STORAGE_KEYS.filters);
      const savedView = localStorage.getItem(STORAGE_KEYS.activeView) as VaultState['activeView'] || 'files';
      const savedSort = localStorage.getItem(STORAGE_KEYS.sort) || 'name';
      const savedShowArchived = localStorage.getItem(STORAGE_KEYS.showArchived) === 'true';

      setState({
        query: savedQuery,
        filters: savedFilters ? JSON.parse(savedFilters) : {},
        activeView: savedView,
        sort: savedSort,
        showArchived: savedShowArchived
      });
    } catch (error) {
      console.warn('Failed to load vault state from localStorage:', error);
    }
  }, []);

  // Update query
  const setQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));
    localStorage.setItem(STORAGE_KEYS.query, query);
  }, []);

  // Update filters
  const setFilters = useCallback((filters: VaultFilters) => {
    setState(prev => ({ ...prev, filters }));
    localStorage.setItem(STORAGE_KEYS.filters, JSON.stringify(filters));
  }, []);

  // Update active view
  const setActiveView = useCallback((activeView: VaultState['activeView']) => {
    setState(prev => ({ ...prev, activeView }));
    localStorage.setItem(STORAGE_KEYS.activeView, activeView);
  }, []);

  // Update sort
  const setSort = useCallback((sort: string) => {
    setState(prev => ({ ...prev, sort }));
    localStorage.setItem(STORAGE_KEYS.sort, sort);
  }, []);

  // Update show archived
  const setShowArchived = useCallback((showArchived: boolean) => {
    setState(prev => ({ ...prev, showArchived }));
    localStorage.setItem(STORAGE_KEYS.showArchived, showArchived.toString());
  }, []);

  // Clear all state
  const clearState = () => {
    const clearedState: VaultState = {
      query: '',
      filters: {},
      activeView: 'files',
      sort: 'name',
      showArchived: false
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
    setShowArchived,
    clearState
  };
}

// Hook for managing edits
export function useVaultEdits() {
  const [edits, setEdits] = useState<Record<string, any>>({});
  const { getChangeHistory, addChangeHistoryEntry, initializeChangeHistory, hasHistory } = useChangeHistory();
  const { profile } = useUserProfile();

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

  // Persist edits to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.edits, JSON.stringify(edits));
    } catch (error) {
      console.warn('Failed to save vault edits:', error);
    }
  }, [edits]);

  // Helper function to check if question/answer changed
  const hasQuestionOrAnswerChanged = (prevData: any, newData: any, originalItem?: any): boolean => {
    // Get previous values: prefer prevEdit, then originalItem, then empty string
    const prevQuestion = (prevData?.question ?? originalItem?.question ?? '').trim();
    const prevAnswer = (prevData?.answer ?? originalItem?.answer ?? '').trim();
    
    // Get new values: if not provided in newData, use previous values (no change)
    // This handles cases like archive/tag operations that don't include question/answer
    const newQuestion = (newData?.question !== undefined 
      ? newData.question 
      : prevData?.question ?? originalItem?.question ?? '').trim();
    const newAnswer = (newData?.answer !== undefined 
      ? newData.answer 
      : prevData?.answer ?? originalItem?.answer ?? '').trim();
    
    return prevQuestion !== newQuestion || prevAnswer !== newAnswer;
  };

  // already existing single-item saver — keep but make it functional
  const saveEdit = (id: string, data: any, originalItem?: any) => {
    // Check history before entering setEdits to avoid stale state
    const itemHasHistory = hasHistory(id);
    
    setEdits(prev => {
      const prevEdit = prev[id];
      const isNewItem = !prevEdit && !originalItem;
      
      // Check if question or answer changed (not just tags)
      // Compare against prevEdit if it exists, otherwise against originalItem
      if (hasQuestionOrAnswerChanged(prevEdit, data, originalItem)) {
        const user = profile.fullName || data.updatedBy || 'Unknown User';
        const timestamp = data.updatedAt || new Date().toISOString();
        
        if (isNewItem) {
          // First creation - initialize history
          const initialData: QuestionItem = {
            id,
            type: data.type || 'Questionnaires',
            tags: data.tags || [],
            question: data.question || '',
            answer: data.answer || '',
            updatedAt: timestamp,
            updatedBy: user,
            ...data,
          };
          initializeChangeHistory(id, initialData, user);
          } else {
            // Update - check if this is the first edit of an existing item
            // If history doesn't exist yet and we have originalItem, initialize with original state first
            if (!itemHasHistory && originalItem) {
              // First edit of existing item - initialize history with original state
              const originalEntry: QuestionItem = {
                id,
                type: originalItem.type || 'Questionnaires',
                tags: originalItem.tags || [],
                question: originalItem.question || '',
                answer: originalItem.answer || '',
                updatedAt: originalItem.updatedAt || new Date().toISOString(),
                updatedBy: originalItem.updatedBy || 'Unknown User',
              };
              initializeChangeHistory(id, originalEntry, originalItem.updatedBy || 'Unknown User');
            }
            
            // Get previous values for fallback
            const prevQuestion = prevEdit?.question ?? originalItem?.question ?? '';
            const prevAnswer = prevEdit?.answer ?? originalItem?.answer ?? '';
            
            // Add the new change entry - use nullish coalescing to ensure complete entries
            addChangeHistoryEntry(id, {
              date: timestamp,
              user,
              question: data.question ?? prevQuestion,
              answer: data.answer ?? prevAnswer,
            });
          }
      }
      
      return {
        ...prev,
        [id]: { ...(prevEdit ?? {}), ...data },
      };
    });
  };

  // NEW: commit many edits in one state update
  const saveManyEdits = (entries: Array<[string, any]>) => {
    setEdits(prev => {
      const next = { ...prev };
      for (const [id, data] of entries) {
        const prevEdit = next[id];
        const isNewItem = !prevEdit;
        
        // Check if question or answer changed (not just tags)
        if (hasQuestionOrAnswerChanged(prevEdit, data)) {
          const user = profile.fullName || data.updatedBy || 'Unknown User';
          const timestamp = data.updatedAt || new Date().toISOString();
          
          if (isNewItem) {
            // First creation - initialize history
            const initialData: QuestionItem = {
              id,
              type: data.type || 'Questionnaires',
              tags: data.tags || [],
              question: data.question || '',
              answer: data.answer || '',
              updatedAt: timestamp,
              updatedBy: user,
              ...data,
            };
            initializeChangeHistory(id, initialData, user);
          } else {
            // Update - add history entry
            // Get previous values for fallback (use prevEdit since originalItem not available in batch saves)
            const prevQuestion = prevEdit?.question ?? '';
            const prevAnswer = prevEdit?.answer ?? '';
            
            // Use nullish coalescing to ensure complete entries
            addChangeHistoryEntry(id, {
              date: timestamp,
              user,
              question: data.question ?? prevQuestion,
              answer: data.answer ?? prevAnswer,
            });
          }
        }
        
        next[id] = { ...(prevEdit ?? {}), ...data };
      }
      return next;
    });
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

  return { edits, saveEdit, getEdit, clearEdit, saveManyEdits };
}