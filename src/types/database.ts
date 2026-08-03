/**
 * Database Schema Sync v1.0 — Database Row Types
 * Strictly typed interfaces matching the exact column names of Supabase PostgreSQL tables.
 */

export interface AppSettingRow {
  id: string
  company_id?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface CompanyRow {
  id: string
  company_name: string
  company_code?: string | null
  tax_id?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  logo_url?: string | null
  is_active?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export interface StoreRow {
  id: string
  store_code?: string | null
  store_name: string
  phone?: string | null
  address?: string | null
  manager_name?: string | null
  is_active?: boolean | null
  company_id?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface MasterEmployeeRow {
  id: string
  employee_no?: string | null
  name: string
  store_id?: string | null
  company_id?: string | null
  hire_date?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
  is_active?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export interface SalaryItemTypeRow {
  id: string
  item_code: string
  item_name: string
  category: 'earning' | 'deduction' | 'addition' | string
  input_type?: string | null
  display_order?: number | null
  printable?: boolean | null
  editable?: boolean | null
  enabled?: boolean | null
  formula?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface SalaryMonthRow {
  id: string
  company_id?: string | null
  month: string
  year?: number | null
  notes?: string | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface ScheduleMonthRow {
  id: string
  company_id?: string | null
  month: string
  year?: number | null
  notes?: string | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface ScheduleWeekRow {
  id: string
  start_date?: string | null
  end_date?: string | null
  notes?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface ScheduleShiftRow {
  id: string
  employee_id?: string | null
  shift_type?: string | null
  start_time?: string | null
  end_time?: string | null
  remarks?: string | null
  created_at?: string | null
  updated_at?: string | null
}
