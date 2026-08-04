/**
 * ScheduleContext.tsx — Supabase Migration Task 5
 *
 * Architecture:
 *   Page → ScheduleContext → SupabaseScheduleRepository → Supabase
 *
 * Backward Compatibility:
 *   - Keeps { state, dispatch } API so all Pages/Components are UNCHANGED.
 *   - state.schedules is the single source of truth (loaded from Supabase).
 *   - dispatch actions (ADD/UPDATE/DELETE) perform optimistic local updates
 *     AND persist to Supabase asynchronously.
 *   - Falls back to Dexie when USE_SUPABASE is false.
 */

import React, {
  createContext, useContext, useReducer,
  useEffect, useCallback, useRef,
} from 'react'
import { Schedule } from '../types/schedule'
import { supabaseScheduleRepository } from '../repositories/SupabaseScheduleRepository'
// Dexie fallback (preserved for rollback)
import { ScheduleRepository } from '../database/repositories/ScheduleRepository'

// ── Feature flag: set to false to rollback to Dexie ──────────────────────────
const USE_SUPABASE = true

// ── State & Actions ──────────────────────────────────────────────────────────

interface ScheduleState {
  schedules: Schedule[]
  loading: boolean
  saving: boolean
  refreshing: boolean
  copying: boolean
  deleting: boolean
  error: string | null
}

type ScheduleAction =
  | { type: 'SET_SCHEDULES';   payload: Schedule[] }
  | { type: 'ADD_SCHEDULE';    payload: Schedule }
  | { type: 'UPDATE_SCHEDULE'; payload: Schedule }
  | { type: 'DELETE_SCHEDULE'; payload: string }
  | { type: 'SET_LOADING';     payload: boolean }
  | { type: 'SET_SAVING';      payload: boolean }
  | { type: 'SET_REFRESHING';  payload: boolean }
  | { type: 'SET_COPYING';     payload: boolean }
  | { type: 'SET_DELETING';    payload: boolean }
  | { type: 'SET_ERROR';       payload: string | null }

function reducer(state: ScheduleState, action: ScheduleAction): ScheduleState {
  switch (action.type) {
    case 'SET_SCHEDULES':
      return { ...state, schedules: action.payload, loading: false, error: null }
    case 'ADD_SCHEDULE':
      return { ...state, schedules: [action.payload, ...state.schedules] }
    case 'UPDATE_SCHEDULE':
      return {
        ...state,
        schedules: state.schedules.map(s =>
          s.id === action.payload.id ? action.payload : s
        ),
      }
    case 'DELETE_SCHEDULE':
      return {
        ...state,
        schedules: state.schedules.filter(s => s.id !== action.payload),
      }
    case 'SET_LOADING':     return { ...state, loading: action.payload }
    case 'SET_SAVING':      return { ...state, saving: action.payload }
    case 'SET_REFRESHING':  return { ...state, refreshing: action.payload }
    case 'SET_COPYING':     return { ...state, copying: action.payload }
    case 'SET_DELETING':    return { ...state, deleting: action.payload }
    case 'SET_ERROR':       return { ...state, error: action.payload }
    default:
      return state
  }
}

const INITIAL_STATE: ScheduleState = {
  schedules: [],
  loading: true,
  saving: false,
  refreshing: false,
  copying: false,
  deleting: false,
  error: null,
}

// ── Context Value ─────────────────────────────────────────────────────────────

interface ScheduleContextValue {
  state: ScheduleState
  dispatch: React.Dispatch<ScheduleAction>
  /** Re-fetch all schedules from Supabase */
  refresh: () => Promise<void>
  /** Direct async save schedule to Supabase returning result */
  saveSchedule: (schedule: Schedule) => Promise<{ success: boolean; data?: Schedule }>
}

const Ctx = createContext<ScheduleContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  // Prevent concurrent refreshes
  const refreshingRef = useRef(false)

  // ── Load from Supabase or Dexie on mount ──────────────────────────────────

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return
    refreshingRef.current = true
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR',   payload: null })

    try {
      if (USE_SUPABASE) {
        const result = await supabaseScheduleRepository.getAllSchedules()
        if (result.success && result.data) {
          console.log("Context schedules", result.data)
          dispatch({ type: 'SET_SCHEDULES', payload: result.data })
        } else {
          console.error('[ScheduleContext] Supabase load error:', result.error)
          dispatch({ type: 'SET_ERROR', payload: '無法載入排班資料，請稍後再試。' })
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } else {
        // Dexie fallback
        const dexieSchedules = ScheduleRepository.getAll()
        console.log("Context schedules", dexieSchedules)
        dispatch({ type: 'SET_SCHEDULES', payload: dexieSchedules })
      }
    } catch (err) {
      console.error('[ScheduleContext] refresh error:', err)
      dispatch({ type: 'SET_ERROR', payload: '載入排班資料時發生錯誤。' })
      dispatch({ type: 'SET_LOADING', payload: false })
    } finally {
      refreshingRef.current = false
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    console.log("Context schedules", state.schedules)
  }, [state.schedules])

  // ── Intercept dispatch to sync Supabase ───────────────────────────────────
  //
  // Workflow aligns with SalaryContext:
  //  1. Save / Add / Update → repository.saveSchedule() → if success → await refresh() → SET_SCHEDULES
  //  2. Delete → repository.deleteSchedule() → if success → await refresh() → SET_SCHEDULES
  //  Never use repository return object to directly mutate React State.

  const syncedDispatch = useCallback(async (action: ScheduleAction) => {
    if (!USE_SUPABASE) {
      dispatch(action)
      // Dexie sync (original behavior)
      if (action.type === 'ADD_SCHEDULE' || action.type === 'UPDATE_SCHEDULE') {
        ScheduleRepository.save(action.payload)
      } else if (action.type === 'DELETE_SCHEDULE') {
        ScheduleRepository.delete(action.payload)
      }
      return
    }

    // Supabase async persistence
    try {
      if (action.type === 'ADD_SCHEDULE' || action.type === 'UPDATE_SCHEDULE') {
        dispatch({ type: 'SET_SAVING', payload: true })
        const result = await supabaseScheduleRepository.saveSchedule(action.payload)
        if (result.success) {
          await refresh()
        } else {
          console.error('[ScheduleContext] Save failed, refreshing:', result.error)
          await refresh()
        }
      } else if (action.type === 'DELETE_SCHEDULE') {
        dispatch({ type: 'SET_DELETING', payload: true })
        const result = await supabaseScheduleRepository.deleteSchedule(action.payload)
        if (result.success) {
          await refresh()
        } else {
          console.error('[ScheduleContext] Delete failed, refreshing:', result.error)
          await refresh()
        }
      } else {
        dispatch(action)
      }
    } catch (err) {
      console.error('[ScheduleContext] syncedDispatch error:', err)
      await refresh()
    } finally {
      dispatch({ type: 'SET_SAVING',   payload: false })
      dispatch({ type: 'SET_DELETING', payload: false })
    }
  }, [refresh]) as React.Dispatch<ScheduleAction>

  const saveSchedule = useCallback(async (sched: Schedule) => {
    dispatch({ type: 'SET_SAVING', payload: true })
    try {
      const result = await supabaseScheduleRepository.saveSchedule(sched)
      if (result.success) {
        await refresh()
        return { success: true, data: result.data || undefined }
      } else {
        console.error('[ScheduleContext] saveSchedule failed:', result.error)
        return { success: false }
      }
    } catch (err) {
      console.error('[ScheduleContext] saveSchedule exception:', err)
      return { success: false }
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false })
    }
  }, [refresh])

  return (
    <Ctx.Provider value={{ state, dispatch: syncedDispatch, refresh, saveSchedule }}>
      {children}
    </Ctx.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSchedule() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSchedule must be used inside ScheduleProvider')
  return ctx
}
