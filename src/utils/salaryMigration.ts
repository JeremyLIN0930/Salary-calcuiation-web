import { Employee } from '../types/employee'

/**
 * Migration helper to categorize and standardise legacy salary records with YYYY-MM month format.
 */
export function migrateSalaryRecords(salaries: Employee[]): Employee[] {
  if (!salaries || salaries.length === 0) return []

  const currentYearMonth = new Date().toISOString().slice(0, 7) // e.g. "2026-08"

  return salaries.map(emp => {
    let month = emp.month ? emp.month.trim() : ''

    // If month is missing or legacy invalid format, fallback from createdAt or current date
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      if (emp.createdAt && emp.createdAt.length >= 7) {
        month = emp.createdAt.slice(0, 7)
      } else {
        month = currentYearMonth
      }
    }

    return {
      ...emp,
      month,
    }
  })
}

/**
 * Group employees by month (sorted descending, e.g., 2026-08, 2026-07...)
 */
export interface MonthGroup {
  monthKey: string       // e.g. "2026-08"
  displayTitle: string   // e.g. "2026 年 08 月"
  employeeCount: number
  totalNetSalary: number
  createdDate: string
  lastUpdatedDate: string
  employees: Employee[]
}

export function groupSalariesByMonth(salaries: Employee[]): MonthGroup[] {
  const migrated = migrateSalaryRecords(salaries)
  const map = new Map<string, Employee[]>()

  migrated.forEach(emp => {
    const key = emp.month
    if (!map.has(key)) {
      map.set(key, [])
    }
    map.get(key)!.push(emp)
  })

  // Sort month keys descending (e.g. 2026-08 > 2026-07)
  const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a))

  return sortedKeys.map(monthKey => {
    const emps = map.get(monthKey) || []
    const [y, m] = monthKey.split('-')
    const displayTitle = y && m ? `${y} 年 ${m} 月` : monthKey

    const totalNetSalary = emps.reduce((sum, e) => sum + (e.netSalary || 0), 0)

    // Compute min createdAt & max updatedAt for stats
    let minCreated = ''
    let maxUpdated = ''

    emps.forEach(e => {
      if (e.createdAt && (!minCreated || e.createdAt < minCreated)) {
        minCreated = e.createdAt
      }
      if (e.updatedAt && (!maxUpdated || e.updatedAt > maxUpdated)) {
        maxUpdated = e.updatedAt
      }
    })

    const formatDate = (isoStr: string) => {
      if (!isoStr) return '未記錄'
      const d = new Date(isoStr)
      if (isNaN(d.getTime())) return '未記錄'
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const date = String(d.getDate()).padStart(2, '0')
      return `${year}/${month}/${date}`
    }

    return {
      monthKey,
      displayTitle,
      employeeCount: emps.length,
      totalNetSalary,
      createdDate: formatDate(minCreated),
      lastUpdatedDate: formatDate(maxUpdated),
      employees: emps,
    }
  })
}
