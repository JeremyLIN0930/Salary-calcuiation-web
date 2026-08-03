import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { SystemSettings, DEFAULT_SETTINGS } from '../types/settings'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage'
import { supabaseSettingsRepository } from '../repositories/SupabaseSettingsRepository'

interface SettingsContextValue {
  settings: SystemSettings
  updateSettings: (newSettings: Partial<SystemSettings>) => void
}

const Ctx = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(() =>
    loadFromStorage<SystemSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  )

  const fetchSupabaseSettings = useCallback(async () => {
    try {
      const res = await supabaseSettingsRepository.getSettings()
      if (res.success && res.data && Object.keys(res.data).length > 0) {
        setSettings(prev => ({
          ...prev,
          ...res.data,
        }))
      }
    } catch (err) {
      console.error('[SettingsContext] Load from Supabase error:', err)
    }
  }, [])

  useEffect(() => {
    fetchSupabaseSettings()
  }, [fetchSupabaseSettings])

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => {
      const next = {
        ...prev,
        ...newSettings,
        updatedAt: new Date().toISOString(),
      }
      saveToStorage(STORAGE_KEYS.SETTINGS, next)
      supabaseSettingsRepository.saveSettings(next as Record<string, unknown>).catch(err => {
        console.error('[SettingsContext] Save to Supabase error:', err)
      })
      return next
    })
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
