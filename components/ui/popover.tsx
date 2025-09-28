'use client'

import React, { useState, useRef, useEffect } from 'react'

interface PopoverProps {
  children: React.ReactNode
  content: React.ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
}

export function PopoverTrigger({ children }: { children: React.ReactNode }) {
  return children
}

export function PopoverContent({
  children,
  className = '',
  align = 'center',
  side = 'bottom',
  sideOffset = 4
}: {
  children: React.ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
}) {
  return (
    <div className={`
      absolute z-50 w-72 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-gray-900 dark:text-gray-100 shadow-lg outline-none
      ${className}
    `}>
      {children}
    </div>
  )
}

export function Popover({ children, content, align = 'center', side = 'bottom', sideOffset = 4 }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
        contentRef.current && !contentRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const updatePosition = () => {
      if (triggerRef.current && isOpen) {
        const triggerRect = triggerRef.current.getBoundingClientRect()
        let top = 0
        let left = 0

        if (side === 'bottom') {
          top = triggerRect.bottom + sideOffset
          left = align === 'start' ? triggerRect.left :
                 align === 'end' ? triggerRect.right :
                 triggerRect.left + triggerRect.width / 2
        } else if (side === 'top') {
          top = triggerRect.top - sideOffset
          left = align === 'start' ? triggerRect.left :
                 align === 'end' ? triggerRect.right :
                 triggerRect.left + triggerRect.width / 2
        } else if (side === 'left') {
          top = align === 'start' ? triggerRect.top :
                align === 'end' ? triggerRect.bottom :
                triggerRect.top + triggerRect.height / 2
          left = triggerRect.left - sideOffset
        } else if (side === 'right') {
          top = align === 'start' ? triggerRect.top :
                align === 'end' ? triggerRect.bottom :
                triggerRect.top + triggerRect.height / 2
          left = triggerRect.right + sideOffset
        }

        // Apply transforms
        if (align === 'center' && (side === 'bottom' || side === 'top')) {
          left = left - 250 // Half of max width
        } else if (align === 'end') {
          left = left - 500 // Full width adjustment
        }

        if (align === 'center' && (side === 'left' || side === 'right')) {
          top = top - 150 // Approximate half height
        } else if (align === 'end') {
          top = top - 300 // Full height adjustment
        }

        setPosition({ top, left })
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    if (isOpen) {
      updatePosition()
      window.addEventListener('scroll', updatePosition)
      window.addEventListener('resize', updatePosition)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', updatePosition)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, side, align, sideOffset])

  return (
    <div className="relative">
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
      >
        {children}
      </div>

      {isOpen && (
        <div
          ref={contentRef}
          className="fixed z-50 w-[500px] max-w-[90vw] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl"
          style={{
            top: `${position.top}px`,
            left: `${Math.max(8, Math.min(window.innerWidth - 508, position.left))}px`,
          }}
        >
          <div className="p-4">
            {content}
          </div>
        </div>
      )}
    </div>
  )
}