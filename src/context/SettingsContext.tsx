import React, { createContext, useContext, useState, useEffect } from 'react'
import { SystemSettings, DEFAULT_SETTINGS } from '../types/settings'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage'

interface SettingsContextValue {
  settings: SystemSettings
  updateSettings: (newSettings: Partial<SystemSettings>) => void
}

const Ctx = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(() =>
    loadFromStorage<SystemSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  )

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings)
  }, [settings])

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
      updatedAt: new Date().toISOString(),
    }))
  }

  return (
    <Ctx.Provider value={{ settings, updateSettings }}>
      {children}
    </Ctx.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
