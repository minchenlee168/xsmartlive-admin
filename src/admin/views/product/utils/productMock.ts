/**
 * 商品管理 → 商品列表頁的 mock 資料。
 *
 * 跟直播收單那邊的 productCatalog 拆開：管理頁需要的欄位（總銷量、規格陣列、上架狀態）
 * 比較多，且要支援組合商品。改動這份不會影響直播收單的「選擇商品」picker 資料。
 */

export type ProductStatus = 'on_shelf' | 'off_shelf' | 'draft'
export type ProductKind = 'normal' | 'bundle'

export interface ManagedProductSpec {
  id: number
  /** 規格顯示名，例如 「S / 白」 */
  name: string
  /** 規格獨立庫存 */
  stock: number
  /** 規格獨立售價 */
  price: number
}

export interface ManagedProduct {
  id: number
  name: string
  /** 商品分類（賣場分頁名稱） */
  category: string
  status: ProductStatus
  kind: ProductKind
  /** 規格陣列；單一規格的商品也至少帶一筆「單一規格」便於統一渲染 */
  specs: ManagedProductSpec[]
  /** 總銷量（mock 用，所有規格相加或單純帶大致數字） */
  totalSold: number
}

export const managedProducts: ManagedProduct[] = [
  {
    id: 1001,
    name: '韓系上衣',
    category: '健康與美容',
    status: 'on_shelf',
    kind: 'normal',
    totalSold: 500,
    specs: [
      { id: 100101, name: 'S',  stock: 60, price: 30 },
      { id: 100102, name: 'M',  stock: 60, price: 30 },
      { id: 100103, name: 'L',  stock: 60, price: 30 },
      { id: 100104, name: 'XL', stock: 60, price: 60 },
    ],
  },
  {
    id: 1002,
    name: '極簡保溫瓶',
    category: '居家生活',
    status: 'on_shelf',
    kind: 'normal',
    totalSold: 500,
    specs: [
      { id: 100201, name: '單一規格', stock: 60, price: 500 },
    ],
  },
  {
    id: 1003,
    name: '日系木質餐具組',
    category: '居家生活',
    status: 'on_shelf',
    kind: 'bundle',
    totalSold: 220,
    specs: [
      { id: 100301, name: '4 件組', stock: 30, price: 980 },
      { id: 100302, name: '6 件組', stock: 18, price: 1380 },
    ],
  },
  {
    id: 1004,
    name: '手作肥皂禮盒',
    category: '健康與美容',
    status: 'off_shelf',
    kind: 'normal',
    totalSold: 132,
    specs: [
      { id: 100401, name: '薰衣草', stock: 0, price: 280 },
      { id: 100402, name: '茶樹',  stock: 12, price: 280 },
    ],
  },
  {
    id: 1005,
    name: '兒童學習積木',
    category: '玩具與遊戲',
    status: 'on_shelf',
    kind: 'normal',
    totalSold: 45,
    specs: [
      { id: 100501, name: '60 片', stock: 25, price: 590 },
      { id: 100502, name: '120 片', stock: 8, price: 990 },
    ],
  },
]

/** 計算總庫存：規格 stock 加總。 */
export function totalStockOf(p: ManagedProduct): number {
  return p.specs.reduce((sum, s) => sum + (s.stock ?? 0), 0)
}

/** 顯示價格：單一規格 → 「$xxx」；多規格 → 「$min ~ $max」；同值收合成單一。 */
export function priceRangeOf(p: ManagedProduct): string {
  if (p.specs.length === 0) return '—'
  const prices = p.specs.map((s) => s.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === max) return `$${min.toLocaleString()}`
  return `$${min.toLocaleString()} ~ $${max.toLocaleString()}`
}
