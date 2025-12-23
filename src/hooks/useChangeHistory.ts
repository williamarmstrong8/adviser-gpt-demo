import { useState, useEffect, useCallback } from 'react';
import { ChangeHistoryEntry, QuestionItem } from '@/types/vault';

const STORAGE_KEY = 'ag_vault_change_history';

// Change history stored as Record<itemId, ChangeHistoryEntry[]>
type ChangeHistoryStorage = Record<string, ChangeHistoryEntry[]>;

export function useChangeHistory() {
  const [history, setHistory] = useState<ChangeHistoryStorage>({});

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.warn('Failed to load change history:', error);
    }
  }, []);

  // Persist history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save change history:', error);
    }
  }, [history]);

  // Get change history for an item
  const getChangeHistory = useCallback((itemId: string): ChangeHistoryEntry[] => {
    return history[itemId] || [];
  }, [history]);

  // Add a change history entry
  const addChangeHistoryEntry = useCallback((itemId: string, entry: ChangeHistoryEntry) => {
    setHistory(prev => {
      const itemHistory = prev[itemId] || [];
      return {
        ...prev,
        [itemId]: [...itemHistory, entry], // Add new entry at the end (chronological order)
      };
    });
  }, []);

  // Initialize change history for a new item (first creation)
  const initializeChangeHistory = useCallback((itemId: string, initialData: QuestionItem, user: string) => {
    const entry: ChangeHistoryEntry = {
      date: initialData.updatedAt || new Date().toISOString(),
      user: user || initialData.updatedBy || 'Unknown User',
      question: initialData.question || '',
      answer: initialData.answer || '',
    };
    
    setHistory(prev => ({
      ...prev,
      [itemId]: [entry], // Initialize with first entry
    }));
  }, []);

  // Check if history exists for an item (synchronous check)
  const hasHistory = useCallback((itemId: string): boolean => {
    return !!(history[itemId] && history[itemId].length > 0);
  }, [history]);

  return {
    getChangeHistory,
    addChangeHistoryEntry,
    initializeChangeHistory,
    hasHistory,
  };
}

