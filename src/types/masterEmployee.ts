export interface MasterEmployee {
  id: string
  name: string
  store: string      // Display store name (e.g. 慶東門市, 南醫門市)
  storeId?: string  // Store UUID (e.g. b357ddf1-7024-4a0a-8aa0-66c62214dbeb)
  storeName?: string
  isShared?: boolean // true: 共用員工, false: 本店員工
  hireDate: string
  remark: string
  createdAt: string
  updatedAt: string
}
