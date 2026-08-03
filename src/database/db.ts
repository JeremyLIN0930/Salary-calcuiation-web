import Dexie, { Table } from 'dexie'
import { MasterEmployee } from '../types/masterEmployee'
import { Employee } from '../types/employee'
import { Schedule } from '../types/schedule'
import { SystemSettings, DEFAULT_SETTINGS } from '../types/settings'
import { Store, DEFAULT_STORES } from '../types/store'
import { loadFromStorage, STORAGE_KEYS } from '../utils/storage'

export class PayrollDatabase extends Dexie {
  employees!: Table<MasterEmployee, string>
  salaries!: Table<Employee, string>
  schedules!: Table<Schedule, string>
  settings!: Table<SystemSettings & { id?: string }, string>
  stores!: Table<Store, string>

  constructor() {
    super('PayrollSystemDB')
    this.version(1).stores({
      employees: 'id, name, store, createdAt',
      salaries:  'id, name, month, store, createdAt',
      schedules: 'id, storeId, weekStart, weekEnd, createdAt',
      settings:  'id, companyName',
      stores:    'id, name',
    })
  }
}

export const db = new PayrollDatabase()

/**
 * Migration Function:
 * Automatically migrates existing LocalStorage data into IndexedDB (Dexie) if IndexedDB is empty.
 * LocalStorage keys are explicitly KEPT to prevent any potential data loss.
 */
export async function runDataMigration(): Promise<void> {
  try {
    // 1. Master Employees Migration
    const empCount = await db.employees.count()
    if (empCount === 0) {
      const localEmps = loadFromStorage<MasterEmployee[]>(STORAGE_KEYS.MASTER_EMPLOYEES, [])
      if (localEmps.length > 0) {
        await db.employees.bulkPut(localEmps)
        console.log(`[Migration] Successfully migrated ${localEmps.length} master employees from LocalStorage to IndexedDB. (LocalStorage retained)`)
      }
    }

    // 2. Salaries Migration
    const salCount = await db.salaries.count()
    if (salCount === 0) {
      const localSalaries = loadFromStorage<Employee[]>(STORAGE_KEYS.SALARIES, [])
      if (localSalaries.length > 0) {
        await db.salaries.bulkPut(localSalaries)
        console.log(`[Migration] Successfully migrated ${localSalaries.length} salary records from LocalStorage to IndexedDB. (LocalStorage retained)`)
      }
    }

    // 3. Weekly Schedules Migration
    const schCount = await db.schedules.count()
    if (schCount === 0) {
      const localSchedules = loadFromStorage<Schedule[]>(STORAGE_KEYS.SCHEDULES, [])
      if (localSchedules.length > 0) {
        await db.schedules.bulkPut(localSchedules)
        console.log(`[Migration] Successfully migrated ${localSchedules.length} weekly schedules from LocalStorage to IndexedDB. (LocalStorage retained)`)
      }
    }

    // 4. System Settings Migration
    const setCount = await db.settings.count()
    if (setCount === 0) {
      const localSettings = loadFromStorage<SystemSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
      await db.settings.put({ id: 'main_settings', ...localSettings })
      console.log('[Migration] Successfully initialized SystemSettings in IndexedDB.')
    }

    // 5. Stores Pre-population
    const storeCount = await db.stores.count()
    if (storeCount === 0) {
      await db.stores.bulkPut(DEFAULT_STORES)
    }
  } catch (err) {
    console.error('[Migration] Failed to migrate LocalStorage to IndexedDB:', err)
  }
}

// Automatically execute migration on module load
runDataMigration()
