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
  const calculatePosition = (): { left: number; top: number } => {
    const popoverWidth = 400; // max-width of popover
    const popoverHeight = 300; // estimated height
    const padding = 20; // padding from edges
    
    let left = position.x;
    let top = position.y;
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Adjust horizontal position if it goes off the right edge
    if (left + popoverWidth > viewportWidth - padding) {
      left = viewportWidth - popoverWidth - padding;
    }
    
    // Ensure it doesn't go off the left edge
    if (left < padding) {
      left = padding;
    }
    
    // Adjust vertical position if it goes off the bottom edge
    if (top + popoverHeight > viewportHeight - padding) {
      // Try to position above the trigger point instead
      top = position.y - popoverHeight - 10;
      
      // If still off screen, just position at bottom of viewport
      if (top < padding) {
        top = viewportHeight - popoverHeight - padding;
      }
    }
    
    // Ensure it doesn't go off the top edge
    if (top < padding) {
      top = padding;
    }
    
    return { left, top };
  };

  const { left, top } = calculatePosition();

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
      {/* Popover */}
      <div
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
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
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
            background: 'transparent'
          }}
          onClick={onClose}
        />
      )}
    </>
  );
}