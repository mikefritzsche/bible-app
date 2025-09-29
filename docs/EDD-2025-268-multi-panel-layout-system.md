# Engineering Design Document: Multi-Panel Layout System with UI Templates

**Project:** Bible App - Enhanced Panel System
**Date:** 2025-09-25
**Version:** 1.0
**EDD ID:** 2025-268

## Executive Summary

This document outlines the design and implementation of an enhanced multi-panel layout system for the Bible application, featuring configurable panes for resources, notes, and user-selectable UI templates. The system will provide users with flexible workspace arrangements tailored to different study scenarios.

## Current State Analysis

### Existing Panel Infrastructure
- **SlideOutPanel Component**: Reusable slide-out panel with touch/mouse support
- **NotesPanel**: Left-positioned panel for note management with search
- **HistoryPanel**: Right-positioned panel for verse history
- **Modal System**: Single modals for settings, parallel views, etc.

### Current Limitations
- Limited to 2 panels maximum (notes + history)
- No simultaneous resource viewing
- Fixed positioning (notes always left, history always right)
- No template system for quick layout changes
- No additional resource panels (commentaries, dictionaries, etc.)

## Target Architecture

### Core Components

#### 1. Panel Management System
**File**: `lib/panels/PanelManager.ts`
```typescript
interface PanelManager {
  // Panel registration and lifecycle
  registerPanel(id: string, config: PanelConfig): void
  unregisterPanel(id: string): void

  // Layout management
  getActiveLayout(): PanelLayout
  setLayout(layoutId: string): void

  // Panel state management
  togglePanel(panelId: string): void
  showPanel(panelId: string): void
  hidePanel(panelId: string): void

  // Template management
  applyTemplate(templateId: string): void
  saveCustomTemplate(name: string): string
}
```

#### 2. Panel Registry
**File**: `lib/panels/PanelRegistry.ts`
- Central registry for all available panels
- Panel metadata (default position, size constraints, etc.)
- Panel factory functions

#### 3. Enhanced Panel Components
**Base**: `components/panels/BasePanel.tsx`
- Enhanced version of SlideOutPanel with more positioning options
- Support for docking, floating, and tabbed panels
- Resizable panels with drag handles

### Panel Types

#### 1. Resource Panels
- **Commentary Panel**: Show commentaries for current passage
- **Dictionary Panel**: Display dictionary/lexicon entries
- **CrossReference Panel**: Show related verses
- **Atlas Panel**: Display maps and geographical information

#### 2. Study Panels
- **Notes Panel**: Enhanced existing notes panel
- **Highlights Panel**: Manage all highlights
- **Bookmarks Panel**: Quick access to bookmarked passages

#### 3. Comparison Panels
- **Parallel Versions Panel**: Compare multiple translations
- **Manuscript Panel**: Show textual variants (if available)

### Layout Templates

#### Predefined Templates

1. **Study Focus**
   ```
   [Main Bible] [Notes]
   ```

2. **Research Mode**
   ```
   [Commentary] [Main Bible] [Dictionary]
   ```

3. **Sermon Prep**
   ```
   [Main Bible] [Parallel] [Notes]
   ```

4. **Devotional Reading**
   ```
   [Main Bible] (full width)
   ```

5. **Language Study**
   ```
   [Main Bible] [Strong's] [Dictionary]
   ```

#### Custom Templates
- Users can save custom panel arrangements
- Template persistence in localStorage
- Template sharing/export functionality

## Technical Implementation Plan

### Phase 1: Core Panel System

#### 1.1 Enhanced Panel Infrastructure
**Files**:
- `components/panels/BasePanel.tsx`
- `components/panels/PanelResizeHandle.tsx`
- `components/panels/PanelTabs.tsx`

**Features**:
- Resizable panels with minimum/maximum constraints
- Tabbed interface for multiple panels in same position
- Drag and drop reordering
- Keyboard shortcuts for panel navigation

#### 1.2 Panel Manager
**File**: `lib/panels/PanelManager.ts`

```typescript
interface PanelConfig {
  id: string
  title: string
  component: React.ComponentType<PanelProps>
  defaultPosition: 'left' | 'right' | 'bottom' | 'top' | 'floating'
  defaultSize: { width: number; height: number }
  minSize: { width: number; height: number }
  maxSize: { width: number; height: number }
  resizable: boolean
  dockable: boolean
  icon: string
  category: 'study' | 'resources' | 'comparison'
}
```

#### 1.3 State Management Integration
**File**: `lib/contexts/PanelContext.tsx`

```typescript
interface PanelState {
  activePanels: Set<string>
  panelLayouts: Map<string, PanelLayout>
  currentTemplate: string
  customTemplates: CustomTemplate[]
}
```

### Phase 2: Enhanced Panels

#### 2.1 Commentary Panel
**File**: `components/panels/CommentaryPanel.tsx`
- Fetch commentaries from APIs or local data
- Support for multiple commentary sources
- Synchronized with current Bible passage

#### 2.2 Dictionary Panel
**File**: `components/panels/DictionaryPanel.tsx`
- Integration with existing Strong's system
- Support for multiple dictionary sources
- Quick lookup from selected words

#### 2.3 Cross-Reference Panel
**File**: `components/panels/CrossReferencePanel.tsx`
- Show cross-references for current passage
- Click to navigate to referenced verses

### Phase 3: Template System

#### 3.1 Template Manager
**File**: `lib/panels/TemplateManager.ts`
- Save/load panel configurations
- Predefined templates for common use cases
- Template preview functionality

#### 3.2 Template Selector
**File**: `components/TemplateSelector.tsx`
- Visual template picker
- Quick template switching
- Custom template creation interface

## Data Models

### Panel Layout
```typescript
interface PanelLayout {
  id: string
  name: string
  description: string
  panels: PanelPosition[]
  createdAt: Date
  updatedAt: Date
  isBuiltin: boolean
}

interface PanelPosition {
  panelId: string
  position: 'left' | 'right' | 'bottom' | 'top' | 'floating'
  size: { width: number; height: number }
  order: number
  isVisible: boolean
  zIndex: number
}
```

### Template
```typescript
interface Template {
  id: string
  name: string
  description: string
  icon: string
  category: 'study' | 'research' | 'devotional' | 'teaching' | 'custom'
  layout: PanelLayout
  screenshot?: string
  author?: string
  isDefault: boolean
}
```

## UI/UX Considerations

### Panel Interactions
- **Keyboard Navigation**: Ctrl/Cmd + 1-9 for quick panel access
- **Drag & Drop**: Reorder panels by dragging headers
- **Resize**: Click and drag panel edges
- **Collapse/Expand**: Double-click panel headers
- **Quick Close**: Middle-click on panel tabs

### Responsive Design
- **Mobile**: Single panel at a time with swipe navigation
- **Tablet**: Support for 2 panels side-by-side
- **Desktop**: Multiple panels with flexible layouts

### Performance Optimizations
- Lazy loading of panel content
- Panel state persistence
- Efficient re-rendering with React.memo
- Virtual scrolling for long content

## Integration Points

### Existing Systems
1. **Settings Context**: Panel preferences and defaults
2. **BibleParser**: Current passage for panel synchronization
3. **StrongsManager**: Dictionary panel integration
4. **NotesManager**: Notes panel enhancement
5. **HighlightManager**: Highlights panel

### New Systems
1. **Resource Manager**: Commentary and external resource fetching
2. **Template Storage**: Template persistence
3. **Analytics**: Panel usage tracking (optional)

## Implementation Roadmap

### Week 1-2: Core Infrastructure
- [ ] Enhanced BasePanel component
- [ ] PanelManager implementation
- [ ] PanelContext integration
- [ ] Migration of existing Notes/History panels

### Week 3-4: New Panels
- [ ] Commentary panel implementation
- [ ] Dictionary panel enhancement
- [ ] Cross-reference panel
- [ ] Panel registry setup

### Week 5-6: Template System
- [ ] Template manager implementation
- [ ] Template selector UI
- [ ] Predefined templates
- [ ] Custom template creation

### Week 7-8: Polish & Testing
- [ ] Responsive design optimization
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Documentation updates

## Success Metrics

### Functional Metrics
- 5+ panel types available
- 5+ predefined templates
- Custom template creation working
- Panel state persistence
- Touch/mobile support

### User Experience Metrics
- Panel switching < 300ms
- Layout changes < 500ms
- Memory usage < 100MB per panel
- No layout breaking on resize

## Known Risks & Mitigations

### Performance Risks
- **Risk**: Multiple panels slow down the app
- **Mitigation**: Lazy loading and virtual scrolling

### Complexity Risks
- **Risk**: Too many options confuse users
- **Mitigation**: Sensible defaults and progressive disclosure

### Compatibility Risks
- **Risk**: Mobile viewport limitations
- **Mitigation**: Mobile-specific layout modes

## Future Enhancements

### Phase 2 Features
- Panel synchronization (e.g., commentary follows Bible)
- Split panels within panels
- Floating panels with absolute positioning
- Panel content sharing between users

### Phase 3 Features
- AI-powered panel suggestions
- Context-aware panel auto-showing
- Collaborative study panels
- Export/import panel configurations

## Conclusion

This enhanced panel system will significantly improve the Bible study experience by providing flexible, configurable workspaces that adapt to different user needs and study scenarios. The template system ensures quick access to optimal layouts for various study contexts.

---

**Document Status**: Draft
**Next Review**: With development team
**Approval Required**: Project Lead

### Expected layout content
📋 What to Look For in Each Layout

📖 Devotional Layout
Visual: Clean Bible text only, no colored panels
Width: Full-width Bible reading experience

🎯 Study Focus Layout
Visual: Bible text + Purple panel on right
Look for: Cross References panel with purple styling

🔬 Research Mode Layout
Visual: Blue panel (left) + Bible text + Purple panel (right)
Look for: Commentary on left, Cross References on right

📚 Language Study Layout
Visual: Green panel (left) + Bible text + Blue panel (right)
Look for: Dictionary on left, Commentary on right

🌟 Comprehensive Study Layout
Visual: Blue panel (left) + Bible text + Purple panel (right) + Green panel (bottom)
Look for: All three panels + bottom dictionary panel (most distinctive!)

👨‍🏫 Teaching Prep Layout
Visual: Bible text + Purple panel on right (larger)
Look for: Similar to Study Focus but different panel sizing
