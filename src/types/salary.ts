// ─── Store ───────────────────────────────────────────────────────────────────

export type Store = '慶東門市' | '南醫門市'

// ─── Salary Item (for future normalised interface) ───────────────────────────

/** A single salary line item. Used for future SalaryItem[] normalisation. */
export interface SalaryItem {
  key: string       // e.g. 'baseSalary'
  label: string     // e.g. '本薪'
  amount: number
  isDeduction: boolean
}

/** A single deduction line item. */
export interface DeductionItem {
  key: string       // e.g. 'laborInsurance'
  label: string     // e.g. '勞保費'
  amount: number
}

// ─── Canonical Salary Interface (PRD Chapter 2 spec) ─────────────────────────
// NOTE: The current implementation stores salary fields flat on the Employee
// interface for simplicity. This canonical interface defines the long-term
// target shape. Migration is planned but not yet implemented.

export interface Salary {
  id: string

  /** Future: link to a shared employee record. Not yet implemented. */
  employeeId?: string

  // ── 基本資料 ──────────────────────────────────────────────
  name: string
  store: Store
  hireDate: string
  payDate: string
  month: string

  // ── 薪資資料（正規化陣列，供未來使用）──────────────────────
  salaryItems: SalaryItem[]
  deductionItems: DeductionItem[]

  // ── 合計 ──────────────────────────────────────────────────
  grossPay: number
  deductionTotal: number
  netPay: number

  // ── 其他 ──────────────────────────────────────────────────
  remark: string

  // ── 追蹤欄位 ──────────────────────────────────────────────
  createdAt: string   // ISO 8601
  updatedAt: string   // ISO 8601
}
