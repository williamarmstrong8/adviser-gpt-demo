// Drafts feature data types

export interface SavedPrompt {
  id: string;
  title: string;
  prompt: string;
  description?: string;
  tags?: string[];
  createdAt: string; // ISO string
  createdBy: string;
  firmId: string;
  isShared: boolean; // true = firm-wide, false = personal
  userId: string; // email or user identifier
}

export interface SavedDraft {
  id: string;
  title: string;
  content: string;
  prompt?: string;
  description?: string;
  sampleFile?: {
    name: string;
    type: string;
    size: number;
  };
  informationalFiles?: Array<{
    name: string;
    type: string;
    size: number;
  }>;
  includeWebSources: boolean;
  createdAt: string; // ISO string
  createdBy: string;
  firmId: string;
  isShared: boolean; // true = firm-wide, false = personal
  userId: string; // email or user identifier
  lastModifiedAt: string; // ISO string
}

export interface FirmContext {
  firmId: string;
  firmName: string; // For display purposes
}
