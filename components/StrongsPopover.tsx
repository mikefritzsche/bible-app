'use client'

import React, { useEffect, useState } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import type { StrongsPopoverProps } from '@/types/bible';

// Helper function to decode HTML entities
function decodeHtmlEntities(text: string): string {
  if (typeof document === 'undefined') return text;
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
}

export function StrongsPopover({
  strongsNumber,
  definition,
  position,
  onClose,
  onStrongsClick,
  onBack,
  hasHistory
}: StrongsPopoverProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [currentTranslateY, setCurrentTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 10);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!strongsNumber || !definition) return null;

  // Function to parse and make Strong's numbers clickable in the definition
  const parseDefinitionWithStrongs = (html: string): string => {
    if (!html) return '';

    // First handle <i> to <em> conversion
    let processedHtml = html.replace(/<i>/g, '<em>').replace(/<\/i>/g, '</em>');

    // Split the HTML into parts to avoid replacing Strong's numbers that are already links
    const linkPlaceholder = '###LINK###';
    const links: string[] = [];

    // First, extract and replace all existing <a> tags with placeholders
    processedHtml = processedHtml.replace(/<a[^>]*>.*?<\/a>/g, (match) => {
      links.push(match);
      return `${linkPlaceholder}${links.length - 1}${linkPlaceholder}`;
    });

    // Now replace all Strong's numbers that aren't already links
    processedHtml = processedHtml.replace(/\b([HG]\d{1,5})\b/g, (match, strongsNum) => {
      return `<a href="#" class="strongs-link" data-strongs="${strongsNum}" style="color: #3b82f6; text-decoration: none; border-bottom: 1px dotted #3b82f6; cursor: pointer;">${strongsNum}</a>`;
    });

    // Restore the original links
    processedHtml = processedHtml.replace(new RegExp(`${linkPlaceholder}(\\d+)${linkPlaceholder}`, 'g'), (match, index) => {
      return links[parseInt(index)];
    });

    return processedHtml;
  };

  // Handle clicks on Strong's numbers within the definition
  const handleDefinitionClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList?.contains('strongs-link')) {
      e.preventDefault();
      e.stopPropagation();
      const strongsNum = target.getAttribute('data-strongs');
      if (onStrongsClick && strongsNum) {
        // Get position for new popover
        const rect = target.getBoundingClientRect();
        const newPosition = {
          x: rect.left,
          y: rect.bottom + 5
        };
        onStrongsClick(strongsNum, newPosition);
      }
    }
  };

  // Touch event handlers for swipe to dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setDragStartY(touch.clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY === null) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - dragStartY;

    // Only allow dragging down (positive deltaY)
    if (deltaY > 0) {
      setCurrentTranslateY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (currentTranslateY > 100) {
      // If dragged down more than 100px, close the sheet
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    } else {
      // Otherwise, snap back to original position
      setCurrentTranslateY(0);
    }
    setDragStartY(null);
    setIsDragging(false);
  };

  // Mobile Bottom Sheet
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black transition-opacity duration-300 z-[9998] ${
            isVisible ? 'bg-opacity-50' : 'bg-opacity-0'
          }`}
          onClick={onClose}
        />

        {/* Bottom Sheet */}
        <div
          className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl z-[9999] ${
            !isDragging ? 'transition-transform duration-300' : ''
          }`}
          style={{
            maxHeight: '75vh',
            transform: isVisible
              ? `translateY(${currentTranslateY}px)`
              : 'translateY(100%)'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Back"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {strongsNumber}
                </h3>
                {definition.transliteration && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    {decodeHtmlEntities(definition.transliteration)}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-4 overflow-y-auto" style={{ maxHeight: 'calc(75vh - 120px)' }}>
            {definition.pronunciation && (
              <div className="mb-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pronunciation: </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{definition.pronunciation}</span>
              </div>
            )}

            <div
              className="text-base text-gray-800 dark:text-gray-200 leading-relaxed"
              onClick={handleDefinitionClick}
              dangerouslySetInnerHTML={{
                __html: parseDefinitionWithStrongs(definition.definition || '')
              }}
            />
          </div>
        </div>
      </>
    );
  }

  // Desktop Popover (existing implementation)
  const calculatePosition = (): { left: number; top: number; arrowPosition: 'top' | 'bottom'; arrowLeft: number } => {
    const popoverWidth = 400;
    const popoverHeight = 180;
    const padding = 20;
    const arrowHeight = 8;
    const clickMargin = 4;

    const originalX = position.x;
    let left = position.x;
    let top = position.y;
    let arrowPosition: 'top' | 'bottom' = 'top';

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const isFromBottom = position.y > viewportHeight - 350;

    if (isFromBottom) {
      arrowPosition = 'bottom';
      top = position.y - popoverHeight - arrowHeight - clickMargin;

      if (top < padding) {
        top = padding;
      }
    } else {
      arrowPosition = 'top';
      top = position.y + arrowHeight + clickMargin;

      if (top + popoverHeight > viewportHeight - padding) {
        arrowPosition = 'bottom';
        top = position.y - popoverHeight - arrowHeight - clickMargin - 20;

        if (top < padding) {
          top = padding;
          arrowPosition = 'top';
        }
      }
    }

    const elementWidth = 50;

    if (originalX + elementWidth + popoverWidth <= viewportWidth - padding) {
      left = originalX + elementWidth;
    } else if (originalX - elementWidth - popoverWidth >= padding) {
      left = originalX - elementWidth - popoverWidth;
    } else {
      left = originalX - (popoverWidth / 2);

      if (left + popoverWidth > viewportWidth - padding) {
        left = viewportWidth - popoverWidth - padding;
      }

      if (left < padding) {
        left = padding;
      }

      if (arrowPosition === 'top') {
        top += 10;
      } else {
        top -= 10;
      }
    }

    const arrowLeft = Math.min(
      Math.max(20, originalX - left),
      popoverWidth - 20
    );

    return { left, top, arrowPosition, arrowLeft };
  };

  const { left, top, arrowPosition, arrowLeft } = calculatePosition();

  return (
    <>
      {/* Arrow pointer */}
      <div
        className="popover-arrow"
        style={{
          position: 'fixed',
          left: left + arrowLeft - 8,
          top: arrowPosition === 'top' ? top - 8 : top + 180,
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: arrowPosition === 'bottom' ? '8px solid #3b82f6' : 'none',
          borderBottom: arrowPosition === 'top' ? '8px solid #3b82f6' : 'none',
          zIndex: 10001
        }}
      />

      {/* Desktop Popover */}
      <div
        className="strongs-popover bg-white dark:bg-gray-800 border-2 border-blue-500"
        style={{
          position: 'fixed',
          left: left,
          top: top,
          borderRadius: '8px',
          padding: '12px',
          maxWidth: '400px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), 0 6px 10px rgba(0, 0, 0, 0.1)',
          zIndex: 10000
        }}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <strong className="text-lg text-gray-900 dark:text-gray-100">
              {strongsNumber}
            </strong>
            {definition.transliteration && (
              <span className="ml-2 italic text-gray-600 dark:text-gray-400">
                {decodeHtmlEntities(definition.transliteration)}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Back"
                title="Back to previous"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close"
              title="Close"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {definition.pronunciation && (
          <div className="mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pronunciation: </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{definition.pronunciation}</span>
          </div>
        )}

        <div
          className="text-sm text-gray-800 dark:text-gray-200"
          onClick={handleDefinitionClick}
          dangerouslySetInnerHTML={{
            __html: parseDefinitionWithStrongs(definition.definition || '')
          }}
        />
      </div>
    </>
  );
}