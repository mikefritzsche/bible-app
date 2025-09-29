'use client'

import { useEffect, useState } from 'react'
import { usePanels } from '@/lib/contexts/PanelContext'
import { panelRegistry } from '@/lib/panels/PanelRegistry'
import { LayoutGrid, ChevronDown } from 'lucide-react'
import { LayoutSelector } from './LayoutSelector'
import { Popover } from '@/components/ui/popover'

export function PanelControls() {
  const {
    getAvailableTemplates,
    currentLayoutId
  } = usePanels()

  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])


  const getCurrentLayoutName = () => {
    if (!currentLayoutId || currentLayoutId === 'default') {
      return 'Default'
    }

    // Map layout IDs to user-friendly names
    const layoutNames: Record<string, string> = {
      'devotional-layout': 'Devotional',
      'study-layout': 'Study Focus',
      'research-layout': 'Research',
      'parallel-layout': 'Parallel',
      'language-layout': 'Language',
      'comprehensive-layout': 'Comprehensive',
      'teaching-layout': 'Teaching'
    }

    return layoutNames[currentLayoutId] || 'Default'
  }

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
            <span>{getCurrentLayoutName()}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
        </Popover>
      )}

    </div>
  )
}
