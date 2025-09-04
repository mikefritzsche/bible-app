import { CloudSyncAdapter, SyncData, SyncResult, SyncConflict } from './CloudSyncManager'

declare global {
  interface Window {
    gapi: any
    google: any
  }
}

export class GoogleDriveAdapter implements CloudSyncAdapter {
  name = 'Google Drive'
  isAuthenticated = false
  
  private clientId: string
  private apiKey: string
  private accessToken: string | null = null
  private tokenClient: any = null
  private gapiInitialized = false
  private gisInitialized = false
  
  private readonly SCOPES = 'https://www.googleapis.com/auth/drive.appdata'
  private readonly DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
  private readonly DATA_FILENAME = 'bible-app-sync-data.json'
  
  constructor(clientId: string, apiKey: string) {
    this.clientId = clientId
    this.apiKey = apiKey
    if (typeof window !== 'undefined') {
      this.loadStoredToken()
    }
  }
  
  private loadStoredToken(): void {
    if (typeof window === 'undefined') return
    
    const stored = localStorage.getItem('google-drive-token')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        if (data.accessToken && data.expires > Date.now()) {
          this.accessToken = data.accessToken
          this.isAuthenticated = true
        }
      } catch (e) {
        localStorage.removeItem('google-drive-token')
      }
    }
  }
  
  private saveToken(token: string): void {
    if (typeof window === 'undefined') return
    
    const data = {
      accessToken: token,
      expires: Date.now() + (3600 * 1000) // 1 hour
    }
    localStorage.setItem('google-drive-token', JSON.stringify(data))
  }
  
  async initialize(): Promise<void> {
    // Load the Google API scripts if not already loaded
    if (!window.gapi) {
      await this.loadScript('https://apis.google.com/js/api.js')
    }
    
    if (!window.google) {
      await this.loadScript('https://accounts.google.com/gsi/client')
    }
    
    // Initialize GAPI
    await new Promise<void>((resolve) => {
      window.gapi.load('client', async () => {
        await window.gapi.client.init({
          apiKey: this.apiKey,
          discoveryDocs: [this.DISCOVERY_DOC],
        })
        this.gapiInitialized = true
        resolve()
      })
    })
    
    // Initialize Google Identity Services
    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: this.clientId,
      scope: this.SCOPES,
      callback: (response: any) => {
        if (response.access_token) {
          this.accessToken = response.access_token
          this.isAuthenticated = true
          this.saveToken(response.access_token)
          window.gapi.client.setToken({ access_token: response.access_token })
        }
      },
    })
    this.gisInitialized = true
  }
  
  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
  
  async authenticate(): Promise<boolean> {
    try {
      if (!this.gapiInitialized || !this.gisInitialized) {
        await this.initialize()
      }
      
      // If we have a valid token, set it and return
      if (this.accessToken) {
        window.gapi.client.setToken({ access_token: this.accessToken })
        this.isAuthenticated = true
        return true
      }
      
      // Otherwise, request a new token
      return new Promise((resolve) => {
        const originalCallback = this.tokenClient.callback
        this.tokenClient.callback = (response: any) => {
          originalCallback(response)
          resolve(!!response.access_token)
        }
        
        this.tokenClient.requestAccessToken({ prompt: '' })
      })
    } catch (error) {
      console.error('Authentication failed:', error)
      return false
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.accessToken && typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(this.accessToken)
    }
    
    this.accessToken = null
    this.isAuthenticated = false
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('google-drive-token')
      
      if (window.gapi?.client) {
        window.gapi.client.setToken(null)
      }
    }
  }
  
  async saveData(data: SyncData): Promise<SyncResult> {
    if (!this.isAuthenticated) {
      return {
        success: false,
        message: 'Not authenticated'
      }
    }
    
    try {
      // Check if file exists
      const fileId = await this.findDataFile()
      
      const boundary = '-------314159265358979323846'
      const delimiter = "\r\n--" + boundary + "\r\n"
      const closeDelim = "\r\n--" + boundary + "--"
      
      const metadata = {
        name: this.DATA_FILENAME,
        mimeType: 'application/json',
        parents: fileId ? undefined : ['appDataFolder']
      }
      
      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(data, null, 2) +
        closeDelim
      
      const request = window.gapi.client.request({
        path: fileId 
          ? `/drive/v3/files/${fileId}`
          : '/drive/v3/files',
        method: fileId ? 'PATCH' : 'POST',
        params: {
          uploadType: 'multipart'
        },
        headers: {
          'Content-Type': 'multipart/related; boundary="' + boundary + '"'
        },
        body: multipartRequestBody
      })
      
      await request
      
      return {
        success: true,
        message: 'Data synced successfully',
        lastSynced: new Date()
      }
    } catch (error) {
      console.error('Save failed:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save data'
      }
    }
  }
  
  async loadData(): Promise<SyncData | null> {
    if (!this.isAuthenticated) {
      return null
    }
    
    try {
      const fileId = await this.findDataFile()
      
      if (!fileId) {
        return null
      }
      
      const response = await window.gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
      })
      
      return response.result as SyncData
    } catch (error) {
      console.error('Load failed:', error)
      return null
    }
  }
  
  private async findDataFile(): Promise<string | null> {
    try {
      const response = await window.gapi.client.drive.files.list({
        spaces: 'appDataFolder',
        fields: 'files(id, name)',
        q: `name='${this.DATA_FILENAME}'`
      })
      
      if (response.result.files && response.result.files.length > 0) {
        return response.result.files[0].id
      }
      
      return null
    } catch (error) {
      console.error('Find file failed:', error)
      return null
    }
  }
  
  async resolveConflict(conflict: SyncConflict, resolution: 'local' | 'remote' | 'merge'): Promise<void> {
    // Implementation would depend on your conflict resolution strategy
    // For now, we'll use the simple approach from CloudSyncManager
    console.log('Resolving conflict:', conflict, 'with resolution:', resolution)
  }
  
  async getLastSyncTime(): Promise<Date | null> {
    const data = await this.loadData()
    if (data?.lastSynced) {
      return new Date(data.lastSynced)
    }
    return null
  }
  
  isAvailable(): boolean {
    // Google Drive API works in all modern browsers
    return typeof window !== 'undefined'
  }
}

// Factory function for easy setup
export function createGoogleDriveAdapter(clientId: string, apiKey: string): GoogleDriveAdapter {
  return new GoogleDriveAdapter(clientId, apiKey)
}