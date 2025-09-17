'use client'

import React from 'react';
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
  if (!strongsNumber || !definition) return null;

  // Calculate position to keep popover within viewport
  const calculatePosition = (): { left: number; top: number; arrowPosition: 'top' | 'bottom'; arrowLeft: number } => {
    const popoverWidth = 400; // max-width of popover
    const popoverHeight = 180; // More accurate typical height for most Strong's definitions
    const padding = 20; // padding from edges
    const arrowHeight = 8; // Height of the arrow pointer
    const clickMargin = 4; // Small margin from the clicked element

    // Store the original click position for arrow placement
    const originalX = position.x;
    let left = position.x;
    let top = position.y;
    let arrowPosition: 'top' | 'bottom' = 'top';

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Check if the click position suggests it's from the bottom (parallel comparison)
    // Consider it from bottom if click is in lower third of viewport
    const isFromBottom = position.y > viewportHeight - 350;

    if (isFromBottom) {
      // Position popover above the click point
      // position.y is rect.top when near bottom, so we need to position just above it
      arrowPosition = 'bottom';
      top = position.y - popoverHeight - arrowHeight - clickMargin;

      // If it goes off the top, adjust
      if (top < padding) {
        top = padding;
      }
    } else {
      // Position popover below the click point
      // position.y is rect.bottom when not near bottom
      arrowPosition = 'top';
      top = position.y + arrowHeight + clickMargin;

      // If it goes off the bottom, position above instead
      if (top + popoverHeight > viewportHeight - padding) {
        arrowPosition = 'bottom';
        // When flipping to above, we need to account for the element height
        // position.y is rect.bottom, so we need to go up by popover height + element height (approx 20px)
        top = position.y - popoverHeight - arrowHeight - clickMargin - 20;

        // If still off screen at top, constrain to viewport
        if (top < padding) {
          top = padding;
          arrowPosition = 'top'; // Reset arrow if we had to constrain
        }
      }
    }

    // Position popover to avoid covering the clicked element
    // Try to position to the right of the click point first
    const elementWidth = 50; // Approximate width of a Strong's number element

    // Check if there's space on the right
    if (originalX + elementWidth + popoverWidth <= viewportWidth - padding) {
      // Position to the right of the element
      left = originalX + elementWidth;
    }
    // Check if there's space on the left
    else if (originalX - elementWidth - popoverWidth >= padding) {
      // Position to the left of the element
      left = originalX - elementWidth - popoverWidth;
    }
    // If no space on sides, center it but ensure we don't cover the element
    else {
      left = originalX - (popoverWidth / 2);

      // Adjust horizontal position if it goes off the right edge
      if (left + popoverWidth > viewportWidth - padding) {
        left = viewportWidth - popoverWidth - padding;
      }

      // Ensure it doesn't go off the left edge
      if (left < padding) {
        left = padding;
      }

      // Add extra vertical spacing when centered to avoid covering the element
      if (arrowPosition === 'top') {
        top += 10; // Add extra space below
      } else {
        top -= 10; // Add extra space above
      }
    }

    // Calculate arrow position relative to the popover
    const arrowLeft = Math.min(
      Math.max(20, originalX - left), // At least 20px from left edge
      popoverWidth - 20 // At least 20px from right edge
    );

    return { left, top, arrowPosition, arrowLeft };
  };

  const { left, top, arrowPosition, arrowLeft } = calculatePosition();
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Function to parse and make Strong's numbers clickable in the definition
  const parseDefinitionWithStrongs = (html: string): string => {
    if (!html) return '';
    
    // First handle <i> to <em> conversion
    let processedHtml = html.replace(/<i>/g, '<em>').replace(/<\/i>/g, '</em>');
    
    // Split the HTML into parts to avoid replacing Strong's numbers that are already links
    // We'll use a placeholder approach to protect existing links
    const linkPlaceholder = '###LINK###';
    const links: string[] = [];
    
    // First, extract and replace all existing <a> tags with placeholders
    processedHtml = processedHtml.replace(/<a[^>]*>.*?<\/a>/g, (match) => {
      links.push(match);
      return `${linkPlaceholder}${links.length - 1}${linkPlaceholder}`;
    });
    
    // Now replace all Strong's numbers that aren't already links
    // Make sure we're matching the pattern correctly
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

  return (
    <>
      {/* Arrow pointer */}
      <div
        className="popover-arrow"
        style={{
          position: 'fixed',
          left: left + arrowLeft - 8, // Center the arrow (arrow is 16px wide)
          top: arrowPosition === 'top' ? top - 8 : top + 180, // Position arrow at bottom of popover (180px is our estimated height)
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: arrowPosition === 'bottom' ? '8px solid #3b82f6' : 'none',
          borderBottom: arrowPosition === 'top' ? '8px solid #3b82f6' : 'none',
          zIndex: 10001
        }}
      />

      {/* Popover */}
      <div
        className="strongs-popover"
        id="strongs-popover-content"
        style={{
          position: 'fixed',
          left: left,
          top: top,
          backgroundColor: 'white',
          border: '2px solid #3b82f6',
          borderRadius: '8px',
          padding: '12px',
          maxWidth: '400px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), 0 6px 10px rgba(0, 0, 0, 0.1)',
          zIndex: 10000
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          marginBottom: '8px'
        }}>
          <div>
            <strong style={{ fontSize: '1.1em', color: '#2c3e50' }}>
              {strongsNumber}
            </strong>
            {definition.transliteration && (
              <span style={{
                marginLeft: '8px',
                fontStyle: 'italic',
                color: '#666'
              }}>
                {decodeHtmlEntities(definition.transliteration)}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {onBack && (
              <button
                onClick={onBack}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2em',
                  cursor: 'pointer',
                  padding: '0',
                  color: '#666'
                }}
                aria-label="Back"
                title="Back to previous"
              >
                ←
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2em',
                  cursor: 'pointer',
                  padding: '0',
                  color: '#666'
                }}
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {definition.word && (
          <div style={{
            fontSize: '1em',
            marginBottom: '6px',
            fontFamily: 'serif',
            color: '#1a1a1a'
          }}>
            {decodeHtmlEntities(definition.word)}
          </div>
        )}

        {definition.pronunciation && (
          <div style={{
            fontSize: '0.9em',
            color: '#666',
            marginBottom: '8px'
          }}>
            Pronunciation: <em>{decodeHtmlEntities(definition.pronunciation)}</em>
          </div>
        )}

        {definition.definition && (
          <div 
            style={{
              fontSize: '0.95em',
              lineHeight: '1.4',
              color: '#333'
            }}
            onClick={handleDefinitionClick}
            dangerouslySetInnerHTML={{ 
              __html: parseDefinitionWithStrongs(definition.definition)
            }}
          />
        )}
        
        {/* Display TVM (Tense/Voice/Mood) data for grammar codes */}
        {!definition.definition && definition.tvm && (
          <div 
            style={{
              fontSize: '0.95em',
              lineHeight: '1.4',
              color: '#333',
              backgroundColor: '#f3f4f6',
              padding: '10px',
              borderRadius: '4px',
              marginTop: '8px'
            }}
            onClick={handleDefinitionClick}
            dangerouslySetInnerHTML={{ 
              __html: parseDefinitionWithStrongs(definition.tvm)
            }}
          />
        )}
      </div>

      {/* Click outside to close - only for the topmost popover */}
      {onClose && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            background: 'transparent',
            cursor: 'default'
          }}
          onMouseDown={(e) => {
            // Use mousedown to intercept before click handlers
            const clickX = e.clientX;
            const clickY = e.clientY;

            // Temporarily hide overlay to get element underneath
            const overlay = e.currentTarget as HTMLElement;
            overlay.style.pointerEvents = 'none';
            const clickedElement = document.elementFromPoint(clickX, clickY);
            overlay.style.pointerEvents = 'auto';

            // Check if clicked on the popover itself
            if (clickedElement?.closest('#strongs-popover-content')) {
              return; // Don't close if clicking inside the popover
            }

            // Check if clicked on a Strong's number link
            const strongsLink = clickedElement?.classList?.contains('strongs-link')
              ? clickedElement as HTMLElement
              : clickedElement?.closest('.strongs-link') as HTMLElement;

            if (strongsLink) {
              // Prevent default to stop normal click flow
              e.preventDefault();
              e.stopPropagation();

              // Simulate click on the Strong's link to trigger its handler
              strongsLink.click();
              return;
            }

            // Otherwise close the popover
            onClose();
          }}
        />
      )}
    </>
  );
}