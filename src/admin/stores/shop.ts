import { defineStore } from 'pinia'

export interface Shop {
  id: number
  name: string
  status: 'active' | 'paused'
  createdAt: string
  logoUrl?: string
}

/**
 * 商家列表 store（mock-only 版）。
 *
 * portal-vue 的 backend 版本會打 `fetchAvailableStoresApi`；此處改成預設塞幾筆假資料，
 * 給原型畫面演示用。新增 / 編輯 / 刪除直接改 state，無持久化。
 */
const initialShops: Shop[] = [
  { id: 1, name: '3C 瘋電玩', status: 'active', createdAt: '2024-08-12' },
  { id: 2, name: '日韓選品館', status: 'active', createdAt: '2024-09-04' },
  { id: 3, name: '小資女衣鋪', status: 'paused', createdAt: '2024-10-21' },
]

export const useShopStore = defineStore('admin-shop', {
  state: () => ({
    shops: [...initialShops] as Shop[],
    currentShopId: initialShops[0]?.id ?? null,
  }),
  getters: {
    currentShop(state): Shop | undefined {
      return state.shops.find((shop) => shop.id === state.currentShopId)
    },
  },
  actions: {
    selectShop(id: number) {
      this.currentShopId = id
    },
    addShop(params: { name: string; status?: Shop['status'] }): Shop {
      const nextId = this.shops.reduce((max, shop) => Math.max(max, shop.id), 0) + 1
      const today = new Date().toISOString().slice(0, 10)
      const newShop: Shop = {
        id: nextId,
        name: params.name.trim() || `新分店 ${nextId}`,
        status: params.status ?? 'active',
        createdAt: today,
      }
      this.shops.push(newShop)
      this.currentShopId = nextId
      return newShop
    },
    updateShop(id: number, patch: Partial<Omit<Shop, 'id'>>) {
      const target = this.shops.find((shop) => shop.id === id)
      if (!target) return
      Object.assign(target, patch)
    },
    removeShop(id: number) {
      const index = this.shops.findIndex((shop) => shop.id === id)
      if (index === -1) return
      this.shops.splice(index, 1)
      if (this.currentShopId === id) {
        this.currentShopId = this.shops[0]?.id ?? null
      }
    },
  },
})
