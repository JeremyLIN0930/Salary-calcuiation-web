import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { Schedule } from '../types/schedule'
import { loadFromStorage, saveToStorage } from '../utils/storage'

const STORAGE_KEY = 'schedules_v2'

interface ScheduleState {
  schedules: Schedule[]
}

type ScheduleAction =
  | { type: 'SET_SCHEDULES'; payload: Schedule[] }
  | { type: 'ADD_SCHEDULE'; payload: Schedule }
  | { type: 'UPDATE_SCHEDULE'; payload: Schedule }
  | { type: 'DELETE_SCHEDULE'; payload: string }

function loadInitialState(): ScheduleState {
  return {
    schedules: loadFromStorage<Schedule[]>(STORAGE_KEY, []),
  }
}

function reducer(state: ScheduleState, action: ScheduleAction): ScheduleState {
  switch (action.type) {
    case 'SET_SCHEDULES':
      return { schedules: action.payload }
    case 'ADD_SCHEDULE':
      return { schedules: [action.payload, ...state.schedules] }
    case 'UPDATE_SCHEDULE':
      return {
        schedules: state.schedules.map(s => s.id === action.payload.id ? action.payload : s),
      }
    case 'DELETE_SCHEDULE':
      return {
        schedules: state.schedules.filter(s => s.id !== action.payload),
      }
    default:
      return state
  }
}

interface ScheduleContextValue {
  state: ScheduleState
  dispatch: React.Dispatch<ScheduleAction>
}

const Ctx = createContext<ScheduleContextValue | null>(null)

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState)

  useEffect(() => {
    saveToStorage(STORAGE_KEY, state.schedules)
  }, [state.schedules])

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useSchedule() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSchedule must be used inside ScheduleProvider')
  return ctx
}
