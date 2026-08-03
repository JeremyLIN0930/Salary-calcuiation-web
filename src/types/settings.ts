export interface SystemSettings {
  companyName: string
  taxId: string
  phone: string
  address: string
  logoUrl?: string
  updatedAt: string
}

export const DEFAULT_SETTINGS: SystemSettings = {
  companyName: '公司名稱',
  taxId: '',
  phone: '',
  address: '',
  updatedAt: new Date().toISOString(),
}
