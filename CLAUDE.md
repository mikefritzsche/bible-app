# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development Server
```bash
npm run dev                    # Start Next.js development server on port 3000
npm run build                  # Build Next.js application for production
npm start                      # Start production server
npm run lint                   # Run ESLint on the codebase
```

### Electron Development
```bash
npm run electron-dev           # Start Next.js dev server + Electron app
npm run electron-build         # Build Next.js app for Electron
npm run electron-pack          # Build and package Electron app with electron-builder
npm run dist                   # Build and create distributable (no publish)
```

## Architecture Overview

This is a **hybrid Next.js + Electron Bible reading application** with the following key architectural patterns:

### Core Technologies
- **Next.js 14** with App Router and TypeScript
- **Electron** for desktop distribution
- **Tailwind CSS** with dark mode support (`class` strategy)
- **React 18** with hooks and context patterns

### Application Structure

#### Data Layer (`lib/`)
- **BibleParser.ts**: Handles Bible text parsing and verse data management
- **StrongsManager.ts**: Manages Strong's Concordance definitions and lookups
- **CloudSyncManager.ts**: Core sync orchestration with pluggable adapter pattern
- **sync/**: Cloud sync adapters (GoogleDriveAdapter, FileSystemAdapter)
- **Manager classes**: Dedicated managers for Highlights, Notes, VerseHistory, ReadingPlans

#### UI Architecture (`app/` & `components/`)
- **Context Providers**: ThemeContext, SettingsContext for global state
- **Route Pages**: Main Bible reader (`/`), reading plans, settings, sync utilities
- **Core Components**: 
  - `VerseWithStrongs.tsx`: Renders verses with clickable Strong's numbers
  - `StrongsPopover.tsx`: Context-aware popover for definitions
  - `Navigation.tsx`: App-wide navigation and theme control

#### Data Sources (`public/bibles/`)
- **JSON format**: Multiple Bible versions (KJV, ASV, Geneva, etc.)
- **Strong's integration**: `kjv_strongs.json` with embedded Strong's numbers
- **Definitions**: `extras/strongs_definitions.json` for Hebrew/Greek concordance

### Key Patterns

#### Context Management
Uses React Context for theme and settings management with providers in root layout.

#### Strong's Number Processing
Supports multiple formats: `{H1234}`, `{G5678}`, `{(H8802)}`, `{H8798)}` with grammar code detection.

#### Cloud Sync Architecture
Plugin-based sync system with `CloudSyncAdapter` interface supporting Google Drive and File System adapters.

#### Electron Integration
- Uses `output: 'export'` for static export compatibility
- Asset prefix handling for production builds
- Preload scripts for secure main/renderer communication

## Development Workflow

### Working with Bible Data
- Bible versions are stored in `public/bibles/json/` as structured JSON
- Strong's definitions are in `public/bibles/extras/strongs_definitions.json`
- Use `BibleParser` for consistent data access patterns

### Adding New Features
1. Follow existing manager pattern for data operations (`lib/`)
2. Use TypeScript interfaces from `types/bible.ts`
3. Integrate with existing context providers for state management
4. Follow component patterns in existing UI components

### Sync System Development
- Implement `CloudSyncAdapter` interface for new sync providers
- Register adapters with `CloudSyncManager`
- Follow conflict resolution patterns in existing adapters

### Electron-specific Considerations
- Test both web and electron environments
- Use conditional rendering for electron-only features
- Ensure asset paths work in both development and production builds

## Environment Configuration

### Required for Google Drive Sync
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_API_KEY=your-api-key
```

### Build Configuration
- Next.js configured for static export (`output: 'export'`)
- Electron builder configuration in `package.json` for multi-platform builds
- TypeScript strict mode enabled with path aliases (`@/*`)

## Testing Requirements

### IMPORTANT: Testing Policy
- **ALWAYS run tests after creating or updating code** using `npm test`
- **Create unit tests for any new functions, components, or features**
- **Update existing tests when modifying code to ensure they still pass**
- **Never commit code without ensuring all tests pass**

### Testing Stack
- Use `jest` for unit tests
- Use `@testing-library/react` for component testing
- Use `@testing-library/jest-dom` for DOM assertions
- Run tests with: `npm test`
- Run tests in watch mode: `npm test:watch`
- Generate coverage report: `npm test:coverage`

### Strong's Number Testing
Test with various formats in verse text:
- Standard Hebrew: `{H1234}`
- Standard Greek: `{G5678}` 
- Grammar codes: `{(H8802)}`, `{H8798)}`

### Sync Testing
Use the sync debug pages (`/sync-debug`, `/sync-demo`) to test cloud sync functionality without affecting real data.

### Cross-Platform Testing
Test in both browser (`npm run dev`) and Electron (`npm run electron-dev`) environments as behaviors can differ.