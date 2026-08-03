/**
 * MasterEmployeeContext.tsx — Supabase Migration (Fixed)
 *
 * Architecture:
 *   EmployeeManagementPage → MasterEmployeeContext → SupabaseEmployeeRepository → master_employees
 *
 * Key Fix:
 *   - syncedDispatch now returns a Promise<boolean> so the UI can wait for Supabase result
 *     before showing success Snackbar.
 *   - Added addEmployee / updateEmployee / deleteEmployee async helpers for Page use.
 *   - On init: reads from master_employees via Supabase (not Dexie).
 *   - F5 / refresh(): re-fetches from Supabase.
 */

import React, {
  createContext, useContext, useReducer,
  useEffect, useCallback, useRef,
} from 'react'
import { MasterEmployee } from '../types/masterEmployee'
import { supabaseEmployeeRepository } from '../repositories/SupabaseEmployeeRepository'
import { EmployeeRepository } from '../database/repositories/EmployeeRepository'

const USE_SUPABASE = true

// ── Types ─────────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET';    payload: MasterEmployee[] }
  | { type: 'ADD';    payload: MasterEmployee }
  | { type: 'UPDATE'; payload: MasterEmployee }
  | { type: 'DELETE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }

interface State {
  employees: MasterEmployee[]
  loading: boolean
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET':
      return { ...state, employees: action.payload, loading: false }
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
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

const INITIAL_STATE: State = { employees: [], loading: true }

// ── Context Value ─────────────────────────────────────────────────────────────

interface MasterEmployeeContextValue {
  state: State
  dispatch: React.Dispatch<Action>
  refresh: () => Promise<void>
  /** Returns true on Supabase success, false on failure */
  addEmployee:    (emp: MasterEmployee) => Promise<boolean>
  updateEmployee: (emp: MasterEmployee) => Promise<boolean>
  deleteEmployee: (id: string)         => Promise<boolean>
}

const Ctx = createContext<MasterEmployeeContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function MasterEmployeeProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const refreshingRef = useRef(false)

  // ── Load from Supabase (master_employees) on mount and F5 ────────────────

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return
    refreshingRef.current = true
    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      if (USE_SUPABASE) {
        console.log('[MasterEmployee] Loading from Supabase master_employees...')
        const result = await supabaseEmployeeRepository.getAll()
        if (result.success && result.data) {
          console.log('[MasterEmployee] Loaded', result.data.length, 'employees from Supabase')
          dispatch({ type: 'SET', payload: result.data as MasterEmployee[] })
        } else {
          console.error('[MasterEmployee] Supabase load failed:', result.error)
          const fallback = EmployeeRepository.getAll()
          dispatch({ type: 'SET', payload: fallback })
        }
      } else {
        const dexieData = EmployeeRepository.getAll()
        dispatch({ type: 'SET', payload: dexieData })
      }
    } catch (err) {
      console.error('[MasterEmployee] refresh exception:', err)
      dispatch({ type: 'SET', payload: [] })
    } finally {
      refreshingRef.current = false
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // ── CRUD Helpers — each waits for Supabase and returns success ───────────

  const addEmployee = useCallback(async (emp: MasterEmployee): Promise<boolean> => {
    // Optimistic update
    dispatch({ type: 'ADD', payload: emp })

    if (!USE_SUPABASE) {
      EmployeeRepository.save(emp)
      return true
    }

    try {
      console.log('[MasterEmployee] Inserting into master_employees:', emp.name)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await supabaseEmployeeRepository.create(emp as any)
      if (result.success) {
        console.log('[MasterEmployee] Insert SUCCESS:', result.data)
        return true
      } else {
        console.error('[MasterEmployee] Insert FAILED:', result.error)
        await refresh() // Rollback local optimistic
        return false
      }
    } catch (err) {
      console.error('[MasterEmployee] addEmployee exception:', err)
      await refresh()
      return false
    }
  }, [refresh])

  const updateEmployee = useCallback(async (emp: MasterEmployee): Promise<boolean> => {
    dispatch({ type: 'UPDATE', payload: emp })

    if (!USE_SUPABASE) {
      EmployeeRepository.save(emp)
      return true
    }

    try {
      console.log('[MasterEmployee] Updating master_employees:', emp.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await supabaseEmployeeRepository.update(emp.id, emp as any)
      if (result.success) {
        return true
      } else {
        console.error('[MasterEmployee] Update FAILED:', result.error)
        await refresh()
        return false
      }
    } catch (err) {
      console.error('[MasterEmployee] updateEmployee exception:', err)
      await refresh()
      return false
    }
  }, [refresh])

  const deleteEmployee = useCallback(async (id: string): Promise<boolean> => {
    dispatch({ type: 'DELETE', payload: id })

    if (!USE_SUPABASE) {
      EmployeeRepository.delete(id)
      return true
    }

    try {
      console.log('[MasterEmployee] Deleting from master_employees:', id)
      const result = await supabaseEmployeeRepository.delete(id)
      if (result.success) {
        return true
      } else {
        console.error('[MasterEmployee] Delete FAILED:', result.error)
        await refresh()
        return false
      }
    } catch (err) {
      console.error('[MasterEmployee] deleteEmployee exception:', err)
      await refresh()
      return false
    }
  }, [refresh])

  return (
    <Ctx.Provider value={{ state, dispatch, refresh, addEmployee, updateEmployee, deleteEmployee }}>
      {children}
    </Ctx.Provider>
  )
}

export function useMasterEmployees() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useMasterEmployees must be used inside MasterEmployeeProvider')
  return ctx
}
