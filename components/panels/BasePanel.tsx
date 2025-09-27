'use client'

import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { X, GripHorizontal, ChevronDown, ChevronRight } from 'lucide-react'
import type { PanelProps, PanelSize } from '@/lib/panels/types'

// Re-export PanelProps for use by other panel components
export type { PanelProps }

interface BasePanelProps extends PanelProps {
  children: ReactNode
  className?: string
  showHeader?: boolean
  isResizable?: boolean
  isCollapsible?: boolean
  defaultCollapsed?: boolean
}

export function BasePanel({
  id,
  title,
  isVisible,
  position,
  size,
  onResize,
  onClose,
  onPositionChange,
  children,
  className = '',
  showHeader = true,
  isResizable = true,
  isCollapsible = true,
  defaultCollapsed = false,
  minSize,
  maxSize
}: BasePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [currentSize, setCurrentSize] = useState(size)

  // Handle resize
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = panelRef.current?.offsetWidth || 0
    const startHeight = panelRef.current?.offsetHeight || 0

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing) return

      let newWidth = startWidth
      let newHeight = startHeight

      if (position === 'left' || position === 'right') {
        const deltaX = position === 'left' ? startX - moveEvent.clientX : moveEvent.clientX - startX
        const minWidth = minSize?.width ?? 200
        const maxWidth = maxSize?.width ?? 800
        newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX))
      }

      if (position === 'bottom' || position === 'top') {
        const deltaY = position === 'top' ? startY - moveEvent.clientY : moveEvent.clientY - startY
        const minHeight = minSize?.height ?? 150
        const maxHeight = maxSize?.height ?? 600
        newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY))
      }

      const newSize: PanelSize = {}
      if (position === 'left' || position === 'right') {
        newSize.width = newWidth
      }
      if (position === 'bottom' || position === 'top') {
        newSize.height = newHeight
      }

      setCurrentSize(newSize)
      onResize(newSize)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [isResizing, position, onResize])

  // Handle collapse/expand
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed)
  }, [isCollapsed])

  // Update size when prop changes
  useEffect(() => {
    setCurrentSize(size)
  }, [size])

  // Get panel classes based on position
  const getPanelClasses = () => {
    const baseClasses = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden'

    switch (position) {
      case 'left':
        return `${baseClasses} border-r-0 ${isCollapsed ? 'w-12' : ''}`
      case 'right':
        return `${baseClasses} border-l-0 ${isCollapsed ? 'w-12' : ''}`
      case 'top':
        return `${baseClasses} border-b-0 ${isCollapsed ? 'h-12' : ''}`
      case 'bottom':
        return `${baseClasses} border-t-0 ${isCollapsed ? 'h-12' : ''}`
      case 'main':
        return `${baseClasses} flex-1`
      default:
        return baseClasses
    }
  }

  // Get panel styles
  const getPanelStyles = () => {
    const styles: React.CSSProperties = {}

    if (!isCollapsed) {
      if (position === 'left' || position === 'right') {
        if (currentSize.width) {
          styles.width = currentSize.width
        }
      }
      if (position === 'top' || position === 'bottom') {
        if (currentSize.height) {
          styles.height = currentSize.height
        }
      }
    }

    return styles
  }

  // Get resize handle
  const getResizeHandle = () => {
    if (!isResizable || isCollapsed) return null

    switch (position) {
      case 'left':
        return (
          <div
            className="absolute top-0 right-0 w-2 h-full cursor-col-resize bg-blue-500/20 hover:bg-blue-500/40 dark:bg-blue-500/30 dark:hover:bg-blue-500/50 transition-colors z-10"
            onMouseDown={handleResizeStart}
          />
        )
      case 'right':
        return (
          <div
            className="absolute top-0 left-0 w-2 h-full cursor-col-resize bg-blue-500/20 hover:bg-blue-500/40 dark:bg-blue-500/30 dark:hover:bg-blue-500/50 transition-colors z-10"
            onMouseDown={handleResizeStart}
          />
        )
      case 'top':
        return (
          <div
            className="absolute bottom-0 left-0 w-full h-2 cursor-row-resize bg-blue-500/20 hover:bg-blue-500/40 dark:bg-blue-500/30 dark:hover:bg-blue-500/50 transition-colors z-10"
            onMouseDown={handleResizeStart}
          />
        )
      case 'bottom':
        return (
          <div
            className="absolute top-0 left-0 w-full h-2 cursor-row-resize bg-blue-500/20 hover:bg-blue-500/40 dark:bg-blue-500/30 dark:hover:bg-blue-500/50 transition-colors z-10"
            onMouseDown={handleResizeStart}
          />
        )
      default:
        return null
    }
  }

  if (!isVisible) return null

  return (
    <div
      ref={panelRef}
      className={`${getPanelClasses()} ${className}`}
      style={getPanelStyles()}
    >
      {/* Resize Handle */}
      {getResizeHandle()}

      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 min-h-12">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
              <GripHorizontal className="w-3 h-3" />
            </span>
            {isCollapsible && (
              <button
                onClick={toggleCollapse}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
                title={isCollapsed ? 'Expand' : 'Collapse'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
            {!isCollapsed && (
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {title}
              </h3>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onPositionChange && (
              <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {position}
              </div>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 dark:text-red-300 transition-colors"
                title="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      )}

      {/* Collapsed indicator */}
      {isCollapsed && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            <div className="transform -rotate-90 whitespace-nowrap">
              {title}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
