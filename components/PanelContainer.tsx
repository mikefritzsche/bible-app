'use client'

import { usePanels } from '@/lib/contexts/PanelContext'
import { panelRegistry } from '@/lib/panels/PanelRegistry'

export function PanelContainer() {
  const { visiblePanels } = usePanels()

  // Group panels by area
  const panelsByArea = {
    main: visiblePanels.filter(panel => panel.position === 'main'),
    left: visiblePanels.filter(panel => panel.position === 'left'),
    right: visiblePanels.filter(panel => panel.position === 'right'),
    top: visiblePanels.filter(panel => panel.position === 'top'),
    bottom: visiblePanels.filter(panel => panel.position === 'bottom')
  }

  // Check if we have any panels in side or bottom areas
  const hasLeftPanels = panelsByArea.left.length > 0
  const hasRightPanels = panelsByArea.right.length > 0
  const hasTopPanels = panelsByArea.top.length > 0
  const hasBottomPanels = panelsByArea.bottom.length > 0

  // If no panels are visible except main, don't show the container
  const hasLayoutPanels = hasLeftPanels || hasRightPanels || hasTopPanels || hasBottomPanels

  if (!hasLayoutPanels) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 pointer-events-none z-10">
      <div className="relative w-full h-full pointer-events-none">
        {/* Top Panel Area */}
        {hasTopPanels && (
          <div className="absolute top-0 left-0 right-0 h-48 pointer-events-auto border-b border-gray-200 dark:border-gray-700">
            <div className="flex h-full">
              {panelsByArea.top.map((panelState) => {
                const panelConfig = panelRegistry.getPanel(panelState.id)
                if (!panelConfig) return null

                const PanelComponent = panelConfig.component
                if (!PanelComponent) return null

                return (
                  <PanelComponent
                    key={panelState.id}
                    id={panelState.id}
                    title={panelConfig.title}
                    isVisible={panelState.isVisible}
                    position={panelState.position}
                    size={panelState.size}
                    onResize={(size) => {
                      // Handle resize through panel manager
                    }}
                    minSize={panelConfig.minSize}
                    maxSize={panelConfig.maxSize}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Middle Section (Left + Main + Right) */}
        <div
          className="absolute flex"
          style={{
            top: hasTopPanels ? '192px' : '0',
            bottom: hasBottomPanels ? '192px' : '0',
            left: '0',
            right: '0'
          }}
        >
          {/* Left Panel Area */}
          {hasLeftPanels && (
            <div className="w-80 pointer-events-auto border-r border-gray-200 dark:border-gray-700">
              <div className="flex flex-col h-full">
                {panelsByArea.left.map((panelState) => {
                  const panelConfig = panelRegistry.getPanel(panelState.id)
                  if (!panelConfig) return null

                  const PanelComponent = panelConfig.component
                  if (!PanelComponent) return null

                  return (
                    <PanelComponent
                      key={panelState.id}
                      id={panelState.id}
                      title={panelConfig.title}
                      isVisible={panelState.isVisible}
                      position={panelState.position}
                      size={panelState.size}
                      onResize={(size) => {
                        // Handle resize through panel manager
                      }}
                      minSize={panelConfig.minSize}
                      maxSize={panelConfig.maxSize}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 pointer-events-auto">
            {panelsByArea.main.map((panelState) => {
              const panelConfig = panelRegistry.getPanel(panelState.id)
              if (!panelConfig) return null

              const PanelComponent = panelConfig.component
              if (!PanelComponent) return null

              return (
                <PanelComponent
                  key={panelState.id}
                  id={panelState.id}
                  title={panelConfig.title}
                  isVisible={panelState.isVisible}
                  position={panelState.position}
                  size={panelState.size}
                  onResize={(size) => {
                    // Handle resize through panel manager
                  }}
                  minSize={panelConfig.minSize}
                  maxSize={panelConfig.maxSize}
                />
              )
            })}
          </div>

          {/* Right Panel Area */}
          {hasRightPanels && (
            <div className="w-80 pointer-events-auto border-l border-gray-200 dark:border-gray-700">
              <div className="flex flex-col h-full">
                {panelsByArea.right.map((panelState) => {
                  const panelConfig = panelRegistry.getPanel(panelState.id)
                  if (!panelConfig) return null

                  const PanelComponent = panelConfig.component
                  if (!PanelComponent) return null

                  return (
                    <PanelComponent
                      key={panelState.id}
                      id={panelState.id}
                      title={panelConfig.title}
                      isVisible={panelState.isVisible}
                      position={panelState.position}
                      size={panelState.size}
                      onResize={(size) => {
                        // Handle resize through panel manager
                      }}
                      minSize={panelConfig.minSize}
                      maxSize={panelConfig.maxSize}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Panel Area */}
        {hasBottomPanels && (
          <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-auto border-t border-gray-200 dark:border-gray-700">
            <div className="flex h-full">
              {panelsByArea.bottom.map((panelState) => {
                const panelConfig = panelRegistry.getPanel(panelState.id)
                if (!panelConfig) return null

                const PanelComponent = panelConfig.component
                if (!PanelComponent) return null

                return (
                  <PanelComponent
                    key={panelState.id}
                    id={panelState.id}
                    title={panelConfig.title}
                    isVisible={panelState.isVisible}
                    position={panelState.position}
                    size={panelState.size}
                    onResize={(size) => {
                      // Handle resize through panel manager
                    }}
                    minSize={panelConfig.minSize}
                    maxSize={panelConfig.maxSize}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
