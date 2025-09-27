'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { usePanels } from '@/lib/contexts/PanelContext'
import { panelRegistry } from '@/lib/panels/PanelRegistry'
import { FileText, History, BookOpen, Book, Link2, Square, LayoutGrid } from 'lucide-react'

export function PanelControls() {
  const {
    visiblePanels,
    togglePanel,
    isPanelVisible,
    getAvailableTemplates,
    applyTemplate,
    currentLayoutId,
    loadLayout
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

  const selectedTemplateId = useMemo(() => {
    if (!currentLayoutId || currentLayoutId === 'default') {
      return '__default'
    }

    const matched = templates.find(template => template.gridLayout.id === currentLayoutId)
    return matched?.id ?? '__default'
  }, [templates, currentLayoutId])

  const handleTemplateChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const templateId = event.target.value
    if (!templateId) return

    if (templateId === '__default') {
      loadLayout('default')
      return
    }

    applyTemplate(templateId)
  }

  if (!isHydrated) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {/* Layout template selector */}
      {templates.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
            <LayoutGrid className="w-4 h-4" />
            <span>Layout</span>
          </span>
          <select
            value={selectedTemplateId}
            onChange={handleTemplateChange}
            className="text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            <option value="__default">Default</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
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
