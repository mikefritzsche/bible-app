export interface Verse {
  chapter: number;
  verse: number;
  name: string;
  text: string;
}

export interface Chapter {
  chapter: number;
  name: string;
  verses: Record<string, Verse>;
}

export interface Book {
  book: string;
  chapters: Chapter[];
}

export interface BibleData {
  version: string;
  books: Record<string, Book>;
}

export interface StrongsDefinition {
  word?: string;
  transliteration?: string;
  pronunciation?: string;
  definition?: string;
  tvm?: string;
}

export interface StrongsPopoverProps {
  strongsNumber: string;
  definition: StrongsDefinition;
  position: { x: number; y: number };
  onClose: () => void;
  onStrongsClick: (strongsNumber: string, position: { x: number; y: number }) => void;
  onBack?: () => void;
  hasHistory?: boolean;
}

export interface VerseWithStrongsProps {
  text: string;
  verseNumber: number | null;
  onStrongsClick: (strongsNumber: string, position: { x: number; y: number }) => void;
  highlights?: Array<{
    startOffset: number;
    endOffset: number;
    color: string;
  }>;
  isDarkMode?: boolean;
  fontSize?: string;
  lineHeight?: string;
}

export interface ParsedTextPart {
  type: 'text' | 'strongs' | 'punctuation' | 'italic';
  content: string;
  display?: string;
  isGrammar?: boolean;
}

// Module system types
export interface ModuleDownloadProgress {
  moduleId: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  progress: number; // 0-100
  bytesDownloaded: number;
  totalBytes: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  currentFile?: string;
}

export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  installed: boolean;
  size: string;
  category: 'bible' | 'reference' | 'commentary';
  features: string[];
  publicDomain: boolean;
  language: string;
}