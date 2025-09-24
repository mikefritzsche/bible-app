export class FileSystemStorage {
  private isElectron: boolean;

  constructor() {
    this.isElectron = typeof window !== 'undefined' && !!window.electronAPI;
  }

  async saveModuleData(moduleId: string, data: any): Promise<void> {
    if (!this.isElectron) {
      throw new Error('Filesystem storage is only available in Electron environment');
    }

    const result = await window.electronAPI.filesystem.saveModuleData(moduleId, data);
    if (!result.success) {
      throw new Error(`Failed to save module data: ${result.error}`);
    }
  }

  async loadModuleData(moduleId: string): Promise<any> {
    if (!this.isElectron) {
      throw new Error('Filesystem storage is only available in Electron environment');
    }

    const result = await window.electronAPI.filesystem.loadModuleData(moduleId);
    if (!result.success) {
      throw new Error(`Failed to load module data: ${result.error}`);
    }

    return result.data;
  }

  async deleteModuleData(moduleId: string): Promise<void> {
    if (!this.isElectron) {
      throw new Error('Filesystem storage is only available in Electron environment');
    }

    const result = await window.electronAPI.filesystem.deleteModuleData(moduleId);
    if (!result.success) {
      throw new Error(`Failed to delete module data: ${result.error}`);
    }
  }

  async listInstalledModules(): Promise<string[]> {
    if (!this.isElectron) {
      throw new Error('Filesystem storage is only available in Electron environment');
    }

    const result = await window.electronAPI.filesystem.listInstalledModules();
    if (!result.success) {
      throw new Error(`Failed to list installed modules: ${result.error}`);
    }

    return result.modules || [];
  }

  async getModulesDirectory(): Promise<string> {
    if (!this.isElectron) {
      throw new Error('Filesystem storage is only available in Electron environment');
    }

    return await window.electronAPI.filesystem.getModulesDirectory();
  }

  isAvailable(): boolean {
    return this.isElectron;
  }
}

export default FileSystemStorage;