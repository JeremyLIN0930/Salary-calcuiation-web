import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { Employee } from '../types/employee'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage'

type Action =
  | { type: 'ADD'; payload: Employee }
  | { type: 'UPDATE'; payload: Employee }
  | { type: 'DELETE'; payload: string }

interface State {
  employees: Employee[]
}

function loadInitialState(): State {
  return {
    employees: loadFromStorage<Employee[]>(STORAGE_KEYS.SALARY_EMPLOYEES, []),
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

  // Persist to LocalStorage whenever salary employees change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SALARY_EMPLOYEES, state.employees)
  }, [state.employees])

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useEmployees() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useEmployees outside provider')
  return ctx
}
