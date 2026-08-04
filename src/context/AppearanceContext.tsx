import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'
export type UiDensity = 'compact' | 'default' | 'comfort'

interface AppearanceContextType {
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  uiDensity: UiDensity
  setUiDensity: (density: UiDensity) => void
  effectiveTheme: 'light' | 'dark'
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined)

const STORAGE_THEME_KEY = 'theme_mode'
const STORAGE_DENSITY_KEY = 'ui_density'

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State from localStorage
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_THEME_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
    return 'system'
  })

  const [uiDensity, setUiDensityState] = useState<UiDensity>(() => {
    const saved = localStorage.getItem(STORAGE_DENSITY_KEY)
    if (saved === 'compact' || saved === 'default' || saved === 'comfort') return saved
    return 'default'
  })

  // System theme listener
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    if (!window.matchMedia) return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches)
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Calculate effective theme ('light' | 'dark')
  const effectiveTheme = useMemo<'light' | 'dark'>(() => {
    if (themeMode === 'dark') return 'dark'
    if (themeMode === 'light') return 'light'
    return systemIsDark ? 'dark' : 'light'
  }, [themeMode, systemIsDark])

  // Update localStorage and DOM attributes
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode)
    localStorage.setItem(STORAGE_THEME_KEY, mode)
  }

  const setUiDensity = (density: UiDensity) => {
    setUiDensityState(density)
    localStorage.setItem(STORAGE_DENSITY_KEY, density)
  }

  useEffect(() => {
    const root = document.documentElement
    const body = document.body

    // Apply Theme Class
    body.classList.remove('theme-light', 'theme-dark')
    body.classList.add(`theme-${effectiveTheme}`)
    root.setAttribute('data-theme', effectiveTheme)

    // Apply Density Class
    body.classList.remove('density-compact', 'density-default', 'density-comfort')
    body.classList.add(`density-${uiDensity}`)
    root.setAttribute('data-density', uiDensity)
  }, [effectiveTheme, uiDensity])

  const value = useMemo(
    () => ({
      themeMode,
      setThemeMode,
      uiDensity,
      setUiDensity,
      effectiveTheme,
    }),
    [themeMode, uiDensity, effectiveTheme]
  )

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
}

export const useAppearance = () => {
  const context = useContext(AppearanceContext)
  if (!context) {
    throw new Error('useAppearance must be used within an AppearanceProvider')
  }
  return context
}
