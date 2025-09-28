'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { PanelManager } from '@/lib/panels/PanelManager'
import { panelRegistry } from '@/lib/panels/PanelRegistry'
import { PanelConfig, PanelState, Template, PanelSize, PanelPosition } from '@/lib/panels/types'

interface PanelContextType {
  panelManager: PanelManager
  visiblePanels: PanelState[]
  currentLayoutId: string | null
  showPanel: (panelId: string) => void
  hidePanel: (panelId: string) => void
  togglePanel: (panelId: string) => void
  resizePanel: (panelId: string, size: PanelSize) => void
  movePanel: (panelId: string, position: PanelPosition) => void
  applyTemplate: (templateId: string) => void
  loadLayout: (layoutId: string) => void
  getCurrentTemplate: () => Template | undefined
  getAvailableTemplates: () => Template[]
  getPanelConfig: (panelId: string) => PanelConfig | undefined
  getAllPanelConfigs: () => PanelConfig[]
  isPanelVisible: (panelId: string) => boolean
  refreshPanels: () => void
}

const PanelContext = createContext<PanelContextType | undefined>(undefined)

interface PanelProviderProps {
  children: ReactNode
  initialPanels?: PanelConfig[]
}

export function PanelProvider({ children, initialPanels = [] }: PanelProviderProps) {
  const [panelManager] = useState(() => new PanelManager())
  const [visiblePanels, setVisiblePanels] = useState<PanelState[]>([])
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(() => panelManager.getCurrentLayout()?.id ?? null)
  const [isInitialized, setIsInitialized] = useState(false)

  const updateVisiblePanels = useCallback(() => {
    const panels = panelManager.getVisiblePanels()
    setVisiblePanels([...panels])
    const layout = panelManager.getCurrentLayout()
    setCurrentLayoutId(layout ? layout.id : null)
  }, [panelManager])

  // Initialize panels
  useEffect(() => {
    if (isInitialized) return

    // Register default panels if provided
    initialPanels.forEach(panelConfig => {
      panelManager.registerPanel(panelConfig)
    })

    // Register panels from registry
    const registryPanels = panelRegistry.getAllPanels()
    registryPanels.forEach(panelConfig => {
      panelManager.registerPanel(panelConfig)
    })

    // Set up event listeners
    panelManager.on('panel_opened', updateVisiblePanels)
    panelManager.on('panel_closed', updateVisiblePanels)
    panelManager.on('panel_resized', updateVisiblePanels)
    panelManager.on('panel_moved', updateVisiblePanels)
    panelManager.on('template_applied', updateVisiblePanels)
    panelManager.on('layout_loaded', updateVisiblePanels)
    panelManager.on('layout_saved', updateVisiblePanels)
    panelManager.on('layout_changed', updateVisiblePanels)

    // Initial update
    updateVisiblePanels()

    if (panelManager.getVisiblePanels().length === 0) {
      panelManager.loadLayout('default')
      panelManager.showPanel('bible-reader')
      updateVisiblePanels()
    }
    setIsInitialized(true)

    return () => {
      panelManager.off('panel_opened', updateVisiblePanels)
      panelManager.off('panel_closed', updateVisiblePanels)
      panelManager.off('panel_resized', updateVisiblePanels)
      panelManager.off('panel_moved', updateVisiblePanels)
      panelManager.off('template_applied', updateVisiblePanels)
      panelManager.off('layout_loaded', updateVisiblePanels)
      panelManager.off('layout_saved', updateVisiblePanels)
      panelManager.off('layout_changed', updateVisiblePanels)
    }
  }, [panelManager, initialPanels, isInitialized, updateVisiblePanels])

  const showPanel = (panelId: string) => {
    panelManager.showPanel(panelId)
  }

  const hidePanel = (panelId: string) => {
    panelManager.hidePanel(panelId)
  }

  const togglePanel = (panelId: string) => {
    panelManager.togglePanel(panelId)
  }

  const resizePanel = (panelId: string, size: PanelSize) => {
    panelManager.resizePanel(panelId, size)
  }

  const movePanel = (panelId: string, position: PanelPosition) => {
    panelManager.movePanel(panelId, position)
  }

  const applyTemplate = (templateId: string) => {
    panelManager.applyTemplate(templateId)
  }

  const loadLayout = (layoutId: string) => {
    panelManager.loadLayout(layoutId)
    updateVisiblePanels()
  }

  const getCurrentTemplate = (): Template | undefined => {
    // This would need to be implemented in PanelManager
    return undefined
  }

  const getAvailableTemplates = (): Template[] => {
    return panelManager.getAvailableTemplates()
  }

  const getPanelConfig = (panelId: string): PanelConfig | undefined => {
    return panelManager.getPanel(panelId)
  }

  const getAllPanelConfigs = (): PanelConfig[] => {
    return panelManager.getAllPanels()
  }

  const isPanelVisible = (panelId: string): boolean => {
    return panelManager.isPanelVisible(panelId)
  }

  const value: PanelContextType = {
    panelManager,
    visiblePanels,
    currentLayoutId,
    showPanel,
    hidePanel,
    togglePanel,
    resizePanel,
    movePanel,
    applyTemplate,
    loadLayout,
    getCurrentTemplate,
    getAvailableTemplates,
    getPanelConfig,
    getAllPanelConfigs,
    isPanelVisible,
    refreshPanels: updateVisiblePanels
  }

  return (
    <PanelContext.Provider value={value}>
      {children}
    </PanelContext.Provider>
  )
}

export function usePanels() {
  const context = useContext(PanelContext)
  if (context === undefined) {
    throw new Error('usePanels must be used within a PanelProvider')
  }
  return context
}
