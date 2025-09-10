'use client'

import { useTheme } from '@/lib/ThemeContext'
import { useSettings } from '@/lib/SettingsContext'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { settings, updateSettings } = useSettings()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
        Settings
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Configure your reading preferences
      </p>
      
      <div className="space-y-8">
        {/* Appearance Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Appearance
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block mb-2 text-gray-700 dark:text-gray-300 font-medium">
                Theme
              </label>
              <div className="flex items-center gap-4">
                <select 
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                  {theme === 'light' ? (
                    <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : theme === 'dark' ? (
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {theme === 'system' ? 'Following your system preference' : `Using ${theme} theme`}
              </p>
            </div>
            
            <div>
              <label className="block mb-2 text-gray-700 dark:text-gray-300 font-medium">
                Font Size: <span className="font-normal">{settings.fontSize}px</span>
              </label>
              <input 
                type="range" 
                min="12" 
                max="24" 
                value={settings.fontSize}
                onChange={(e) => updateSettings({ fontSize: e.target.value })}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>12px</span>
                <span>18px</span>
                <span>24px</span>
              </div>
            </div>
            
            <div>
              <label className="block mb-2 text-gray-700 dark:text-gray-300 font-medium">
                Line Spacing: <span className="font-normal">{settings.lineSpacing}</span>
              </label>
              <input 
                type="range" 
                min="1.2" 
                max="2.5" 
                step="0.1"
                value={settings.lineSpacing}
                onChange={(e) => updateSettings({ lineSpacing: e.target.value })}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Compact</span>
                <span>Normal</span>
                <span>Relaxed</span>
              </div>
            </div>
            
            <div>
              <label className="block mb-2 text-gray-700 dark:text-gray-300 font-medium">
                Verse Spacing: <span className="font-normal">{settings.verseSpacing}px</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="48" 
                step="4"
                value={settings.verseSpacing}
                onChange={(e) => updateSettings({ verseSpacing: e.target.value })}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Compact</span>
                <span>Normal</span>
                <span>Spacious</span>
              </div>
            </div>
            
            {/* Live Preview */}
            <div className="mt-6">
              <label className="block mb-3 text-gray-700 dark:text-gray-300 font-medium">
                Preview
              </label>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div style={{ 
                  fontSize: `${settings.fontSize}px`, 
                  lineHeight: settings.lineSpacing,
                  padding: `${Math.max(0, parseInt(settings.verseSpacing) / 2)}px 12px`,
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  borderRadius: '4px'
                }}>
                  {settings.showVerseNumbers && (
                    <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">1</span>
                  )}
                  <span className="text-gray-800 dark:text-gray-200">
                    In the beginning God created the heaven and the earth.
                  </span>
                </div>
                <div style={{ 
                  fontSize: `${settings.fontSize}px`, 
                  lineHeight: settings.lineSpacing,
                  padding: `${Math.max(0, parseInt(settings.verseSpacing) / 2)}px 12px`,
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  borderRadius: '4px'
                }}>
                  {settings.showVerseNumbers && (
                    <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">2</span>
                  )}
                  <span className="text-gray-800 dark:text-gray-200">
                    And the earth was without form, and void; and darkness was upon the face of the deep.
                    {settings.showStrongsNumbers && (
                      <span className="text-xs align-super text-blue-500 ml-1 cursor-pointer hover:underline">
                        H776
                      </span>
                    )}
                    {' '}And the Spirit of God moved upon the face of the waters.
                  </span>
                </div>
                <div style={{ 
                  fontSize: `${settings.fontSize}px`, 
                  lineHeight: settings.lineSpacing,
                  padding: `${Math.max(0, parseInt(settings.verseSpacing) / 2)}px 12px`,
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  borderRadius: '4px'
                }}>
                  {settings.showVerseNumbers && (
                    <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">3</span>
                  )}
                  <span className="text-gray-800 dark:text-gray-200">
                    And God said, Let there be light: and there was light.
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Adjust the sliders above to see changes in real-time
              </p>
            </div>
          </div>
        </div>

        {/* Reading Preferences Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Reading Preferences
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={settings.showVerseNumbers}
                onChange={(e) => updateSettings({ showVerseNumbers: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                Show verse numbers
              </span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox"
                checked={settings.showStrongsNumbers}
                onChange={(e) => updateSettings({ showStrongsNumbers: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                Show Strong's numbers
              </span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox"
                checked={settings.enableReminders}
                onChange={(e) => updateSettings({ enableReminders: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                Enable reading plan reminders
              </span>
            </label>
          </div>
        </div>
        
        {/* Bible Version Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Bible Version
          </h2>
          <select 
            value={settings.bibleVersion}
            onChange={(e) => updateSettings({ bibleVersion: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="kjv_strongs">KJV with Strong's</option>
            <option value="kjv">King James Version</option>
            <option value="asv">American Standard Version</option>
            <option value="web">World English Bible</option>
          </select>
        </div>

        {/* Cloud Sync Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Cloud Sync
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Sync your highlights, notes, and reading progress across devices
          </p>
          <a 
            href="/sync-demo"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Configure Cloud Sync
            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* Data Management Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Data Management
          </h2>
          <div className="flex flex-wrap gap-4">
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
              Export Data
            </button>
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              Import Data
            </button>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
              Clear All Data
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            Export your data for backup or import previously saved data
          </p>
        </div>
      </div>
    </div>
  )
}