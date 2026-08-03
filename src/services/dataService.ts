import { db } from '../database/db'
import { MasterEmployee } from '../types/masterEmployee'
import { Employee } from '../types/employee'
import { Schedule } from '../types/schedule'
import { SystemSettings } from '../types/settings'
import { Store } from '../types/store'

export interface BackupData {
  version: string
  exportTime: string
  employees: MasterEmployee[]
  salaries: Employee[]
  schedules: Schedule[]
  settings: SystemSettings | null
  stores: Store[]
}

export class DataService {
  /**
   * Collects all database tables and generates formatted JSON string
   */
  static async exportAllData(): Promise<{ jsonStr: string; fileName: string }> {
    const employees = await db.employees.toArray()
    const salaries  = await db.salaries.toArray()
    const schedules = await db.schedules.toArray()
    const settingsArr = await db.settings.toArray()
    const stores    = await db.stores.toArray()

    const settings = settingsArr.length > 0 ? settingsArr[0] : null

    const backupObj: BackupData = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      employees,
      salaries,
      schedules,
      settings,
      stores,
    }

    const jsonStr = JSON.stringify(backupObj, null, 2)

    // Format: PayrollSystem_Backup_YYYY-MM-DD_HH-mm-ss.json
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const timePart = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
    const fileName = `PayrollSystem_Backup_${datePart}_${timePart}.json`

    return { jsonStr, fileName }
  }

  /**
   * Triggers browser download of generated JSON backup file
   */
  static downloadJsonFile(jsonStr: string, fileName: string): void {
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Clears existing IndexedDB tables and imports provided backup data
   */
  static async importData(backup: BackupData): Promise<void> {
    await db.transaction('rw', [db.employees, db.salaries, db.schedules, db.settings, db.stores], async () => {
      await db.employees.clear()
      await db.salaries.clear()
      await db.schedules.clear()
      await db.settings.clear()
      await db.stores.clear()

      if (backup.employees && backup.employees.length > 0) {
        await db.employees.bulkPut(backup.employees)
      }
      if (backup.salaries && backup.salaries.length > 0) {
        await db.salaries.bulkPut(backup.salaries)
      }
      if (backup.schedules && backup.schedules.length > 0) {
        await db.schedules.bulkPut(backup.schedules)
      }
      if (backup.settings) {
        await db.settings.put({ id: 'main_settings', ...backup.settings })
      }
      if (backup.stores && backup.stores.length > 0) {
        await db.stores.bulkPut(backup.stores)
      }
    })
  }

  /**
   * Clears all tables in IndexedDB
   */
  static async clearAllData(): Promise<void> {
    await db.transaction('rw', [db.employees, db.salaries, db.schedules, db.settings, db.stores], async () => {
      await db.employees.clear()
      await db.salaries.clear()
      await db.schedules.clear()
      await db.settings.clear()
      await db.stores.clear()
    })
  }
}
