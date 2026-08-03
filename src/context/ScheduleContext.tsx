import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { Schedule } from '../types/schedule'
import { ScheduleRepository } from '../database/repositories/ScheduleRepository'

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
    schedules: ScheduleRepository.getAll(),
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

  // Sync state with ScheduleRepository
  useEffect(() => {
    const currentRepoIds = new Set(ScheduleRepository.getAll().map(s => s.id))
    const stateIds = new Set(state.schedules.map(s => s.id))

    // Save/Update
    state.schedules.forEach(s => ScheduleRepository.save(s))

    // Remove deleted items
    currentRepoIds.forEach(id => {
      if (!stateIds.has(id)) {
        ScheduleRepository.delete(id)
      }
    })
  }, [state.schedules])

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useSchedule() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSchedule must be used inside ScheduleProvider')
  return ctx
}
