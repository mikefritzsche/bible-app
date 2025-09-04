'use client'

import { useState } from 'react'
import { cloudSyncManager } from '@/lib/sync/CloudSyncManager'
import { createGoogleDriveAdapter } from '@/lib/sync/GoogleDriveAdapter'
import { createFileSystemAdapter } from '@/lib/sync/FileSystemAdapter'

export default function SyncDebugPage() {
  const [syncData, setSyncData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSyncData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Initialize adapters if not already done
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ''
      
      // First check if we already have adapters registered
      let adapter = cloudSyncManager.getCurrentAdapter()
      
      // If no adapter, register them
      if (!adapter) {
        if (clientId && apiKey) {
          const googleDriveAdapter = createGoogleDriveAdapter(clientId, apiKey)
          cloudSyncManager.registerAdapter(googleDriveAdapter)
          
          // Check if Google Drive has stored token
          if (googleDriveAdapter.isAuthenticated) {
            await cloudSyncManager.setAdapter('Google Drive')
            await googleDriveAdapter.initialize()
            adapter = googleDriveAdapter
          }
        }
        
        if (!adapter) {
          const fileSystemAdapter = createFileSystemAdapter()
          cloudSyncManager.registerAdapter(fileSystemAdapter)
          
          // Check if FileSystem adapter has permission
          if (await fileSystemAdapter.tryRestorePermission()) {
            await cloudSyncManager.setAdapter('Local Cloud Folder')
            adapter = fileSystemAdapter
          }
        }
      }
      
      if (!adapter) {
        setError('No sync adapter configured. Please go to /sync-demo and set up sync first.')
        return
      }
      
      // Initialize Google Drive adapter if needed
      if (adapter.name === 'Google Drive') {
        const googleAdapter = adapter as any
        if (!googleAdapter.gapiInitialized) {
          await googleAdapter.initialize()
        }
      }
      
      if (!adapter.isAuthenticated) {
        setError('Not authenticated. Please go to /sync-demo and connect to a sync service.')
        return
      }
      
      // Load the data
      const data = await adapter.loadData()
      
      if (!data) {
        setError('No sync data found in the cloud. Try syncing some data first.')
        return
      }
      
      // Also get file metadata for Google Drive
      if (adapter.name === 'Google Drive' && (window as any).gapi?.client?.drive) {
        try {
          const response = await (window as any).gapi.client.drive.files.list({
            spaces: 'appDataFolder',
            fields: 'files(id, name, size, modifiedTime)',
          })
          
          if (response.result.files && response.result.files.length > 0) {
            console.log('Google Drive file info:', response.result.files[0])
          }
        } catch (e) {
          console.log('Could not fetch file metadata:', e)
        }
      }
      
      setSyncData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sync data')
      console.error('Debug error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Sync Data Debug View</h1>
      
      <div className="mb-6">
        <button
          onClick={loadSyncData}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load Sync Data'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {syncData && (
        <div className="space-y-6">
          {/* Metadata */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Sync Metadata</h2>
            <div className="text-sm space-y-1">
              <div>
                <strong>Last Synced:</strong> {syncData.lastSynced ? formatDate(syncData.lastSynced) : 'Never'}
              </div>
              <div>
                <strong>Version:</strong> {syncData.version || '1.0.0'}
              </div>
            </div>
          </div>
          
          {/* Highlights */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-3">
              Highlights ({Object.keys(syncData.highlights || {}).length} verses)
            </h2>
            <div className="max-h-64 overflow-y-auto">
              <pre className="text-xs bg-gray-50 dark:bg-gray-950 p-2 rounded overflow-x-auto">
                {JSON.stringify(syncData.highlights, null, 2)}
              </pre>
            </div>
          </div>
          
          {/* Notes */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-3">
              Notes ({Object.keys(syncData.notes || {}).length} verses)
            </h2>
            <div className="max-h-64 overflow-y-auto">
              <pre className="text-xs bg-gray-50 dark:bg-gray-950 p-2 rounded overflow-x-auto">
                {JSON.stringify(syncData.notes, null, 2)}
              </pre>
            </div>
          </div>
          
          {/* Verse History */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-3">
              Verse History ({(syncData.verseHistory || []).length} entries)
            </h2>
            <div className="max-h-64 overflow-y-auto">
              {syncData.verseHistory && syncData.verseHistory.length > 0 ? (
                <div className="space-y-2">
                  {syncData.verseHistory.slice(0, 10).map((entry: any, index: number) => (
                    <div key={index} className="text-sm p-2 bg-gray-50 dark:bg-gray-950 rounded">
                      <div className="font-semibold">{entry.reference}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {entry.verseText?.substring(0, 100)}...
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {formatDate(entry.timestamp)}
                      </div>
                    </div>
                  ))}
                  {syncData.verseHistory.length > 10 && (
                    <div className="text-sm text-gray-500">
                      ... and {syncData.verseHistory.length - 10} more entries
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No verse history</div>
              )}
            </div>
          </div>
          
          {/* Reading Progress */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-3">
              Reading Progress ({(syncData.readingProgress || []).length} days)
            </h2>
            <div className="max-h-64 overflow-y-auto">
              <pre className="text-xs bg-gray-50 dark:bg-gray-950 p-2 rounded overflow-x-auto">
                {JSON.stringify(syncData.readingProgress, null, 2)}
              </pre>
            </div>
          </div>
          
          {/* Raw Data */}
          <details className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <summary className="cursor-pointer font-semibold">View Raw JSON Data</summary>
            <div className="mt-4 max-h-96 overflow-y-auto">
              <pre className="text-xs bg-white dark:bg-gray-900 p-4 rounded overflow-x-auto">
                {JSON.stringify(syncData, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}