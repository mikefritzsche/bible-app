import FileSystemStorage from './FileSystemStorage';
import WebStorage from './WebStorage';

export class HybridStorage {
  private fileSystemStorage: FileSystemStorage;
  private webStorage: WebStorage;

  constructor() {
    this.fileSystemStorage = new FileSystemStorage();
    this.webStorage = new WebStorage();
  }

  async saveModuleData(moduleId: string, data: any): Promise<void> {
    if (this.fileSystemStorage.isAvailable()) {
      await this.fileSystemStorage.saveModuleData(moduleId, data);
    } else if (this.webStorage.isAvailable()) {
      await this.webStorage.saveModuleData(moduleId, data);
    } else {
      throw new Error('No storage backend available');
    }
  }

  async loadModuleData(moduleId: string): Promise<any> {
    if (this.fileSystemStorage.isAvailable()) {
      try {
        return await this.fileSystemStorage.loadModuleData(moduleId);
      } catch (error) {
        console.warn(`Filesystem storage failed for ${moduleId}, trying web storage:`, error);
      }
    }

    if (this.webStorage.isAvailable()) {
      return await this.webStorage.loadModuleData(moduleId);
    }

    throw new Error('No storage backend available');
  }

  async deleteModuleData(moduleId: string): Promise<void> {
    if (this.fileSystemStorage.isAvailable()) {
      await this.fileSystemStorage.deleteModuleData(moduleId);
    } else if (this.webStorage.isAvailable()) {
      await this.webStorage.deleteModuleData(moduleId);
    } else {
      throw new Error('No storage backend available');
    }
  }

  async listInstalledModules(): Promise<string[]> {
    if (this.fileSystemStorage.isAvailable()) {
      try {
        return await this.fileSystemStorage.listInstalledModules();
      } catch (error) {
        console.warn('Filesystem storage failed for listing modules, trying web storage:', error);
      }
    }

    if (this.webStorage.isAvailable()) {
      return await this.webStorage.listInstalledModules();
    }

    throw new Error('No storage backend available');
  }

  async getModulesDirectory(): Promise<string> {
    if (this.fileSystemStorage.isAvailable()) {
      return await this.fileSystemStorage.getModulesDirectory();
    } else if (this.webStorage.isAvailable()) {
      return await this.webStorage.getModulesDirectory();
    } else {
      return 'No storage available';
    }
  }

  isAvailable(): boolean {
    return this.fileSystemStorage.isAvailable() || this.webStorage.isAvailable();
  }
}

export default HybridStorage;