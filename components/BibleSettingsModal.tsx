'use client'

import { useState, useEffect } from 'react'
import { useSettings } from '@/lib/SettingsContext'

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

  useEffect(() => {
    setLocalLineSpacing(String(settings.lineSpacing))
    setLocalVerseSpacing(String(settings.verseSpacing))
  }, [settings])

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

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Bible Display Settings
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Parallel Comparison Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
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
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="kjv_strongs">KJV with Strong's</option>
                  <option value="kjv">KJV (King James Version)</option>
                  <option value="asvs">ASV with Strong's</option>
                  <option value="asv">ASV (American Standard Version)</option>
                  <option value="web">WEB (World English Bible)</option>
                  <option value="net">NET (New English Translation)</option>
                  <option value="geneva">Geneva Bible</option>
                  <option value="bishops">Bishops' Bible</option>
                  <option value="coverdale">Coverdale Bible</option>
                  <option value="tyndale">Tyndale Bible</option>
                </select>
                {parallelVersion === primaryVersion && (
                  <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                    ⚠️ Comparison version is the same as primary version
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Spacing Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Text Spacing
            </h3>
            
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
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}