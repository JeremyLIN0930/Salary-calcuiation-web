/**
 * LocalStorage utilities with type-safe get/set/remove helpers.
 * All data is JSON-serialised. Returns undefined if key does not exist or
 * if the stored value cannot be parsed.
 */

export const STORAGE_KEYS = {
  SALARY_EMPLOYEES: 'salary_employees_v1',
  SCHEDULE_RECORDS: 'schedule_records_v1',
  SCHEDULE_STAFF: 'schedule_staff_v1',
  SHIFT_TEMPLATES: 'shift_templates_v1',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

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
    console.warn('[storage] Failed to save:', key, err)
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
