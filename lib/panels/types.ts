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
  dockable: boolean
  closable: boolean
  component: React.ComponentType<PanelProps>
  defaultVisible?: boolean
  keyboardShortcut?: string
}

export interface PanelProps {
  id: string
  title: string
  isVisible: boolean
  position: PanelPosition
  size: PanelSize
  onClose: () => void
  onResize: (size: PanelSize) => void
  onPositionChange: (position: PanelPosition) => void
  [key: string]: any
}

export type PanelPosition = 'left' | 'right' | 'bottom' | 'top' | 'floating'

export interface PanelSize {
  width: number
  height: number
}

export interface PanelState {
  id: string
  config: PanelConfig
  isVisible: boolean
  position: PanelPosition
  size: PanelSize
  order: number
  zIndex: number
}

export interface PanelLayout {
  id: string
  name: string
  description?: string
  panels: Omit<PanelState, 'config'>[]
  timestamp: Date
}

export interface Template {
  id: string
  name: string
  description?: string
  icon?: string
  category: 'study' | 'research' | 'devotional' | 'teaching' | 'custom'
  layout: PanelLayout
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