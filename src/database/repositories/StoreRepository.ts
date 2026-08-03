import { Store, DEFAULT_STORES } from '../../types/store'

export class StoreRepository {
  static getAll(): Store[] {
    return DEFAULT_STORES
  }

  static getById(id: string): Store | undefined {
    return DEFAULT_STORES.find(item => item.id === id)
  }

  static save(_store: Store): void {
    // Reserved for future expansion
  }

  static update(store: Store): void {
    this.save(store)
  }

  static delete(_id: string): void {
    // Reserved for future expansion
  }
}
