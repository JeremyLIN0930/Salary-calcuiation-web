import { db } from '../../database/db'
import { supabase, isSupabaseConfigured } from './supabase'

export type SyncStatus = 'synced' | 'pending' | 'error' | 'offline'

export interface SyncState {
  status: SyncStatus
  lastSyncTime: string | null
  message: string
}

type Listener = (state: SyncState) => void

export class SyncService {
  private static state: SyncState = {
    status: navigator.onLine ? (isSupabaseConfigured ? 'pending' : 'offline') : 'offline',
    lastSyncTime: localStorage.getItem('last_supabase_sync_time'),
    message: isSupabaseConfigured ? '準備同步' : '雲端金鑰未設定 (離線模式)',
  }

  private static listeners: Set<Listener> = new Set()
  private static isSyncing = false

  public static subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private static notify() {
    this.listeners.forEach(fn => fn(this.state))
  }

  public static getSyncState(): SyncState {
    return this.state
  }

  /**
   * Main Background Sync function.
   * Dexie (IndexedDB) -> Background Sync -> Supabase
   */
  public static async triggerSync(): Promise<void> {
    if (!navigator.onLine) {
      this.state = {
        ...this.state,
        status: 'offline',
        message: '目前處於離線狀態，資料已存至本機資料庫。',
      }
      this.notify()
      return
    }

    if (!isSupabaseConfigured || !supabase) {
      this.state = {
        ...this.state,
        status: 'offline',
        message: '未設定 Supabase 金鑰，目前以本機資料庫運作。',
      }
      this.notify()
      return
    }

    if (this.isSyncing) return
    this.isSyncing = true

    this.state = {
      ...this.state,
      status: 'pending',
      message: '正在進行背景雲端同步...',
    }
    this.notify()

    try {
      // 1. Fetch latest IndexedDB items
      const employees = await db.employees.toArray()
      const salaries  = await db.salaries.toArray()
      const schedules = await db.schedules.toArray()
      const settings  = await db.settings.toArray()

      // 2. Background upsert to Supabase
      if (employees.length > 0) {
        await supabase.from('employees').upsert(employees, { onConflict: 'id' })
      }
      if (salaries.length > 0) {
        await supabase.from('salaries').upsert(salaries, { onConflict: 'id' })
      }
      if (schedules.length > 0) {
        await supabase.from('schedules').upsert(schedules, { onConflict: 'id' })
      }
      if (settings.length > 0) {
        await supabase.from('settings').upsert(settings, { onConflict: 'id' })
      }

      // 3. Mark success
      const nowStr = new Date().toLocaleString('zh-TW', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
      })

      localStorage.setItem('last_supabase_sync_time', nowStr)

      this.state = {
        status: 'synced',
        lastSyncTime: nowStr,
        message: '雲端同步完成',
      }
    } catch (err: any) {
      console.warn('[SyncService] Background sync failed (Offline or network error):', err)
      // Never break UI on network failure! Gracefully handle error state
      this.state = {
        ...this.state,
        status: 'error',
        message: '同步失敗，資料已安全存在本機，恢復網路後自動重試。',
      }
    } finally {
      this.isSyncing = false
      this.notify()
    }
  }

  /**
   * Initializes network state listeners (online/offline)
   */
  public static initAutoSync(): void {
    window.addEventListener('online', () => {
      console.log('[SyncService] Network reconnected, triggering background sync...')
      this.triggerSync()
    })

    window.addEventListener('offline', () => {
      this.state = {
        ...this.state,
        status: 'offline',
        message: '離線模式',
      }
      this.notify()
    })

    // Initial background trigger if online
    if (navigator.onLine && isSupabaseConfigured) {
      setTimeout(() => {
        this.triggerSync()
      }, 2000)
    }
  }
}

// Auto init
SyncService.initAutoSync()
