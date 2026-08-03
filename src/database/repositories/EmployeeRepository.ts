import { MasterEmployee } from '../../types/masterEmployee'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../../utils/storage'

export class EmployeeRepository {
  static getAll(): MasterEmployee[] {
    return loadFromStorage<MasterEmployee[]>(STORAGE_KEYS.MASTER_EMPLOYEES, [])
  }

  static getById(id: string): MasterEmployee | undefined {
    const list = this.getAll()
    return list.find(item => item.id === id)
  }

  static save(employee: MasterEmployee): void {
    const list = this.getAll()
    const index = list.findIndex(item => item.id === employee.id)
    if (index >= 0) {
      list[index] = employee
    } else {
      list.unshift(employee)
    }
    saveToStorage(STORAGE_KEYS.MASTER_EMPLOYEES, list)
  }

  static update(employee: MasterEmployee): void {
    this.save(employee)
  }

  static delete(id: string): void {
    const list = this.getAll().filter(item => item.id !== id)
    saveToStorage(STORAGE_KEYS.MASTER_EMPLOYEES, list)
  }
}
