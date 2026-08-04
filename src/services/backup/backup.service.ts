import { supabaseEmployeeRepository } from '../../repositories/SupabaseEmployeeRepository'
import { supabaseSalaryRepository } from '../../repositories/SupabaseSalaryRepository'
import { supabaseScheduleRepository } from '../../repositories/SupabaseScheduleRepository'
import { supabaseSettingsRepository } from '../../repositories/SupabaseSettingsRepository'
import { MasterEmployee } from '../../types/masterEmployee'
import { Employee } from '../../types/employee'
import { Schedule } from '../../types/schedule'
import { SystemSettings } from '../../types/settings'

export interface BackupSchema {
  version: string
  createdAt: string
  system: string
  employees: MasterEmployee[]
  salaries: Employee[]
  schedules: Schedule[]
  settings: SystemSettings | null
}

export class BackupService {
  private static CURRENT_VERSION = '1.0'
  private static SYSTEM_NAME = 'Payroll & Schedule Management System'

  /**
   * Generates a validated JSON backup string and suggested filename
   */
  static async exportBackup(): Promise<{ jsonStr: string; fileName: string }> {
    const empsRes = await supabaseEmployeeRepository.getAll()
    const salRes = await supabaseSalaryRepository.getSalaryRecords()
    const schRes = await supabaseScheduleRepository.getWeeks()
    const setRes = await supabaseSettingsRepository.getSettings()

    const employees = empsRes.data || []
    const salaries  = salRes.data || []
    const schedules = schRes.data || []
    const settings  = (setRes.data as unknown as SystemSettings) || null

    const backupPayload: BackupSchema = {
      version: this.CURRENT_VERSION,
      createdAt: new Date().toISOString(),
      system: this.SYSTEM_NAME,
      employees: employees || [],
      salaries: salaries || [],
      schedules: schedules || [],
      settings: settings ? {
        companyName: settings.companyName,
        taxId: settings.taxId,
        phone: settings.phone,
        address: settings.address,
        logoUrl: settings.logoUrl,
        updatedAt: settings.updatedAt || new Date().toISOString(),
      } : null,
    }

    const jsonStr = JSON.stringify(backupPayload, null, 2)

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const timePart = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
    const fileName = `PayrollSystem_Backup_${datePart}_${timePart}.json`

    return { jsonStr, fileName }
  }

  /**
   * Validates backup JSON structure and returns typed BackupSchema
   */
  static validateBackupJson(jsonContent: string): BackupSchema {
    let parsed: any
    try {
      parsed = JSON.parse(jsonContent)
    } catch {
      throw new Error('備份檔格式錯誤。 (非有效 JSON)')
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('備份檔格式錯誤。')
    }

    // Mandatory schema fields check
    if (!parsed.version || typeof parsed.version !== 'string') {
      throw new Error('備份檔格式錯誤。（缺少版本資訊 version）')
    }
    if (!Array.isArray(parsed.employees)) {
      throw new Error('備份檔格式錯誤。（缺少員工資料 employees）')
    }
    if (!Array.isArray(parsed.salaries)) {
      throw new Error('備份檔格式錯誤。（缺少薪資資料 salaries）')
    }
    if (!Array.isArray(parsed.schedules)) {
      throw new Error('備份檔格式錯誤。（缺少排班資料 schedules）')
    }

    this.migrateVersionIfNeeded(parsed)

    return parsed as BackupSchema
  }

  private static migrateVersionIfNeeded(data: any): void {
    if (data.version !== this.CURRENT_VERSION) {
      console.log(`[BackupService] Backup version is ${data.version}, current is ${this.CURRENT_VERSION}`)
    }
  }

  static async restoreBackup(backup: BackupSchema): Promise<void> {
    if (backup.settings) {
      await supabaseSettingsRepository.saveSettings(backup.settings as unknown as Record<string, unknown>)
    }
  }

  static async clearAllData(): Promise<void> {
    console.log('[BackupService] Clear data called')
  }

  /**
   * Browser file download helper
   */
  static downloadFile(content: string, fileName: string): void {
    const blob = new Blob([content], { type: 'application/json;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
