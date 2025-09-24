import { IModule, ModuleDownloadProgress } from '../types/IModule';

export class BibleAPISource {
  async downloadModule(
    module: IModule,
    progress: ModuleDownloadProgress,
    progressCallback?: (progress: ModuleDownloadProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<void> {
    console.log(`Configuring ${module.name} from Bible-API.com...`);

    if (module.source.type !== 'api') {
      throw new Error('Invalid source type for BibleAPISource');
    }

    try {
      // For API-based modules, we don't actually download the entire Bible
      // Instead, we configure the API access and test connectivity
      progress.progress = 100;
      progress.bytesDownloaded = 1000; // Small size for API configuration
      progress.totalBytes = 1000;
      this.notifyProgress(progress, progressCallback);

      // Test API connectivity
      await this.testAPIConnectivity(module);

      console.log(`✅ ${module.name} configured successfully`);
    } catch (error) {
      console.error(`❌ Failed to configure ${module.name}:`, error);
      throw error;
    }
  }

  private async testAPIConnectivity(module: IModule): Promise<void> {
    // Test the API with a simple request
    const testUrl = `${module.source.url}john 3:16`;

    try {
      const response = await fetch(testUrl);
      if (!response.ok) {
        throw new Error(`API test failed: HTTP ${response.status}`);
      }

      const data = await response.json();

      // Validate the response structure
      if (!data.verses || !Array.isArray(data.verses)) {
        throw new Error('Invalid API response structure');
      }

      console.log(`✅ API connectivity test passed for ${module.name}`);
    } catch (error) {
      console.error(`❌ API connectivity test failed for ${module.name}:`, error);
      throw error;
    }
  }

  async getModuleData(module: IModule, book?: string, chapter?: number, term?: string): Promise<any> {
    if (!book || chapter === undefined) {
      throw new Error('Book and chapter are required for Bible API data');
    }

    // Format the reference for the API
    const bookFormatted = book.replace(/ /g, '+');
    const reference = `${bookFormatted}+${chapter}`;
    const url = `${module.source.url}${encodeURIComponent(reference)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch from Bible-API.com: HTTP ${response.status}`);
      }

      const data = await response.json();

      // Transform the API response to match our internal format
      return this.transformAPIData(data, book, chapter);
    } catch (error) {
      console.error('Error fetching from Bible-API.com:', error);
      throw error;
    }
  }

  private transformAPIData(apiResponse: any, book: string, chapter: number): any {
    // Transform Bible-API.com response to our standard format
    const verses = apiResponse.verses.map((verse: any) => ({
      verse: verse.verse.toString(),
      text: verse.text,
      reference: `${book} ${chapter}:${verse.verse}`
    }));

    return {
      book,
      chapter,
      verses,
      reference: `${book} ${chapter}`,
      source: 'Bible-API.com',
      fetchedAt: new Date().toISOString()
    };
  }

  // Get available translations from Bible-API.com
  async getAvailableTranslations(): Promise<string[]> {
    try {
      const response = await fetch('https://bible-api.com/books');
      if (!response.ok) {
        return ['kjv', 'asv', 'web', 'ylt']; // Fallback list
      }

      const data = await response.json();
      // Bible-API.com doesn't have a specific endpoint for translations,
      // so we'll return the known supported ones
      return ['kjv', 'asv', 'web', 'ylt', 'bbe', 'webster'];
    } catch (error) {
      console.error('Error fetching available translations:', error);
      return ['kjv', 'asv', 'web', 'ylt']; // Fallback list
    }
  }

  // Search functionality
  async search(query: string, translation: string = 'kjv'): Promise<any[]> {
    const url = `https://bible-api.com/search?query=${encodeURIComponent(query)}&translation=${translation}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Search failed: HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.verses || [];
    } catch (error) {
      console.error('Error searching Bible-API.com:', error);
      return [];
    }
  }

  private notifyProgress(progress: ModuleDownloadProgress, callback?: (progress: ModuleDownloadProgress) => void): void {
    if (callback) {
      callback(progress);
    }
  }
}

export default BibleAPISource;