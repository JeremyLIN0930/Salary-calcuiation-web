/**
 * Date and time helper utilities with validation rules.
 */

export function isValidDateRange(startDate: string, endDate: string): boolean {
  if (!startDate || !endDate) return true
  return new Date(startDate).getTime() <= new Date(endDate).getTime()
}

export function isValidTimeRange(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return true
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const startMins = sh * 60 + sm
  const endMins = eh * 60 + em
  return startMins <= endMins
}

export function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(date.setDate(diff))
}

export function formatDateISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/**
 * Format HH:mm:ss or HH:mm string to HH:mm (without seconds).
 * e.g., "07:00:00" -> "07:00"
 */
export function formatTimeHHmm(timeStr?: string | null): string {
  if (!timeStr) return ''
  const trimmed = timeStr.trim()
  if (!trimmed) return ''
  if (trimmed.length >= 5) {
    return trimmed.slice(0, 5)
  }
  return trimmed
}
