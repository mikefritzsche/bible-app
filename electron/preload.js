const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // Filesystem operations for Bible modules
  filesystem: {
    saveModuleData: (moduleId, data) => ipcRenderer.invoke('save-module-data', moduleId, data),
    loadModuleData: (moduleId) => ipcRenderer.invoke('load-module-data', moduleId),
    deleteModuleData: (moduleId) => ipcRenderer.invoke('delete-module-data', moduleId),
    listInstalledModules: () => ipcRenderer.invoke('list-installed-modules'),
    getModulesDirectory: () => ipcRenderer.invoke('get-modules-directory')
  }
});