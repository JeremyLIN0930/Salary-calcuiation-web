import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { MasterEmployee } from '../types/masterEmployee'
import { EmployeeRepository } from '../database/repositories/EmployeeRepository'

type Action =
  | { type: 'ADD'; payload: MasterEmployee }
  | { type: 'UPDATE'; payload: MasterEmployee }
  | { type: 'DELETE'; payload: string }

interface State {
  employees: MasterEmployee[]
}

function loadInitialState(): State {
  return {
    employees: EmployeeRepository.getAll(),
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD':
      return { employees: [action.payload, ...state.employees] }
    case 'UPDATE':
      return {
        employees: state.employees.map(e => e.id === action.payload.id ? action.payload : e),
      }
    case 'DELETE':
      return {
        employees: state.employees.filter(e => e.id !== action.payload),
      }
    default:
      return state
  }
}

interface MasterEmployeeContextValue {
  state: State
  dispatch: React.Dispatch<Action>
}

const Ctx = createContext<MasterEmployeeContextValue | null>(null)

export function MasterEmployeeProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState)

  useEffect(() => {
    const currentRepoIds = new Set(EmployeeRepository.getAll().map(e => e.id))
    const stateIds = new Set(state.employees.map(e => e.id))

    state.employees.forEach(emp => EmployeeRepository.save(emp))

    currentRepoIds.forEach(id => {
      if (!stateIds.has(id)) {
        EmployeeRepository.delete(id)
      }
    })
  }, [state.employees])

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useMasterEmployees() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useMasterEmployees must be used inside MasterEmployeeProvider')
  return ctx
}
