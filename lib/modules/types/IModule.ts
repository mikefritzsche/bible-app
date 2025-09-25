export interface ModuleSource {
  type: 'github' | 'api' | 'static';
  url?: string;
  apiKey?: string;
}

export interface ModuleFormat {
  type: 'github-json' | 'bible-api' | 'api-scripture' | 'static-json' | 'kjv-strongs-json' | 'scrollmapper-strongs' | 'berean-json' | 'berean-interlinear';
  parser?: string;
}

export enum ModuleType {
  BIBLE = 'bible',
  DICTIONARY = 'dictionary',
  COMMENTARY = 'commentary',
  CROSS_REFERENCE = 'cross_reference',
  TOPICAL = 'topical'
}

export enum ModuleCategory {
  BIBLE = 'bible',
  REFERENCE = 'reference',
  COMMENTARY = 'commentary'
}

export enum ModuleFeature {
  STRONGS = 'strongs',
  SEARCH = 'search',
  AUDIO = 'audio',
  CROSS_REFS = 'cross_refs',
  MORPHOLOGY = 'morphology',
  INTERLINEAR = 'interlinear'
}

export interface IModule {
  id: string;
  name: string;
  description: string;
  type: ModuleType;
  category: ModuleCategory;
  language: string;
  size: string;
  source: ModuleSource;
  format: ModuleFormat;
  features: ModuleFeature[];
  license: string;
  publicDomain: boolean;
  isDefault?: boolean;
  installed: boolean;
  installedVersion?: string;
  lastUpdated?: Date;
  downloadUrl?: string;
  checksum?: string;
}

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

export interface ModuleManifest {
  installed: string[];
  available: Record<string, IModule>;
  lastUpdated: Date;
  version: string;
}