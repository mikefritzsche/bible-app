'use client'

import React from 'react';
import type { VerseWithStrongsProps, ParsedTextPart } from '@/types/bible';
import { HIGHLIGHT_COLORS_LIGHT, HIGHLIGHT_COLORS_DARK } from '@/lib/HighlightManager';

export function VerseWithStrongs({ text, verseNumber, onStrongsClick, highlights, isDarkMode = false, fontSize, lineHeight }: VerseWithStrongsProps) {
  // Debug: log the original text and highlights
  if (highlights && highlights.length > 0) {
    console.log('VerseWithStrongs - Original text:', text);
    console.log('VerseWithStrongs - Highlights:', highlights);
    highlights.forEach(h => {
      console.log(`  Highlight: "${text.substring(h.startOffset, h.endOffset)}" at [${h.startOffset}, ${h.endOffset}]`);
    });
  }

  // Parse the text to separate words from Strong's numbers and handle punctuation correctly
  const parseVerseText = (text: string): ParsedTextPart[] => {
    const parts: ParsedTextPart[] = [];

    // Handle {{ pattern - everything from {{ to end of text should be italicized
    let processedText = text;
    const doubleBraceIndex = text.indexOf('{{');
    if (doubleBraceIndex !== -1) {
      // Debug logging
      console.log('Found {{ pattern in verse:', text);

      // Split at the {{ and wrap the rest in brackets for italics
      const beforeBrace = text.substring(0, doubleBraceIndex);
      const afterBrace = text.substring(doubleBraceIndex + 2); // Skip the {{
      processedText = beforeBrace + '[' + afterBrace + ']';

      console.log('Processed to:', processedText);
    }

    // Split by Strong's numbers and bracketed text
    const segments = processedText.split(/(\{[^}]+\}|\[[^\]]+\])/);

    let pendingTrailingSpace = '';

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      if (segment.startsWith('[') && segment.endsWith(']')) {
        // This is bracketed text (translator addition) - should be italicized
        const content = segment.slice(1, -1); // Remove brackets
        parts.push({
          type: 'italic',
          content: content
        });

        // Add any pending trailing space
        if (pendingTrailingSpace) {
          parts.push({
            type: 'text',
            content: pendingTrailingSpace
          });
          pendingTrailingSpace = '';
        }
      } else if (segment.startsWith('{') && segment.endsWith('}')) {
        // This is a Strong's number
        const strongsMatch = segment.match(/[HG]\d{1,5}/);

        if (strongsMatch) {
          const cleanStrongsNumber = strongsMatch[0];
          const numPart = cleanStrongsNumber.slice(1);
          const isGrammarCode = numPart.length > 4 || (numPart.length === 4 && numPart[0] >= '8');

          parts.push({
            type: 'strongs',
            content: cleanStrongsNumber,
            display: cleanStrongsNumber,
            isGrammar: isGrammarCode
          });

          // Add any pending trailing space after Strong's number
          if (pendingTrailingSpace) {
            parts.push({
              type: 'text',
              content: pendingTrailingSpace
            });
            pendingTrailingSpace = '';
          }
        }
      } else if (segment) {
        // This is regular text - split words from trailing punctuation
        // Look ahead to see if next segment is Strong's or bracketed text
        const hasFollowingStrongs = (i + 1 < segments.length &&
                                   segments[i + 1].startsWith('{') &&
                                   segments[i + 1].endsWith('}'));
        
        if (hasFollowingStrongs) {
          // When followed by Strong's, we need to separate word from punctuation
          // Pattern: word + punctuation, then Strong's should come after punctuation
          const wordPuncMatch = segment.match(/^(\s*)(.+?)([.,;:!?'"]+)(\s*)$/);
          
          if (wordPuncMatch) {
            const leadingSpace = wordPuncMatch[1];
            const word = wordPuncMatch[2];
            const punctuation = wordPuncMatch[3];
            const trailingSpace = wordPuncMatch[4];
            
            // Add leading space
            if (leadingSpace) {
              parts.push({
                type: 'text',
                content: leadingSpace
              });
            }
            
            // Add the word
            if (word) {
              parts.push({
                type: 'text',
                content: word
              });
            }
            
            // Add punctuation before Strong's number
            if (punctuation) {
              parts.push({
                type: 'text',
                content: punctuation
              });
            }
            
            // Save trailing space for after Strong's number
            if (trailingSpace) {
              pendingTrailingSpace = trailingSpace;
            }
          } else {
            // No punctuation found, or different pattern - add as word only
            const trimmedSegment = segment.trim();
            if (trimmedSegment) {
              const leadingSpace = segment.match(/^(\s*)/)?.[1] || '';
              const trailingSpace = segment.match(/(\s*)$/)?.[1] || '';
              
              if (leadingSpace) {
                parts.push({
                  type: 'text',
                  content: leadingSpace
                });
              }
              
              parts.push({
                type: 'text',
                content: trimmedSegment
              });
              
              // Save trailing space for after Strong's
              if (trailingSpace) {
                pendingTrailingSpace = trailingSpace;
              }
            }
          }
        } else {
          // No following Strong's, keep text as is
          if (segment.trim()) {
            parts.push({
              type: 'text',
              content: segment
            });
          }
        }
      }
    }
    
    // Add any remaining trailing space at the end
    if (pendingTrailingSpace) {
      parts.push({
        type: 'text',
        content: pendingTrailingSpace
      });
    }
    
    return parts;
  };

  const handleStrongsClick = (e: React.MouseEvent<HTMLAnchorElement>, strongsNumber: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Get position for popover - center it horizontally on the clicked element
    const rect = e.currentTarget.getBoundingClientRect();
    const elementCenterX = rect.left + (rect.width / 2);

    // Check if click is from bottom of viewport (likely the parallel comparison panel)
    // If so, position popover above the element instead of below
    const viewportHeight = window.innerHeight;
    const isNearBottom = rect.bottom > viewportHeight - 300; // Within 300px of bottom

    const position = {
      x: elementCenterX, // Center the popover on the Strong's number
      y: isNearBottom ? rect.top : rect.bottom
    };

    // Call parent handler with Strong's number and position
    if (onStrongsClick) {
      onStrongsClick(strongsNumber, position);
    }
  };

  const parsedText = parseVerseText(text);

  return (
    <span>
      {verseNumber !== null && (
        <strong className="text-blue-600 dark:text-blue-400 mr-2">{verseNumber}</strong>
      )}
      {parsedText.map((part, index) => {
        if (part.type === 'text') {
          // Check if this text part needs highlighting
          if (highlights && highlights.length > 0) {
            // Calculate the position of this text part in the ORIGINAL text (with Strong's codes)
            // Build up the position by reconstructing what came before
            let reconstructed = '';
            for (let i = 0; i < index; i++) {
              if (parsedText[i].type === 'text') {
                reconstructed += parsedText[i].content;
              } else if (parsedText[i].type === 'strongs') {
                // Check if this Strong's code appears with parentheses in the original
                // Some codes are like {H1234} and some are like {(H8804)}
                const strongsNum = parsedText[i].content;
                // Look for this Strong's number in the original text
                if (text.includes(`{(${strongsNum})}`)) {
                  reconstructed += `{(${strongsNum})}`;
                } else {
                  reconstructed += `{${strongsNum}}`;
                }
              }
            }
            const originalPos = reconstructed.length;
            
            console.log(`Text part ${index}: "${part.content}" starts at position ${originalPos}`);
            
            const textContent = part.content;
            const segments: React.ReactNode[] = [];
            let lastEnd = 0;
            
            // Find highlights that apply to this text segment
            const relevantHighlights = highlights.filter(h => {
              const segmentEnd = originalPos + textContent.length;
              return h.startOffset < segmentEnd && h.endOffset > originalPos;
            }).sort((a, b) => a.startOffset - b.startOffset);
            
            relevantHighlights.forEach((highlight, hIndex) => {
              // Calculate relative positions within this text segment
              const relativeStart = Math.max(0, highlight.startOffset - originalPos);
              const relativeEnd = Math.min(textContent.length, highlight.endOffset - originalPos);
              
              if (relativeStart < relativeEnd && relativeStart >= 0 && relativeEnd <= textContent.length) {
                // Add unhighlighted text before this highlight
                if (relativeStart > lastEnd) {
                  segments.push(textContent.substring(lastEnd, relativeStart));
                }
                
                // Add highlighted text
                const colorKey = highlight.color as keyof typeof HIGHLIGHT_COLORS_LIGHT;
                const color = isDarkMode ? HIGHLIGHT_COLORS_DARK[colorKey] : HIGHLIGHT_COLORS_LIGHT[colorKey];
                
                segments.push(
                  <span
                    key={`highlight-${index}-${hIndex}`}
                    style={{
                      backgroundColor: color,
                      padding: '2px 4px',
                      borderRadius: '3px'
                    }}
                  >
                    {textContent.substring(relativeStart, relativeEnd)}
                  </span>
                );
                
                lastEnd = relativeEnd;
              }
            });
            
            // Add any remaining unhighlighted text
            if (lastEnd < textContent.length) {
              segments.push(textContent.substring(lastEnd));
            }
            
            // Return segments if we created any, otherwise just the text
            return segments.length > 0 ? <span key={index}>{segments}</span> : <span key={index}>{part.content}</span>;
          }
          
          return <span key={index}>{part.content}</span>;
        } else if (part.type === 'italic') {
          // Render italicized text (translator additions)
          return <em key={index} className="font-light">{part.content}</em>;
        } else if (part.type === 'strongs') {
          return (
            <sup key={index}>
              <a
                href="#"
                className={`strongs-link ml-0.5 mr-0.5 px-1 py-0.5 rounded transition-all opacity-85 hover:opacity-100 ${
                  part.isGrammar
                    ? 'text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                    : 'text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                }`}
                onClick={(e) => handleStrongsClick(e, part.content)}
                style={{
                  textDecoration: 'none',
                  fontSize: '0.85em',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
                title={`Click to see Strong's ${part.content}${part.isGrammar ? ' (Grammar)' : ''}`}
              >
                {part.display}
              </a>
            </sup>
          );
        }
        return null;
      })}
    </span>
  );
}