export interface Store {
  id: string
  name: string
  code?: string     // store_code (系統內部代碼 001, 002)
  storeNo?: string  // store_no (真實門市店號 251732, 129213)
  address?: string
  phone?: string
}

export const DEFAULT_STORES: Store[] = [
  { id: 'b357ddf1-7024-4a0a-8aa0-66c62214dbeb', name: '慶東門市', code: '001', storeNo: '251732' },
  { id: 'c468eee2-8135-5b1b-9bb1-77d73325ecef', name: '南醫門市', code: '002', storeNo: '129213' },
]
