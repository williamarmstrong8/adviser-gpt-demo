import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SavedPrompt, SavedDraft, FirmContext } from '@/types/drafts';
import { generateFirmId } from '@/utils/draftUtils';
import { useUserProfile } from '@/hooks/useUserProfile';

const SAVED_PROMPTS_KEY = 'drafts-saved-prompts';
const SAVED_DRAFTS_KEY = 'drafts-saved-drafts';
const FIRM_ID_KEY = 'drafts-firm-id';

interface DraftsContextType {
  // Prompts
  savedPrompts: SavedPrompt[];
  myPrompts: SavedPrompt[];
  firmPrompts: SavedPrompt[];
  savePrompt: (prompt: Omit<SavedPrompt, 'id' | 'createdAt' | 'firmId' | 'userId'>) => SavedPrompt;
  deletePrompt: (id: string) => void;
  sharePrompt: (id: string) => void;
  unsharePrompt: (id: string) => void;
  updatePrompt: (id: string, updates: Partial<SavedPrompt>) => void;

  // Drafts
  savedDrafts: SavedDraft[];
  myDrafts: SavedDraft[];
  firmDrafts: SavedDraft[];
  saveDraft: (draft: Omit<SavedDraft, 'id' | 'createdAt' | 'lastModifiedAt' | 'firmId' | 'userId'>) => SavedDraft;
  deleteDraft: (id: string) => void;
  shareDraft: (id: string) => void;
  unshareDraft: (id: string) => void;
  updateDraft: (id: string, updates: Partial<SavedDraft>) => void;

  // Firm context
  firmContext: FirmContext | null;
  getFirmId: () => string;
}

const DraftsContext = createContext<DraftsContextType | undefined>(undefined);

interface DraftsProviderProps {
  children: ReactNode;
}

export function DraftsProvider({ children }: DraftsProviderProps) {
  const { profile } = useUserProfile();
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [firmContext, setFirmContext] = useState<FirmContext | null>(null);

  // Initialize firm ID
  useEffect(() => {
    const storedFirmId = localStorage.getItem(FIRM_ID_KEY);
    if (storedFirmId) {
      setFirmContext({
        firmId: storedFirmId,
        firmName: profile.companyName || 'My Firm',
      });
    } else {
      const firmId = generateFirmId(profile.companyName || 'default');
      localStorage.setItem(FIRM_ID_KEY, firmId);
      setFirmContext({
        firmId,
        firmName: profile.companyName || 'My Firm',
      });
    }
  }, [profile.companyName]);

  // Load saved prompts
  useEffect(() => {
    const stored = localStorage.getItem(SAVED_PROMPTS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSavedPrompts(parsed);
      } catch {
        setSavedPrompts([]);
      }
    }
  }, []);

  // Load saved drafts
  useEffect(() => {
    const stored = localStorage.getItem(SAVED_DRAFTS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSavedDrafts(parsed);
      } catch {
        setSavedDrafts([]);
      }
    }
  }, []);

  // Save prompts to localStorage
  const persistPrompts = useCallback((prompts: SavedPrompt[]) => {
    try {
      localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(prompts));
      setSavedPrompts(prompts);
    } catch (error) {
      console.error('Failed to save prompts:', error);
    }
  }, []);

  // Save drafts to localStorage
  const persistDrafts = useCallback((drafts: SavedDraft[]) => {
    try {
      localStorage.setItem(SAVED_DRAFTS_KEY, JSON.stringify(drafts));
      setSavedDrafts(drafts);
    } catch (error) {
      console.error('Failed to save drafts:', error);
    }
  }, []);

  const getFirmId = useCallback((): string => {
    if (firmContext) {
      return firmContext.firmId;
    }
    const stored = localStorage.getItem(FIRM_ID_KEY);
    if (stored) {
      return stored;
    }
    const firmId = generateFirmId(profile.companyName || 'default');
    localStorage.setItem(FIRM_ID_KEY, firmId);
    return firmId;
  }, [firmContext, profile.companyName]);

  const getUserId = useCallback((): string => {
    return profile.email || 'unknown';
  }, [profile.email]);

  // Prompt functions
  const savePrompt = useCallback((promptData: Omit<SavedPrompt, 'id' | 'createdAt' | 'firmId' | 'userId'>): SavedPrompt => {
    const firmId = getFirmId();
    const userId = getUserId();
    const newPrompt: SavedPrompt = {
      ...promptData,
      id: `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      firmId,
      userId,
      isShared: promptData.isShared || false,
    };

    const updated = [newPrompt, ...savedPrompts];
    persistPrompts(updated);
    return newPrompt;
  }, [savedPrompts, getFirmId, getUserId, persistPrompts]);

  const deletePrompt = useCallback((id: string) => {
    const updated = savedPrompts.filter(p => p.id !== id);
    persistPrompts(updated);
  }, [savedPrompts, persistPrompts]);

  const sharePrompt = useCallback((id: string) => {
    const updated = savedPrompts.map(p =>
      p.id === id ? { ...p, isShared: true } : p
    );
    persistPrompts(updated);
  }, [savedPrompts, persistPrompts]);

  const unsharePrompt = useCallback((id: string) => {
    const updated = savedPrompts.map(p =>
      p.id === id ? { ...p, isShared: false } : p
    );
    persistPrompts(updated);
  }, [savedPrompts, persistPrompts]);

  const updatePrompt = useCallback((id: string, updates: Partial<SavedPrompt>) => {
    const updated = savedPrompts.map(p =>
      p.id === id ? { ...p, ...updates } : p
    );
    persistPrompts(updated);
  }, [savedPrompts, persistPrompts]);

  // Draft functions
  const saveDraft = useCallback((draftData: Omit<SavedDraft, 'id' | 'createdAt' | 'lastModifiedAt' | 'firmId' | 'userId'>): SavedDraft => {
    const firmId = getFirmId();
    const userId = getUserId();
    const now = new Date().toISOString();
    const newDraft: SavedDraft = {
      ...draftData,
      id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      lastModifiedAt: now,
      firmId,
      userId,
      isShared: draftData.isShared || false,
    };

    const updated = [newDraft, ...savedDrafts];
    persistDrafts(updated);
    return newDraft;
  }, [savedDrafts, getFirmId, getUserId, persistDrafts]);

  const deleteDraft = useCallback((id: string) => {
    const updated = savedDrafts.filter(d => d.id !== id);
    persistDrafts(updated);
  }, [savedDrafts, persistDrafts]);

  const shareDraft = useCallback((id: string) => {
    const updated = savedDrafts.map(d =>
      d.id === id ? { ...d, isShared: true } : d
    );
    persistDrafts(updated);
  }, [savedDrafts, persistDrafts]);

  const unshareDraft = useCallback((id: string) => {
    const updated = savedDrafts.map(d =>
      d.id === id ? { ...d, isShared: false } : d
    );
    persistDrafts(updated);
  }, [savedDrafts, persistDrafts]);

  const updateDraft = useCallback((id: string, updates: Partial<SavedDraft>) => {
    const updated = savedDrafts.map(d =>
      d.id === id ? { ...d, ...updates, lastModifiedAt: new Date().toISOString() } : d
    );
    persistDrafts(updated);
  }, [savedDrafts, persistDrafts]);

  // Filter prompts and drafts
  const firmId = firmContext?.firmId || getFirmId();
  const userId = getUserId();

  // Mine = all my items (shared or not). Shared = all firm-shared items (so shared items appear in both).
  const myPrompts = savedPrompts.filter(p => p.userId === userId);
  const firmPrompts = savedPrompts.filter(p => p.firmId === firmId && p.isShared);

  const myDrafts = savedDrafts.filter(d => d.userId === userId);
  const firmDrafts = savedDrafts.filter(d => d.firmId === firmId && d.isShared);

  const value: DraftsContextType = {
    savedPrompts,
    myPrompts,
    firmPrompts,
    savePrompt,
    deletePrompt,
    sharePrompt,
    unsharePrompt,
    updatePrompt,
    savedDrafts,
    myDrafts,
    firmDrafts,
    saveDraft,
    deleteDraft,
    shareDraft,
    unshareDraft,
    updateDraft,
    firmContext,
    getFirmId,
  };

  return (
    <DraftsContext.Provider value={value}>
      {children}
    </DraftsContext.Provider>
  );
}

export function useDrafts() {
  const context = useContext(DraftsContext);
  if (context === undefined) {
    throw new Error('useDrafts must be used within a DraftsProvider');
  }
  return context;
}
