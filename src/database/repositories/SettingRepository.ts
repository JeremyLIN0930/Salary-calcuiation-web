import { SystemSettings, DEFAULT_SETTINGS } from '../../types/settings'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../../utils/storage'

export class SettingRepository {
  static getAll(): SystemSettings[] {
    const item = this.get()
    return [item]
  }

  static get(): SystemSettings {
    return loadFromStorage<SystemSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  }

  static getById(_id: string): SystemSettings | undefined {
    return this.get()
  }

  static save(settings: SystemSettings): void {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings)
  }

  static update(settings: SystemSettings): void {
    this.save(settings)
  }

  static delete(_id: string): void {
    saveToStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  }
}
