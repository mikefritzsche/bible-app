'use client'

import { useState, useEffect } from 'react'
import { BasePanel } from './BasePanel'
import { TSKManager } from '@/lib/TSKManager'

interface CrossReference {
  book: string
  chapter: number
  verse: number
  text: string
  source: string
}

export function CrossReferencesPanel({
  id,
  title,
  isVisible,
  position,
  size,
  onResize,
  onClose,
  onPositionChange,
  minSize,
  maxSize,
  book,
  chapter,
  verse,
  onReferenceClick
}: any) {
  const [selectedSource, setSelectedSource] = useState('tsk')
  const [crossReferences, setCrossReferences] = useState<CrossReference[]>([])
  const [loading, setLoading] = useState(false)
  const tskManager = TSKManager.getInstance()

  const sources = [
    { id: 'tsk', name: 'Treasury of Scripture Knowledge', description: 'Comprehensive cross-references' },
    { id: 'builtin', name: 'Built-in Cross References', description: 'Basic related verses' }
  ]

  useEffect(() => {
    if (book && chapter && verse) {
      loadCrossReferences()
    }
  }, [book, chapter, verse, selectedSource])

  const loadCrossReferences = async () => {
    setLoading(true)
    try {
      if (selectedSource === 'tsk') {
        await loadTSKReferences()
      } else {
        loadBuiltinReferences()
      }
    } catch (error) {
      console.error('Failed to load cross references:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTSKReferences = async () => {
    try {
      if (!tskManager.isLoaded()) {
        await tskManager.loadData()
      }

      const references = tskManager.getReferencesForVerse(book, chapter, verse)
      if (references) {
        const formattedRefs: CrossReference[] = []
        references.forEach(entry => {
          entry.references.forEach(ref => {
            formattedRefs.push({
              book: ref.book,
              chapter: ref.chapter,
              verse: ref.startVerse,
              text: entry.word,
              source: 'TSK'
            })
          })
        })
        setCrossReferences(formattedRefs)
      } else {
        setCrossReferences([])
      }
    } catch (error) {
      console.error('Failed to load TSK references:', error)
      setCrossReferences([])
    }
  }

  const loadBuiltinReferences = () => {
    // Placeholder for built-in cross references
    // This could be expanded with actual cross-reference data
    const builtinRefs: CrossReference[] = [
      {
        book: 'John',
        chapter: 3,
        verse: 16,
        text: 'For God so loved the world...',
        source: 'Built-in'
      },
      {
        book: 'Romans',
        chapter: 5,
        verse: 8,
        text: 'But God demonstrates his own love...',
        source: 'Built-in'
      }
    ]
    setCrossReferences(builtinRefs)
  }

  const handleReferenceClick = (ref: CrossReference) => {
    if (onReferenceClick) {
      onReferenceClick(ref.book, ref.chapter, ref.verse)
    }
  }

  const currentSource = sources.find(s => s.id === selectedSource)

  return (
    <BasePanel
      id={id}
      title={title}
      isVisible={isVisible}
      position={position}
      size={size}
      onResize={onResize}
      onClose={onClose}
      onPositionChange={onPositionChange}
      minSize={minSize}
      maxSize={maxSize}
    >
      <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">Cross References</h3>
        </div>

        {/* Source Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
            Cross Reference Source
          </label>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-purple-300 dark:border-purple-600 rounded-md text-sm text-purple-900 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {sources.map(source => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            {currentSource?.description}
          </p>
        </div>

        {/* Current Reference */}
        {book && chapter && verse && (
          <div className="mb-4 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Current: {book} {chapter}:{verse}
            </p>
          </div>
        )}

        {/* Cross References Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              <span className="ml-2 text-sm text-purple-600 dark:text-purple-400">Loading...</span>
            </div>
          ) : crossReferences.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-purple-600 dark:text-purple-400">
                {book && chapter && verse
                  ? 'No cross references found for this verse.'
                  : 'Select a verse to view cross references.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {crossReferences.map((ref, index) => (
                <div
                  key={index}
                  onClick={() => handleReferenceClick(ref)}
                  className="p-3 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-medium text-purple-700 dark:text-purple-300">
                      {ref.book} {ref.chapter}:{ref.verse}
                    </span>
                    <span className="text-xs text-purple-500 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                      {ref.source}
                    </span>
                  </div>
                  {ref.text && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {ref.text.length > 100 ? `${ref.text.substring(0, 100)}...` : ref.text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
          <p className="text-xs text-purple-500 dark:text-purple-400">
            🔗 Click on any reference to navigate to that verse
          </p>
        </div>
      </div>
    </BasePanel>
  )
}