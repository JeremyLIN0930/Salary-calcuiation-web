import { Employee } from '../types/employee'
import { Schedule } from '../types/schedule'

/**
 * Format month string (e.g. "2026-08" or "2026/08") into "2026年08月"
 */
export function formatYearMonth(monthStr?: string): string {
  if (!monthStr) {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    return `${y}年${m}月`
  }

  const match = monthStr.match(/^(\d{4})[-/]?(\d{1,2})/)
  if (match) {
    const y = match[1]
    const m = String(match[2]).padStart(2, '0')
    return `${y}年${m}月`
  }

  return monthStr
}

/**
 * Remove illegal filename characters: / \ : * ? " < > |
 */
export function sanitizeFileName(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '').trim()
}

/**
 * Get Payroll PDF filename by type:
 * - 'single': 薪資單_YYYY年MM月_員工姓名_門市.pdf (門市若無則省略)
 * - 'multi':  薪資單_YYYY年MM月_多人.pdf
 * - 'month':  薪資單_YYYY年MM月.pdf
 * - 'all':    薪資單_全部月份.pdf
 */
export function getPayrollFileName(
  employees: Employee[],
  type: 'single' | 'multi' | 'month' | 'all',
  targetMonthKey?: string
): string {
  if (type === 'all') {
    return '薪資單_全部月份.pdf'
  }

  const sampleEmp = employees[0]
  const rawMonth = targetMonthKey || sampleEmp?.month
  const ym = formatYearMonth(rawMonth)

  if (type === 'single' && sampleEmp) {
    const empName = sanitizeFileName(sampleEmp.name || '未命名')
    const store = sampleEmp.store ? sanitizeFileName(sampleEmp.store) : ''
    const storePart = store ? `_${store}` : ''
    return `薪資單_${ym}_${empName}${storePart}.pdf`
  }

  if (type === 'multi') {
    return `薪資單_${ym}_多人.pdf`
  }

  // default type === 'month'
  return `薪資單_${ym}.pdf`
}

/**
 * Get Schedule PDF filename by type:
 * - 'single': 排班表_YYYY年MM月_第X週_門市.pdf (門市若無則省略)
 * - 'month':  排班表_YYYY年MM月_門市.pdf
 * - 'multi':  排班表_YYYY年MM月_多週.pdf
 * - 'all':    排班表_全部月份.pdf
 */
export function getScheduleFileName(
  schedule: Schedule,
  type: 'single' | 'month' | 'multi' | 'all',
  weekIndex?: number
): string {
  if (type === 'all') {
    return '排班表_全部月份.pdf'
  }

  const rawMonth = schedule.weekStart ? schedule.weekStart.slice(0, 7) : undefined
  const ym = formatYearMonth(rawMonth)
  const store = schedule.storeName ? sanitizeFileName(schedule.storeName) : ''
  const storePart = store ? `_${store}` : ''

  if (type === 'single') {
    const wNo = schedule.weekNo || weekIndex || 1
    const weekStr = `_第${wNo}週`
    return `排班表_${ym}${weekStr}${storePart}.pdf`
  }

  if (type === 'multi') {
    return `排班表_${ym}_多週.pdf`
  }

  // default type === 'month'
  return `排班表_${ym}${storePart}.pdf`
}
