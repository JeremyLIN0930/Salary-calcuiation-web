export interface Store {
  id: string
  name: string
  address?: string
  phone?: string
}

export const DEFAULT_STORES: Store[] = [
  { id: '101', name: '慶東門市' },
  { id: '102', name: '南醫門市' },
]
