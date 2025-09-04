'use client'

import React from 'react';
import type { VerseWithStrongsProps, ParsedTextPart } from '@/types/bible';
import { HIGHLIGHT_COLORS_LIGHT, HIGHLIGHT_COLORS_DARK } from '@/lib/HighlightManager';

export function VerseWithStrongs({ text, verseNumber, onStrongsClick, highlights, isDarkMode = false }: VerseWithStrongsProps) {
  // Debug: log the original text and highlights
  if (highlights && highlights.length > 0) {
    console.log('VerseWithStrongs - Original text:', text);
    console.log('VerseWithStrongs - Highlights:', highlights);
    highlights.forEach(h => {
      console.log(`  Highlight: "${text.substring(h.startOffset, h.endOffset)}" at [${h.startOffset}, ${h.endOffset}]`);
    });
  }
  
  // Parse the text to separate words from Strong's numbers
  const parseVerseText = (text: string): ParsedTextPart[] => {
    const parts: ParsedTextPart[] = [];
    
    // More comprehensive pattern to match:
    // - Regular text (words, punctuation, spaces)
    // - Strong's numbers in various formats: {H1234}, {(H8804)}, {H853}, etc.
    const pattern = /(\{[^}]+\})|([^{]+)/g;
    let match;
    
    while ((match = pattern.exec(text)) !== null) {
      if (match[1]) {
        // This is a Strong's number
        const strongsText = match[1];
        
        // Extract the actual Strong's number from various formats
        // Handles: {H1234}, {(H8804)}, {G5547}, etc.
        const strongsMatch = strongsText.match(/[HG]\d{1,5}/);
        
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
        }
      } else if (match[2]) {
        // This is regular text
        const textContent = match[2];
        if (textContent.trim()) {
          parts.push({
            type: 'text',
            content: textContent
          });
        }
      }
    }
    
    return parts;
  };

  const handleStrongsClick = (e: React.MouseEvent<HTMLAnchorElement>, strongsNumber: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get position for popover
    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      x: rect.left,
      y: rect.bottom + 5
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
        } else if (part.type === 'strongs') {
          return (
            <sup key={index}>
              <a
                href="#"
                className={`strongs-link text-xs ml-px mr-1 px-0.5 rounded transition-all opacity-70 hover:opacity-100 ${
                  part.isGrammar 
                    ? 'text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30' 
                    : 'text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                }`}
                onClick={(e) => handleStrongsClick(e, part.content)}
                style={{
                  textDecoration: 'none',
                  fontSize: '0.7em',
                  cursor: 'pointer',
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