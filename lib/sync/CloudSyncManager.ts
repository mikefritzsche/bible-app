export interface SyncData {
  highlights: any[]
  notes: any[]
  verseHistory: any[]
  readingProgress: any[]
  lastSynced: string
  deviceId: string
  version: string
}

export interface SyncResult {
  success: boolean
  message: string
  conflicts?: SyncConflict[]
  lastSynced?: Date
}

export interface SyncConflict {
  type: 'highlights' | 'notes' | 'verseHistory' | 'readingProgress'
  localData: any
  remoteData: any
  localTimestamp: Date
  remoteTimestamp: Date
}

export interface CloudSyncAdapter {
  name: string
  isAuthenticated: boolean
  
  authenticate(): Promise<boolean>
  disconnect(): Promise<void>
  
  saveData(data: SyncData): Promise<SyncResult>
  loadData(): Promise<SyncData | null>
  
  resolveConflict(conflict: SyncConflict, resolution: 'local' | 'remote' | 'merge'): Promise<void>
  
  getLastSyncTime(): Promise<Date | null>
  isAvailable(): boolean
}

export class CloudSyncManager {
  private adapters: Map<string, CloudSyncAdapter> = new Map()
  private currentAdapter: CloudSyncAdapter | null = null
  private syncInProgress = false
  private deviceId: string
  
  constructor() {
    this.deviceId = this.getOrCreateDeviceId()
  }
  
  private getOrCreateDeviceId(): string {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      return 'server-device-id'
    }
    
    let deviceId = localStorage.getItem('bible-app-device-id')
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(2)}`
      localStorage.setItem('bible-app-device-id', deviceId)
    }
    return deviceId
  }
  
  registerAdapter(adapter: CloudSyncAdapter): void {
    this.adapters.set(adapter.name, adapter)
  }
  
  async setAdapter(name: string): Promise<boolean> {
    const adapter = this.adapters.get(name)
    if (!adapter) {
      throw new Error(`Adapter ${name} not found`)
    }
    
    if (!adapter.isAvailable()) {
      throw new Error(`Adapter ${name} is not available in this environment`)
    }
    
    this.currentAdapter = adapter
    return true
  }
  
  async authenticate(): Promise<boolean> {
    if (!this.currentAdapter) {
      throw new Error('No sync adapter selected')
    }
    
    return await this.currentAdapter.authenticate()
  }
  
  async disconnect(): Promise<void> {
    if (this.currentAdapter) {
      await this.currentAdapter.disconnect()
      this.currentAdapter = null
    }
  }
  
  async sync(
    localData: Omit<SyncData, 'lastSynced' | 'deviceId' | 'version'>
  ): Promise<SyncResult> {
    if (!this.currentAdapter) {
      return {
        success: false,
        message: 'No sync adapter selected'
      }
    }
    
    if (!this.currentAdapter.isAuthenticated) {
      return {
        success: false,
        message: 'Not authenticated'
      }
    }
    
    if (this.syncInProgress) {
      return {
        success: false,
        message: 'Sync already in progress'
      }
    }
    
    this.syncInProgress = true
    
    try {
      // Prepare data for sync
      const syncData: SyncData = {
        ...localData,
        lastSynced: new Date().toISOString(),
        deviceId: this.deviceId,
        version: '1.0.0'
      }
      
      // Load remote data to check for conflicts
      const remoteData = await this.currentAdapter.loadData()
      
      if (remoteData) {
        // Check for conflicts
        const conflicts = this.detectConflicts(syncData, remoteData)
        
        if (conflicts.length > 0) {
          return {
            success: false,
            message: 'Conflicts detected',
            conflicts
          }
        }
        
        // Merge data if no conflicts
        const mergedData = this.mergeData(syncData, remoteData)
        const result = await this.currentAdapter.saveData(mergedData)
        
        return {
          ...result,
          lastSynced: new Date()
        }
      } else {
        // No remote data, just save
        const result = await this.currentAdapter.saveData(syncData)
        
        return {
          ...result,
          lastSynced: new Date()
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Sync failed'
      }
    } finally {
      this.syncInProgress = false
    }
  }
  
  private detectConflicts(local: SyncData, remote: SyncData): SyncConflict[] {
    const conflicts: SyncConflict[] = []
    
    // Simple conflict detection based on timestamps
    // In production, you'd want more sophisticated detection
    if (local.deviceId !== remote.deviceId) {
      const localTime = new Date(local.lastSynced)
      const remoteTime = new Date(remote.lastSynced)
      
      // If both were modified recently (within 1 hour), flag as conflict
      const timeDiff = Math.abs(localTime.getTime() - remoteTime.getTime())
      if (timeDiff < 3600000) { // 1 hour
        // Check each data type for differences
        if (JSON.stringify(local.highlights) !== JSON.stringify(remote.highlights)) {
          conflicts.push({
            type: 'highlights',
            localData: local.highlights,
            remoteData: remote.highlights,
            localTimestamp: localTime,
            remoteTimestamp: remoteTime
          })
        }
        
        if (JSON.stringify(local.notes) !== JSON.stringify(remote.notes)) {
          conflicts.push({
            type: 'notes',
            localData: local.notes,
            remoteData: remote.notes,
            localTimestamp: localTime,
            remoteTimestamp: remoteTime
          })
        }
      }
    }
    
    return conflicts
  }
  
  private mergeData(local: SyncData, remote: SyncData): SyncData {
    // Simple last-write-wins merge strategy
    // In production, you'd want more sophisticated merging
    const localTime = new Date(local.lastSynced).getTime()
    const remoteTime = new Date(remote.lastSynced).getTime()
    
    if (localTime > remoteTime) {
      return local
    } else {
      // Preserve local device ID but take remote data
      return {
        ...remote,
        deviceId: this.deviceId,
        lastSynced: new Date().toISOString()
      }
    }
  }
  
  async getLastSyncTime(): Promise<Date | null> {
    if (!this.currentAdapter) {
      return null
    }
    
    return await this.currentAdapter.getLastSyncTime()
  }
  
  getCurrentAdapter(): CloudSyncAdapter | null {
    return this.currentAdapter
  }
  
  getAvailableAdapters(): string[] {
    return Array.from(this.adapters.keys()).filter(name => {
      const adapter = this.adapters.get(name)
      return adapter && adapter.isAvailable()
    })
  }
}

export const cloudSyncManager = new CloudSyncManager()