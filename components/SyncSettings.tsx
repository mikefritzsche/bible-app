'use client'

import { useState, useEffect } from 'react'
import { cloudSyncManager } from '@/lib/sync/CloudSyncManager'
import { createGoogleDriveAdapter } from '@/lib/sync/GoogleDriveAdapter'
import { createFileSystemAdapter } from '@/lib/sync/FileSystemAdapter'
import { HighlightManager } from '@/lib/HighlightManager'
import { NotesManager } from '@/lib/NotesManager'
import { VerseHistoryManager } from '@/lib/VerseHistoryManager'
import { ReadingPlanManager } from '@/lib/ReadingPlanManager'

interface SyncSettingsProps {
  onClose?: () => void
}

export default function SyncSettings({ onClose }: SyncSettingsProps) {
  const [selectedAdapter, setSelectedAdapter] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState<string>('')
  const [availableAdapters, setAvailableAdapters] = useState<string[]>([])
  const [folderName, setFolderName] = useState<string | null>(null)

  useEffect(() => {
    initializeAdapters()
  }, [])

  const initializeAdapters = async () => {
    // Register Google Drive adapter using environment variables
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ''
    
    if (clientId && apiKey) {
      const googleDriveAdapter = createGoogleDriveAdapter(clientId, apiKey)
      cloudSyncManager.registerAdapter(googleDriveAdapter)
    } else {
      console.warn('Google Drive credentials not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_API_KEY to .env.local')
    }

    // Register File System adapter for iCloud Drive and other local folders
    const fileSystemAdapter = createFileSystemAdapter()
    cloudSyncManager.registerAdapter(fileSystemAdapter)

    // Try to restore File System adapter permission
    if (fileSystemAdapter.isAvailable()) {
      const restored = await fileSystemAdapter.tryRestorePermission()
      if (restored) {
        await cloudSyncManager.setAdapter('Local Cloud Folder')
        setSelectedAdapter('Local Cloud Folder')
        setIsAuthenticated(true)
        setFolderName(fileSystemAdapter.getFolderName())
        const lastSync = await cloudSyncManager.getLastSyncTime()
        setLastSyncTime(lastSync)
      }
    }

    // Get available adapters
    const available = cloudSyncManager.getAvailableAdapters()
    setAvailableAdapters(available)
  }

  const handleAdapterSelect = async (adapterName: string) => {
    try {
      await cloudSyncManager.setAdapter(adapterName)
      setSelectedAdapter(adapterName)
      setSyncStatus('')
      
      // Initialize the adapter if it's Google Drive
      const adapter = cloudSyncManager.getCurrentAdapter()
      if (adapter && adapterName === 'Google Drive') {
        const googleAdapter = adapter as any
        await googleAdapter.initialize()
      }
      
      // Check if already authenticated (e.g., stored token)
      if (adapter?.isAuthenticated) {
        setIsAuthenticated(true)
        const lastSync = await cloudSyncManager.getLastSyncTime()
        setLastSyncTime(lastSync)
      } else {
        setIsAuthenticated(false)
        setLastSyncTime(null)
      }
    } catch (error) {
      setSyncStatus(`Error: ${(error as Error).message}`)
    }
  }

  const handleAuthenticate = async () => {
    if (!selectedAdapter) return

    try {
      setSyncStatus('Authenticating...')
      const success = await cloudSyncManager.authenticate()
      
      if (success) {
        setIsAuthenticated(true)
        setSyncStatus('Authentication successful!')
        
        // For File System adapter, show the selected folder name
        const adapter = cloudSyncManager.getCurrentAdapter()
        if (adapter?.name === 'Local Cloud Folder') {
          const fsAdapter = adapter as any
          setFolderName(fsAdapter.getFolderName())
        }
        
        // Check last sync time
        const lastSync = await cloudSyncManager.getLastSyncTime()
        setLastSyncTime(lastSync)
      } else {
        setSyncStatus('Authentication failed')
      }
    } catch (error) {
      setSyncStatus(`Authentication error: ${(error as Error).message}`)
    }
  }

  const handleSync = async () => {
    if (!isAuthenticated) return

    try {
      setIsSyncing(true)
      setSyncStatus('Preparing data...')

      // Gather all data from managers
      const highlightManager = new HighlightManager()
      const notesManager = new NotesManager()
      const historyManager = new VerseHistoryManager()
      const readingPlanManager = new ReadingPlanManager()

      await highlightManager.init()
      await notesManager.init()
      await historyManager.init()
      await readingPlanManager.init()

      const highlights = await highlightManager.getAllHighlights()
      const notes = await notesManager.getAllNotes()
      const history = await historyManager.getHistory()
      const readingProgress = await readingPlanManager.getAllProgress()

      setSyncStatus('Syncing...')
      
      const result = await cloudSyncManager.sync({
        highlights,
        notes,
        verseHistory: history,
        readingProgress
      })

      if (result.success) {
        setSyncStatus('Sync successful!')
        setLastSyncTime(result.lastSynced || null)
      } else if (result.conflicts && result.conflicts.length > 0) {
        setSyncStatus(`Sync conflicts detected: ${result.conflicts.length} conflicts need resolution`)
        // In a real app, you'd show a conflict resolution UI here
      } else {
        setSyncStatus(`Sync failed: ${result.message}`)
      }
    } catch (error) {
      setSyncStatus(`Sync error: ${(error as Error).message}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    await cloudSyncManager.disconnect()
    setSelectedAdapter(null)
    setIsAuthenticated(false)
    setLastSyncTime(null)
    setFolderName(null)
    setSyncStatus('Disconnected')
  }

  const handleRestore = async () => {
    if (!isAuthenticated) return

    try {
      setIsSyncing(true)
      setSyncStatus('Loading remote data...')

      const adapter = cloudSyncManager.getCurrentAdapter()
      if (!adapter) {
        setSyncStatus('No adapter selected')
        return
      }

      const remoteData = await adapter.loadData()
      if (!remoteData) {
        setSyncStatus('No remote data found')
        return
      }

      setSyncStatus('Restoring data...')

      // Restore data to managers
      const highlightManager = new HighlightManager()
      const notesManager = new NotesManager()
      const historyManager = new VerseHistoryManager()
      const readingPlanManager = new ReadingPlanManager()

      await highlightManager.init()
      await notesManager.init()
      await historyManager.init()
      await readingPlanManager.init()

      // Clear existing data and import remote data
      await highlightManager.clearAllHighlights()
      await highlightManager.importHighlights(JSON.stringify(remoteData.highlights))

      await notesManager.clearAllNotes()
      await notesManager.importNotes(JSON.stringify(remoteData.notes))

      await historyManager.clearHistory()
      for (const entry of remoteData.verseHistory) {
        await historyManager.addToHistory({
          book: entry.book,
          chapter: entry.chapter,
          verse: entry.verse,
          verseText: entry.verseText,
          version: entry.version,
          reference: entry.reference
        })
      }

      // Restore reading progress
      for (const progress of remoteData.readingProgress) {
        await readingPlanManager.markAsRead(
          progress.date,
          progress.psalmCompleted && progress.proverbsCompleted ? 'both' :
          progress.psalmCompleted ? 'psalm' : 'proverbs'
        )
      }

      setSyncStatus('Data restored successfully!')
      window.location.reload() // Refresh to show new data
    } catch (error) {
      setSyncStatus(`Restore error: ${(error as Error).message}`)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Sync Settings</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Adapter Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Choose Sync Method</h3>
          <div className="space-y-2">
            {availableAdapters.map((adapter) => (
              <button
                key={adapter}
                onClick={() => handleAdapterSelect(adapter)}
                className={`w-full text-left p-3 rounded-lg border ${
                  selectedAdapter === adapter
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="font-medium">{adapter}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {adapter === 'Google Drive' && 'Sync with Google Drive (app data)'}
                  {adapter === 'Local Cloud Folder' && 'Use iCloud Drive, Dropbox, or OneDrive folder'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Authentication Status */}
        {selectedAdapter && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Connection Status</h3>
              {isAuthenticated && (
                <span className="text-sm text-green-600 dark:text-green-400">
                  ● Connected
                </span>
              )}
            </div>
            
            {!isAuthenticated ? (
              <button
                onClick={handleAuthenticate}
                className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
              >
                Connect to {selectedAdapter}
              </button>
            ) : (
              <div className="space-y-3">
                {folderName && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Folder: {folderName}
                  </div>
                )}
                
                {lastSyncTime && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Last sync: {lastSyncTime.toLocaleString()}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex-1 bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </button>
                  
                  <button
                    onClick={handleRestore}
                    disabled={isSyncing}
                    className="flex-1 bg-purple-600 text-white rounded-lg px-4 py-2 hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    Restore from Cloud
                  </button>
                </div>
                
                <button
                  onClick={handleDisconnect}
                  className="w-full bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-700 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        )}

        {/* Status Messages */}
        {syncStatus && (
          <div className={`p-3 rounded-lg text-sm ${
            syncStatus.includes('successful') ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
            syncStatus.includes('error') || syncStatus.includes('failed') ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
            'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
          }`}>
            {syncStatus}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300">
          <h4 className="font-semibold mb-2">About Cloud Sync</h4>
          <ul className="space-y-1">
            <li>• Your data is stored securely in your chosen cloud service</li>
            <li>• Google Drive stores data in a hidden app folder</li>
            <li>• Local Cloud Folder works with iCloud Drive, Dropbox, OneDrive, etc.</li>
            <li>• Sync happens manually - automatic sync coming soon</li>
            <li>• Your data never passes through our servers</li>
          </ul>
        </div>
      </div>
    </div>
  )
}