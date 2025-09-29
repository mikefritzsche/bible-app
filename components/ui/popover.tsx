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
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const dropdownWidth = 500
        const dropdownHeight = 400 // Approximate height

        let top = 0
        let left = 0

        // Determine preferred position based on side prop
        if (side === 'bottom') {
          top = triggerRect.bottom + sideOffset
          left = align === 'start' ? triggerRect.left :
                 align === 'end' ? triggerRect.right - dropdownWidth :
                 triggerRect.left + triggerRect.width / 2 - dropdownWidth / 2

          // If not enough space below, try to position above
          if (top + dropdownHeight > viewportHeight - 10) {
            top = triggerRect.top - dropdownHeight - sideOffset
          }
        } else if (side === 'top') {
          top = triggerRect.top - dropdownHeight - sideOffset
          left = align === 'start' ? triggerRect.left :
                 align === 'end' ? triggerRect.right - dropdownWidth :
                 triggerRect.left + triggerRect.width / 2 - dropdownWidth / 2

          // If not enough space above, position below
          if (top < 10) {
            top = triggerRect.bottom + sideOffset
          }
        }

        // Ensure dropdown stays within horizontal bounds
        left = Math.max(10, Math.min(left, viewportWidth - dropdownWidth - 10))

        // Final vertical boundary check
        top = Math.max(10, Math.min(top, viewportHeight - dropdownHeight - 10))

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
          className="fixed z-50 w-[480px] max-w-[85vw] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
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