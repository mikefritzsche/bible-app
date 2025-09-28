import React from 'react'
import { PanelConfig, PanelPosition, PanelSize } from './types'


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
    // Bible Reader Panel
    this.registerPanel({
      id: 'bible-reader',
      title: 'Bible Reader',
      description: 'Primary Bible reading pane',
      icon: 'book-open',
      category: 'study',
      defaultPosition: 'main' as PanelPosition,
      defaultSize: { width: 0, height: 0 },
      minSize: { width: 320, height: 480 },
      maxSize: { width: 10000, height: 10000 },
      resizable: false,
      dockable: false,
      closable: false,
      defaultVisible: true,
      component: null as any
    })

    // Notes Panel - will be imported from components/panels/NotesPanel
    this.registerPanel({
      id: 'notes',
      title: 'Notes',
      description: 'View and manage your study notes',
      icon: 'file-text',
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
      icon: 'history',
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
      icon: 'scroll-text',
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
      component: null as any // Will be set dynamically
    })

    // Dictionary Panel
    this.registerPanel({
      id: 'dictionary',
      title: 'Dictionary',
      description: 'Look up words and definitions',
      icon: 'book',
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
      component: null as any // Will be set dynamically
    })

    // Cross References Panel
    this.registerPanel({
      id: 'cross-references',
      title: 'Cross References',
      description: 'View related verses',
      icon: 'link-2',
      category: 'resources',
      defaultPosition: 'right' as PanelPosition,
      defaultSize: { width: 340, height: 300 },
      minSize: { width: 260, height: 200 },
      maxSize: { width: 520, height: 500 },
      resizable: true,
      dockable: true,
      closable: true,
      defaultVisible: true,
      keyboardShortcut: 'CmdOrCtrl+R',
      component: null as any // Will be set dynamically
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
