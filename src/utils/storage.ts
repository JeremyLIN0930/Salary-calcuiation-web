/**
 * Type-safe LocalStorage utilities with 4 isolated storage keys.
 * PRD Chapter 4: employees, salaries, schedules, settings MUST be independent.
 */

export const STORAGE_KEYS = {
  MASTER_EMPLOYEES: 'employees_v1',
  SALARIES:         'salaries_v1',
  SCHEDULES:        'schedules_v2',
  SETTINGS:         'settings_v1',
} as const

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.error('[storage] Failed to save:', key, err)
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export function clearAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach(k => removeFromStorage(k))
}
