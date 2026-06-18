import { ref } from 'vue'
import { fetchTagListApi } from '@/admin/api/portal-product'
import { getApiErrorMessage } from '@/admin/utils/api-error'
import type { PortalCategory } from '../schemas'

/**
 * 預設分類樹（mock）— 簡單兩層結構，足夠展示分類選擇器多選邏輯。
 *
 * 真實後端會回傳完整的分類樹；此處純粹給展示用，未來接 API 時只要把
 * `availableCategories.value` 替換成 fetch 的結果即可。
 */
const MOCK_CATEGORIES: PortalCategory[] = [
  {
    id: 1,
    name: '3C 電子',
    child: [
      { id: 11, name: '手機' },
      { id: 12, name: '平板' },
      { id: 13, name: '電腦' },
    ],
  },
  {
    id: 2,
    name: '配件',
    child: [
      { id: 21, name: '保護殼' },
      { id: 22, name: '耳機' },
      { id: 23, name: '充電線' },
    ],
  },
  {
    id: 3,
    name: '電玩周邊',
    child: [
      { id: 31, name: '主機' },
      { id: 32, name: '控制器' },
      { id: 33, name: '鍵盤' },
    ],
  },
]

/**
 * 管理商品表單的下拉選項（分類、標籤）。
 *
 * 跟 portal-vue 對齊的介面：暴露 reactive refs + 一個統一的 loadOptions()，
 * 讓使用端不必個別處理 categories / tags 的併發。
 */
export function useProductFormOptions() {
  const availableCategories = ref<PortalCategory[]>([])
  const availableTags = ref<string[]>([])
  const errorMessage = ref<string | null>(null)

  async function loadCategories(): Promise<void> {
    // 此 stub 專案沒有真實 categories API，直接套用 mock data。
    availableCategories.value = MOCK_CATEGORIES
  }

  async function loadTags(): Promise<void> {
    try {
      const response = await fetchTagListApi()
      if (!response.success) return
      availableTags.value = [
        ...new Set(response.data.map((item) => item.name.trim()).filter(Boolean)),
      ]
    } catch (error) {
      errorMessage.value = getApiErrorMessage(error)
      console.error('Error loading tags:', error)
    }
  }

  /** 同時載入分類與標籤選項 */
  async function loadOptions(): Promise<void> {
    await Promise.all([loadCategories(), loadTags()])
  }

  return {
    availableCategories,
    availableTags,
    loadOptions,
  }
}
