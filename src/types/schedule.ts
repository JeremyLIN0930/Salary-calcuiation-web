// ─── PRD Chapter 3 Schedule Data Models ───────────────────────────────────────

export type ShiftType = 'work' | 'off' | 'public' | 'annual' | 'sick' | 'personal'

export interface Shift {
  date: string        // 'YYYY-MM-DD'
  type: ShiftType
  startTime?: string  // 'HH:mm', 24h format (e.g., '07:00')
  endTime?: string    // 'HH:mm', 24h format (e.g., '15:00')
  remark?: string
}

export interface ScheduleEmployee {
  id: string
  name: string
  isTemp?: boolean // true for temporary/weekly employee (no master_employees entry)
  shifts: Shift[]
}

export interface Schedule {
  id: string
  storeId: string     // 店號, e.g. '101' or UUID
  storeCode?: string  // 門市編號, e.g. '001' | '002'
  storeName: string   // 店名, e.g. '慶東門市' | '南醫門市'
  weekStart: string   // YYYY-MM-DD (Monday)
  weekEnd: string     // YYYY-MM-DD (Sunday)
  weekNo?: number     // 週次 (e.g., 1, 2, 3, 4, 5)
  employees: ScheduleEmployee[]
  remark: string
  createdAt: string
  updatedAt: string
}

export function formatStoreTitle(sch?: { storeCode?: string; storeId?: string; storeName?: string } | null): string {
  if (!sch) return ''
  const name = sch.storeName || '門市'
  const isUuid = (str?: string) => typeof str === 'string' && str.includes('-') && str.length > 20
  
  let code = sch.storeCode
  if (!code && sch.storeId && !isUuid(sch.storeId)) {
    code = sch.storeId
  }
  if (!code) {
    if (name.includes('慶東')) code = '001'
    else if (name.includes('南醫')) code = '002'
  }

  return code ? `【${code}】${name}` : name
}

// Helper to get ShiftType label
export const SHIFT_TYPE_CONFIG: Record<ShiftType, { label: string; bg: string; color: string }> = {
  work:     { label: '上班', bg: '#ffffff', color: '#111827' },
  off:      { label: '休',   bg: '#FFE4E4', color: '#B91C1C' },
  public:   { label: '公',   bg: '#EBEBEB', color: '#374151' },
  annual:   { label: '特',   bg: '#E4F5E4', color: '#15803D' },
  sick:     { label: '病',   bg: '#FFFBE4', color: '#A16207' },
  personal: { label: '事',   bg: '#FFF0E0', color: '#C2410C' },
}
