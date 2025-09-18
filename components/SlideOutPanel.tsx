'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

interface SlideOutPanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  position: 'left' | 'right'
  children: React.ReactNode
  className?: string
  width?: string
}

export function SlideOutPanel({
  isOpen,
  onClose,
  title,
  subtitle,
  position,
  children,
  className = '',
  width = 'w-96'
}: SlideOutPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // Handle touch/mouse events for swipe-to-close
  const handleStart = (clientX: number) => {
    setStartX(clientX)
    setCurrentX(clientX)
    setIsDragging(true)
  }

  const handleMove = (clientX: number) => {
    if (!isDragging) return
    setCurrentX(clientX)

    const deltaX = clientX - startX
    const panel = panelRef.current
    if (!panel) return

    // Apply transform based on direction
    if (position === 'left') {
      // For left panel, only allow dragging left (negative deltaX)
      if (deltaX < 0) {
        panel.style.transform = `translateX(${deltaX}px)`
      }
    } else {
      // For right panel, only allow dragging right (positive deltaX)
      if (deltaX > 0) {
        panel.style.transform = `translateX(${deltaX}px)`
      }
    }
  }

  const handleEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    const deltaX = currentX - startX
    const panel = panelRef.current
    if (!panel) return

    // Reset transform
    panel.style.transform = ''

    // Close if dragged far enough
    const threshold = 100 // px
    if (position === 'left' && deltaX < -threshold) {
      onClose()
    } else if (position === 'right' && deltaX > threshold) {
      onClose()
    }
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    handleEnd()
  }

  // Mouse events (for desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX)
  }

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX)
  }

  const handleMouseUp = () => {
    handleEnd()
  }

  // Add/remove mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, currentX])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const translateClass = position === 'left'
    ? isOpen ? 'translate-x-0' : '-translate-x-full'
    : isOpen ? 'translate-x-0' : 'translate-x-full'

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed ${position === 'left' ? 'left-0' : 'right-0'} top-0 bottom-0 ${width} bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${translateClass} ${className}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-5 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Swipe indicator */}
          <div className={`mt-3 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 ${position === 'left' ? '' : 'justify-end'}`}>
            {position === 'left' ? (
              <>
                <span>← Swipe left to close</span>
              </>
            ) : (
              <>
                <span>Swipe right to close →</span>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </>
  )
}