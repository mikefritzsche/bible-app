'use client'

import { usePanels } from '@/lib/contexts/PanelContext'
import { panelRegistry } from '@/lib/panels/PanelRegistry'
import type { PanelPosition, PanelState } from '@/lib/panels/types'
import { ReactNode, useMemo } from 'react'
import { usePathname } from 'next/navigation'

interface LayoutSystemProps {
  children: ReactNode
}

export function LayoutSystem({ children }: LayoutSystemProps) {
  const { visiblePanels, hidePanel, resizePanel, movePanel } = usePanels()
  const pathname = usePathname()
  const isBibleRoute = !pathname || pathname === '/' || pathname.startsWith('/bible')

  if (!isBibleRoute) {
    return <>{children}</>
  }

  const panelsByPosition = useMemo(() => {
    return {
      main: visiblePanels.filter(panel => panel.position === 'main'),
      left: visiblePanels.filter(panel => panel.position === 'left'),
      right: visiblePanels.filter(panel => panel.position === 'right'),
      top: visiblePanels.filter(panel => panel.position === 'top'),
      bottom: visiblePanels.filter(panel => panel.position === 'bottom')
    }
  }, [visiblePanels])

  const hasLeftPanels = panelsByPosition.left.length > 0
  const hasRightPanels = panelsByPosition.right.length > 0
  const hasTopPanels = panelsByPosition.top.length > 0
  const hasBottomPanels = panelsByPosition.bottom.length > 0

  const getContainerStyle = (position: PanelPosition) => {
    if (position === 'left' || position === 'right') {
      const panels = panelsByPosition[position]
      if (panels.length === 0) return undefined

      const width = Math.max(
        ...panels.map(panel => panel.size.width ?? panel.config.defaultSize.width ?? 320)
      )
      return { width }
    }

    if (position === 'top' || position === 'bottom') {
      const panels = panelsByPosition[position]
      if (panels.length === 0) return undefined

      const height = Math.max(
        ...panels.map(panel => panel.size.height ?? panel.config.defaultSize.height ?? 240)
      )
      return { height }
    }

    return undefined
  }

  // Render panels for a specific position
  const renderPanels = (position: PanelPosition) => {
    return panelsByPosition[position].map((panelState) => {
      const panelConfig = panelRegistry.getPanel(panelState.id)
      if (!panelConfig || !panelConfig.component) return null

      const PanelComponent = panelConfig.component

      return (
        <PanelComponent
          key={panelState.id}
          id={panelState.id}
          title={panelConfig.title}
          isVisible={panelState.isVisible}
          position={panelState.position}
          size={panelState.size}
          onResize={(size) => resizePanel(panelState.id, size)}
          onClose={() => hidePanel(panelState.id)}
          onPositionChange={(nextPosition) => movePanel(panelState.id, nextPosition)}
          minSize={panelConfig.minSize}
          maxSize={panelConfig.maxSize}
        />
      )
    })
  }

  const renderMainContent = () => {
    const mainPanels = renderPanels('main')
    const renderablePanels = mainPanels.filter(Boolean) as ReactNode[]

    if (renderablePanels.length === 0) {
      return children
    }

    if (renderablePanels.length === 1) {
      return renderablePanels
    }

    const columns = Math.min(renderablePanels.length, 3)

    return (
      <div
        className="grid gap-4 h-full overflow-hidden"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {renderablePanels}
      </div>
    )
  }

  const hasMainPanels = panelsByPosition.main.length > 0

  return (
    <>
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Top Panel Area */}
      {hasTopPanels && (
        <div
          className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
          style={getContainerStyle('top')}
        >
          {renderPanels('top')}
        </div>
      )}

      {/* Main Content Area with Side Panels */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Panel Area */}
        {hasLeftPanels && (
          <div
            className="border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
            style={getContainerStyle('left')}
          >
            <div className="h-full flex flex-col overflow-auto">
              {renderPanels('left')}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full min-h-0 overflow-y-auto">
            {renderMainContent()}
          </div>
        </div>

        {/* Right Panel Area */}
        {hasRightPanels && (
          <div
            className="border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
            style={getContainerStyle('right')}
          >
            <div className="h-full flex flex-col overflow-auto">
              {renderPanels('right')}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Panel Area */}
      {hasBottomPanels && (
        <div
          className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
          style={getContainerStyle('bottom')}
        >
          {renderPanels('bottom')}
        </div>
      )}
      </div>
      {hasMainPanels && (
        <div className="contents">
          {children}
        </div>
      )}
    </>
  )
}
