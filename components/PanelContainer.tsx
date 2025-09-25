'use client'

import { usePanels } from '@/lib/contexts/PanelContext'
import { panelRegistry } from '@/lib/panels/PanelRegistry'

export function PanelContainer() {
  const { visiblePanels } = usePanels()

  return (
    <>
      {visiblePanels.map((panelState) => {
        const panelConfig = panelRegistry.getPanel(panelState.id)
        if (!panelConfig) return null

        const PanelComponent = panelConfig.component

        return (
          <PanelComponent
            key={panelState.id}
            id={panelState.id}
            title={panelConfig.title}
            isVisible={panelState.isVisible}
            position={panelState.position}
            size={panelState.size}
            onClose={() => {}} // This will be handled by the panel manager
            onResize={(size) => {}} // This will be handled by the panel manager
            onPositionChange={(position) => {}} // This will be handled by the panel manager
          />
        )
      })}
    </>
  )
}