'use client'

import { useEffect, useState } from 'react'
import { usePanels } from '@/lib/contexts/PanelContext'
import { panelRegistry } from '@/lib/panels/PanelRegistry'
import { FileText, History, BookOpen, Book, Link2, Square, LayoutGrid, ChevronDown } from 'lucide-react'
import { LayoutSelector } from './LayoutSelector'
import { Popover } from '@/components/ui/popover'

export function PanelControls() {
  const {
    visiblePanels,
    togglePanel,
    isPanelVisible,
    getAvailableTemplates
  } = usePanels()

  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const getPanelIcon = (panelId: string) => {
    switch (panelId) {
      case 'notes': return <FileText className="w-4 h-4" />
      case 'history': return <History className="w-4 h-4" />
      case 'commentary': return <BookOpen className="w-4 h-4" />
      case 'dictionary': return <Book className="w-4 h-4" />
      case 'cross-references': return <Link2 className="w-4 h-4" />
      case 'bible-reader': return <BookOpen className="w-4 h-4" />
      default: return <Square className="w-4 h-4" />
    }
  }

  const getVisiblePanelCount = () => {
    return visiblePanels.length
  }

  const availablePanels = panelRegistry
    .getAllPanels()
    .filter(panel => panel.closable !== false)
  const templates = getAvailableTemplates()

  if (!isHydrated) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {/* Layout template selector */}
      {templates.length > 0 && (
        <Popover
          content={
            <LayoutSelector />
          }
          side="bottom"
          align="start"
          sideOffset={8}
        >
          <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
            <LayoutGrid className="w-4 h-4" />
            <span>Layout</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
        </Popover>
      )}

      {/* Panel Toggle Buttons */}
      <div className="flex items-center gap-1">
        {availablePanels.map((panel) => (
          <button
            key={panel.id}
            onClick={() => togglePanel(panel.id)}
            className={`p-2 rounded-lg transition-all ${
              isPanelVisible(panel.id)
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={`${panel.title} (${panel.keyboardShortcut})`}
          >
            {getPanelIcon(panel.id)}
          </button>
        ))}
      </div>

      {/* Panel Count Indicator */}
      {getVisiblePanelCount() > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
          {getVisiblePanelCount()} panel{getVisiblePanelCount() !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
