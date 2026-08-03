export type Store = '慶東門市' | '南醫門市'

export interface Employee {
  id: string
  // 基本資料
  name: string
  month: string
  store: Store | ''
  hireDate: string
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
  // 退休金與實發
  companyPensionContribution: number
  monthlyPensionContribution: number
  netSalary: number
  isNetManual: boolean
  // 備註
  remark: string
}

export function createEmptyEmployee(): Employee {
  return {
    id: Math.random().toString(36).slice(2),
    name: '',
    month: new Date().toISOString().slice(0, 7),
    store: '',
    hireDate: '',
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
    companyPensionContribution: 0,
    monthlyPensionContribution: 0,
    netSalary: 0,
    isNetManual: false,
    remark: '',
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
