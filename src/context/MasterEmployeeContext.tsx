/**
 * MasterEmployeeContext.tsx — Supabase Migration
 *
 * Architecture:
 *   EmployeeManagementPage → MasterEmployeeContext → SupabaseEmployeeRepository → master_employees
 *
 * Root Cause Fixed:
 *   Previously this context only saved to Dexie (EmployeeRepository),
 *   so employees appeared to save locally but NEVER reached Supabase master_employees table.
 *
 * Backward Compatible:
 *   - { state, dispatch } API unchanged
 *   - All pages/components unchanged
 */

import React, {
  createContext, useContext, useReducer,
  useEffect, useCallback, useRef,
} from 'react'
import { MasterEmployee } from '../types/masterEmployee'
import { supabaseEmployeeRepository } from '../repositories/SupabaseEmployeeRepository'
// Dexie fallback (preserved for rollback)
import { EmployeeRepository } from '../database/repositories/EmployeeRepository'

// ── Feature flag: set to false to rollback to Dexie ──────────────────────────
const USE_SUPABASE = true

// ── Types ─────────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET';    payload: MasterEmployee[] }
  | { type: 'ADD';    payload: MasterEmployee }
  | { type: 'UPDATE'; payload: MasterEmployee }
  | { type: 'DELETE'; payload: string }

interface State {
  employees: MasterEmployee[]
  loading: boolean
  saving: boolean
  deleting: boolean
  error: string | null
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET':
      return { ...state, employees: action.payload, loading: false, error: null }
    case 'ADD':
      return { ...state, employees: [action.payload, ...state.employees] }
    case 'UPDATE':
      return {
        ...state,
        employees: state.employees.map(e => e.id === action.payload.id ? action.payload : e),
      }
    case 'DELETE':
      return {
        ...state,
        employees: state.employees.filter(e => e.id !== action.payload),
      }
    default:
      return state
  }
}

const INITIAL_STATE: State = {
  employees: [],
  loading: true,
  saving: false,
  deleting: false,
  error: null,
}

// ── Context Value ─────────────────────────────────────────────────────────────

interface MasterEmployeeContextValue {
  state: State
  dispatch: React.Dispatch<Action>
  refresh: () => Promise<void>
}

const Ctx = createContext<MasterEmployeeContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function MasterEmployeeProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const refreshingRef = useRef(false)

  // ── Load from Supabase (master_employees) or Dexie ───────────────────────

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return
    refreshingRef.current = true

    try {
      if (USE_SUPABASE) {
        console.log('[MasterEmployeeContext] Loading from master_employees...')
        const result = await supabaseEmployeeRepository.getAll()
        if (result.success && result.data) {
          console.log('[MasterEmployeeContext] Loaded', result.data.length, 'employees')
          dispatch({ type: 'SET', payload: result.data as MasterEmployee[] })
        } else {
          console.error('[MasterEmployeeContext] Load failed:', result.error)
          // Fallback: load from Dexie
          const dexieData = EmployeeRepository.getAll()
          dispatch({ type: 'SET', payload: dexieData })
        }
      } else {
        const dexieData = EmployeeRepository.getAll()
        dispatch({ type: 'SET', payload: dexieData })
      }
    } catch (err) {
      console.error('[MasterEmployeeContext] refresh exception:', err)
      dispatch({ type: 'SET', payload: [] })
    } finally {
      refreshingRef.current = false
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // ── Intercept dispatch: optimistic update + Supabase persist ─────────────

  const syncedDispatch = useCallback(async (action: Action) => {
    // Always optimistic local update first
    dispatch(action)

    if (!USE_SUPABASE) {
      // Dexie only
      if (action.type === 'ADD' || action.type === 'UPDATE') {
        EmployeeRepository.save(action.payload as MasterEmployee)
      } else if (action.type === 'DELETE') {
        EmployeeRepository.delete(action.payload)
      }
      return
    }

    // Supabase async persist
    try {
      if (action.type === 'ADD') {
        console.log('[MasterEmployeeContext] Creating in master_employees:', action.payload)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await supabaseEmployeeRepository.create(action.payload as any)
        if (!result.success) {
          console.error('[MasterEmployeeContext] Create failed:', result.error)
          await refresh() // Rollback
        } else {
          console.log('[MasterEmployeeContext] Created successfully:', result.data)
        }
      } else if (action.type === 'UPDATE') {
        console.log('[MasterEmployeeContext] Updating in master_employees:', action.payload.id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await supabaseEmployeeRepository.update(action.payload.id, action.payload as any)
        if (!result.success) {
          console.error('[MasterEmployeeContext] Update failed:', result.error)
          await refresh() // Rollback
        }
      } else if (action.type === 'DELETE') {
        console.log('[MasterEmployeeContext] Deleting from master_employees:', action.payload)
        const result = await supabaseEmployeeRepository.delete(action.payload)
        if (!result.success) {
          console.error('[MasterEmployeeContext] Delete failed:', result.error)
          await refresh() // Rollback
        }
      }
    } catch (err) {
      console.error('[MasterEmployeeContext] syncedDispatch exception:', err)
      await refresh()
    }
  }, [refresh]) as React.Dispatch<Action>

  return (
    <Ctx.Provider value={{ state, dispatch: syncedDispatch, refresh }}>
      {children}
    </Ctx.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useMasterEmployees() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useMasterEmployees must be used inside MasterEmployeeProvider')
  return ctx
}
