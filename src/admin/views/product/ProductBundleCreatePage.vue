<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { RouteName } from '@/admin/router'
import {
  managedProducts,
  PRODUCT_CATEGORIES,
  PRODUCT_TAGS,
  addManagedProduct,
  syncManagedProduct,
  totalStockOf,
  type ManagedBundleItem,
  type ManagedProduct,
} from './utils/productMock'
import PromoteTable, { type PromoteData } from './components/PromoteTable.vue'
import MultiImageUploader, { type UploaderItem } from './components/MultiImageUploader.vue'
import BundleContentsCard, { type BundleItem } from './components/BundleContentsCard.vue'
import AISuggestPanel, { type AiApplyPayload } from './components/AISuggestPanel.vue'

/**
 * 新增 / 編輯組合商品頁面（與 ProductUpdatePage 同樣 dual-mode：route.name 判 create / update）：
 * - 商品名稱 / 商品介紹 → 組合商品名稱 / 組合商品介紹
 * - 規格設定 / 銷售設定 → 組合商品內容 Card（子商品表 + 備註）；
 *   表內每列「商品名稱」= 子商品的商品名稱（由 productId 反查 managedProducts）
 * - 商品詳情 Card 移除（備註已併入組合商品內容）
 */

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

/** route name = bundle.update 視為編輯模式；否則為新增 */
const isUpdateMode = computed(() => route.name === RouteName.ProductBundleUpdate)
const productId = computed(() => Number(route.params.id))
const original = computed<ManagedProduct | undefined>(() =>
  managedProducts.find((p) => p.id === productId.value),
)
const pageTitle = computed(() => isUpdateMode.value ? '編輯組合商品' : '新增組合商品')

interface FormState {
  name: string
  category: string
  keyword: string
  tags: string[]
  enableCoupon: boolean
  weight: number
  description: string
  images: UploaderItem[]
  bundleItems: BundleItem[]
  bundleRemark: string
  promote: PromoteData
}

const form = ref<FormState>(emptyForm())

function emptyForm(): FormState {
  return {
    name: '',
    category: '',
    keyword: '',
    tags: [],
    enableCoupon: false,
    weight: 0,
    description: '',
    images: [],
    bundleItems: [],
    bundleRemark: '',
    promote: { startAt: null, endAt: null, tiers: [] },
  }
}

/**
 * 把 MP.bundleItems 投影成 BundleContentsCard 用的 BundleItem：
 * - 反查 managedProducts / productCatalog 拿到「商品名稱」與庫存
 * - key 比照 BundleContentsCard 慣例：單一商品 `p-{productId}`、規格 `s-{productId}-{specId}`
 */
function adaptBundleItems(p: ManagedProduct): BundleItem[] {
  return (p.bundleItems ?? []).map((it) => {
    const child = managedProducts.find((m) => m.id === it.productId)
    const spec = it.specId && child
      ? child.specs.find((s) => s.id === it.specId)
      : undefined
    const name = spec
      ? `${child?.name ?? ''} - ${spec.name}`
      : (child?.name ?? `商品 #${it.productId}`)
    const stock = spec
      ? spec.stock
      : (child ? totalStockOf(child) : 0)
    const key = it.specId
      ? `s-${it.productId}-${it.specId}`
      : `p-${it.productId}`
    return {
      key,
      productId: it.productId,
      specId:    it.specId,
      name,
      stock,
      quantity: it.qty,
      maxPerPurchase: it.maxPerPurchase ?? null,
    }
  })
}

onMounted(() => {
  if (!isUpdateMode.value) return
  const p = original.value
  if (!p || p.kind !== 'bundle') {
    toast.add({ severity: 'warn', summary: '找不到組合商品', life: 1800 })
    router.replace({ name: RouteName.ProductList })
    return
  }
  form.value = {
    name: p.name,
    category: p.category,
    keyword: p.keyword ?? '',
    tags: [...(p.tags ?? [])],
    enableCoupon: p.enableCoupon ?? false,
    weight: p.weight ?? 0,
    description: p.description ?? '',
    images: (p.images ?? []).map((img) => ({ ...img })),
    bundleItems: adaptBundleItems(p),
    bundleRemark: p.remark ?? '',
    promote: { startAt: null, endAt: null, tiers: [] },
  }
})

const categoryOptions = PRODUCT_CATEGORIES.map((c) => ({ label: c, value: c }))
const tagOptions = PRODUCT_TAGS.map((c) => ({ label: c, value: c }))

function backToList(): void {
  router.push({ name: RouteName.ProductList })
}

function onCancel(): void {
  confirm.require({
    header: isUpdateMode.value ? '取消編輯' : '取消新增',
    message: '尚未儲存的內容會遺失，確定離開？',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '離開',
    rejectLabel: '繼續編輯',
    acceptClass: 'p-button-danger',
    accept: () => backToList(),
  })
}

function onSave(): void {
  if (!form.value.name.trim()) {
    toast.add({ severity: 'warn', summary: '請輸入組合商品名稱', life: 1500 })
    return
  }
  const bundleItems: ManagedBundleItem[] = form.value.bundleItems.map((it) => ({
    productId: it.productId,
    specId:    it.specId,
    qty:       it.quantity,
    maxPerPurchase: it.maxPerPurchase,
  }))
  // 組合商品：庫存以 min(子商品 stock) 預估
  const bundleStock = form.value.bundleItems.length
    ? Math.min(...form.value.bundleItems.map((it) => it.stock))
    : 0

  if (isUpdateMode.value) {
    const p = original.value
    if (!p) return
    p.name = form.value.name.trim()
    p.category = form.value.category
    p.keyword = form.value.keyword.trim()
    p.tags = [...form.value.tags]
    p.enableCoupon = form.value.enableCoupon
    p.weight = form.value.weight
    p.description = form.value.description
    p.remark = form.value.bundleRemark
    p.images = form.value.images.map((img) => ({ ...img }))
    p.bundleItems = bundleItems
    p.bundleStock = bundleStock
    // 保留既有 bundlePrice；如未設過則沿用 0
    p.bundlePrice = p.bundlePrice ?? 0
    p.specs = [{ id: p.specs[0]?.id ?? Date.now(), name: '單一規格', stock: bundleStock, price: p.bundlePrice ?? 0 }]
    syncManagedProduct(p.id)
    toast.add({ severity: 'success', summary: '已儲存組合商品變更', detail: p.name, life: 2000 })
    backToList()
    return
  }

  const newId = Date.now()
  addManagedProduct({
    id: newId,
    name: form.value.name.trim(),
    category: form.value.category,
    status: 'on_shelf',
    kind: 'bundle',
    totalSold: 0,
    keyword: form.value.keyword.trim(),
    tags: [...form.value.tags],
    enableCoupon: form.value.enableCoupon,
    weight: form.value.weight,
    description: form.value.description,
    remark: form.value.bundleRemark,
    images: form.value.images.map((img) => ({ ...img })),
    specs: [{ id: newId + 1, name: '單一規格', stock: bundleStock, price: 0 }],
    bundleItems,
    bundlePrice: 0,
    bundleStock,
  })
  toast.add({ severity: 'success', summary: '已建立組合商品', detail: form.value.name, life: 2000 })
  backToList()
}

// ── AI 建議面板 ───────────────────────────────────
const aiPanelVisible = ref(false)
const adopted = ref<{
  productName: string | null
  description: string | null
  category: string | null
  keyword: string | null
  tags: string[]
  specGroupNames: string[]
}>({
  productName: null,
  description: null,
  category: null,
  keyword: null,
  tags: [],
  specGroupNames: [],
})

function applyAi(payload: AiApplyPayload): void {
  switch (payload.kind) {
    case 'productName':
      if (adopted.value.productName === payload.value) { adopted.value.productName = null; return }
      form.value.name = payload.value
      adopted.value.productName = payload.value
      break
    case 'description':
      if (adopted.value.description === payload.value) { adopted.value.description = null; return }
      form.value.description = payload.value
      adopted.value.description = payload.value
      break
    case 'category':
      if (adopted.value.category === payload.value) { adopted.value.category = null; return }
      if (!PRODUCT_CATEGORIES.includes(payload.value)) PRODUCT_CATEGORIES.push(payload.value)
      form.value.category = payload.value
      adopted.value.category = payload.value
      break
    case 'keyword':
      if (adopted.value.keyword === payload.value) { adopted.value.keyword = null; return }
      form.value.keyword = payload.value
      adopted.value.keyword = payload.value
      break
    case 'tag': {
      const t = payload.value
      if (adopted.value.tags.includes(t)) {
        adopted.value.tags = adopted.value.tags.filter((x) => x !== t)
        form.value.tags = form.value.tags.filter((x) => x !== t)
        return
      }
      if (!PRODUCT_TAGS.includes(t)) PRODUCT_TAGS.push(t)
      adopted.value.tags = [...adopted.value.tags, t]
      if (!form.value.tags.includes(t)) form.value.tags = [...form.value.tags, t]
      break
    }
    case 'spec':
      // 組合商品不走 spec 流程，AI 建議的規格忽略
      break
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 flex-1 min-h-0">
    <!-- 頁首 -->
    <div class="flex items-center gap-3">
      <Button
        v-tooltip.bottom="'返回商品列表'"
        icon="pi pi-arrow-left"
        severity="secondary"
        rounded
        text
        @click="backToList"
      />
      <h2 class="cursor-default text-2xl font-bold text-neutral-700 dark:text-neutral-100">{{ pageTitle }}</h2>

      <div class="ml-auto flex items-center gap-2 text-sm">
        <button
          class="text-color-secondary hover:text-color"
          @click="backToList"
        >商品管理</button>
        <i class="pi pi-chevron-right text-color-secondary" style="font-size: 10px"></i>
        <span class="text-primary cursor-default">{{ pageTitle }}</span>
      </div>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4">
      <!-- 商品資料 -->
      <Card class="relative">
        <template #title>商品資料</template>
        <template #content>
          <button
            v-tooltip.left="'AI 建議'"
            class="absolute top-5 right-5 size-[44px] rounded-full bg-primary text-white text-[13px] font-bold flex items-center justify-center shadow-md hover:opacity-90"
            @click="aiPanelVisible = true"
          >AI</button>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div class="col-span-2 flex flex-col gap-1.5">
              <label class="text-sm font-bold text-color">
                <span class="text-red-600 mr-1">*</span>組合商品名稱
              </label>
              <InputText v-model="form.name" placeholder="請輸入組合商品名稱" class="w-full" />
            </div>

            <div class="col-span-2 flex flex-col gap-1.5">
              <label class="text-sm font-bold text-color">商品類別</label>
              <Select
                v-model="form.category"
                :options="categoryOptions"
                option-label="label"
                option-value="value"
                placeholder="請選擇商品類別"
                class="w-full"
              />
            </div>

            <div class="col-span-2 flex flex-col gap-1.5">
              <label class="text-sm font-bold text-color">直播關鍵字</label>
              <InputText v-model="form.keyword" placeholder="可設定直播使用關鍵字加單" class="w-full" />
            </div>

            <div class="col-span-2 flex flex-col gap-1.5">
              <label class="text-sm font-bold text-color">標籤</label>
              <MultiSelect
                v-model="form.tags"
                :options="tagOptions"
                option-label="label"
                option-value="value"
                placeholder="請選擇商品標籤"
                class="w-full"
                display="chip"
              />
            </div>

            <div class="col-span-2 flex flex-col gap-1.5">
              <label class="text-sm font-bold text-color">啟用優惠券</label>
              <ToggleSwitch v-model="form.enableCoupon" />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-bold text-color">商品重量（公克）</label>
              <InputNumber v-model="form.weight" :min="0" suffix=" g" class="w-full" />
            </div>

            <div class="col-span-2 flex flex-col gap-1.5">
              <label class="text-sm font-bold text-color">組合商品介紹</label>
              <Editor v-model="form.description" editor-style="height: 320px" />
            </div>
          </div>
        </template>
      </Card>

      <!-- 商品圖片 -->
      <Card>
        <template #title>商品圖片</template>
        <template #content>
          <MultiImageUploader v-model:images="form.images" :max-count="8" :aspect-ratio="1" />
        </template>
      </Card>

      <!-- 組合商品內容 -->
      <BundleContentsCard
        v-model:items="form.bundleItems"
        v-model:remark="form.bundleRemark"
      />

      <!-- 多件優惠 -->
      <PromoteTable v-model="form.promote" />
    </div>

    <!-- 底部 sticky 操作列 -->
    <div class="flex items-center justify-end gap-2 pt-3 border-t border-[var(--p-content-border-color)] bg-[var(--p-content-background)]">
      <Button label="取消" severity="secondary" outlined @click="onCancel" />
      <Button :label="isUpdateMode ? '儲存變更' : '建立組合商品'" icon="pi pi-save" @click="onSave" />
    </div>

    <AISuggestPanel
      v-model:visible="aiPanelVisible"
      :adopted-product-name="adopted.productName"
      :adopted-description="adopted.description"
      :adopted-category="adopted.category"
      :adopted-keyword="adopted.keyword"
      :adopted-tags="adopted.tags"
      :adopted-spec-group-names="adopted.specGroupNames"
      @apply="applyAi"
    />
  </div>
</template>
