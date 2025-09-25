'use client'

import { useState, useEffect } from 'react'
import { ModuleDownloadProgress } from '@/lib/modules/types/IModuleManager'
import ModuleManagerInstance from '@/lib/modules/ModuleManager'

interface ActiveDownload extends ModuleDownloadProgress {
  moduleId: string
}

export default function DownloadProgress() {
  const [activeDownloads, setActiveDownloads] = useState<ActiveDownload[]>([])
  const [showPanel, setShowPanel] = useState(false)

  // Poll for active downloads
  useEffect(() => {
    const pollDownloads = () => {
      const progressData = ModuleManagerInstance().getDownloadProgress() as ModuleDownloadProgress[]
      if (Array.isArray(progressData)) {
        const active = progressData.filter(p =>
          p.status === 'downloading' || p.status === 'pending'
        ) as ActiveDownload[]
        setActiveDownloads(active)
      }
    }

    // Poll every 500ms for active downloads
    const interval = setInterval(pollDownloads, 500)

    // Initial check
    pollDownloads()

    return () => clearInterval(interval)
  }, [])

  // Auto-show panel when downloads are active
  useEffect(() => {
    if (activeDownloads.length > 0) {
      setShowPanel(true)
    }
  }, [activeDownloads.length])

  if (activeDownloads.length === 0 && !showPanel) {
    return null
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      showPanel ? 'translate-y-0' : 'translate-y-full'
    }`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-96">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Active Downloads ({activeDownloads.length})
            </h3>
            <button
              onClick={() => setShowPanel(false)}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {activeDownloads.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No active downloads
            </div>
          ) : (
            activeDownloads.map((download) => (
              <DownloadItem
                key={download.moduleId}
                download={download}
                onDismiss={() => {
                  // If download is complete or failed, remove it from view
                  if (download.status === 'completed' || download.status === 'failed') {
                    setActiveDownloads(prev => prev.filter(d => d.moduleId !== download.moduleId))
                  }
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

interface DownloadItemProps {
  download: ActiveDownload
  onDismiss: () => void
}

function DownloadItem({ download, onDismiss }: DownloadItemProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getStatusColor = () => {
    switch (download.status) {
      case 'downloading':
        return 'text-blue-600 dark:text-blue-400'
      case 'completed':
        return 'text-green-600 dark:text-green-400'
      case 'failed':
        return 'text-red-600 dark:text-red-400'
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getStatusIcon = () => {
    switch (download.status) {
      case 'downloading':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        )
      case 'completed':
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'failed':
        return (
          <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      case 'pending':
        return (
          <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  return (
    <div className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {getStatusIcon()}
            <span className={`text-sm font-medium capitalize ${getStatusColor()}`}>
              {download.status}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
            Module: {download.moduleId}
          </p>
          {download.currentFile && (
            <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
              {download.currentFile}
            </p>
          )}
        </div>
        {(download.status === 'completed' || download.status === 'failed') && (
          <button
            onClick={onDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {download.status === 'downloading' && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${download.progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{download.progress}%</span>
            <span>
              {formatBytes(download.bytesDownloaded)} / {formatBytes(download.totalBytes)}
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {download.status === 'failed' && download.error && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400">
            {download.error}
          </p>
        </div>
      )}

      {/* Time Info */}
      {download.startedAt && (
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>
            Started: {new Date(download.startedAt).toLocaleTimeString()}
          </span>
          {download.completedAt && (
            <span>
              Duration: {Math.round(
                (new Date(download.completedAt).getTime() - new Date(download.startedAt).getTime()) / 1000
              )}s
            </span>
          )}
        </div>
      )}
    </div>
  )
}