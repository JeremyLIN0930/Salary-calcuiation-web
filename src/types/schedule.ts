// ─── Shift / Schedule types ───────────────────────────────────────────────

/** A user-defined shift template (e.g. 早班, 晚班, 休假) */
export interface ShiftTemplate {
  id: string
  name: string
  color: string   // Material UI color hex, e.g. '#1976D2'
  startTime: string  // 'HH:mm' or empty
  endTime: string    // 'HH:mm' or empty
}

/** An employee visible to the scheduling module (independent from salary) */
export interface ScheduleStaff {
  id: string
  name: string
  store: string
  note: string
}

/** One scheduling record: one staff member on one date with one shift */
export interface ScheduleRecord {
  id: string
  staffId: string
  staffName: string   // denormalised for PDF / display
  date: string        // 'YYYY-MM-DD'
  shiftId: string
  shiftName: string   // denormalised
  shiftColor: string  // denormalised
  note: string
}

// ─── Default shift templates ────────────────────────────────────────────────

export const DEFAULT_SHIFT_TEMPLATES: ShiftTemplate[] = [
  { id: 'shift-early',   name: '早班', color: '#1976D2', startTime: '09:00', endTime: '17:00' },
  { id: 'shift-late',    name: '晚班', color: '#7B1FA2', startTime: '13:00', endTime: '21:00' },
  { id: 'shift-full',    name: '全天', color: '#388E3C', startTime: '09:00', endTime: '21:00' },
  { id: 'shift-off',     name: '休假', color: '#9E9E9E', startTime: '',      endTime: '' },
  { id: 'shift-leave',   name: '請假', color: '#F57C00', startTime: '',      endTime: '' },
]
