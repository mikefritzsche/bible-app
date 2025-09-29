'use client'

import { BasePanel } from './BasePanel'

export function DictionaryPanel({
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
      <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Dictionary</h3>
        </div>
        <p className="text-green-700 dark:text-green-300 mb-4 font-medium">
          Original language definitions & Strong's Concordance
        </p>

        <div className="space-y-3">
          <div className="p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg border-l-4 border-green-500">
            <h4 className="font-medium text-sm mb-2 text-green-800 dark:text-green-200">🔍 Available Features:</h4>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• Hebrew & Greek word definitions</li>
              <li>• Strong's number lookup</li>
              <li>• Word pronunciation guides</li>
              <li>• Cross-references to usage</li>
            </ul>
          </div>

          <div className="p-3 bg-green-200/30 dark:bg-green-800/30 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200 font-medium">
              💡 This panel will integrate with the Strong's numbers in the Bible text!
            </p>
          </div>
        </div>
      </div>
    </BasePanel>
  )
}