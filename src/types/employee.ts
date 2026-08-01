export interface Employee {
  id: string
  // 基本資料
  name: string
  month: string
  department: string
  jobTitle: string
  employeeId: string
  payDate: string
  // 薪資資料
  baseSalary: number
  mealAllowance: number
  positionAllowance: number
  otherAllowance: number
  nightAllowance: number
  bonusItems: number
  profitSharing: number
  otherAdditions: number
  specialLeaveAllowance: number
  weekdayOT: number
  restDayOT: number
  holidayOT: number
  sickLeaveDeduction: number
  grossSalary: number
  isGrossManual: boolean
  // 代扣資料
  laborInsurance: number
  healthInsurance: number
  laborPension: number
  incomeTax: number
  otherDeductions: number
  totalDeductions: number
  isDeductionManual: boolean
  // 考勤資料
  annualLeaveRemaining: number
  carriedOverLeave: number
  ot2Hours: number
  otAfter2Hours: number
  restDay2Hours: number
  restDayAfter6Hours: number
  restDay8HoursAfter: number
  holidayAttendance: number
  sickLeaveHours: number
  personalLeaveHours: number
  otBaseRate: number
  // 退休金與實發
  companyPensionContribution: number
  monthlyPensionContribution: number
  netSalary: number
  isNetManual: boolean
}

export function createEmptyEmployee(): Employee {
  return {
    id: Math.random().toString(36).slice(2),
    name: '',
    month: new Date().toISOString().slice(0, 7),
    department: '',
    jobTitle: '',
    employeeId: '',
    payDate: '',
    baseSalary: 0,
    mealAllowance: 0,
    positionAllowance: 0,
    otherAllowance: 0,
    nightAllowance: 0,
    bonusItems: 0,
    profitSharing: 0,
    otherAdditions: 0,
    specialLeaveAllowance: 0,
    weekdayOT: 0,
    restDayOT: 0,
    holidayOT: 0,
    sickLeaveDeduction: 0,
    grossSalary: 0,
    isGrossManual: false,
    laborInsurance: 0,
    healthInsurance: 0,
    laborPension: 0,
    incomeTax: 0,
    otherDeductions: 0,
    totalDeductions: 0,
    isDeductionManual: false,
    annualLeaveRemaining: 0,
    carriedOverLeave: 0,
    ot2Hours: 0,
    otAfter2Hours: 0,
    restDay2Hours: 0,
    restDayAfter6Hours: 0,
    restDay8HoursAfter: 0,
    holidayAttendance: 0,
    sickLeaveHours: 0,
    personalLeaveHours: 0,
    otBaseRate: 0,
    companyPensionContribution: 0,
    monthlyPensionContribution: 0,
    netSalary: 0,
    isNetManual: false,
  }
}

export function calcGross(e: Employee): number {
  return e.baseSalary + e.mealAllowance + e.positionAllowance + e.otherAllowance
    + e.nightAllowance + e.bonusItems + e.profitSharing + e.otherAdditions
    + e.specialLeaveAllowance + e.weekdayOT + e.restDayOT + e.holidayOT
    - e.sickLeaveDeduction
}

export function calcDeductions(e: Employee): number {
  return e.laborInsurance + e.healthInsurance + e.laborPension + e.incomeTax + e.otherDeductions
}

export function fmtMoney(n: number | undefined | null): string {
  const val = n ?? 0
  if (val === 0) return '—'
  return val.toLocaleString('zh-TW')
}
