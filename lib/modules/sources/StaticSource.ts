import { IModule, ModuleDownloadProgress } from '../types/IModule';

export class StaticSource {
  async downloadModule(
    module: IModule,
    progress: ModuleDownloadProgress,
    progressCallback?: (progress: ModuleDownloadProgress) => void
  ): Promise<void> {
    console.log(`Configuring ${module.name} from static source...`);

    if (module.source.type !== 'static') {
      throw new Error('Invalid source type for StaticSource');
    }

    try {
      // For static modules, we just mark as configured
      progress.progress = 100;
      progress.bytesDownloaded = 500; // Small size for static configuration
      progress.totalBytes = 500;
      this.notifyProgress(progress, progressCallback);

      console.log(`✅ ${module.name} configured successfully`);
    } catch (error) {
      console.error(`❌ Failed to configure ${module.name}:`, error);
      throw error;
    }
  }

  async getModuleData(module: IModule, book?: string, chapter?: number, term?: string): Promise<any> {
    // Try to load from existing static files in public/bibles/
    try {
      if (module.type === 'bible' && book && chapter !== undefined) {
        return await this.getBibleData(module.id, book, chapter);
      } else if (module.type === 'dictionary' && term) {
        return await this.getDictionaryData(module.id, term);
      } else {
        return await this.getGeneralModuleData(module.id);
      }
    } catch (error) {
      throw new Error(`Static data not available for ${module.id}: ${error}`);
    }
  }

  private async getBibleData(moduleId: string, book: string, chapter: number): Promise<any> {
    // Try to load from existing static Bible files
    const staticFiles = {
      'kjv': '/bibles/json/kjv.json',
      'kjv-strongs': '/bibles/json/kjv_strongs.json',
      'kjv_strongs': '/bibles/json/kjv_strongs.json',
      'asv': '/bibles/json/asv.json',
      'web': '/bibles/json/web.json',
      'geneva': '/bibles/json/geneva.json'
    };

    const filePath = staticFiles[moduleId as keyof typeof staticFiles];
    if (!filePath) {
      throw new Error(`No static file available for ${moduleId}`);
    }

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Static file not found: ${filePath}`);
      }

      const data = await response.json();

      // Find the requested book and chapter
      if (data.books && data.books[book]) {
        const bookData = data.books[book];
        if (bookData.chapters && bookData.chapters[chapter - 1]) {
          return bookData.chapters[chapter - 1];
        }
      }

      throw new Error(`Book ${book} chapter ${chapter} not found in static data`);
    } catch (error) {
      console.error(`Error loading static Bible data:`, error);
      throw error;
    }
  }

  private async getDictionaryData(moduleId: string, term: string): Promise<any> {
    // Try to load from existing Strong's definitions
    if (moduleId === 'strongs-hebrew' || moduleId === 'strongs-greek') {
      try {
        const response = await fetch('/bibles/extras/strongs_definitions.json');
        if (!response.ok) {
          throw new Error('Strong\'s definitions file not found');
        }

        const data = await response.json();
        return data[term] || null;
      } catch (error) {
        console.error('Error loading Strong\'s definitions:', error);
        throw error;
      }
    }

    throw new Error(`Dictionary ${moduleId} not available in static data`);
  }

  private async getGeneralModuleData(moduleId: string): Promise<any> {
    // Load the full Bible data from static files
    const staticFiles = {
      'kjv': '/bibles/json/kjv.json',
      'kjv-strongs': '/bibles/json/kjv_strongs.json', // Map module ID to file name
      'kjv_strongs': '/bibles/json/kjv_strongs.json',
      'asv': '/bibles/json/asv.json',
      'web': '/bibles/json/web.json',
      'geneva': '/bibles/json/geneva.json'
    };

    const filePath = staticFiles[moduleId as keyof typeof staticFiles];
    if (!filePath) {
      throw new Error(`No static file available for ${moduleId}`);
    }

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Static file not found: ${filePath}`);
      }

      const data = await response.json();
      console.log(`Loaded general module data for ${moduleId} with ${data.verses ? data.verses.length : 'unknown'} verses`);
      return data;
    } catch (error) {
      console.error(`Error loading static general module data for ${moduleId}:`, error);
      throw error;
    }
  }

  // Check if static data is available for a module
  async isStaticDataAvailable(moduleId: string): Promise<boolean> {
    const staticModules = [
      'kjv', 'kjv_strongs', 'asv', 'web', 'geneva',
      'strongs-hebrew', 'strongs-greek'
    ];

    return staticModules.includes(moduleId);
  }

  // Get list of available static modules
  async getAvailableStaticModules(): Promise<string[]> {
    return [
      'kjv', 'kjv_strongs', 'asv', 'web', 'geneva',
      'strongs-hebrew', 'strongs-greek'
    ];
  }

  private notifyProgress(progress: ModuleDownloadProgress, callback?: (progress: ModuleDownloadProgress) => void): void {
    if (callback) {
      callback(progress);
    }
  }
}

export default StaticSource;