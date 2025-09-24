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
      const availableModules = await ModuleRegistryInstance.getAvailableModules()

      // Get installed modules
      const installedModules = await ModuleManagerInstance.getInstalledModules()

      // Transform to ModuleInfo array
      const moduleList = Object.values(availableModules).map((module) => ({
        id: module.id,
        module,
        isInstalled: installedModules.includes(module.id),
        size: module.size || 'Unknown',
        downloadProgress: ModuleManagerInstance.getDownloadProgress(module.id) as ModuleDownloadProgress
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
      await ModuleManagerInstance.downloadModule(moduleId, (progress) => {
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
      await ModuleManagerInstance.deleteModule(moduleId)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Module Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Download and manage Bible translations, dictionaries, and other resources
          </p>
        </div>
        <button
          onClick={fetchModules}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Refresh modules"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as ModuleType | 'all')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="bible">Bible Translations</option>
          <option value="dictionary">Dictionaries</option>
          <option value="commentary">Commentaries</option>
          <option value="cross_reference">Cross References</option>
        </select>
      </div>

      {/* Module Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {modules.filter(m => m.isInstalled).length}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            Installed Modules
          </div>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {modules.filter(m => m.downloadProgress?.status === 'downloading').length}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            Downloading
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {modules.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Available Modules
          </div>
        </div>
      </div>

      {/* Modules by Type */}
      {Object.entries(modulesByType).map(([type, typeModules]) => (
        <div key={type} className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 capitalize">
            {type} ({typeModules.length})
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {typeModules.map((moduleInfo) => (
              <ModuleCard
                key={moduleInfo.id}
                moduleInfo={moduleInfo}
                onDownload={handleDownload}
                onDelete={handleDelete}
                formatBytes={formatBytes}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      ))}

      {filteredModules.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No modules found matching your search criteria.
          </p>
        </div>
      )}
    </div>
  )
}

// Module Card Component
interface ModuleCardProps {
  moduleInfo: ModuleInfo
  onDownload: (moduleId: string) => void
  onDelete: (moduleId: string) => void
  formatBytes: (bytes: number) => string
  formatDate: (date?: Date) => string
}

function ModuleCard({ moduleInfo, onDownload, onDelete, formatBytes, formatDate }: ModuleCardProps) {
  const { module, isInstalled, downloadProgress } = moduleInfo

  const getStatusBadge = () => {
    if (isInstalled) {
      return (
        <span className="px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-full">
          Installed
        </span>
      )
    }

    if (downloadProgress) {
      switch (downloadProgress.status) {
        case 'downloading':
          return (
            <span className="px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              Downloading ({downloadProgress.progress}%)
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
            <span className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full">
              Available
            </span>
          )
      }
    }

    return (
      <span className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full">
        Available
      </span>
    )
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
            {module.name}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {module.description}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Module Details */}
      <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
        {module.language && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span>Language: {module.language}</span>
          </div>
        )}

        {module.size && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            <span>Size: {module.size}</span>
          </div>
        )}

        {downloadProgress?.startedAt && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Started: {formatDate(downloadProgress.startedAt)}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {downloadProgress?.status === 'downloading' && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Downloading...</span>
            <span>{downloadProgress.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress.progress}%` }}
            ></div>
          </div>
          {downloadProgress.currentFile && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {downloadProgress.currentFile}
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {isInstalled ? (
          <button
            onClick={() => onDelete(module.id)}
            disabled={module.isDefault}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
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
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
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
            className="px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}