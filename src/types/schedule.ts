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
  shifts: Shift[]
}

export interface Schedule {
  id: string
  storeId: string     // 店號, e.g. '101'
  storeName: string   // 店名, e.g. '慶東門市' | '南醫門市'
  weekStart: string   // YYYY-MM-DD (Monday)
  weekEnd: string     // YYYY-MM-DD (Sunday)
  employees: ScheduleEmployee[]
  remark: string
  createdAt: string
  updatedAt: string
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
