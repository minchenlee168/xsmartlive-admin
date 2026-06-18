/**
 * 「選擇商品」picker 的商品目錄（mock）。
 *
 * 抽成共用模組讓 AddProductDialog 與「快速新增」共用同一份來源，
 * 以便快速新增時能比對是否與目錄內既有商品重複。
 *
 * `productCatalog` 是 reactive：快速新增送出時透過 `addToCatalog` 把新商品 push 進來，
 * AddProductDialog 重新打開時會看到對應條目。
 */
import { reactive } from 'vue'

export interface CatalogProduct {
  id: number
  name: string
  sku: string
  category: string
  price: number
  stock: number
  status: string
}

export const productCatalog: CatalogProduct[] = reactive([
  { id: 1,  name: 'iPhone 15 Pro 保護殼',    sku: 'ACC-IP15P-001', category: '配件',     price: 490,   stock: 85,  status: '上架中' },
  { id: 2,  name: 'Sony WH-1000XM5 耳機',    sku: 'AUD-SONY-005',  category: '耳機',     price: 9900,  stock: 12,  status: '上架中' },
  { id: 3,  name: 'Nintendo Switch 主機',    sku: 'GAM-NSW-001',   category: '電玩周邊', price: 9800,  stock: 6,   status: '上架中' },
  { id: 4,  name: 'PS5 DualSense 控制器',    sku: 'GAM-PS5-002',   category: '電玩周邊', price: 2190,  stock: 0,   status: '已下架' },
  { id: 5,  name: 'Samsung 65" QLED 電視',   sku: '3C-SAM-TV65',   category: '3C 電子',  price: 42900, stock: 3,   status: '上架中' },
  { id: 6,  name: 'Apple Watch S9 錶帶',     sku: 'ACC-AW9-003',   category: '配件',     price: 890,   stock: 120, status: '上架中' },
  { id: 7,  name: 'Razer 機械鍵盤',          sku: 'GAM-RZR-010',   category: '電玩周邊', price: 3500,  stock: 8,   status: '上架中' },
  { id: 8,  name: 'JBL Flip 6 藍牙喇叭',     sku: 'AUD-JBL-006',   category: '耳機',     price: 2990,  stock: 25,  status: '已下架' },
  { id: 9,  name: 'iPad Pro M2 螢幕保護貼',  sku: 'ACC-IPD-007',   category: '配件',     price: 350,   stock: 200, status: '上架中' },
  { id: 10, name: 'ASUS ROG 電競滑鼠',       sku: 'GAM-ROG-008',   category: '電玩周邊', price: 1890,  stock: 10,  status: '已下架' },
  { id: 11, name: '經典素色棉質 T 恤',        sku: 'CLO-TS-001',    category: '服飾',     price: 490,   stock: 138, status: '上架中' },
])

/** 正規化名稱供比對：去頭尾空白、轉小寫。 */
function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

/** 名稱是否與目錄內既有商品重複（大小寫/前後空白不敏感）。 */
export function isCatalogDuplicate(name: string): boolean {
  const target = normalizeName(name)
  if (!target) return false
  return productCatalog.some((p) => normalizeName(p.name) === target)
}

/** 快速新增送出時呼叫：把新商品 push 到 reactive catalog；AddProductDialog 下次打開可看到。 */
export function addToCatalog(p: CatalogProduct): void {
  productCatalog.push(p)
}

/**
 * 組合商品（mock）：由商家在「商品管理」事先建立，這裡是 catalog 端的清單。
 * 直播收單頁的「選擇商品 → 組合商品」下拉會列出這份清單供商家挑選後加進場次。
 *
 * `bundleItems` 帶 catalogProductId 指回 productCatalog；組合售價 / 庫存獨立於子商品，
 * 由商品管理那邊的設定決定（這裡用 mock 值）。
 */
export interface BundleItem {
  catalogProductId: number
  qty: number
}
export interface CatalogBundle {
  id: number
  name: string
  sku: string
  keyword: string
  /** 組合售價（低於子商品原價合計 → 有組合優惠） */
  price: number
  /** 組合庫存（一般 = min(子商品庫存)） */
  stock: number
  status: string
  bundleItems: BundleItem[]
}

export const bundleCatalog: CatalogBundle[] = reactive([
  {
    id: 9001,
    name: '電競黃金組合（鍵盤 + 滑鼠）',
    sku: 'BUNDLE-GAMING-001',
    keyword: 'GAMING',
    price: 4990,
    stock: 8,
    status: '上架中',
    bundleItems: [
      { catalogProductId: 7,  qty: 1 },
      { catalogProductId: 10, qty: 1 },
    ],
  },
  {
    id: 9002,
    name: 'Apple 周邊 3 件組（保護殼 + 螢幕保護貼 + 錶帶）',
    sku: 'BUNDLE-APPLE-002',
    keyword: 'APPLE3',
    price: 1490,
    stock: 30,
    status: '上架中',
    bundleItems: [
      { catalogProductId: 1, qty: 1 },
      { catalogProductId: 9, qty: 1 },
      { catalogProductId: 6, qty: 1 },
    ],
  },
  {
    id: 9003,
    name: '影音雙享組（耳機 + 藍牙喇叭）',
    sku: 'BUNDLE-AUDIO-003',
    keyword: 'AUDIO',
    price: 11900,
    stock: 5,
    status: '上架中',
    bundleItems: [
      { catalogProductId: 2, qty: 1 },
      { catalogProductId: 8, qty: 1 },
    ],
  },
])
