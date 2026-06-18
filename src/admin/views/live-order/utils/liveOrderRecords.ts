/**
 * 結束收單後保留的場次紀錄（mock）。
 *
 * 收單頁按下「結束收單 → 儲存」會把當前場次的彙總 push 進 `liveOrderRecords`，
 * 收單紀錄頁（LiveRecordsPage）讀取它列出。實際串接時換成 API。
 */
import { reactive } from 'vue'

export interface RecordedProductSpec {
  name: string
  stock: number
  winnerCount: number
  sold: number
  total: number
}

export interface RecordedProduct {
  id: number
  name: string
  keyword?: string
  price: number
  winnerCount: number
  sold: number
  total: number
  /** 是否單品免運（同購物車結帳免運） */
  freeShipping: boolean
  specs: RecordedProductSpec[]
}

export interface LiveOrderRecord {
  id: number
  sessionName: string
  endedAt: string
  /** 此筆紀錄的所有商品總金額（products.total 合計） */
  totalAmount: number
  /** 商品總筆數（products.length） */
  productCount: number
  /** 訂單總筆數 = 所有商品的 winnerCount 相加（mock：用 sold 當 winners） */
  orderCount: number
  products: RecordedProduct[]
}

export const liveOrderRecords: LiveOrderRecord[] = reactive([])

export function addLiveOrderRecord(record: Omit<LiveOrderRecord, 'id'>): LiveOrderRecord {
  const next: LiveOrderRecord = { id: Date.now(), ...record }
  liveOrderRecords.unshift(next)
  return next
}
