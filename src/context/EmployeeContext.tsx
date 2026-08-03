import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react'
import { Employee } from '../types/employee'
import { supabaseSalaryRepository } from '../repositories/SupabaseSalaryRepository'
import { SalaryRepository } from '../database/repositories/SalaryRepository'

type Action =
  | { type: 'SET'; payload: Employee[] }
  | { type: 'ADD'; payload: Employee }
  | { type: 'UPDATE'; payload: Employee }
  | { type: 'DELETE'; payload: string }

interface State {
  employees: Employee[]
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET':
      return { employees: action.payload }
    case 'ADD':
      return { employees: [action.payload, ...state.employees] }
    case 'UPDATE':
      return { employees: state.employees.map(e => e.id === action.payload.id ? action.payload : e) }
    case 'DELETE':
      return { employees: state.employees.filter(e => e.id !== action.payload) }
    default:
      return state
  }
}

interface ContextType {
  state: State
  dispatch: React.Dispatch<Action>
  loading: boolean
  saving: boolean
  exporting: boolean
  deleting: boolean
  refreshing: boolean
  error: string | null
  refresh: () => Promise<void>
  saveSalary: (emp: Partial<Employee>) => Promise<boolean>
  deleteSalary: (id: string) => Promise<boolean>
  createMonth: (monthKey: string) => Promise<boolean>
  deleteMonth: (monthKey: string) => Promise<boolean>
}

const Ctx = createContext<ContextType | null>(null)

export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { employees: [] })
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [exporting, setExporting] = useState<boolean>(false)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all salary records from SupabaseSalaryRepository
  const refresh = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      const result = await supabaseSalaryRepository.getSalaryRecords()
      if (result.success && result.data) {
        dispatch({ type: 'SET', payload: result.data })

        // Optional local Dexie backup sync
        try {
          result.data.forEach(emp => SalaryRepository.save(emp))
        } catch (dexieErr) {
          console.warn('[Dexie Sync Warning]:', dexieErr)
        }
      } else {
        console.error('[SalaryContext] Failed to load salaries from Supabase:', result.error)
        setError(result.error || '載入薪資資料失敗')
        // Fallback to local Dexie data if offline
        const localData = SalaryRepository.getAll()
        if (localData && localData.length > 0) {
          dispatch({ type: 'SET', payload: localData })
        }
      }
    } catch (e: any) {
      console.error('[SalaryContext Error]:', e)
      setError(e?.message || '系統錯誤')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    refresh()
  }, [refresh])

  // Save/Update Salary
  const saveSalary = async (emp: Partial<Employee>): Promise<boolean> => {
    setSaving(true)
    try {
      const result = await supabaseSalaryRepository.saveSalary(emp)
      if (result.success && result.data) {
        await refresh()
        return true
      } else {
        setError(result.error || '儲存失敗')
        return false
      }
    } catch (e: any) {
      console.error('[saveSalary error]:', e)
      return false
    } finally {
      setSaving(false)
    }
  }

  // Delete Salary
  const deleteSalary = async (id: string): Promise<boolean> => {
    setDeleting(true)
    try {
      const result = await supabaseSalaryRepository.deleteSalary(id)
      if (result.success) {
        dispatch({ type: 'DELETE', payload: id })
        await refresh()
        return true
      } else {
        setError(result.error || '刪除失敗')
        return false
      }
    } catch (e: any) {
      console.error('[deleteSalary error]:', e)
      return false
    } finally {
      setDeleting(false)
    }
  }

  // Create Month
  const createMonth = async (monthKey: string): Promise<boolean> => {
    setSaving(true)
    try {
      const result = await supabaseSalaryRepository.createMonth(monthKey)
      if (result.success) {
        await refresh()
        return true
      }
      return false
    } finally {
      setSaving(false)
    }
  }

  // Delete Month
  const deleteMonth = async (monthKey: string): Promise<boolean> => {
    setDeleting(true)
    try {
      const result = await supabaseSalaryRepository.deleteMonth(monthKey)
      if (result.success) {
        await refresh()
        return true
      }
      return false
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Ctx.Provider
      value={{
        state,
        dispatch,
        loading,
        saving,
        exporting,
        deleting,
        refreshing,
        error,
        refresh,
        saveSalary,
        deleteSalary,
        createMonth,
        deleteMonth,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useEmployees() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useEmployees outside provider')
  return ctx
}

// Alias exports for Task 4
export const SalaryProvider = EmployeeProvider
export const useSalary = useEmployees
