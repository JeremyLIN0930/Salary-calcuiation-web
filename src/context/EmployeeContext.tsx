import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { Employee } from '../types/employee'
import { SalaryRepository } from '../database/repositories/SalaryRepository'

type Action =
  | { type: 'ADD'; payload: Employee }
  | { type: 'UPDATE'; payload: Employee }
  | { type: 'DELETE'; payload: string }

interface State {
  employees: Employee[]
}

function loadInitialState(): State {
  return {
    employees: SalaryRepository.getAll(),
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD':
      return { employees: [...state.employees, action.payload] }
    case 'UPDATE':
      return { employees: state.employees.map(e => e.id === action.payload.id ? action.payload : e) }
    case 'DELETE':
      return { employees: state.employees.filter(e => e.id !== action.payload) }
    default:
      return state
  }
}

const Ctx = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null)

export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState)

  // Persist to Repository whenever salary employees change
  useEffect(() => {
    // Sync state to SalaryRepository
    const currentRepoIds = new Set(SalaryRepository.getAll().map(s => s.id))
    const stateIds = new Set(state.employees.map(s => s.id))

    // Save/Update
    state.employees.forEach(emp => SalaryRepository.save(emp))

    // Remove deleted items
    currentRepoIds.forEach(id => {
      if (!stateIds.has(id)) {
        SalaryRepository.delete(id)
      }
    })
  }, [state.employees])

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useEmployees() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useEmployees outside provider')
  return ctx
}
