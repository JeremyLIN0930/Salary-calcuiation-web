import { Store, DEFAULT_STORES } from '../../types/store'
import { db } from '../db'

export class StoreRepository {
  private static cache: Store[] = DEFAULT_STORES

  static getAll(): Store[] {
    db.stores.toArray().then(items => {
      if (items.length > 0) {
        this.cache = items
      }
    })
    return this.cache
  }

  static getById(id: string): Store | undefined {
    return this.getAll().find(item => item.id === id)
  }

  static save(store: Store): void {
    const list = this.getAll()
    const index = list.findIndex(item => item.id === store.id)
    if (index >= 0) {
      list[index] = store
    } else {
      list.unshift(store)
    }
    this.cache = list

    db.stores.put(store).catch(err => console.error('StoreRepository save error:', err))
  }

  static update(store: Store): void {
    this.save(store)
  }

  static delete(id: string): void {
    const list = this.getAll().filter(item => item.id !== id)
    this.cache = list
    db.stores.delete(id).catch(err => console.error('StoreRepository delete error:', err))
  }
}
