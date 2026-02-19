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

export interface SavedSampleFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // Base64 encoded file content
  uploadedAt: string; // ISO string
  uploadedBy: string;
  firmId: string;
  userId: string;
}

// Block-based draft editor
export type DraftBlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'heading4'
  | 'heading5'
  | 'heading6'
  | 'list'
  | 'quote'
  | 'delimiter'
  | 'link'
  | 'image'
  | 'table';

export interface DraftBlock {
  id: string;
  type: DraftBlockType;
  content: string; // For list: newline-separated items; for table: placeholder or simple format
}
