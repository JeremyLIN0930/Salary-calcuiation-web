/**
 * StoreContext.tsx
 * Dynamic Store Provider for 001 慶東門市, 002 南醫門市
 * Reads stores from SupabaseStoreRepository and falls back to DEFAULT_STORES.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Store, DEFAULT_STORES } from '../types/store'
import { supabaseStoreRepository } from '../repositories/SupabaseStoreRepository'

interface StoreContextValue {
  stores: Store[]
  loading: boolean
  refreshStores: () => Promise<void>
}

const StoreCtx = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [stores, setStores] = useState<Store[]>(DEFAULT_STORES)
  const [loading, setLoading] = useState<boolean>(true)

  const refreshStores = useCallback(async () => {
    setLoading(true)
    try {
      const res = await supabaseStoreRepository.getStores()
      if (res.success && res.data && res.data.length > 0) {
        setStores(res.data)
      } else {
        setStores(DEFAULT_STORES)
      }
    } catch (err) {
      console.error('[StoreContext] Failed to load stores from Supabase:', err)
      setStores(DEFAULT_STORES)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshStores()
  }, [refreshStores])

  return (
    <StoreCtx.Provider value={{ stores, loading, refreshStores }}>
      {children}
    </StoreCtx.Provider>
  )
}

export function useStoreContext() {
  const ctx = useContext(StoreCtx)
  if (!ctx) {
    // Fallback if rendered outside provider
    return { stores: DEFAULT_STORES, loading: false, refreshStores: async () => {} }
  }
  return ctx
}
