import { Schedule } from '../types/schedule'

/**
 * Helper to compute monthKey (e.g. "2026-08") from weekStart ISO string (e.g. "2026-08-03")
 */
export function getMonthKeyFromSchedule(schedule: Schedule): string {
  if (!schedule.weekStart) return new Date().toISOString().slice(0, 7)
  return schedule.weekStart.slice(0, 7)
}

export interface ScheduleMonthGroup {
  monthKey: string       // e.g. "2026-08"
  displayTitle: string   // e.g. "2026 年 08 月"
  weekCount: number
  lastUpdatedDate: string
  schedules: Schedule[]
}

/**
 * Group schedules by month (sorted descending, e.g., 2026-08, 2026-07...)
 * Each month contains its weekly schedules sorted ascending by weekStart.
 */
export function groupSchedulesByMonth(schedules: Schedule[]): ScheduleMonthGroup[] {
  if (!schedules || schedules.length === 0) return []

  const map = new Map<string, Schedule[]>()

  schedules.forEach(sched => {
    const monthKey = getMonthKeyFromSchedule(sched)
    if (!map.has(monthKey)) {
      map.set(monthKey, [])
    }
    map.get(monthKey)!.push(sched)
  })

  // Sort month keys descending
  const sortedMonthKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a))

  return sortedMonthKeys.map(monthKey => {
    const monthSchedules = map.get(monthKey) || []
    // Sort weekly schedules inside month by weekNo ascending, then storeCode/storeName
    monthSchedules.sort((a: Schedule, b: Schedule) => {
      const weekNoA = a.weekNo || Math.min(Math.ceil(parseInt((a.weekStart || '').slice(8, 10), 10) / 7), 5) || 1
      const weekNoB = b.weekNo || Math.min(Math.ceil(parseInt((b.weekStart || '').slice(8, 10), 10) / 7), 5) || 1
      if (weekNoA !== weekNoB) {
        return weekNoA - weekNoB
      }
      const codeA = a.storeCode || a.storeName || ''
      const codeB = b.storeCode || b.storeName || ''
      return codeA.localeCompare(codeB)
    })

    const [y, m] = monthKey.split('-')
    const displayTitle = y && m ? `${y} 年 ${m} 月` : monthKey

    // Compute max updatedAt for stats
    let maxUpdated = ''
    monthSchedules.forEach(s => {
      if (s.updatedAt && (!maxUpdated || s.updatedAt > maxUpdated)) {
        maxUpdated = s.updatedAt
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
      weekCount: monthSchedules.length,
      lastUpdatedDate: formatDate(maxUpdated),
      schedules: monthSchedules,
    }
  })
}

/**
 * Helper to calculate Monday to Sunday week dates for a given start date
 */
export function getWeekDates(weekStartStr: string) {
  const dates: { date: string; label: string; isWeekend: boolean }[] = []
  const start = new Date(weekStartStr)
  const weekdays = ['一', '二', '三', '四', '五', '六', '日']

  for (let i = 0; i < 7; i++) {
    const current = new Date(start)
    current.setDate(start.getDate() + i)
    const dateStr = current.toISOString().slice(0, 10)
    const m = current.getMonth() + 1
    const d = current.getDate()
    const isWeekend = i === 5 || i === 6
    dates.push({
      date: dateStr,
      label: `${m}/${d}（${weekdays[i]}）`,
      isWeekend,
    })
  }
  return dates
}
