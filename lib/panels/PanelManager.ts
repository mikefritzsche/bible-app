import { PanelConfig, PanelState, PanelLayout, Template, PanelManagerConfig, PanelEvent, PanelSize, PanelPosition } from './types'

export class PanelManager {
  private panels: Map<string, PanelConfig> = new Map()
  private activePanels: Map<string, PanelState> = new Map()
  private layouts: Map<string, PanelLayout> = new Map()
  private templates: Map<string, Template> = new Map()
  private eventListeners: Map<string, Function[]> = new Map()
  private config: Required<PanelManagerConfig>
  private currentLayout: string = 'default'

  constructor(config: PanelManagerConfig = {}) {
    this.config = {
      storageKey: config.storageKey || 'bible-app-panel-layout',
      maxPanels: config.maxPanels || 6,
      enablePersistence: config.enablePersistence ?? true,
      enableKeyboardShortcuts: config.enableKeyboardShortcuts ?? true,
      ...config
    }

    this.initializeDefaultLayout()
    this.initializeDefaultTemplates()

    if (this.config.enablePersistence) {
      this.loadFromStorage()
    }
  }

  // Panel Registration
  registerPanel(config: PanelConfig): void {
    this.panels.set(config.id, config)

    // Initialize panel state if not already exists
    if (!this.activePanels.has(config.id)) {
      this.activePanels.set(config.id, {
        id: config.id,
        config,
        isVisible: config.defaultVisible ?? false,
        position: config.defaultPosition,
        size: config.defaultSize,
        order: this.getNextOrderForPosition(config.defaultPosition),
        zIndex: this.getNextZIndex()
      })
    }

    this.emit('panel_registered', { panelId: config.id })
  }

  unregisterPanel(panelId: string): void {
    this.panels.delete(panelId)
    this.activePanels.delete(panelId)
    this.emit('panel_unregistered', { panelId })
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

  // Panel Visibility
  showPanel(panelId: string): boolean {
    const panel = this.activePanels.get(panelId)
    if (!panel || !this.canShowPanel(panelId)) return false

    panel.isVisible = true
    panel.zIndex = this.getNextZIndex()

    this.emit('panel_opened', { panelId })
    this.saveToStorage()
    return true
  }

  hidePanel(panelId: string): boolean {
    const panel = this.activePanels.get(panelId)
    if (!panel) return false

    panel.isVisible = false

    this.emit('panel_closed', { panelId })
    this.saveToStorage()
    return true
  }

  togglePanel(panelId: string): boolean {
    const panel = this.activePanels.get(panelId)
    if (!panel) return false

    if (panel.isVisible) {
      return this.hidePanel(panelId)
    } else {
      return this.showPanel(panelId)
    }
  }

  isPanelVisible(panelId: string): boolean {
    const panel = this.activePanels.get(panelId)
    return panel?.isVisible ?? false
  }

  getVisiblePanels(): PanelState[] {
    return Array.from(this.activePanels.values())
      .filter(panel => panel.isVisible)
      .sort((a, b) => {
        // Sort by position, then by order
        const positionOrder = { left: 0, right: 1, top: 2, bottom: 3, floating: 4 }
        if (positionOrder[a.position] !== positionOrder[b.position]) {
          return positionOrder[a.position] - positionOrder[b.position]
        }
        return a.order - b.order
      })
  }

  // Panel Layout Management
  resizePanel(panelId: string, size: PanelSize): boolean {
    const panel = this.activePanels.get(panelId)
    const config = this.panels.get(panelId)

    if (!panel || !config) return false

    // Apply size constraints
    const constrainedSize = {
      width: Math.max(config.minSize.width, Math.min(config.maxSize.width, size.width)),
      height: Math.max(config.minSize.height, Math.min(config.maxSize.height, size.height))
    }

    panel.size = constrainedSize

    this.emit('panel_resized', { panelId, size: constrainedSize })
    this.saveToStorage()
    return true
  }

  movePanel(panelId: string, position: PanelPosition): boolean {
    const panel = this.activePanels.get(panelId)
    const config = this.panels.get(panelId)

    if (!panel || !config || !config.dockable) return false

    panel.position = position
    panel.order = this.getNextOrderForPosition(position)
    panel.zIndex = this.getNextZIndex()

    this.emit('panel_moved', { panelId, position })
    this.saveToStorage()
    return true
  }

  // Layout Management
  saveLayout(name: string, description?: string): string {
    const layoutId = this.generateId()
    const layout: PanelLayout = {
      id: layoutId,
      name,
      description,
      panels: Array.from(this.activePanels.values()).map(panel => ({
        id: panel.id,
        isVisible: panel.isVisible,
        position: panel.position,
        size: panel.size,
        order: panel.order,
        zIndex: panel.zIndex
      })),
      timestamp: new Date()
    }

    this.layouts.set(layoutId, layout)
    this.currentLayout = layoutId

    this.emit('layout_saved', { layoutId })
    this.saveToStorage()
    return layoutId
  }

  loadLayout(layoutId: string): boolean {
    const layout = this.layouts.get(layoutId)
    if (!layout) return false

    layout.panels.forEach(panelData => {
      const panel = this.activePanels.get(panelData.id)
      if (panel) {
        panel.isVisible = panelData.isVisible
        panel.position = panelData.position
        panel.size = panelData.size
        panel.order = panelData.order
        panel.zIndex = panelData.zIndex
      }
    })

    this.currentLayout = layoutId
    this.emit('layout_loaded', { layoutId })
    this.saveToStorage()
    return true
  }

  getCurrentLayout(): PanelLayout | undefined {
    return this.layouts.get(this.currentLayout)
  }

  getAllLayouts(): PanelLayout[] {
    return Array.from(this.layouts.values())
  }

  // Template Management
  registerTemplate(template: Template): void {
    this.templates.set(template.id, template)
    this.emit('template_registered', { templateId: template.id })
  }

  applyTemplate(templateId: string): boolean {
    const template = this.templates.get(templateId)
    if (!template) return false

    // Apply template layout
    template.layout.panels.forEach(panelData => {
      const panel = this.activePanels.get(panelData.id)
      if (panel) {
        panel.isVisible = panelData.isVisible
        panel.position = panelData.position
        panel.size = panelData.size
        panel.order = panelData.order
        panel.zIndex = panelData.zIndex
      }
    })

    this.currentLayout = template.layout.id
    this.emit('template_applied', { templateId })
    this.saveToStorage()
    return true
  }

  getTemplates(): Template[] {
    return Array.from(this.templates.values())
  }

  getTemplatesByCategory(category: string): Template[] {
    return this.getTemplates().filter(template => template.category === category)
  }

  // Utility Methods
  private canShowPanel(panelId: string): boolean {
    const visibleCount = this.getVisiblePanels().length
    const maxPanels = this.config.maxPanels

    if (visibleCount >= maxPanels) {
      console.warn(`Maximum number of panels (${maxPanels}) reached`)
      return false
    }

    return true
  }

  private getNextOrderForPosition(position: PanelPosition): number {
    const panelsInPosition = Array.from(this.activePanels.values())
      .filter(panel => panel.position === position)

    return panelsInPosition.length > 0
      ? Math.max(...panelsInPosition.map(p => p.order)) + 1
      : 0
  }

  private getNextZIndex(): number {
    const maxZIndex = Math.max(...Array.from(this.activePanels.values())
      .map(panel => panel.zIndex), 0)
    return maxZIndex + 1
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  // Persistence
  private saveToStorage(): void {
    if (!this.config.enablePersistence) return

    try {
      const data = {
        currentLayout: this.currentLayout,
        activePanels: Array.from(this.activePanels.entries()),
        layouts: Array.from(this.layouts.entries()),
        templates: Array.from(this.templates.entries())
      }

      localStorage.setItem(this.config.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save panel state to storage:', error)
    }
  }

  private loadFromStorage(): void {
    if (!this.config.enablePersistence) return

    try {
      const stored = localStorage.getItem(this.config.storageKey)
      if (!stored) return

      const data = JSON.parse(stored)

      if (data.currentLayout) {
        this.currentLayout = data.currentLayout
      }

      if (data.activePanels) {
        this.activePanels = new Map(
          data.activePanels.map(([id, state]: [string, any]) => {
            const config = this.panels.get(id)
            return [id, { ...state, config }]
          })
        )
      }

      if (data.layouts) {
        this.layouts = new Map(data.layouts)
      }

      if (data.templates) {
        this.templates = new Map(data.templates)
      }
    } catch (error) {
      console.error('Failed to load panel state from storage:', error)
    }
  }

  // Event System
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }

  // Default Layout and Templates
  private initializeDefaultLayout(): void {
    const defaultLayout: PanelLayout = {
      id: 'default',
      name: 'Default Layout',
      description: 'Default panel arrangement',
      panels: [],
      timestamp: new Date()
    }

    this.layouts.set('default', defaultLayout)
    this.currentLayout = 'default'
  }

  private initializeDefaultTemplates(): void {
    // Study Focus Template
    this.registerTemplate({
      id: 'study-focus',
      name: 'Study Focus',
      description: 'Bible text with notes panel',
      icon: '📖',
      category: 'study',
      isDefault: true,
      isBuiltIn: true,
      layout: {
        id: 'study-focus-layout',
        name: 'Study Focus Layout',
        panels: [
          {
            id: 'notes',
            isVisible: true,
            position: 'right' as PanelPosition,
            size: { width: 320, height: 600 },
            order: 0,
            zIndex: 1
          }
        ],
        timestamp: new Date()
      }
    })

    // Research Mode Template
    this.registerTemplate({
      id: 'research-mode',
      name: 'Research Mode',
      description: 'Multi-panel research setup',
      icon: '🔍',
      category: 'research',
      isDefault: true,
      isBuiltIn: true,
      layout: {
        id: 'research-layout',
        name: 'Research Layout',
        panels: [
          {
            id: 'commentary',
            isVisible: true,
            position: 'left' as PanelPosition,
            size: { width: 300, height: 600 },
            order: 0,
            zIndex: 1
          },
          {
            id: 'notes',
            isVisible: true,
            position: 'right' as PanelPosition,
            size: { width: 320, height: 600 },
            order: 0,
            zIndex: 2
          }
        ],
        timestamp: new Date()
      }
    })

    // Devotional Reading Template
    this.registerTemplate({
      id: 'devotional',
      name: 'Devotional Reading',
      description: 'Clean reading experience',
      icon: '🙏',
      category: 'devotional',
      isDefault: true,
      isBuiltIn: true,
      layout: {
        id: 'devotional-layout',
        name: 'Devotional Layout',
        panels: [],
        timestamp: new Date()
      }
    })
  }
}