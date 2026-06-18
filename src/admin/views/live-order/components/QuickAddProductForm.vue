<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * 單規格商品快速新增表單；只在已選擇場次時顯示。
 *
 * 4 個 input（名稱、關鍵字、售價、庫存）+ 右側新增鈕，單列、無收合。
 * 按 Enter 或新增鈕即送出，送出後欄位重設。
 */

interface QuickAddProductPayload {
  id: number
  name: string
  keyword: string
  price: number
  stock: number
  /** 單規格商品：specs 留空陣列 */
  specs: never[]
}

const emit = defineEmits<{
  submit: [payloads: QuickAddProductPayload[]]
}>()

const { t } = useI18n()

const name = ref('')
const keyword = ref('')
const price = ref<number | null>(null)
const stock = ref<number | null>(null)

const canSubmit = computed(() => name.value.trim().length > 0 && typeof price.value === 'number' && price.value >= 0)

function reset(): void {
  name.value = ''
  keyword.value = ''
  price.value = null
  stock.value = null
}

function onSubmit(): void {
  if (!canSubmit.value) return
  emit('submit', [{
    id: Date.now(),
    name: name.value.trim(),
    keyword: keyword.value.trim(),
    price: price.value ?? 0,
    stock: stock.value ?? 0,
    specs: [],
  }])
  reset()
}

/** 給父層程式化收合用 — 沿用 API（這版沒有收合需求，呼叫不做事） */
function collapse(): void { /* no-op：表單一直顯示 */ }
defineExpose({ collapse })
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 rounded-md border border-[var(--p-content-border-color)] bg-[var(--p-content-background)] p-2">
    <InputText
      v-model="name"
      :placeholder="t('live_order.quick_add.placeholder.name')"
      class="!w-[200px]"
      size="small"
      @keyup.enter="onSubmit"
    />
    <InputText
      v-model="keyword"
      :placeholder="t('live_order.quick_add.placeholder.keyword')"
      class="!w-[120px]"
      size="small"
      @keyup.enter="onSubmit"
    />
    <InputNumber
      v-model="price"
      :placeholder="t('live_order.quick_add.placeholder.price')"
      :min="0"
      :use-grouping="false"
      input-class="!w-[110px]"
      size="small"
      @keyup.enter="onSubmit"
    />
    <InputNumber
      v-model="stock"
      :placeholder="t('live_order.quick_add.placeholder.stock')"
      :min="0"
      :use-grouping="false"
      input-class="!w-[110px]"
      size="small"
      @keyup.enter="onSubmit"
    />
    <Button
      icon="pi pi-plus"
      :label="t('live_order.quick_add.button.add_one')"
      size="small"
      :disabled="!canSubmit"
      @click="onSubmit"
    />
  </div>
</template>
