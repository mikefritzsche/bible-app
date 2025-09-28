'use client'

import { useMemo } from 'react'
import { usePanels } from '@/lib/contexts/PanelContext'
import { BookOpen, Search, Sun, Layers, Book, BookText, LayoutTemplate, Check } from 'lucide-react'

interface LayoutTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: string
  preview: {
    main: boolean
    left: boolean
    right: boolean
    top: boolean
    bottom: boolean
  }
}

export function LayoutSelector() {
  const {
    getAvailableTemplates,
    applyTemplate,
    currentLayoutId,
    loadLayout
  } = usePanels()

  const templates = getAvailableTemplates()

  const layoutTemplates: LayoutTemplate[] = useMemo(() => [
    {
      id: '__default',
      name: 'Default',
      description: 'Standard reading layout',
      icon: <LayoutTemplate className="w-5 h-5" />,
      category: 'basic',
      preview: { main: true, left: false, right: false, top: false, bottom: false }
    },
    {
      id: 'devotional',
      name: 'Devotional',
      description: 'Clean reading experience',
      icon: <Sun className="w-5 h-5" />,
      category: 'reading',
      preview: { main: true, left: false, right: false, top: false, bottom: false }
    },
    {
      id: 'study-focus',
      name: 'Study Focus',
      description: 'Bible + notes + cross-references',
      icon: <BookOpen className="w-5 h-5" />,
      category: 'study',
      preview: { main: true, left: false, right: true, top: false, bottom: false }
    },
    {
      id: 'research-mode',
      name: 'Research',
      description: 'Full research workspace',
      icon: <Search className="w-5 h-5" />,
      category: 'research',
      preview: { main: true, left: true, right: true, top: false, bottom: false }
    },
    {
      id: 'parallel-study',
      name: 'Parallel',
      description: 'Side-by-side comparison',
      icon: <Layers className="w-5 h-5" />,
      category: 'study',
      preview: { main: true, left: false, right: true, top: false, bottom: false }
    },
    {
      id: 'language-study',
      name: 'Language',
      description: 'Original language tools',
      icon: <Book className="w-5 h-5" />,
      category: 'academic',
      preview: { main: true, left: true, right: true, top: false, bottom: false }
    },
    {
      id: 'comprehensive',
      name: 'Comprehensive',
      description: 'Complete study workspace',
      icon: <BookText className="w-5 h-5" />,
      category: 'advanced',
      preview: { main: true, left: true, right: true, top: true, bottom: true }
    },
    {
      id: 'teaching',
      name: 'Teaching',
      description: 'Teaching preparation layout',
      icon: <BookOpen className="w-5 h-5" />,
      category: 'teaching',
      preview: { main: true, left: false, right: true, top: false, bottom: false }
    }
  ], [])

  const selectedTemplateId = useMemo(() => {
    if (!currentLayoutId || currentLayoutId === 'default') {
      return '__default'
    }

    const matched = templates.find(template => template.gridLayout.id === currentLayoutId)
    return matched?.id ?? '__default'
  }, [templates, currentLayoutId])

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === '__default') {
      loadLayout('default')
      return
    }

    applyTemplate(templateId)
  }

  const renderLayoutPreview = (preview: LayoutTemplate['preview']) => {
    return (
      <div className="relative w-16 h-12 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
        {/* Main panel */}
        {preview.main && (
          <div className="absolute inset-2 bg-blue-200 dark:bg-blue-800 rounded-sm">
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-2 h-1 bg-blue-400 dark:bg-blue-300 rounded"></div>
            </div>
          </div>
        )}

        {/* Left panel */}
        {preview.left && (
          <div className="absolute left-0 top-2 bottom-2 w-3 bg-green-200 dark:bg-green-800 rounded-l-sm">
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-1 h-1 bg-green-400 dark:bg-green-300 rounded-full"></div>
            </div>
          </div>
        )}

        {/* Right panel */}
        {preview.right && (
          <div className="absolute right-0 top-2 bottom-2 w-3 bg-purple-200 dark:bg-purple-800 rounded-r-sm">
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-1 h-1 bg-purple-400 dark:bg-purple-300 rounded-full"></div>
            </div>
          </div>
        )}

        {/* Top panel */}
        {preview.top && (
          <div className="absolute top-0 left-2 right-2 h-2 bg-yellow-200 dark:bg-yellow-800 rounded-t-sm">
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-1 h-0.5 bg-yellow-400 dark:bg-yellow-300 rounded"></div>
            </div>
          </div>
        )}

        {/* Bottom panel */}
        {preview.bottom && (
          <div className="absolute bottom-0 left-2 right-2 h-2 bg-red-200 dark:bg-red-800 rounded-b-sm">
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-1 h-0.5 bg-red-400 dark:bg-red-300 rounded"></div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <LayoutTemplate className="w-4 h-4" />
        <span className="font-medium">Choose Layout</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {layoutTemplates.map((template) => {
          const isSelected = selectedTemplateId === template.id
          const isAvailable = template.id === '__default' || templates.some(t => t.id === template.id)

          return (
            <button
              key={template.id}
              onClick={() => isAvailable && handleTemplateSelect(template.id)}
              disabled={!isAvailable}
              className={`
                relative p-3 rounded-lg border transition-all duration-200 text-left
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
                ${!isAvailable
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:shadow-sm'
                }
                bg-white dark:bg-gray-800
              `}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  {renderLayoutPreview(template.preview)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <div className="text-gray-700 dark:text-gray-200">
                      {template.icon}
                    </div>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                      {template.name}
                    </h4>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight line-clamp-2">
                    {template.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}