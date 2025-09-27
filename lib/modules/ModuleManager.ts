import { IModuleManager, ModuleDownloadProgress, ModuleManifest } from './types/IModuleManager';
import { IModule, ModuleType } from './types/IModule';
import getModuleRegistry from './ModuleRegistry';
import GitHubJSONSource from './sources/GitHubJSONSource';
import BibleAPISource from './sources/BibleAPISource';
import StaticSource from './sources/StaticSource';
import HybridStorage from './storage/HybridStorage';

export class ModuleManager implements IModuleManager {
  private registry: any;
  private storage: Map<string, any>; // In-memory cache for performance
  private hybridStorage: HybridStorage;
  private downloadProgress: Map<string, ModuleDownloadProgress>;
  private activeDownloads: Map<string, AbortController>;

  constructor() {
    this.registry = getModuleRegistry();
    this.storage = new Map();
    this.hybridStorage = new HybridStorage();
    this.downloadProgress = new Map();
    this.activeDownloads = new Map();
  }

  // Module Management
  async getAvailableModules(): Promise<Record<string, IModule>> {
    return await this.registry.getAvailableModules();
  }

  async getInstalledModules(): Promise<string[]> {
    return await this.registry.getInstalledModules();
  }

  async isModuleInstalled(moduleId: string): Promise<boolean> {
    return await this.registry.isModuleInstalled(moduleId);
  }

  async getModule(moduleId: string): Promise<IModule | null> {
    return await this.registry.getModule(moduleId);
  }

  // Download Operations
  async downloadModule(moduleId: string, progressCallback?: (progress: ModuleDownloadProgress) => void): Promise<void> {
    const module = await this.getModule(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    // Check if already downloading
    if (this.activeDownloads.has(moduleId)) {
      throw new Error(`Module ${moduleId} is already being downloaded`);
    }

    // Create abort controller for cancellation
    const abortController = new AbortController();
    this.activeDownloads.set(moduleId, abortController);

    // Initialize progress tracking
    const progress: ModuleDownloadProgress = {
      moduleId,
      status: 'pending',
      progress: 0,
      bytesDownloaded: 0,
      totalBytes: 0,
      startedAt: new Date()
    };

    this.downloadProgress.set(moduleId, progress);

    try {
      // First attempt to satisfy the request from bundled static modules
      if (typeof window !== 'undefined') {
        const staticUrl = `/bibles/modules/${moduleId}.json`;
        try {
          const response = await fetch(staticUrl);
          if (response.ok) {
            const staticData = await response.json();
            console.log(`✅ Loaded ${moduleId} from bundled static modules`);

            this.storage.set(moduleId, staticData);

            if (this.hybridStorage.isAvailable()) {
              try {
                await this.hybridStorage.saveModuleData(moduleId, staticData);
              } catch (storageError) {
                console.warn(`Failed to persist ${moduleId} from static modules:`, storageError);
              }
            }

            progress.status = 'completed';
            progress.progress = 100;
            progress.bytesDownloaded = staticData?.verses?.length || 0;
            progress.totalBytes = progress.bytesDownloaded;
            progress.completedAt = new Date();
            this.notifyProgress(progress, progressCallback);

            await this.registry.addInstalledModule(moduleId);
            return;
          }
        } catch (staticError) {
          console.warn(`Bundled module lookup failed for ${moduleId}:`, staticError);
        }
      }

      // Update status to downloading
      progress.status = 'downloading';
      this.notifyProgress(progress, progressCallback);

      // Route to appropriate downloader based on source type
      switch (module.source.type) {
        case 'github':
          console.log(`Starting GitHub download for ${moduleId}...`);
          const githubData = await this.downloadGitHubModule(module, progress, progressCallback, abortController.signal);
          console.log(`GitHub download completed for ${moduleId}:`, githubData ? 'Success' : 'Failed');

          // Save the downloaded data to storage
          if (githubData) {
            console.log(`Caching ${moduleId} in memory...`);
            this.storage.set(moduleId, githubData);

            console.log(`Checking storage availability for ${moduleId}...`);
            console.log(`Hybrid storage available:`, this.hybridStorage.isAvailable());

            if (this.hybridStorage.isAvailable()) {
              try {
                console.log(`Saving ${moduleId} to persistent storage...`);
                await this.hybridStorage.saveModuleData(moduleId, githubData);
                console.log(`✅ Successfully saved ${moduleId} to storage`);
              } catch (error) {
                console.error(`❌ Failed to save GitHub module data to storage for ${moduleId}:`, error);
                console.log(`⚠️  Continuing with in-memory cache only for ${moduleId}`);
                // Don't throw error - continue with in-memory cache
              }
            } else {
              console.log(`⚠️  Storage not available for ${moduleId}, using in-memory cache only`);
              // Don't throw error - continue with in-memory cache
            }
          } else {
            console.error(`❌ No data returned from GitHub download for ${moduleId}`);
            throw new Error('Download returned no data');
          }
          break;
        case 'api':
          await this.downloadAPIModule(module, progress, progressCallback, abortController.signal);
          break;
        case 'static':
          await this.downloadStaticModule(module, progress, progressCallback);
          break;
        default:
          throw new Error(`Unsupported source type: ${module.source.type}`);
      }

      // Mark as completed
      progress.status = 'completed';
      progress.progress = 100;
      progress.completedAt = new Date();
      this.notifyProgress(progress, progressCallback);

      // Update registry to mark as installed
      await this.registry.addInstalledModule(moduleId);

      // Module data is already cached during download
      // No need to fetch again

    } catch (error) {
      // Mark as failed
      progress.status = 'failed';
      progress.error = error instanceof Error ? error.message : String(error);
      this.notifyProgress(progress, progressCallback);
      throw error;
    } finally {
      // Clean up download tracking
      this.activeDownloads.delete(moduleId);
    }
  }

  async pauseDownload(moduleId: string): Promise<void> {
    // For now, we'll implement cancellation as pause
    await this.cancelDownload(moduleId);
  }

  async resumeDownload(moduleId: string): Promise<void> {
    // Restart the download
    await this.downloadModule(moduleId);
  }

  async cancelDownload(moduleId: string): Promise<void> {
    const abortController = this.activeDownloads.get(moduleId);
    if (abortController) {
      abortController.abort();
      this.activeDownloads.delete(moduleId);

      const progress = this.downloadProgress.get(moduleId);
      if (progress) {
        progress.status = 'failed';
        progress.error = 'Download cancelled';
        this.downloadProgress.delete(moduleId);
      }
    }
  }

  // Module Operations
  async deleteModule(moduleId: string): Promise<void> {
    const module = await this.getModule(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    if (module.isDefault) {
      throw new Error('Cannot delete default module');
    }

    // Remove from storage
    this.storage.delete(moduleId);

    // Remove from filesystem storage
    if (this.hybridStorage.isAvailable()) {
      try {
        await this.hybridStorage.deleteModuleData(moduleId);
      } catch (error) {
        console.warn(`Failed to remove module data from filesystem for ${moduleId}:`, error);
      }
    }

    // Update registry
    await this.registry.removeInstalledModule(moduleId);

    // Clear any download progress
    this.downloadProgress.delete(moduleId);
  }

  async getModuleData(moduleId: string, book?: string, chapter?: number, term?: string): Promise<any> {
    const module = await this.getModule(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    const extractModuleSlice = (data: any) => {
      if (!data) return null;

      if (module.type === ModuleType.BIBLE && book && data.books && data.books[book]) {
        if (chapter !== undefined && data.books[book].chapters) {
          return data.books[book].chapters[chapter - 1] || null;
        }
        return data.books[book] || null;
      }

      if (module.type === ModuleType.DICTIONARY && term && data.entries) {
        return data.entries[term] || null;
      }

      return data;
    };

    const isValidModuleData = (data: any): boolean => {
      if (!data) return false;

      if (module.type === ModuleType.BIBLE) {
        if (data.books && typeof data.books === 'object') {
          return Object.keys(data.books).length > 0;
        }

        if (data.chapters && Array.isArray(data.chapters)) {
          return data.chapters.length > 0;
        }

        if (data.verses && typeof data.verses === 'object') {
          return Object.keys(data.verses).length > 0;
        }

        if (Array.isArray(data.verses)) {
          return data.verses.length > 0;
        }

        return false;
      }

      return true;
    };

    // Check in-memory cache first
    if (this.storage.has(moduleId)) {
      const cachedData = this.storage.get(moduleId);
      if (isValidModuleData(cachedData)) {
        return extractModuleSlice(cachedData);
      }

      // Purge invalid cached data
      this.storage.delete(moduleId);
    }

    // Try persistent storage next
    if (this.hybridStorage.isAvailable()) {
      try {
        const storedData = await this.hybridStorage.loadModuleData(moduleId);
        if (storedData && isValidModuleData(storedData)) {
          this.storage.set(moduleId, storedData);
          return extractModuleSlice(storedData);
        }

        if (storedData) {
          // Remove corrupted or incomplete data so we can fall back to a known-good source
          await this.hybridStorage.deleteModuleData(moduleId).catch(error => {
            console.warn(`Failed to delete corrupted module data for ${moduleId}:`, error);
          });
        }
      } catch (error) {
        console.warn(`Failed to load module data from filesystem for ${moduleId}:`, error);
      }
    }

    // Load from static source as final fallback (client side only)
    if (typeof window === 'undefined') {
      throw new Error(`Module ${moduleId} is not available during server-side rendering`);
    }

    try {
      const staticSource = new StaticSource();
      const data = await staticSource.getModuleData(module, book, chapter, term);

      if (!isValidModuleData(data)) {
        throw new Error(`Static module data for ${moduleId} is incomplete`);
      }

      this.storage.set(moduleId, data);

      if (this.hybridStorage.isAvailable()) {
        await this.hybridStorage.saveModuleData(moduleId, data).catch(error => {
          console.warn(`Failed to save module data to filesystem for ${moduleId}:`, error);
        });
      }

      return extractModuleSlice(data);
    } catch (error) {
      throw new Error(`Module ${moduleId} is not installed and could not be loaded`);
    }
  }

  // Filesystem availability check
  isFilesystemAvailable(): boolean {
    return this.hybridStorage.isAvailable();
  }

  // Get modules directory path (Electron only)
  async getModulesDirectory(): Promise<string | null> {
    if (this.hybridStorage.isAvailable()) {
      try {
        return await this.hybridStorage.getModulesDirectory();
      } catch (error) {
        console.warn('Failed to get modules directory:', error);
        return null;
      }
    }
    return null;
  }

  // Storage Management
  async getStorageInfo(): Promise<{ used: number; total: number; available: number }> {
    // Simplified storage info - in real implementation, this would check actual storage
    const used = Array.from(this.storage.values()).reduce((total, data) => {
      return total + JSON.stringify(data).length;
    }, 0);

    return {
      used,
      total: 100 * 1024 * 1024, // 100MB limit
      available: Math.max(0, (100 * 1024 * 1024) - used)
    };
  }

  async cleanup(): Promise<void> {
    // Clean up unused data
    const installed = await this.getInstalledModules();

    // Remove cached data for uninstalled modules
    for (const moduleId of this.storage.keys()) {
      if (!installed.includes(moduleId)) {
        this.storage.delete(moduleId);
      }
    }

    // Clear completed download progress
    for (const [moduleId, progress] of this.downloadProgress.entries()) {
      if (progress.status === 'completed' || progress.status === 'failed') {
        this.downloadProgress.delete(moduleId);
      }
    }
  }

  // Manifest Operations
  async getManifest(): Promise<ModuleManifest> {
    return await this.registry.getManifest();
  }

  async updateManifest(manifest: ModuleManifest): Promise<void> {
    await this.registry.updateManifest(manifest);
  }

  // Helper methods
  private async downloadGitHubModule(
    module: IModule,
    progress: ModuleDownloadProgress,
    progressCallback?: (progress: ModuleDownloadProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<any> {
    const source = new GitHubJSONSource();
    return await source.downloadModule(module, progress, progressCallback, abortSignal);
  }

  private async downloadAPIModule(
    module: IModule,
    progress: ModuleDownloadProgress,
    progressCallback?: (progress: ModuleDownloadProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<void> {
    const source = new BibleAPISource();
    await source.downloadModule(module, progress, progressCallback, abortSignal);
  }

  private async downloadStaticModule(
    module: IModule,
    progress: ModuleDownloadProgress,
    progressCallback?: (progress: ModuleDownloadProgress) => void
  ): Promise<void> {
    // Only allow static module downloads on client side
    if (typeof window === 'undefined') {
      throw new Error('Static module downloads are not available during server-side rendering');
    }
    try {
      const source = new StaticSource();
      await source.downloadModule(module, progress, progressCallback);
    } catch (error) {
      console.error('Error creating StaticSource:', error);
      throw error;
    }
  }

  private notifyProgress(progress: ModuleDownloadProgress, callback?: (progress: ModuleDownloadProgress) => void): void {
    this.downloadProgress.set(progress.moduleId, progress);
    if (callback) {
      callback(progress);
    }
  }

  // Public method to get download progress
  getDownloadProgress(moduleId?: string): ModuleDownloadProgress | ModuleDownloadProgress[] | null {
    if (moduleId) {
      return this.downloadProgress.get(moduleId) || null;
    }
    return Array.from(this.downloadProgress.values());
  }
}

// Lazy initialization - will be created when first accessed
let moduleManagerInstance: ModuleManager | null = null;

export default function getModuleManager(): ModuleManager {
  if (!moduleManagerInstance) {
    moduleManagerInstance = new ModuleManager();
  }
  return moduleManagerInstance;
}
