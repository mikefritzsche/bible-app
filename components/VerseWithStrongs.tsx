'use client'

import React from 'react';
import type { VerseWithStrongsProps, ParsedTextPart } from '@/types/bible';

export function VerseWithStrongs({ text, verseNumber, onStrongsClick }: VerseWithStrongsProps) {
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
      <strong>{verseNumber}.</strong>{' '}
      {parsedText.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index}>{part.content}</span>;
        } else if (part.type === 'strongs') {
          return (
            <sup>
              <a
                key={index}
                href="#"
                className="strongs-link"
                onClick={(e) => handleStrongsClick(e, part.content)}
                style={{
                  color: part.isGrammar ? '#9333ea' : '#2563eb',
                  textDecoration: 'none',
                  fontSize: '0.7em',
                  marginLeft: '1px',
                  marginRight: '3px',
                  cursor: 'pointer',
                  padding: '0px 2px',
                  borderRadius: '2px',
                  transition: 'all 0.2s',
                  opacity: 0.7
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = part.isGrammar ? '#f3e8ff' : '#dbeafe';
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.opacity = '0.7';
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