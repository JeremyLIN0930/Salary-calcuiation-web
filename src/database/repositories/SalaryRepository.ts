import { Employee } from '../../types/employee'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../../utils/storage'

export class SalaryRepository {
  static getAll(): Employee[] {
    return loadFromStorage<Employee[]>(STORAGE_KEYS.SALARIES, [])
  }

  static getById(id: string): Employee | undefined {
    const list = this.getAll()
    return list.find(item => item.id === id)
  }

  static save(salary: Employee): void {
    const list = this.getAll()
    const index = list.findIndex(item => item.id === salary.id)
    if (index >= 0) {
      list[index] = salary
    } else {
      list.unshift(salary)
    }
    saveToStorage(STORAGE_KEYS.SALARIES, list)
  }

  static update(salary: Employee): void {
    this.save(salary)
  }

  static delete(id: string): void {
    const list = this.getAll().filter(item => item.id !== id)
    saveToStorage(STORAGE_KEYS.SALARIES, list)
  }
}
