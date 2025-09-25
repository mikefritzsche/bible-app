'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { PanelManager } from '@/lib/panels/PanelManager'
import { panelRegistry } from '@/lib/panels/PanelRegistry'
import { PanelConfig, PanelState, Template, PanelSize, PanelPosition } from '@/lib/panels/types'

interface PanelContextType {
  panelManager: PanelManager
  visiblePanels: PanelState[]
  showPanel: (panelId: string) => void
  hidePanel: (panelId: string) => void
  togglePanel: (panelId: string) => void
  resizePanel: (panelId: string, size: PanelSize) => void
  movePanel: (panelId: string, position: PanelPosition) => void
  applyTemplate: (templateId: string) => void
  getCurrentTemplate: () => Template | undefined
  getAvailableTemplates: () => Template[]
  getPanelConfig: (panelId: string) => PanelConfig | undefined
  getAllPanelConfigs: () => PanelConfig[]
  isPanelVisible: (panelId: string) => boolean
}

const PanelContext = createContext<PanelContextType | undefined>(undefined)

interface PanelProviderProps {
  children: ReactNode
  initialPanels?: PanelConfig[]
}

export function PanelProvider({ children, initialPanels = [] }: PanelProviderProps) {
  const [panelManager] = useState(() => new PanelManager())
  const [visiblePanels, setVisiblePanels] = useState<PanelState[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

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

    // Initial update
    updateVisiblePanels()
    setIsInitialized(true)

    return () => {
      // Cleanup event listeners if needed
    }
  }, [panelManager, initialPanels, isInitialized])

  const updateVisiblePanels = () => {
    const panels = panelManager.getVisiblePanels()
    setVisiblePanels(panels)
  }

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

  const getCurrentTemplate = (): Template | undefined => {
    // This would need to be implemented in PanelManager
    return undefined
  }

  const getAvailableTemplates = (): Template[] => {
    return panelManager.getTemplates()
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
    showPanel,
    hidePanel,
    togglePanel,
    resizePanel,
    movePanel,
    applyTemplate,
    getCurrentTemplate,
    getAvailableTemplates,
    getPanelConfig,
    getAllPanelConfigs,
    isPanelVisible
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

