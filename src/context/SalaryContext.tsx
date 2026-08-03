import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { Employee } from '../types/employee'
import { SalaryRepository } from '../database/repositories/SalaryRepository'

type Action =
  | { type: 'ADD'; payload: Employee }
  | { type: 'UPDATE'; payload: Employee }
  | { type: 'DELETE'; payload: string }

interface State {
  salaries: Employee[]
}

function loadInitialState(): State {
  return {
    salaries: SalaryRepository.getAll(),
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD':
      return { salaries: [...state.salaries, action.payload] }
    case 'UPDATE':
      return { salaries: state.salaries.map(s => s.id === action.payload.id ? action.payload : s) }
    case 'DELETE':
      return { salaries: state.salaries.filter(s => s.id !== action.payload) }
    default:
      return state
  }
}

interface SalaryContextValue {
  state: State
  dispatch: React.Dispatch<Action>
}

const Ctx = createContext<SalaryContextValue | null>(null)

export function SalaryProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState)

  // Sync with SalaryRepository
  useEffect(() => {
    const currentRepoIds = new Set(SalaryRepository.getAll().map(s => s.id))
    const stateIds = new Set(state.salaries.map(s => s.id))

    // Save/Update
    state.salaries.forEach(s => SalaryRepository.save(s))

    // Delete removed items
    currentRepoIds.forEach(id => {
      if (!stateIds.has(id)) {
        SalaryRepository.delete(id)
      }
    })
  }, [state.salaries])

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useSalaryContext() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSalaryContext must be used within SalaryProvider')
  return ctx
}
