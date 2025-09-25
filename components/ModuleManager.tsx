'use client'

import { useState, useEffect } from 'react'
import { IModule, ModuleType } from '@/lib/modules/types/IModule'
import ModuleManagerInstance from '@/lib/modules/ModuleManager'
import ModuleRegistryInstance from '@/lib/modules/ModuleRegistry'

interface ModuleDownloadProgress {
  moduleId: string
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused'
  progress: number
  bytesDownloaded: number
  totalBytes: number
  startedAt?: Date
  completedAt?: Date
  error?: string
  currentFile?: string
}

interface ModuleInfo {
  id: string
  module: IModule
  isInstalled: boolean
  size?: string
  downloadProgress?: ModuleDownloadProgress
}

export default function ModuleManager() {
  const [modules, setModules] = useState<ModuleInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<ModuleType | 'all'>('all')

  // Fetch modules with installation status
  const fetchModules = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get available modules from registry
      const availableModules = await ModuleRegistryInstance().getAvailableModules()

      // Get installed modules
      const installedModules = await ModuleManagerInstance().getInstalledModules()

      // Transform to ModuleInfo array
      const moduleList = Object.values(availableModules).map((module) => ({
        id: module.id,
        module,
        isInstalled: installedModules.includes(module.id),
        size: module.size || 'Unknown',
        downloadProgress: ModuleManagerInstance().getDownloadProgress(module.id) as ModuleDownloadProgress
      }))

      setModules(moduleList)
    } catch (err) {
      console.error('Error fetching modules:', err)
      setError('Failed to load modules')
    } finally {
      setLoading(false)
    }
  }

  // Download a module
  const handleDownload = async (moduleId: string) => {
    try {
      await ModuleManagerInstance().downloadModule(moduleId, (progress) => {
        setModules(prev => prev.map(mod =>
          mod.id === moduleId
            ? { ...mod, downloadProgress: progress }
            : mod
        ))
      })

      // Refresh modules after download
      await fetchModules()
    } catch (err) {
      console.error('Error downloading module:', err)
      setError(`Failed to download module: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // Delete a module
  const handleDelete = async (moduleId: string) => {
    try {
      await ModuleManagerInstance().deleteModule(moduleId)
      await fetchModules()
    } catch (err) {
      console.error('Error deleting module:', err)
      setError(`Failed to delete module: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // Filter modules based on search and type
  const filteredModules = modules.filter(module => {
    const matchesSearch = module.module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.module.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || module.module.type === selectedType
    return matchesSearch && matchesType
  })

  // Group modules by type
  const modulesByType = filteredModules.reduce((acc, module) => {
    if (!acc[module.module.type]) {
      acc[module.module.type] = []
    }
    acc[module.module.type].push(module)
    return acc
  }, {} as Record<ModuleType, ModuleInfo[]>)

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // Format date
  const formatDate = (date?: Date): string => {
    if (!date) return ''
    return new Date(date).toLocaleString()
  }

  useEffect(() => {
    fetchModules()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading modules...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchModules}
          className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Available Modules
          </h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ModuleType | 'all')}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="bible">Bible</option>
              <option value="dictionary">Dictionary</option>
              <option value="commentary">Commentary</option>
              <option value="cross_reference">Cross Reference</option>
            </select>
            <button
              onClick={fetchModules}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Refresh modules"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Compact Module Statistics */}
      <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400 pb-2 border-b border-gray-200 dark:border-gray-700">
        <span>{modules.filter(m => m.isInstalled).length} installed</span>
        <span>{modules.filter(m => m.downloadProgress?.status === 'downloading').length} downloading</span>
        <span>{modules.length} available</span>
      </div>

      {/* Streamlined Module List */}
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {filteredModules.map((moduleInfo) => (
          <ModuleListItem
            key={moduleInfo.id}
            moduleInfo={moduleInfo}
            onDownload={handleDownload}
            onDelete={handleDelete}
            formatBytes={formatBytes}
            formatDate={formatDate}
          />
        ))}

        {filteredModules.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No modules found matching your search criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Module List Item Component
interface ModuleListItemProps {
  moduleInfo: ModuleInfo
  onDownload: (moduleId: string) => void
  onDelete: (moduleId: string) => void
  formatBytes: (bytes: number) => string
  formatDate: (date?: Date) => string
}

function ModuleListItem({ moduleInfo, onDownload, onDelete, formatBytes, formatDate }: ModuleListItemProps) {
  const { module, isInstalled, downloadProgress } = moduleInfo

  const getStatusBadge = () => {
    if (isInstalled) {
      return (
        <span className="px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-full">
          ✓ Installed
        </span>
      )
    }

    if (downloadProgress) {
      switch (downloadProgress.status) {
        case 'downloading':
          return (
            <span className="px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              {downloadProgress.progress}%
            </span>
          )
        case 'failed':
          return (
            <span className="px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-full">
              Failed
            </span>
          )
        default:
          return (
            <span className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400">
              Available
            </span>
          )
      }
    }

    return (
      <span className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400">
        Available
      </span>
    )
  }

  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
            {module.name}
          </h4>
          {getStatusBadge()}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-1">
          {module.description}
        </p>
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          {module.language && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              {module.language}
            </span>
          )}
          {module.size && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              {module.size}
            </span>
          )}
          <span className="capitalize text-gray-500 dark:text-gray-400">
            {module.type}
          </span>
        </div>

        {/* Progress Bar */}
        {downloadProgress?.status === 'downloading' && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div
                className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress.progress}%` }}
              ></div>
            </div>
            {downloadProgress.currentFile && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                {downloadProgress.currentFile}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 ml-4">
        {isInstalled ? (
          <button
            onClick={() => onDelete(module.id)}
            disabled={module.isDefault}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              module.isDefault
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {module.isDefault ? 'Default' : 'Remove'}
          </button>
        ) : (
          <button
            onClick={() => onDownload(module.id)}
            disabled={downloadProgress?.status === 'downloading'}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              downloadProgress?.status === 'downloading'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {downloadProgress?.status === 'downloading' ? 'Downloading...' : 'Download'}
          </button>
        )}

        {downloadProgress?.status === 'failed' && (
          <button
            onClick={() => onDownload(module.id)}
            className="px-3 py-1 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}