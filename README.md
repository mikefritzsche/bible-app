# Bible Reading App (Next.js + TypeScript)

A modern Bible reading application built with Next.js 14, TypeScript, and React 18, featuring Strong's Concordance integration with clickable references and full type safety.

## Features

- 📖 **KJV Bible with Strong's Numbers** - Read the King James Version with integrated Strong's references
- 🔗 **Clickable Strong's Numbers** - Click any Strong's number to see its definition
- 📚 **Grammar Codes** - Special handling for Hebrew/Greek grammar codes (displayed in purple)
- 🔄 **Navigation History** - Navigate through Strong's references with back button support
- 📱 **Viewport Awareness** - Popovers automatically adjust to stay within the viewport
- ⌨️ **Keyboard Support** - Press Escape to close popovers or navigate back

## Strong's Number Formats Supported

- `{H1234}` - Standard Strong's Hebrew numbers (blue)
- `{G5678}` - Standard Strong's Greek numbers (blue)
- `{(H8802)}` - Grammar codes with parentheses (purple)
- `{H8798)}` - Grammar codes with trailing parenthesis (purple)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
# or
PORT=3001 npm run dev  # to use a different port
```

3. Open [http://localhost:3000](http://localhost:3000) (or your specified port) in your browser

## Project Structure

```
bible-app/
├── app/
│   ├── layout.tsx      # Root layout with TypeScript
│   ├── page.tsx        # Main Bible reader page
│   └── globals.css     # Global styles
├── components/
│   ├── VerseWithStrongs.tsx  # Verse rendering with Strong's links
│   └── StrongsPopover.tsx    # Popover for Strong's definitions
├── lib/
│   ├── KJVBibleParser.ts     # Bible data parser with types
│   ├── StrongsManager.ts     # Strong's concordance manager
│   └── bible-versions.js     # Bible version configurations
├── types/
│   └── bible.ts        # TypeScript type definitions
└── public/
    └── bibles/
        ├── kjv-strongs.json     # KJV Bible with Strong's
        └── extras/
            └── strongs_definitions.json  # Strong's definitions

```

## Usage

1. **Select a Book and Chapter**: Use the dropdown and input field to navigate
2. **Click Strong's Numbers**: Click on any blue or purple number to see its definition
3. **Navigate Definitions**: Click Strong's numbers within definitions to explore related terms
4. **Use Navigation**: Use the back arrow (←) to go back or × to close
5. **Keyboard Shortcuts**: Press Escape to close or go back

## Development

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Technical Details

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict mode
- **React Version**: React 18 (stable)
- **Type Safety**: Full type definitions for all components and data structures
- **Styling**: CSS modules and inline styles
- **State Management**: React useState and useEffect hooks with TypeScript
- **Data Source**: KJV Bible with Strong's numbers in JSON format

## Features Implemented

✅ All Strong's number formats supported  
✅ Grammar codes with TVM (Tense/Voice/Mood) data  
✅ Viewport-aware popovers  
✅ Navigation history with back button  
✅ Clean number extraction from various formats  
✅ HTML entity decoding  
✅ Clickable Strong's references within definitions  

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project uses public domain Bible texts and Strong's Concordance data.

## Acknowledgments

- King James Version Bible (Public Domain)
- Strong's Concordance (Public Domain)
- Next.js team for the excellent framework