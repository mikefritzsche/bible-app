'use client'

import { usePanels } from '@/lib/contexts/PanelContext'
import { panelRegistry } from '@/lib/panels/PanelRegistry'
import { FileText, History, BookOpen, Book, Link2, Square } from 'lucide-react'

export function PanelControls() {
  const { visiblePanels, togglePanel, isPanelVisible } = usePanels()

  const getPanelIcon = (panelId: string) => {
    switch (panelId) {
      case 'notes': return <FileText className="w-4 h-4" />
      case 'history': return <History className="w-4 h-4" />
      case 'commentary': return <BookOpen className="w-4 h-4" />
      case 'dictionary': return <Book className="w-4 h-4" />
      case 'cross-references': return <Link2 className="w-4 h-4" />
      case 'parallel-versions': return <Square className="w-4 h-4" />
      default: return <Square className="w-4 h-4" />
    }
  }

  const getVisiblePanelCount = () => {
    return visiblePanels.length
  }

  const availablePanels = panelRegistry.getAllPanels()

  return (
    <div className="flex items-center gap-2">
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