// Helper function to process Bible text formatting for display
export function processBibleText(text: string): string {
  if (!text) return text;

  let processedText = text;

  // Handle {{ pattern for italics - convert to HTML italics
  processedText = processedText.replace(/\{\{([^}]+)\}\}/g, '<em>$1</em>');

  // Handle HTML entities that might be in the raw text
  if (typeof document !== 'undefined') {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = processedText;
    processedText = textArea.value;
  } else {
    // Server-side fallback - handle common entities
    processedText = processedText
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  return processedText;
}

