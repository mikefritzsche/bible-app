'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Maximize2, Minimize2, GripHorizontal } from 'lucide-react'
import type { PanelProps, PanelPosition, PanelSize } from '@/lib/panels/types'

// Re-export PanelProps for use by other panel components
export type { PanelProps }

interface BasePanelProps extends PanelProps {
  children: React.ReactNode
  className?: string
  showHeader?: boolean
  isResizable?: boolean
  isDraggable?: boolean
  isCollapsible?: boolean
  defaultCollapsed?: boolean
}

export function BasePanel({
  id,
  title,
  isVisible,
  position,
  size,
  onClose,
  onResize,
  onPositionChange,
  children,
  className = '',
  showHeader = true,
  isResizable = true,
  isDraggable = true,
  isCollapsible = true,
  defaultCollapsed = false
}: BasePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [isMaximized, setIsMaximized] = useState(false)
  const [currentSize, setCurrentSize] = useState(size)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [currentPosition, setCurrentPosition] = useState(position)

  // Handle resize
  const handleResizeStart = useCallback((e: React.MouseEvent, direction: 'horizontal' | 'vertical' | 'both') => {
    e.preventDefault()
    setIsResizing(true)

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = currentSize.width
    const startHeight = currentSize.height

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      let newWidth = startWidth
      let newHeight = startHeight

      if (direction === 'horizontal' || direction === 'both') {
        newWidth = startWidth + (position === 'left' ? startX - e.clientX : e.clientX - startX)
      }
      if (direction === 'vertical' || direction === 'both') {
        newHeight = startHeight + (position === 'top' ? startY - e.clientY : e.clientY - startY)
      }

      const constrainedSize = {
        width: Math.max(200, Math.min(800, newWidth)),
        height: Math.max(150, Math.min(600, newHeight))
      }

      setCurrentSize(constrainedSize)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      onResize(currentSize)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [isResizing, currentSize, position, onResize])

  // Handle drag
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (!isDraggable) return

    e.preventDefault()
    setIsDragging(true)

    const rect = panelRef.current?.getBoundingClientRect()
    if (!rect) return

    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }, [isDraggable])

  // Handle drag movement
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return

      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y

      // Update panel position for floating panels
      if (currentPosition === 'floating') {
        panelRef.current.style.left = `${newX}px`
        panelRef.current.style.top = `${newY}px`
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, currentPosition])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, onClose])

  // Calculate panel classes based on position and state
  const getPanelClasses = () => {
    const baseClasses = 'fixed bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-200'

    let positionClasses = ''
    let sizeClasses = ''

    if (isMaximized) {
      positionClasses = 'inset-0'
      sizeClasses = 'w-full h-full'
    } else if (currentPosition === 'floating') {
      positionClasses = ''
      sizeClasses = `w-[${currentSize.width}px] h-[${currentSize.height}px]`
    } else {
      switch (currentPosition) {
        case 'left':
          positionClasses = 'left-0 top-0 bottom-0'
          sizeClasses = isCollapsed ? 'w-12' : `w-[${currentSize.width}px]`
          break
        case 'right':
          positionClasses = 'right-0 top-0 bottom-0'
          sizeClasses = isCollapsed ? 'w-12' : `w-[${currentSize.width}px]`
          break
        case 'top':
          positionClasses = 'left-0 right-0 top-0'
          sizeClasses = isCollapsed ? 'h-12' : `h-[${currentSize.height}px]`
          break
        case 'bottom':
          positionClasses = 'left-0 right-0 bottom-0'
          sizeClasses = isCollapsed ? 'h-12' : `h-[${currentSize.height}px]`
          break
      }
    }

    const visibilityClasses = isVisible
      ? 'opacity-100 translate-x-0 translate-y-0'
      : currentPosition === 'left'
        ? 'opacity-0 -translate-x-full'
        : currentPosition === 'right'
        ? 'opacity-0 translate-x-full'
        : currentPosition === 'top'
        ? 'opacity-0 -translate-y-full'
        : currentPosition === 'bottom'
        ? 'opacity-0 translate-y-full'
        : 'opacity-0 scale-95'

    const interactionClasses = isResizing ? 'select-none' : ''

    return `${baseClasses} ${positionClasses} ${sizeClasses} ${visibilityClasses} ${interactionClasses} ${className}`
  }

  // Render resize handles
  const renderResizeHandles = () => {
    if (!isResizable || isCollapsed || isMaximized) return null

    const handles = []

    if (currentPosition === 'left' || currentPosition === 'right') {
      handles.push(
        <div
          key="vertical"
          className={`absolute top-0 bottom-0 w-2 cursor-ew-resize ${
            currentPosition === 'left' ? 'right-0' : 'left-0'
          } hover:bg-blue-500/20 transition-colors`}
          onMouseDown={(e) => handleResizeStart(e, 'horizontal')}
        />
      )
    }

    if (currentPosition === 'top' || currentPosition === 'bottom') {
      handles.push(
        <div
          key="horizontal"
          className={`absolute left-0 right-0 h-2 cursor-ns-resize ${
            currentPosition === 'top' ? 'bottom-0' : 'top-0'
          } hover:bg-blue-500/20 transition-colors`}
          onMouseDown={(e) => handleResizeStart(e, 'vertical')}
        />
      )
    }

    if (currentPosition === 'floating') {
      handles.push(
        <>
          <div
            key="corner-nw"
            className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize"
            onMouseDown={(e) => handleResizeStart(e, 'both')}
          />
          <div
            key="corner-ne"
            className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize"
            onMouseDown={(e) => handleResizeStart(e, 'both')}
          />
          <div
            key="corner-sw"
            className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize"
            onMouseDown={(e) => handleResizeStart(e, 'both')}
          />
          <div
            key="corner-se"
            className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
            onMouseDown={(e) => handleResizeStart(e, 'both')}
          />
        </>
      )
    }

    return handles
  }

  if (!isVisible) return null

  return (
    <>
      {/* Backdrop for non-floating panels */}
      {currentPosition !== 'floating' && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          style={{ display: isVisible ? 'block' : 'none' }}
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        className={getPanelClasses()}
        style={{
          zIndex: 50,
          ...(currentPosition === 'floating' ? {
            width: currentSize.width,
            height: currentSize.height,
            left: 100,
            top: 100
          } : {})
        }}
      >
        {/* Header */}
        {showHeader && (
          <div
            className={`flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 ${
              isDraggable && currentPosition === 'floating' ? 'cursor-move' : ''
            }`}
            onMouseDown={handleDragStart}
          >
            <div className="flex items-center gap-2 min-w-0">
              {isCollapsible && (
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                >
                  <GripHorizontal className="w-4 h-4 text-gray-500" />
                </button>
              )}
              <h3 className={`font-medium text-gray-900 dark:text-gray-100 truncate ${
                isCollapsed ? 'sr-only' : ''
              }`}>
                {title}
              </h3>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {currentPosition === 'floating' && (
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  title={isMaximized ? 'Restore' : 'Maximize'}
                >
                  {isMaximized ? (
                    <Minimize2 className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Close (Esc)"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`flex-1 overflow-hidden ${isCollapsed ? 'hidden' : ''}`}>
          {children}
        </div>

        {/* Resize Handles */}
        {renderResizeHandles()}
      </div>
    </>
  )
}