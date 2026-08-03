import { Employee } from '../../types/employee'
import { db } from '../db'

export class SalaryRepository {
  private static cache: Employee[] | null = null

  static getAll(): Employee[] {
    if (!this.cache) {
      db.salaries.toArray().then(items => {
        this.cache = items
      })
      return this.cache || []
    }
    return this.cache
  }

  static getById(id: string): Employee | undefined {
    return this.getAll().find(item => item.id === id)
  }

  static save(salary: Employee): void {
    const list = this.getAll()
    const index = list.findIndex(item => item.id === salary.id)
    if (index >= 0) {
      list[index] = salary
    } else {
      list.unshift(salary)
    }
    this.cache = list

    db.salaries.put(salary).catch(err => console.error('SalaryRepository save error:', err))
  }

  static update(salary: Employee): void {
    this.save(salary)
  }

  static delete(id: string): void {
    const list = this.getAll().filter(item => item.id !== id)
    this.cache = list
    db.salaries.delete(id).catch(err => console.error('SalaryRepository delete error:', err))
  }
}
