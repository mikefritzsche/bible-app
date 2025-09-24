import { IModule, ModuleDownloadProgress, ModuleManifest } from './IModule';

export interface IModuleManager {
  // Module Management
  getAvailableModules(): Promise<Record<string, IModule>>;
  getInstalledModules(): Promise<string[]>;
  isModuleInstalled(moduleId: string): Promise<boolean>;
  getModule(moduleId: string): Promise<IModule | null>;

  // Download Operations
  downloadModule(moduleId: string, progressCallback?: (progress: ModuleDownloadProgress) => void): Promise<void>;
  pauseDownload(moduleId: string): Promise<void>;
  resumeDownload(moduleId: string): Promise<void>;
  cancelDownload(moduleId: string): Promise<void>;

  // Module Operations
  deleteModule(moduleId: string): Promise<void>;
  getModuleData(moduleId: string, book?: string, chapter?: number, term?: string): Promise<any>;

  // Storage Management
  getStorageInfo(): Promise<{ used: number; total: number; available: number }>;
  cleanup(): Promise<void>;

  // Manifest Operations
  getManifest(): Promise<ModuleManifest>;
  updateManifest(manifest: ModuleManifest): Promise<void>;
}

export type { ModuleDownloadProgress, ModuleManifest };