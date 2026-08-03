import React, { createContext, useContext, useReducer, useEffect } from 'react'
import {
  ShiftTemplate,
  ScheduleStaff,
  ScheduleRecord,
  DEFAULT_SHIFT_TEMPLATES,
} from '../types/schedule'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage'

// ─── State ──────────────────────────────────────────────────────────────────

interface ScheduleState {
  shifts: ShiftTemplate[]
  staff: ScheduleStaff[]
  records: ScheduleRecord[]
}

// ─── Actions ────────────────────────────────────────────────────────────────

type ScheduleAction =
  // Shift templates
  | { type: 'ADD_SHIFT';    payload: ShiftTemplate }
  | { type: 'UPDATE_SHIFT'; payload: ShiftTemplate }
  | { type: 'DELETE_SHIFT'; payload: string }
  // Staff
  | { type: 'ADD_STAFF';    payload: ScheduleStaff }
  | { type: 'UPDATE_STAFF'; payload: ScheduleStaff }
  | { type: 'DELETE_STAFF'; payload: string }
  // Records
  | { type: 'ADD_RECORD';    payload: ScheduleRecord }
  | { type: 'UPDATE_RECORD'; payload: ScheduleRecord }
  | { type: 'DELETE_RECORD'; payload: string }

// ─── Initial State ──────────────────────────────────────────────────────────

function loadInitialState(): ScheduleState {
  return {
    shifts:  loadFromStorage<ShiftTemplate[]>(STORAGE_KEYS.SHIFT_TEMPLATES, DEFAULT_SHIFT_TEMPLATES),
    staff:   loadFromStorage<ScheduleStaff[]>(STORAGE_KEYS.SCHEDULE_STAFF,  []),
    records: loadFromStorage<ScheduleRecord[]>(STORAGE_KEYS.SCHEDULE_RECORDS, []),
  }
}

// ─── Reducer ────────────────────────────────────────────────────────────────

function reducer(state: ScheduleState, action: ScheduleAction): ScheduleState {
  switch (action.type) {
    case 'ADD_SHIFT':
      return { ...state, shifts: [...state.shifts, action.payload] }
    case 'UPDATE_SHIFT':
      return { ...state, shifts: state.shifts.map(s => s.id === action.payload.id ? action.payload : s) }
    case 'DELETE_SHIFT':
      return { ...state, shifts: state.shifts.filter(s => s.id !== action.payload) }

    case 'ADD_STAFF':
      return { ...state, staff: [...state.staff, action.payload] }
    case 'UPDATE_STAFF':
      return { ...state, staff: state.staff.map(s => s.id === action.payload.id ? action.payload : s) }
    case 'DELETE_STAFF':
      return { ...state, staff: state.staff.filter(s => s.id !== action.payload) }

    case 'ADD_RECORD':
      return { ...state, records: [...state.records, action.payload] }
    case 'UPDATE_RECORD':
      return { ...state, records: state.records.map(r => r.id === action.payload.id ? action.payload : r) }
    case 'DELETE_RECORD':
      return { ...state, records: state.records.filter(r => r.id !== action.payload) }

    default:
      return state
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

interface ScheduleContextValue {
  state: ScheduleState
  dispatch: React.Dispatch<ScheduleAction>
}

const Ctx = createContext<ScheduleContextValue | null>(null)

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState)

  useEffect(() => { saveToStorage(STORAGE_KEYS.SHIFT_TEMPLATES,  state.shifts) },  [state.shifts])
  useEffect(() => { saveToStorage(STORAGE_KEYS.SCHEDULE_STAFF,   state.staff) },   [state.staff])
  useEffect(() => { saveToStorage(STORAGE_KEYS.SCHEDULE_RECORDS, state.records) }, [state.records])

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useSchedule() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSchedule must be used inside ScheduleProvider')
  return ctx
}
