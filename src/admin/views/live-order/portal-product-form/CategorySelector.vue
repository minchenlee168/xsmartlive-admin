<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PortalCategory } from './schemas'

/**
 * 分類選擇器（簡化版）
 *
 * portal-vue 走獨立的 CategorySelectDialog（treetable + 收斂規則），此 stub 專案
 * 直接用 PrimeVue MultiSelect 攤平整棵樹，仍受 maxCategorySelection 限制。
 * 後續若要還原 dialog 路徑，可換成 portal-vue 的實作而不變動本元件 API。
 */
interface FlatOption {
  id: number
  name: string
  /** 顯示用的階層路徑（例：3C 電子 / 手機）。 */
  displayName: string
}

const { t } = useI18n()

const categories = defineModel<number[]>('categories', { default: () => [] })

const props = defineProps<{
  categoryOptions: PortalCategory[]
  maxCategorySelection?: number
  isDisabled?: boolean
}>()

function flattenCategories(tree: PortalCategory[], parentName = ''): FlatOption[] {
  return tree.flatMap((cat) => {
    const displayName = parentName ? `${parentName} / ${cat.name}` : cat.name
    const current: FlatOption = { id: cat.id, name: cat.name, displayName }
    const children = cat.child ? flattenCategories(cat.child, displayName) : []
    return [current, ...children]
  })
}

const flatOptions = computed(() => flattenCategories(props.categoryOptions))

function handleUpdate(newIds: number[] | unknown): void {
  if (!Array.isArray(newIds)) return
  const max = props.maxCategorySelection
  const next = max && newIds.length > max ? newIds.slice(0, max) : newIds
  categories.value = next as number[]
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <MultiSelect
      :model-value="categories"
      name="product-category"
      input-id="product-category-input"
      :options="flatOptions"
      option-label="displayName"
      option-value="id"
      display="chip"
      filter
      :disabled="isDisabled"
      :placeholder="t('portal_product.form.placeholder.category')"
      class="w-full"
      @update:model-value="handleUpdate"
    />
  </div>
</template>
