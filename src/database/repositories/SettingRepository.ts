import { SystemSettings, DEFAULT_SETTINGS } from '../../types/settings'
import { db } from '../db'

export class SettingRepository {
  private static cache: SystemSettings = DEFAULT_SETTINGS

  static getAll(): SystemSettings[] {
    return [this.get()]
  }

  static get(): SystemSettings {
    db.settings.get('main_settings').then(s => {
      if (s) {
        const { id, ...rest } = s
        this.cache = rest
      }
    })
    return this.cache
  }

  static getById(_id: string): SystemSettings | undefined {
    return this.get()
  }

  static save(settings: SystemSettings): void {
    this.cache = settings
    db.settings.put({ id: 'main_settings', ...settings }).catch(err => console.error('SettingRepository save error:', err))
  }

  static update(settings: SystemSettings): void {
    this.save(settings)
  }

  static delete(_id: string): void {
    this.cache = DEFAULT_SETTINGS
    db.settings.delete('main_settings').catch(err => console.error('SettingRepository delete error:', err))
  }
}
