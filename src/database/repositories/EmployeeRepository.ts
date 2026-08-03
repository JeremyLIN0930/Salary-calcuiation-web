import { MasterEmployee } from '../../types/masterEmployee'
import { db } from '../db'

export class EmployeeRepository {
  private static cache: MasterEmployee[] | null = null

  static getAll(): MasterEmployee[] {
    if (!this.cache) {
      // Async fetch to prime cache asynchronously
      db.employees.toArray().then(items => {
        this.cache = items
      })
      // Sync fallback to empty or cached
      return this.cache || []
    }
    return this.cache
  }

  static getById(id: string): MasterEmployee | undefined {
    return this.getAll().find(item => item.id === id)
  }

  static save(employee: MasterEmployee): void {
    // Update local cache for instant sync return
    const list = this.getAll()
    const index = list.findIndex(item => item.id === employee.id)
    if (index >= 0) {
      list[index] = employee
    } else {
      list.unshift(employee)
    }
    this.cache = list

    // Persist asynchronously to IndexedDB
    db.employees.put(employee).catch(err => console.error('EmployeeRepository save error:', err))
  }

  static update(employee: MasterEmployee): void {
    this.save(employee)
  }

  static delete(id: string): void {
    const list = this.getAll().filter(item => item.id !== id)
    this.cache = list
    db.employees.delete(id).catch(err => console.error('EmployeeRepository delete error:', err))
  }
}
