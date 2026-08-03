import { Schedule } from '../../types/schedule'
import { db } from '../db'

export class ScheduleRepository {
  private static cache: Schedule[] | null = null

  static getAll(): Schedule[] {
    if (!this.cache) {
      db.schedules.toArray().then(items => {
        this.cache = items
      })
      return this.cache || []
    }
    return this.cache
  }

  static getById(id: string): Schedule | undefined {
    return this.getAll().find(item => item.id === id)
  }

  static save(schedule: Schedule): void {
    const list = this.getAll()
    const index = list.findIndex(item => item.id === schedule.id)
    if (index >= 0) {
      list[index] = schedule
    } else {
      list.unshift(schedule)
    }
    this.cache = list

    db.schedules.put(schedule).catch(err => console.error('ScheduleRepository save error:', err))
  }

  static update(schedule: Schedule): void {
    this.save(schedule)
  }

  static delete(id: string): void {
    const list = this.getAll().filter(item => item.id !== id)
    this.cache = list
    db.schedules.delete(id).catch(err => console.error('ScheduleRepository delete error:', err))
  }
}
