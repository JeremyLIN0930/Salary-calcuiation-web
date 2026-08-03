import { Schedule } from '../../types/schedule'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../../utils/storage'

export class ScheduleRepository {
  static getAll(): Schedule[] {
    return loadFromStorage<Schedule[]>(STORAGE_KEYS.SCHEDULES, [])
  }

  static getById(id: string): Schedule | undefined {
    const list = this.getAll()
    return list.find(item => item.id === id)
  }

  static save(schedule: Schedule): void {
    const list = this.getAll()
    const index = list.findIndex(item => item.id === schedule.id)
    if (index >= 0) {
      list[index] = schedule
    } else {
      list.unshift(schedule)
    }
    saveToStorage(STORAGE_KEYS.SCHEDULES, list)
  }

  static update(schedule: Schedule): void {
    this.save(schedule)
  }

  static delete(id: string): void {
    const list = this.getAll().filter(item => item.id !== id)
    saveToStorage(STORAGE_KEYS.SCHEDULES, list)
  }
}
