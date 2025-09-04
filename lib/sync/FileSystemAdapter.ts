import { CloudSyncAdapter, SyncData, SyncResult, SyncConflict } from './CloudSyncManager'

export class FileSystemAdapter implements CloudSyncAdapter {
  name = 'Local Cloud Folder'
  isAuthenticated = false
  
  private directoryHandle: FileSystemDirectoryHandle | null = null
  private readonly DATA_FILENAME = 'bible-app-sync-data.json'
  private readonly BACKUP_FILENAME = 'bible-app-sync-backup.json'
  
  async authenticate(): Promise<boolean> {
    try {
      // Show folder picker - user can choose iCloud Drive, Dropbox, Google Drive local folder, etc.
      this.directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      })
      
      // Store permission for future use
      if (this.directoryHandle) {
        await this.storeDirectoryPermission()
        this.isAuthenticated = true
        return true
      }
      
      return false
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('User cancelled folder selection')
      } else {
        console.error('Failed to access folder:', error)
      }
      return false
    }
  }
  
  private async storeDirectoryPermission(): Promise<void> {
    // Store the handle in IndexedDB so we can request permission again later
    const db = await this.openPermissionDB()
    const transaction = db.transaction(['handles'], 'readwrite')
    const store = transaction.objectStore('handles')
    
    await store.put({
      id: 'bible-app-sync-folder',
      handle: this.directoryHandle
    })
  }
  
  private async openPermissionDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FileSystemPermissions', 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('handles')) {
          db.createObjectStore('handles', { keyPath: 'id' })
        }
      }
    })
  }
  
  async tryRestorePermission(): Promise<boolean> {
    try {
      const db = await this.openPermissionDB()
      const transaction = db.transaction(['handles'], 'readonly')
      const store = transaction.objectStore('handles')
      
      const result = await new Promise<any>((resolve, reject) => {
        const request = store.get('bible-app-sync-folder')
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      
      if (result?.handle) {
        // Request permission to access the stored handle
        const permission = await result.handle.requestPermission({ mode: 'readwrite' })
        
        if (permission === 'granted') {
          this.directoryHandle = result.handle
          this.isAuthenticated = true
          return true
        }
      }
    } catch (error) {
      console.log('Could not restore folder permission:', error)
    }
    
    return false
  }
  
  async disconnect(): Promise<void> {
    this.directoryHandle = null
    this.isAuthenticated = false
    
    // Clear stored permission
    try {
      const db = await this.openPermissionDB()
      const transaction = db.transaction(['handles'], 'readwrite')
      const store = transaction.objectStore('handles')
      await store.delete('bible-app-sync-folder')
    } catch (error) {
      console.error('Failed to clear stored permission:', error)
    }
  }
  
  async saveData(data: SyncData): Promise<SyncResult> {
    if (!this.directoryHandle) {
      return {
        success: false,
        message: 'No folder selected'
      }
    }
    
    try {
      // Create backup of existing data if it exists
      await this.createBackup()
      
      // Write new data
      const fileHandle = await this.directoryHandle.getFileHandle(
        this.DATA_FILENAME,
        { create: true }
      )
      
      const writable = await fileHandle.createWritable()
      await writable.write(JSON.stringify(data, null, 2))
      await writable.close()
      
      return {
        success: true,
        message: 'Data saved successfully',
        lastSynced: new Date()
      }
    } catch (error) {
      console.error('Save failed:', error)
      
      // Try to restore from backup
      await this.restoreFromBackup()
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save data'
      }
    }
  }
  
  async loadData(): Promise<SyncData | null> {
    if (!this.directoryHandle) {
      return null
    }
    
    try {
      const fileHandle = await this.directoryHandle.getFileHandle(this.DATA_FILENAME)
      const file = await fileHandle.getFile()
      const text = await file.text()
      
      return JSON.parse(text) as SyncData
    } catch (error) {
      if ((error as Error).name === 'NotFoundError') {
        // File doesn't exist yet, that's okay
        return null
      }
      
      console.error('Load failed:', error)
      return null
    }
  }
  
  private async createBackup(): Promise<void> {
    if (!this.directoryHandle) return
    
    try {
      // Check if main file exists
      const existingData = await this.loadData()
      if (!existingData) return
      
      // Create backup
      const backupHandle = await this.directoryHandle.getFileHandle(
        this.BACKUP_FILENAME,
        { create: true }
      )
      
      const writable = await backupHandle.createWritable()
      await writable.write(JSON.stringify(existingData, null, 2))
      await writable.close()
    } catch (error) {
      console.warn('Backup creation failed:', error)
    }
  }
  
  private async restoreFromBackup(): Promise<boolean> {
    if (!this.directoryHandle) return false
    
    try {
      const backupHandle = await this.directoryHandle.getFileHandle(this.BACKUP_FILENAME)
      const backupFile = await backupHandle.getFile()
      const backupText = await backupFile.text()
      
      // Restore main file from backup
      const fileHandle = await this.directoryHandle.getFileHandle(
        this.DATA_FILENAME,
        { create: true }
      )
      
      const writable = await fileHandle.createWritable()
      await writable.write(backupText)
      await writable.close()
      
      return true
    } catch (error) {
      console.error('Restore from backup failed:', error)
      return false
    }
  }
  
  async resolveConflict(conflict: SyncConflict, resolution: 'local' | 'remote' | 'merge'): Promise<void> {
    // For file system, conflicts are handled at the file level
    // The user would need to manually resolve conflicts in their cloud service
    console.log('Conflict resolution for file system:', conflict, resolution)
  }
  
  async getLastSyncTime(): Promise<Date | null> {
    if (!this.directoryHandle) return null
    
    try {
      const fileHandle = await this.directoryHandle.getFileHandle(this.DATA_FILENAME)
      const file = await fileHandle.getFile()
      
      // Use file modification time
      return new Date(file.lastModified)
    } catch (error) {
      return null
    }
  }
  
  isAvailable(): boolean {
    // Check if File System Access API is available
    return typeof window !== 'undefined' && 
           'showDirectoryPicker' in window &&
           'FileSystemDirectoryHandle' in window
  }
  
  getFolderName(): string | null {
    return this.directoryHandle?.name || null
  }
  
  async getStorageInfo(): Promise<{ used: number; quota: number } | null> {
    if (!this.directoryHandle) return null
    
    try {
      // Get size of our sync file
      const fileHandle = await this.directoryHandle.getFileHandle(this.DATA_FILENAME)
      const file = await fileHandle.getFile()
      
      return {
        used: file.size,
        quota: -1 // Quota depends on the cloud service being used
      }
    } catch (error) {
      return { used: 0, quota: -1 }
    }
  }
}

// Factory function for easy setup
export function createFileSystemAdapter(): FileSystemAdapter {
  return new FileSystemAdapter()
}