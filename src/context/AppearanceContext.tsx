import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { ThemeTokens, lightTokens, darkTokens } from '../theme/tokens'

export type ThemeMode = 'system' | 'light' | 'dark'
export type UiDensity = 'compact' | 'default' | 'comfort'

interface AppearanceContextType {
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  uiDensity: UiDensity
  setUiDensity: (density: UiDensity) => void
  effectiveTheme: 'light' | 'dark'
  tokens: ThemeTokens
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined)

const STORAGE_THEME_KEY = 'theme_mode'
const STORAGE_DENSITY_KEY = 'ui_density'

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State from localStorage (Default to Light Theme on first visit)
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_THEME_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
    return 'light'
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

  // Get active Theme Tokens
  const tokens = useMemo<ThemeTokens>(() => {
    return effectiveTheme === 'dark' ? darkTokens : lightTokens
  }, [effectiveTheme])

  // Update localStorage and DOM attributes & CSS variables
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

    // Apply Theme Class & Attributes
    body.classList.remove('theme-light', 'theme-dark')
    body.classList.add(`theme-${effectiveTheme}`)
    root.setAttribute('data-theme', effectiveTheme)

    // Apply CSS Variables for Theme Tokens
    Object.entries(tokens).forEach(([key, val]) => {
      root.style.setProperty(`--token-${key}`, val)
    })

    // Apply Density Class
    body.classList.remove('density-compact', 'density-default', 'density-comfort')
    body.classList.add(`density-${uiDensity}`)
    root.setAttribute('data-density', uiDensity)
  }, [effectiveTheme, uiDensity, tokens])

  const value = useMemo(
    () => ({
      themeMode,
      setThemeMode,
      uiDensity,
      setUiDensity,
      effectiveTheme,
      tokens,
    }),
    [themeMode, uiDensity, effectiveTheme, tokens]
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
