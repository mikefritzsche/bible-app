import type { ComponentType } from 'react'

export type PanelPosition = 'main' | 'left' | 'right' | 'bottom' | 'top'

export interface PanelConfig {
  id: string
  title: string
  description?: string
  icon?: string
  category: 'study' | 'resources' | 'comparison' | 'tools'
  defaultPosition: PanelPosition
  defaultSize: PanelSize
  minSize: PanelSize
  maxSize: PanelSize
  resizable: boolean
  dockable?: boolean
  closable?: boolean
  defaultVisible?: boolean
  keyboardShortcut?: string
  component: ComponentType<PanelProps> | null
}

export interface PanelProps {
  id: string
  title: string
  isVisible: boolean
  position: PanelPosition
  size: PanelSize
  onResize: (size: PanelSize) => void
  onClose?: () => void
  onPositionChange?: (position: PanelPosition) => void
  minSize?: PanelSize
  maxSize?: PanelSize
  [key: string]: any
}

export interface PanelSize {
  width?: number // in pixels or percentage
  height?: number // in pixels or percentage
  flex?: number // flex grow factor
}

export interface PanelState {
  id: string
  config: PanelConfig
  isVisible: boolean
  position: PanelPosition
  size: PanelSize
  order: number
}

export interface GridLayout {
  id: string
  name: string
  description?: string
  areas: {
    main: PanelState[]
    left: PanelState[]
    right: PanelState[]
    bottom: PanelState[]
    top: PanelState[]
  }
  timestamp: Date
}

export interface Template {
  id: string
  name: string
  description?: string
  icon?: string
  category: 'study' | 'research' | 'devotional' | 'teaching' | 'custom'
  gridLayout: GridLayout
  screenshot?: string
  author?: string
  isDefault: boolean
  isBuiltIn: boolean
}

export interface PanelManagerConfig {
  storageKey?: string
  maxPanels?: number
  enablePersistence?: boolean
  enableKeyboardShortcuts?: boolean
}

export type PanelEvent =
  | { type: 'panel_opened'; panelId: string }
  | { type: 'panel_closed'; panelId: string }
  | { type: 'panel_resized'; panelId: string; size: PanelSize }
  | { type: 'panel_moved'; panelId: string; position: PanelPosition }
  | { type: 'layout_changed'; layoutId: string }
  | { type: 'template_applied'; templateId: string }
