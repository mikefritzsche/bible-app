'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useSettings } from '@/lib/SettingsContext'
import ModuleManager from './ModuleManager'

interface BibleSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  parallelComparisonEnabled: boolean
  onParallelComparisonChange: (enabled: boolean) => void
  parallelVersion: string
  onParallelVersionChange: (version: string) => void
  primaryVersion: string
}

export function BibleSettingsModal({
  isOpen,
  onClose,
  parallelComparisonEnabled,
  onParallelComparisonChange,
  parallelVersion,
  onParallelVersionChange,
  primaryVersion
}: BibleSettingsModalProps) {
  const { settings, updateSettings } = useSettings()
  const [localLineSpacing, setLocalLineSpacing] = useState(String(settings.lineSpacing))
  const [localVerseSpacing, setLocalVerseSpacing] = useState(String(settings.verseSpacing))
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState<'display' | 'modules'>('display')

  useEffect(() => {
    setLocalLineSpacing(String(settings.lineSpacing))
    setLocalVerseSpacing(String(settings.verseSpacing))
  }, [settings])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleLineSpacingChange = (value: string) => {
    setLocalLineSpacing(value)
    updateSettings({ lineSpacing: value })
  }

  const handleVerseSpacingChange = (value: string) => {
    setLocalVerseSpacing(value)
    updateSettings({ verseSpacing: value })
  }

  const modalContent = (
    <>
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('display')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'display'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            Display
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'modules'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            Modules
          </button>
        </nav>
      </div>

      <div className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: isMobile ? 'calc(100vh - 200px)' : '60vh' }}>
        {activeTab === 'display' ? (
          <div className="space-y-6">
            {/* Parallel Comparison Settings */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
                Parallel Comparison
              </h3>

          <div className="flex items-center justify-between">
            <label htmlFor="parallel-comparison" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show Parallel Comparison
            </label>
            <button
              id="parallel-comparison"
              onClick={() => onParallelComparisonChange(!parallelComparisonEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                parallelComparisonEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  parallelComparisonEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {parallelComparisonEnabled && (
            <div>
              <label htmlFor="parallel-version" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comparison Version
              </label>
              <select
                id="parallel-version"
                value={parallelVersion}
                onChange={(e) => onParallelVersionChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none transition-colors text-base"
              >
                <option value="kjv-strongs">KJV with Strong's</option>
                <option value="kjv">KJV (King James Version)</option>
              </select>
              {parallelVersion === primaryVersion && (
                <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ Comparison version is the same as primary version
                </p>
              )}
            </div>
          )}
            </div>

            {/* Text Display Settings */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
                Text Display
              </h3>

          <div>
            <label htmlFor="font-size" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Font Size: {settings.fontSize}px
            </label>
            <input
              id="font-size"
              type="range"
              min="14"
              max="24"
              step="1"
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: e.target.value })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Small</span>
              <span>Large</span>
            </div>
          </div>

          <div>
            <label htmlFor="line-spacing" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Line Spacing: {parseFloat(localLineSpacing).toFixed(1)}
            </label>
            <input
              id="line-spacing"
              type="range"
              min="1.2"
              max="2.5"
              step="0.1"
              value={localLineSpacing}
              onChange={(e) => handleLineSpacingChange(e.target.value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Compact</span>
              <span>Relaxed</span>
            </div>
          </div>

          <div>
            <label htmlFor="verse-spacing" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Verse Spacing: {localVerseSpacing}px
            </label>
            <input
              id="verse-spacing"
              type="range"
              min="8"
              max="32"
              step="4"
              value={localVerseSpacing}
              onChange={(e) => handleVerseSpacingChange(e.target.value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Tight</span>
              <span>Spacious</span>
            </div>
          </div>
        </div>

            {/* Display Options */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
                Display Options
              </h3>

          <div className="flex items-center justify-between">
                <label htmlFor="show-verse-numbers" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show Verse Numbers
                </label>
                <button
                  id="show-verse-numbers"
                  onClick={() => updateSettings({ showVerseNumbers: !settings.showVerseNumbers })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showVerseNumbers ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showVerseNumbers ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="show-strongs" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show Strong's Numbers
                </label>
                <button
                  id="show-strongs"
                  onClick={() => updateSettings({ showStrongsNumbers: !settings.showStrongsNumbers })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showStrongsNumbers ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showStrongsNumbers ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <ModuleManager />
        )}
      </div>

      <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Done
        </button>
      </div>
    </>
  )

  // Mobile: Full-screen modal
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-800 z-50">
        {modalContent}
      </div>
    )
  }

  // Desktop: Centered modal with backdrop
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {modalContent}
      </div>
    </div>
  )
}