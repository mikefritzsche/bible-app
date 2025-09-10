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

const defaultSettings: Settings = {
  fontSize: '16',
  lineSpacing: '1.8',
  verseSpacing: '16',
  showVerseNumbers: true,
  showStrongsNumbers: true,
  enableReminders: true,
  bibleVersion: 'kjv_strongs'
}

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
        setSettings({
          fontSize: prefs.fontSize || defaultSettings.fontSize,
          lineSpacing: prefs.lineSpacing || defaultSettings.lineSpacing,
          verseSpacing: prefs.verseSpacing || defaultSettings.verseSpacing,
          showVerseNumbers: prefs.showVerseNumbers ?? defaultSettings.showVerseNumbers,
          showStrongsNumbers: prefs.showStrongsNumbers ?? defaultSettings.showStrongsNumbers,
          enableReminders: prefs.enableReminders ?? defaultSettings.enableReminders,
          bibleVersion: prefs.bibleVersion || defaultSettings.bibleVersion
        })
      } catch (e) {
        console.error('Failed to load preferences:', e)
      }
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