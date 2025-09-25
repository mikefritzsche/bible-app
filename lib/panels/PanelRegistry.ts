import React from 'react'
import { PanelConfig, PanelPosition, PanelSize } from './types'

// Simple placeholder components
const CommentaryPlaceholder = () => {
  return React.createElement('div', { className: 'p-4' }, [
    React.createElement('h3', {
      key: 'title',
      className: 'text-lg font-semibold mb-4'
    }, 'Commentary'),
    React.createElement('p', {
      key: 'content',
      className: 'text-gray-600 dark:text-gray-400'
    }, 'Commentary panel will be implemented in a future update.')
  ])
}

const DictionaryPlaceholder = () => {
  return React.createElement('div', { className: 'p-4' }, [
    React.createElement('h3', {
      key: 'title',
      className: 'text-lg font-semibold mb-4'
    }, 'Dictionary'),
    React.createElement('p', {
      key: 'content',
      className: 'text-gray-600 dark:text-gray-400'
    }, 'Dictionary panel will be implemented in a future update.')
  ])
}

const CrossReferencesPlaceholder = () => {
  return React.createElement('div', { className: 'p-4' }, [
    React.createElement('h3', {
      key: 'title',
      className: 'text-lg font-semibold mb-4'
    }, 'Cross References'),
    React.createElement('p', {
      key: 'content',
      className: 'text-gray-600 dark:text-gray-400'
    }, 'Cross references panel will be implemented in a future update.')
  ])
}

const ParallelVersionsPlaceholder = () => {
  return React.createElement('div', { className: 'p-4' }, [
    React.createElement('h3', {
      key: 'title',
      className: 'text-lg font-semibold mb-4'
    }, 'Parallel Versions'),
    React.createElement('p', {
      key: 'content',
      className: 'text-gray-600 dark:text-gray-400'
    }, 'Parallel versions panel will be implemented in a future update.')
  ])
}

export class PanelRegistry {
  private static instance: PanelRegistry
  private panels: Map<string, PanelConfig> = new Map()

  private constructor() {
    this.registerDefaultPanels()
  }

  static getInstance(): PanelRegistry {
    if (!PanelRegistry.instance) {
      PanelRegistry.instance = new PanelRegistry()
    }
    return PanelRegistry.instance
  }

  registerPanel(config: PanelConfig): void {
    this.panels.set(config.id, config)
  }

  unregisterPanel(panelId: string): void {
    this.panels.delete(panelId)
  }

  getPanel(panelId: string): PanelConfig | undefined {
    return this.panels.get(panelId)
  }

  getAllPanels(): PanelConfig[] {
    return Array.from(this.panels.values())
  }

  getPanelsByCategory(category: string): PanelConfig[] {
    return this.getAllPanels().filter(panel => panel.category === category)
  }

  getVisiblePanels(): PanelConfig[] {
    return this.getAllPanels().filter(panel => panel.defaultVisible)
  }

  private registerDefaultPanels(): void {
    // Notes Panel - will be imported from components/panels/NotesPanel
    this.registerPanel({
      id: 'notes',
      title: 'Notes',
      description: 'View and manage your study notes',
      icon: '📝',
      category: 'study',
      defaultPosition: 'right' as PanelPosition,
      defaultSize: { width: 320, height: 600 },
      minSize: { width: 250, height: 300 },
      maxSize: { width: 500, height: 800 },
      resizable: true,
      dockable: true,
      closable: true,
      defaultVisible: false,
      keyboardShortcut: 'CmdOrCtrl+N',
      component: null as any // Will be set dynamically
    })

    // History Panel - will be imported from components/panels/HistoryPanel
    this.registerPanel({
      id: 'history',
      title: 'History',
      description: 'View your reading history',
      icon: '📚',
      category: 'study',
      defaultPosition: 'right' as PanelPosition,
      defaultSize: { width: 320, height: 600 },
      minSize: { width: 250, height: 300 },
      maxSize: { width: 500, height: 800 },
      resizable: true,
      dockable: true,
      closable: true,
      defaultVisible: false,
      keyboardShortcut: 'CmdOrCtrl+H',
      component: null as any // Will be set dynamically
    })

    // Commentary Panel
    this.registerPanel({
      id: 'commentary',
      title: 'Commentary',
      description: 'View commentaries for current passage',
      icon: '📖',
      category: 'resources',
      defaultPosition: 'left' as PanelPosition,
      defaultSize: { width: 300, height: 600 },
      minSize: { width: 250, height: 300 },
      maxSize: { width: 500, height: 800 },
      resizable: true,
      dockable: true,
      closable: true,
      defaultVisible: false,
      keyboardShortcut: 'CmdOrCtrl+C',
      component: CommentaryPlaceholder
    })

    // Dictionary Panel
    this.registerPanel({
      id: 'dictionary',
      title: 'Dictionary',
      description: 'Look up words and definitions',
      icon: '📚',
      category: 'resources',
      defaultPosition: 'left' as PanelPosition,
      defaultSize: { width: 300, height: 400 },
      minSize: { width: 250, height: 200 },
      maxSize: { width: 500, height: 600 },
      resizable: true,
      dockable: true,
      closable: true,
      defaultVisible: false,
      keyboardShortcut: 'CmdOrCtrl+D',
      component: DictionaryPlaceholder
    })

    // Cross References Panel
    this.registerPanel({
      id: 'cross-references',
      title: 'Cross References',
      description: 'View related verses',
      icon: '🔗',
      category: 'resources',
      defaultPosition: 'bottom' as PanelPosition,
      defaultSize: { width: 400, height: 200 },
      minSize: { width: 300, height: 150 },
      maxSize: { width: 800, height: 400 },
      resizable: true,
      dockable: true,
      closable: true,
      defaultVisible: false,
      keyboardShortcut: 'CmdOrCtrl+R',
      component: CrossReferencesPlaceholder
    })

    // Parallel Versions Panel
    this.registerPanel({
      id: 'parallel-versions',
      title: 'Parallel Versions',
      description: 'Compare multiple Bible translations',
      icon: '📖',
      category: 'comparison',
      defaultPosition: 'bottom' as PanelPosition,
      defaultSize: { width: 600, height: 300 },
      minSize: { width: 400, height: 200 },
      maxSize: { width: 1000, height: 500 },
      resizable: true,
      dockable: true,
      closable: true,
      defaultVisible: false,
      keyboardShortcut: 'CmdOrCtrl+P',
      component: ParallelVersionsPlaceholder
    })
  }

  // Method to dynamically set panel components after they're imported
  setPanelComponent(panelId: string, component: React.ComponentType<any>): void {
    const panel = this.panels.get(panelId)
    if (panel) {
      panel.component = component
    }
  }
}

// Export singleton instance
export const panelRegistry = PanelRegistry.getInstance()