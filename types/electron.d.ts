// Electron API types for TypeScript
export interface ElectronAPI {
  platform: string;
  filesystem: {
    saveModuleData: (moduleId: string, data: any) => Promise<{ success: boolean; path?: string; error?: string }>;
    loadModuleData: (moduleId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    deleteModuleData: (moduleId: string) => Promise<{ success: boolean; error?: string }>;
    listInstalledModules: () => Promise<{ success: boolean; modules?: string[]; error?: string }>;
    getModulesDirectory: () => Promise<string>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}