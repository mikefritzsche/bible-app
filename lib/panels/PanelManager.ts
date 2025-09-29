import { PanelConfig, PanelState, GridLayout, Template, PanelManagerConfig, PanelEvent, PanelSize, PanelPosition } from './types'

export class PanelManager {
  private panels: Map<string, PanelConfig> = new Map()
  private activePanels: Map<string, PanelState> = new Map()
  private layouts: Map<string, GridLayout> = new Map()
  private templates: Map<string, Template> = new Map()
  private eventListeners: Map<string, Function[]> = new Map()
  private config: Required<PanelManagerConfig>
  private currentLayout: string = 'default'

  constructor(config: PanelManagerConfig = {}) {
    this.config = {
      storageKey: config.storageKey || 'bible-app-panel-layout',
      maxPanels: config.maxPanels || 12,
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
        order: this.getNextOrderForPosition(config.defaultPosition)
      })
    } else {
      const existing = this.activePanels.get(config.id)
      if (existing) {
        existing.config = config
        if (!existing.size) {
          existing.size = config.defaultSize
        }
        if (!existing.position) {
          existing.position = config.defaultPosition
        }
      }
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
    if (!panel) {
      console.warn(`PanelManager: Panel ${panelId} not found in active panels`)
      return false
    }

    const panelConfig = this.panels.get(panelId) || panel.config
    const bypassLimits = panelConfig?.closable === false

    if (!bypassLimits && !this.canShowPanel(panelId)) {
      return false
    }

    panel.isVisible = true

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
    if (!panel) {
      console.warn(`PanelManager: Panel ${panelId} not found in active panels`)
      return false
    }

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
        const positionOrder = { left: 0, right: 1, top: 2, bottom: 3, main: 4 }
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

    const constrainedSize: PanelSize = { ...panel.size }

    if (typeof size.width === 'number') {
      const minWidth = config.minSize.width ?? 0
      const maxWidth = config.maxSize.width ?? Number.MAX_SAFE_INTEGER
      constrainedSize.width = Math.max(minWidth, Math.min(maxWidth, size.width))
    }

    if (typeof size.height === 'number') {
      const minHeight = config.minSize.height ?? 0
      const maxHeight = config.maxSize.height ?? Number.MAX_SAFE_INTEGER
      constrainedSize.height = Math.max(minHeight, Math.min(maxHeight, size.height))
    }

    panel.size = constrainedSize

    this.emit('panel_resized', { panelId, size: constrainedSize })
    this.saveToStorage()
    return true
  }

  movePanel(panelId: string, position: PanelPosition): boolean {
    const panel = this.activePanels.get(panelId)
    if (!panel) return false

    panel.position = position
    panel.order = this.getNextOrderForPosition(position)

    this.emit('panel_moved', { panelId, position })
    this.saveToStorage()
    return true
  }

  // Layout Management
  saveLayout(name: string, description?: string): string {
    const layoutId = this.generateId()
    const layout: GridLayout = {
      id: layoutId,
      name,
      description,
      areas: {
        main: Array.from(this.activePanels.values())
          .filter(panel => panel.position === 'main')
          .map(panel => ({
            id: panel.id,
            config: panel.config,
            isVisible: panel.isVisible,
            position: panel.position,
            size: panel.size,
            order: panel.order
          })),
        left: Array.from(this.activePanels.values())
          .filter(panel => panel.position === 'left')
          .map(panel => ({
            id: panel.id,
            config: panel.config,
            isVisible: panel.isVisible,
            position: panel.position,
            size: panel.size,
            order: panel.order
          })),
        right: Array.from(this.activePanels.values())
          .filter(panel => panel.position === 'right')
          .map(panel => ({
            id: panel.id,
            config: panel.config,
            isVisible: panel.isVisible,
            position: panel.position,
            size: panel.size,
            order: panel.order
          })),
        top: Array.from(this.activePanels.values())
          .filter(panel => panel.position === 'top')
          .map(panel => ({
            id: panel.id,
            config: panel.config,
            isVisible: panel.isVisible,
            position: panel.position,
            size: panel.size,
            order: panel.order
          })),
        bottom: Array.from(this.activePanels.values())
          .filter(panel => panel.position === 'bottom')
          .map(panel => ({
            id: panel.id,
            config: panel.config,
            isVisible: panel.isVisible,
            position: panel.position,
            size: panel.size,
            order: panel.order
          }))
      },
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

    // Update all panels based on the layout
    Object.entries(layout.areas).forEach(([position, panels]) => {
      panels.forEach(panelData => {
        const panel = this.activePanels.get(panelData.id)
        if (panel) {
          panel.isVisible = panelData.isVisible
          panel.position = position as PanelPosition
          panel.size = panelData.size
          panel.order = panelData.order
        }
      })
    })

    this.currentLayout = layoutId
    this.emit('layout_loaded', { layoutId })
    this.saveToStorage()
    return true
  }

  getCurrentLayout(): GridLayout | undefined {
    return this.layouts.get(this.currentLayout)
  }

  getAllLayouts(): GridLayout[] {
    return Array.from(this.layouts.values())
  }

  // Template Management
  registerTemplate(template: Template): void {
    this.templates.set(template.id, template)
    this.emit('template_registered', { templateId: template.id })
  }

  applyTemplate(templateId: string): boolean {
    console.log('🔍 PanelManager: applyTemplate called with:', templateId)
    console.log('🔍 PanelManager: Available templates:', Array.from(this.templates.keys()))

    const template = this.templates.get(templateId)
    if (!template) {
      console.error('🔍 PanelManager: Template not found:', templateId)
      return false
    }

    console.log('🔍 PanelManager: Applying template:', template.name, 'with layout:', template.gridLayout.id)

    const normalizePanelsForLayout = (panels: PanelState[]): PanelState[] => {
      return panels.map(panelData => {
        const config = this.panels.get(panelData.id) ?? panelData.config
        const position = panelData.position ?? config?.defaultPosition ?? 'main'
        return {
          id: panelData.id,
          config,
          isVisible: panelData.isVisible,
          position,
          size: { ...panelData.size },
          order: panelData.order
        }
      })
    }

    // Apply template layout
    console.log('🔍 PanelManager: Applying layout with areas:', Object.keys(template.gridLayout.areas))
    Object.entries(template.gridLayout.areas).forEach(([position, panels]) => {
      console.log(`🔍 PanelManager: Processing ${position} area with ${panels.length} panels:`, panels.map(p => ({ id: p.id, visible: p.isVisible })))
      panels.forEach(panelData => {
        const panel = this.activePanels.get(panelData.id)
        if (panel) {
          console.log(`🔍 PanelManager: Setting panel ${panelData.id} to position ${position}, visible: ${panelData.isVisible}`)
          panel.isVisible = panelData.isVisible
          panel.position = position as PanelPosition
          panel.size = { ...panelData.size }
          panel.order = panelData.order
          if (!panel.config && this.panels.has(panelData.id)) {
            panel.config = this.panels.get(panelData.id)!
          }
        } else {
          console.warn(`🔍 PanelManager: Panel ${panelData.id} not found in active panels`)
        }
      })
    })

    const appliedLayout: GridLayout = {
      id: template.gridLayout.id,
      name: template.gridLayout.name,
      description: template.gridLayout.description,
      areas: {
        main: normalizePanelsForLayout(template.gridLayout.areas.main),
        left: normalizePanelsForLayout(template.gridLayout.areas.left),
        right: normalizePanelsForLayout(template.gridLayout.areas.right),
        top: normalizePanelsForLayout(template.gridLayout.areas.top),
        bottom: normalizePanelsForLayout(template.gridLayout.areas.bottom)
      },
      timestamp: new Date()
    }

    this.layouts.set(appliedLayout.id, appliedLayout)
    this.currentLayout = appliedLayout.id
    this.emit('template_applied', { templateId })
    this.emit('layout_changed', { layoutId: appliedLayout.id })
    this.saveToStorage()
    return true
  }

  getTemplates(): Template[] {
    return Array.from(this.templates.values())
  }

  getAvailableTemplates(): Template[] {
    return Array.from(this.templates.values()).filter(template => {
      // Check if all panels referenced in the template are registered
      const panelIds = new Set<string>()

      Object.values(template.gridLayout.areas).forEach(panels => {
        panels.forEach(panel => {
          panelIds.add(panel.id)
        })
      })

      // Template is available if all its panels are registered
      return Array.from(panelIds).every(panelId => this.panels.has(panelId))
    })
  }

  getTemplatesByCategory(category: string): Template[] {
    return this.getTemplates().filter(template => template.category === category)
  }

  // Utility Methods
  private canShowPanel(panelId: string): boolean {
    const visibleCount = this.getVisiblePanels().length
    const maxPanels = this.config.maxPanels

    if (visibleCount >= maxPanels) {
      console.warn(`PanelManager: Maximum number of panels (${maxPanels}) reached`)
      return false
    }

    return true
  }

  private getNextOrderForPosition(position: PanelPosition): number {
    const panelsInArea = Array.from(this.activePanels.values())
      .filter(panel => panel.position === position)

    return panelsInArea.length > 0
      ? Math.max(...panelsInArea.map(p => p.order)) + 1
      : 0
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
            const normalizedState = { ...state }

            if (normalizedState.area && !normalizedState.position) {
              normalizedState.position = normalizedState.area
            }

            delete normalizedState.area

            if (!normalizedState.size && config) {
              normalizedState.size = config.defaultSize
            }

            if (!normalizedState.position && config) {
              normalizedState.position = config.defaultPosition
            }

            return [id, { ...normalizedState, config }]
          })
        )
      }

      if (data.layouts) {
        const normalizeLayoutPanels = (panels: any[]) =>
          panels.map(panel => {
            const normalizedPanel = { ...panel }
            if (normalizedPanel.area && !normalizedPanel.position) {
              normalizedPanel.position = normalizedPanel.area
            }
            delete normalizedPanel.area
            return normalizedPanel
          })

        this.layouts = new Map(
          data.layouts.map(([id, layout]: [string, any]) => {
            const areas = layout.areas || {}
            const normalizedAreas = {
              main: normalizeLayoutPanels(areas.main || []),
              left: normalizeLayoutPanels(areas.left || []),
              right: normalizeLayoutPanels(areas.right || []),
              top: normalizeLayoutPanels(areas.top || []),
              bottom: normalizeLayoutPanels(areas.bottom || [])
            }

            return [id, {
              ...layout,
              areas: normalizedAreas,
              timestamp: layout.timestamp ? new Date(layout.timestamp) : new Date()
            }]
          })
        )
      }

      if (data.templates) {
        this.templates = new Map(
          data.templates.map(([id, template]: [string, any]) => {
            const layout = template.gridLayout || {}
            const areas = layout.areas || {}

            const normalizeTemplatePanels = (panels: any[]) =>
              panels.map(panel => {
                const normalizedPanel = { ...panel }
                if (normalizedPanel.area && !normalizedPanel.position) {
                  normalizedPanel.position = normalizedPanel.area
                }
                delete normalizedPanel.area
                return normalizedPanel
              })

            const normalizedLayout = {
              ...layout,
              areas: {
                main: normalizeTemplatePanels(areas.main || []),
                left: normalizeTemplatePanels(areas.left || []),
                right: normalizeTemplatePanels(areas.right || []),
                top: normalizeTemplatePanels(areas.top || []),
                bottom: normalizeTemplatePanels(areas.bottom || [])
              },
              timestamp: layout.timestamp ? new Date(layout.timestamp) : new Date()
            }

            return [id, { ...template, gridLayout: normalizedLayout }]
          })
        )
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
    const defaultLayout: GridLayout = {
      id: 'default',
      name: 'Default Layout',
      description: 'Default panel arrangement',
      areas: {
        main: [
          {
            id: 'bible-reader',
            config: {} as PanelConfig,
            isVisible: true,
            position: 'main' as PanelPosition,
            size: {},
            order: 0
          }
        ],
        left: [],
        right: [
          {
            id: 'cross-references',
            config: {} as PanelConfig,
            isVisible: true,
            position: 'right' as PanelPosition,
            size: { width: 340, height: 360 },
            order: 0
          }
        ],
        top: [],
        bottom: []
      },
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
      icon: 'book-open',
      category: 'study',
      isDefault: true,
      isBuiltIn: true,
      gridLayout: {
        id: 'study-focus-layout',
        name: 'Study Focus Layout',
        areas: {
          main: [
            {
              id: 'bible-reader',
              config: {} as PanelConfig,
              isVisible: true,
              position: 'main' as PanelPosition,
              size: {},
              order: 0
            }
          ],
          left: [],
          right: [
            {
              id: 'cross-references',
              config: {} as PanelConfig,
              isVisible: true,
              position: 'right' as PanelPosition,
              size: { width: 340, height: 360 },
              order: 0
            },
            {
              id: 'notes',
              config: {} as PanelConfig,
              isVisible: true,
              position: 'right' as PanelPosition,
              size: { width: 320, height: 600 },
              order: 1
            }
          ],
          top: [],
          bottom: []
        },
        timestamp: new Date()
      }
    })

    // Research Mode Template
    this.registerTemplate({
      id: 'research-mode',
      name: 'Research Mode',
      description: 'Multi-panel research setup',
      icon: 'search',
      category: 'research',
      isDefault: true,
      isBuiltIn: true,
      gridLayout: {
        id: 'research-layout',
        name: 'Research Layout',
        areas: {
          main: [
            {
              id: 'bible-reader',
              config: {} as PanelConfig,
              isVisible: true,
              position: 'main' as PanelPosition,
              size: {},
              order: 0
            }
          ],
          left: [
            {
              id: 'commentary',
              config: {} as PanelConfig,
              isVisible: true,
              position: 'left' as PanelPosition,
              size: { width: 300, height: 600 },
              order: 0
            }
          ],
          right: [
            {
              id: 'cross-references',
              config: {} as PanelConfig,
              isVisible: true,
              position: 'right' as PanelPosition,
              size: { width: 340, height: 360 },
              order: 0
            },
            {
              id: 'notes',
              config: {} as PanelConfig,
              isVisible: true,
              position: 'right' as PanelPosition,
              size: { width: 320, height: 600 },
              order: 1
            }
          ],
          top: [],
          bottom: []
        },
        timestamp: new Date()
      }
    })

    // Devotional Reading Template
    this.registerTemplate({
      id: 'devotional',
      name: 'Devotional Reading',
      description: 'Clean reading experience',
      icon: 'sun',
      category: 'devotional',
      isDefault: true,
      isBuiltIn: true,
      gridLayout: {
        id: 'devotional-layout',
        name: 'Devotional Layout',
        areas: {
          main: [
            {
              id: 'bible-reader',
              config: {} as PanelConfig,
              isVisible: true,
              position: 'main' as PanelPosition,
              size: {},
              order: 0
            }
          ],
          left: [],
          right: [],
          top: [],
          bottom: []
        },
        timestamp: new Date()
      }
    })

    // Parallel Study Template
    this.registerTemplate({
      id: 'parallel-study',
      name: 'Parallel Study',
      description: 'Compare translations with cross-references',
      icon: 'layers',
      category: 'study',
      isDefault: true,
      isBuiltIn: true,
      gridLayout: {
        id: 'parallel-layout',
        name: 'Parallel Study Layout',
        areas: {
          main: [
            {
              id: 'bible-reader',
              config: {} as PanelConfig,
              isVisible: true,
              position: 'main' as PanelPosition,
              size: {},
              order: 0
            }
          ],
          left: [],
          right: [
            {
              id: 'cross-references',
              config: {} as PanelConfig,
              isVisible: true,
              position: 'right' as PanelPosition,
              size: { width: 280, height: 400 },
              order: 0
            }
          ],
          top: [],
          bottom: []
        },
        timestamp: new Date()
      }
    })

    // Language Study Template
    this.registerTemplate({
      id: 'language-study',
      name: 'Language Study',
      description: 'Deep dive into original languages',
      icon: 'type',
      category: 'study',
      isDefault: true,
      isBuiltIn: true,
      gridLayout: {
        id: 'language-layout',
        name: 'Language Study Layout',
        areas: {
          main: [
            {
              id: 'bible-reader',
              config: {} as PanelConfig,
              isVisible: true,
              position: 'main' as PanelPosition,
              size: {},
              order: 0
            }
          ],
          left: [
            {
              id: 'dictionary',
              config: {} as PanelConfig,
              isVisible: true,
              position: 'left' as PanelPosition,
              size: { width: 320, height: 500 },
              order: 0
            }
          ],
          right: [
            {
              id: 'commentary',
              config: {} as PanelConfig,
              isVisible: true,
              position: 'right' as PanelPosition,
              size: { width: 300, height: 500 },
              order: 0
            }
          ],
          top: [],
          bottom: []
        },
        timestamp: new Date()
      }
    })

    // Comprehensive Study Template
    this.registerTemplate({
      id: 'comprehensive-study',
      name: 'Comprehensive Study',
      description: 'Full-featured study workspace',
      icon: 'clipboard-list',
      category: 'research',
      isDefault: true,
      isBuiltIn: true,
      gridLayout: {
        id: 'comprehensive-layout',
        name: 'Comprehensive Study Layout',
        areas: {
          main: [
            {
              id: 'bible-reader',
              config: {} as PanelConfig,
              isVisible: true,
              position: 'main' as PanelPosition,
              size: {},
              order: 0
            }
          ],
          left: [
            {
              id: 'commentary',
              config: {} as PanelConfig,
              isVisible: true,
              position: 'left' as PanelPosition,
              size: { width: 280, height: 600 },
              order: 0
            }
          ],
          right: [
            {
              id: 'cross-references',
              config: {} as PanelConfig,
              isVisible: true,
              position: 'right' as PanelPosition,
              size: { width: 340, height: 360 },
              order: 0
            },
            {
              id: 'notes',
              config: {} as PanelConfig,
              isVisible: true,
              position: 'right' as PanelPosition,
              size: { width: 320, height: 600 },
              order: 1
            }
          ],
          top: [],
          bottom: [
            {
              id: 'dictionary',
              config: {} as PanelConfig,
              isVisible: true,
              position: 'bottom' as PanelPosition,
              size: { width: 400, height: 250 },
              order: 0
            }
          ]
        },
        timestamp: new Date()
      }
    })

    // Teaching Preparation Template
    this.registerTemplate({
      id: 'teaching-prep',
      name: 'Teaching Preparation',
      description: 'Prepare lessons and sermons',
      icon: 'graduation-cap',
      category: 'teaching',
      isDefault: true,
      isBuiltIn: true,
      gridLayout: {
        id: 'teaching-layout',
        name: 'Teaching Preparation Layout',
        areas: {
          main: [
            {
              id: 'bible-reader',
              config: {} as PanelConfig,
              isVisible: true,
              position: 'main' as PanelPosition,
              size: {},
              order: 0
            }
          ],
          left: [],
          right: [
            {
              id: 'cross-references',
              config: {} as PanelConfig,
              isVisible: true,
              position: 'right' as PanelPosition,
              size: { width: 340, height: 360 },
              order: 0
            },
            {
              id: 'notes',
              config: {} as PanelConfig,
              isVisible: true,
              position: 'right' as PanelPosition,
              size: { width: 350, height: 700 },
              order: 1
            }
          ],
          top: [],
          bottom: []
        },
        timestamp: new Date()
      }
    })

  }
}
