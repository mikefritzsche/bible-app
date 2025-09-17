'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface Settings {
  fontSize: string
  lineSpacing: string
  verseSpacing: string
  showVerseNumbers: boolean
  showStrongsNumbers: boolean
  enableReminders: boolean
  bibleVersion: string
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => void
}

// Responsive default settings based on screen size
const getDefaultSettings = (): Settings => {
  // Check if we're on the client side
  if (typeof window !== 'undefined') {
    const isMobile = window.innerWidth < 768
    return {
      fontSize: isMobile ? '18' : '16',  // Larger font on mobile for readability
      lineSpacing: isMobile ? '1.6' : '1.8',  // Slightly tighter line spacing on mobile
      verseSpacing: isMobile ? '12' : '16',  // Less verse spacing on mobile
      showVerseNumbers: true,
      showStrongsNumbers: true,
      enableReminders: true,
      bibleVersion: 'kjv_strongs'
    }
  }

  // Server-side defaults
  return {
    fontSize: '16',
    lineSpacing: '1.8',
    verseSpacing: '16',
    showVerseNumbers: true,
    showStrongsNumbers: true,
    enableReminders: true,
    bibleVersion: 'kjv_strongs'
  }
}

const defaultSettings = getDefaultSettings()

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {}
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [mounted, setMounted] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedPrefs = localStorage.getItem('bible-app-preferences')
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs)
        // Get current responsive defaults
        const currentDefaults = getDefaultSettings()

        // Check if user has customized settings
        const hasCustomSettings = localStorage.getItem('bible-app-custom-settings') === 'true'

        if (!hasCustomSettings) {
          // If no custom settings, use responsive defaults
          setSettings({
            fontSize: currentDefaults.fontSize,
            lineSpacing: currentDefaults.lineSpacing,
            verseSpacing: currentDefaults.verseSpacing,
            showVerseNumbers: prefs.showVerseNumbers ?? currentDefaults.showVerseNumbers,
            showStrongsNumbers: prefs.showStrongsNumbers ?? currentDefaults.showStrongsNumbers,
            enableReminders: prefs.enableReminders ?? currentDefaults.enableReminders,
            bibleVersion: prefs.bibleVersion || currentDefaults.bibleVersion
          })
        } else {
          // Use saved custom settings
          setSettings({
            fontSize: prefs.fontSize || currentDefaults.fontSize,
            lineSpacing: prefs.lineSpacing || currentDefaults.lineSpacing,
            verseSpacing: prefs.verseSpacing || currentDefaults.verseSpacing,
            showVerseNumbers: prefs.showVerseNumbers ?? currentDefaults.showVerseNumbers,
            showStrongsNumbers: prefs.showStrongsNumbers ?? currentDefaults.showStrongsNumbers,
            enableReminders: prefs.enableReminders ?? currentDefaults.enableReminders,
            bibleVersion: prefs.bibleVersion || currentDefaults.bibleVersion
          })
        }
      } catch (e) {
        console.error('Failed to load preferences:', e)
        setSettings(getDefaultSettings())
      }
    } else {
      // No saved preferences, use responsive defaults
      setSettings(getDefaultSettings())
    }
    setMounted(true)
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('bible-app-preferences', JSON.stringify(settings))
    }
  }, [settings, mounted])

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
    // Mark that user has customized settings
    if (updates.fontSize || updates.lineSpacing || updates.verseSpacing) {
      localStorage.setItem('bible-app-custom-settings', 'true')
    }
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}