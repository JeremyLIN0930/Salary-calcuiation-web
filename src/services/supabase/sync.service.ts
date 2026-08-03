/**
 * sync.service.ts
 *
 * NOTE: This legacy Dexie→Supabase background sync service is DEPRECATED.
 * Data is now written directly to Supabase via Repository layer.
 * Table names are kept corrected for reference. The sync logic is disabled.
 *
 * Correct Supabase table names:
 *   employees  → master_employees
 *   salaries   → salary_months
 *   schedules  → schedule_shifts
 *   settings   → app_settings
 */

import { isSupabaseEnvConfigured } from '../../lib/supabase'

export type SyncStatus = 'synced' | 'pending' | 'error' | 'offline'

export interface SyncState {
  status: SyncStatus
  lastSyncTime: string | null
  message: string
}

type Listener = (state: SyncState) => void

export class SyncService {
  private static state: SyncState = {
    status: navigator.onLine ? (isSupabaseEnvConfigured ? 'synced' : 'offline') : 'offline',
    lastSyncTime: localStorage.getItem('last_supabase_sync_time'),
    message: isSupabaseEnvConfigured ? '直接寫入 Supabase (Repository Mode)' : '雲端金鑰未設定 (離線模式)',
  }

  private static listeners: Set<Listener> = new Set()

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
   * DEPRECATED: Legacy Dexie→Supabase sync.
   * Data is now written directly to Supabase via Repository.
   * This method is a no-op kept for backward compatibility.
   */
  public static async triggerSync(): Promise<void> {
    if (!navigator.onLine) {
      this.state = {
        ...this.state,
        status: 'offline',
        message: '目前處於離線狀態。',
      }
      this.notify()
      return
    }

    if (!isSupabaseEnvConfigured) {
      this.state = {
        ...this.state,
        status: 'offline',
        message: '未設定 Supabase 金鑰，目前以本機資料庫運作。',
      }
      this.notify()
      return
    }

    // No-op: Repository layer handles writes directly
    this.state = {
      ...this.state,
      status: 'synced',
      message: '直接寫入 Supabase (Repository Mode)',
    }
    this.notify()
  }

  public static initAutoSync(): void {
    window.addEventListener('online', () => {
      this.state = { ...this.state, status: 'synced', message: '已連線' }
      this.notify()
    })

    window.addEventListener('offline', () => {
      this.state = { ...this.state, status: 'offline', message: '離線模式' }
      this.notify()
    })
  }
}

// Auto init
SyncService.initAutoSync()
