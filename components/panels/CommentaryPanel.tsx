'use client'

import { BasePanel } from './BasePanel'

export function CommentaryPanel({
  id,
  title,
  isVisible,
  position,
  size,
  onResize,
  onClose,
  onPositionChange,
  minSize,
  maxSize
}: any) {
  return (
    <BasePanel
      id={id}
      title={title}
      isVisible={isVisible}
      position={position}
      size={size}
      onResize={onResize}
      onClose={onClose}
      onPositionChange={onPositionChange}
      minSize={minSize}
      maxSize={maxSize}
    >
      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Commentary</h3>
        </div>
        <p className="text-blue-700 dark:text-blue-300 mb-4 font-medium">
          Scholarly insights and explanations
        </p>
        <div className="p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            📖 Coming Soon: Historical context, scholarly analysis, and verse-by-verse commentary
          </p>
        </div>
      </div>
    </BasePanel>
  )
}