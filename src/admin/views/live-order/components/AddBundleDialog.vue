<script setup lang="ts">
import { computed, ref, watch, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { bundleCatalog, productCatalog, type CatalogBundle } from '../utils/productCatalog'
import OrderSettingForm, { type OrderSettingFormData } from './OrderSettingForm.vue'

/**
 * 選擇組合商品彈窗：UI 比照「選擇商品」picker — 一橫列一個組合，
 * 點箭頭可向下展開該組合的子商品內容（名稱 / 單價 / 數量）；
 * 選完後進入「得標設定」步驟，套用一次得標設定到所有勾選的組合。
 *
 * 組合商品由商家在「商品管理」預先建立（mock 在 productCatalog.bundleCatalog）。
 */

export interface BundlePickPayload {
  bundles: CatalogBundle[]
  orderSetting?: OrderSettingFormData
}

interface OrderSettingFormApi {
  validate: () => boolean
  getSettings: () => OrderSettingFormData
  reset: () => void
}

interface Props {
  visible?: boolean
  /** 當前場次已加入的商品名稱 set，已加入的 bundle row 整列 disabled */
  existingNames?: Set<string>
}
const props = withDefaults(defineProps<Props>(), {
  visible: false,
  existingNames: () => new Set<string>(),
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  add: [payload: BundlePickPayload]
}>()

const { t } = useI18n()

const innerVisible = ref(props.visible)
const step = ref<'pick' | 'form'>('pick')
const orderSettingRef = useTemplateRef<OrderSettingFormApi>('orderSettingRef')
const selectedIds = ref<Set<number>>(new Set())
const searchField = ref<'name' | 'sku'>('name')
const keyword = ref('')
const onlyAvailable = ref(false)
const expanded = ref<number[]>([])
const pageFirst = ref(0)
const pageSize = 10

const searchFields = computed(() => [
  { label: t('live_order.search_field.name'), value: 'name' },
  { label: t('live_order.search_field.sku'),  value: 'sku'  },
])

watch(
  () => props.visible,
  (v) => {
    innerVisible.value = v
    if (v) {
      step.value = 'pick'
      selectedIds.value = new Set()
      searchField.value = 'name'
      keyword.value = ''
      onlyAvailable.value = false
      expanded.value = []
      pageFirst.value = 0
    }
  },
)

function close(): void {
  innerVisible.value = false
  emit('update:visible', false)
}

// ── 過濾 + 分頁 ─────────────────────────────────
const filtered = computed(() =>
  bundleCatalog.filter((b) => {
    if (onlyAvailable.value && b.status !== '上架中') return false
    if (!keyword.value) return true
    const k = keyword.value.trim().toLowerCase()
    // 跟 AddProductDialog 一致：name / sku 二擇一搜尋
    return searchField.value === 'sku'
      ? b.sku.toLowerCase().includes(k)
      : b.name.toLowerCase().includes(k)
  }),
)
const paged = computed(() => filtered.value.slice(pageFirst.value, pageFirst.value + pageSize))

// ── 展開 / 勾選 ─────────────────────────────────
function toggleExpand(id: number): void {
  const idx = expanded.value.indexOf(id)
  if (idx === -1) expanded.value = [...expanded.value, id]
  else expanded.value = expanded.value.filter((x) => x !== id)
}
function toggle(id: number): void {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

// ── 顯示輔助 ─────────────────────────────────
const productLookup = computed(() => {
  const m = new Map<number, { name: string; price: number; sku: string }>()
  productCatalog.forEach((p) => m.set(p.id, { name: p.name, price: p.price, sku: p.sku }))
  return m
})
function originalSumOf(b: CatalogBundle): number {
  return b.bundleItems.reduce((sum, it) => {
    const p = productLookup.value.get(it.catalogProductId)
    return sum + (p?.price ?? 0) * it.qty
  }, 0)
}
function costApprox(b: CatalogBundle): number {
  // 用子品原價合計的 60% 當組合成本（mock）
  return Math.round(originalSumOf(b) * 0.6)
}
function subItemsOf(b: CatalogBundle): Array<{ name: string; sku: string; price: number; qty: number }> {
  return b.bundleItems.map((it) => {
    const p = productLookup.value.get(it.catalogProductId)
    return {
      name: p?.name ?? `#${it.catalogProductId}`,
      sku: p?.sku ?? '',
      price: p?.price ?? 0,
      qty: it.qty,
    }
  })
}
function isExisting(b: CatalogBundle): boolean { return props.existingNames.has(b.name) }

const selectedCount = computed(() => selectedIds.value.size)
const canSubmit = computed(() => selectedCount.value > 0)
const selectedBundles = computed(() => bundleCatalog.filter((b) => selectedIds.value.has(b.id)))
/** 第二步顯示用：勾選的組合名稱清單（給 OrderSettingForm `picked-names`） */
const selectedNames = computed(() => selectedBundles.value.map((b) => b.name))

/** 步驟指示器（對齊 AddProductDialog）：選擇組合(1) → 得標設定(2) */
const stepNum = computed(() => (step.value === 'pick' ? 1 : 2))
const pickSteps = computed(() => [
  { step: 1, label: t('live_order.dialog.add_bundle_header') },
  { step: 2, label: t('live_order.dialog.order_setting_header') },
])

function goToForm(): void {
  if (!canSubmit.value) return
  step.value = 'form'
}
function onBackToPick(): void {
  step.value = 'pick'
}
function onSubmit(): void {
  if (!canSubmit.value) return
  if (!orderSettingRef.value?.validate()) return
  const orderSetting = orderSettingRef.value.getSettings()
  emit('add', { bundles: selectedBundles.value, orderSetting })
  close()
}
</script>

<template>
  <Dialog
    v-model:visible="innerVisible"
    modal
    :draggable="false"
    :style="{ width: '960px' }"
    :pt="{
      header: { style: 'padding: 17.5px' },
      content: { style: 'padding: 0 17.5px 17.5px' },
      footer: { style: 'padding: 0 17.5px 17.5px' },
    }"
    @update:visible="(v) => emit('update:visible', v)"
  >
    <template #header>
      <span class="font-semibold text-[var(--p-text-color)]" style="font-size: 17.5px">
        {{ t('live_order.dialog.add_bundle_header') }}
      </span>
    </template>

    <!-- 步驟指示（對齊 AddProductDialog 樣式） -->
    <div class="flex items-center gap-2 pt-2">
      <template v-for="(s, i) in pickSteps" :key="s.step">
        <div class="flex items-center gap-2">
          <span
            class="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[13px] font-bold"
            :class="stepNum >= s.step
              ? 'bg-[var(--p-primary-color)] text-white'
              : 'bg-[var(--p-content-hover-background)] text-[var(--p-text-muted-color)]'"
          >{{ s.step }}</span>
          <span
            class="text-[14px] font-medium"
            :class="stepNum === s.step ? 'text-[var(--p-text-color)]' : 'text-[var(--p-text-muted-color)]'"
          >{{ s.label }}</span>
        </div>
        <div v-if="i < pickSteps.length - 1" class="flex-1 h-px bg-[var(--p-content-border-color)]"></div>
      </template>
    </div>
    <div class="border-t border-[var(--p-content-border-color)] mt-3"></div>

    <div v-if="step === 'pick'" class="flex flex-col gap-3 pt-2">

      <!-- 搜尋（同「選擇商品」picker：欄位 Select + InputText + 紫色搜尋鈕） -->
      <div class="flex gap-4 items-end flex-wrap">
        <div class="flex flex-col gap-2">
          <label class="text-[14px] font-medium text-[var(--p-text-color)]">
            {{ t('live_order.form.field.search') }}
          </label>
          <div class="flex h-[42px]">
            <Select
              v-model="searchField"
              :options="searchFields"
              option-label="label"
              option-value="value"
              class="w-[130px]"
              style="border-top-right-radius: 0; border-bottom-right-radius: 0; border-right: 0"
            />
            <InputText
              v-model="keyword"
              :placeholder="t('live_order.form.placeholder.quick_search_products')"
              class="w-[260px]"
              style="border-radius: 0"
            />
            <button
              class="bg-[var(--p-primary-color)] text-white w-[35px] rounded-r-[6px] flex items-center justify-center shrink-0"
            >
              <i class="pi pi-search text-[14px]"></i>
            </button>
          </div>
        </div>
        <label class="flex items-center gap-[7px] cursor-pointer ml-auto pb-2">
          <Checkbox v-model="onlyAvailable" binary />
          <span class="text-[14px] text-[var(--p-text-color)]">
            {{ t('live_order.label.only_show_available') }}
          </span>
        </label>
      </div>

      <!-- 表格區 -->
      <div class="overflow-x-auto">
        <div style="min-width: 880px">
          <!-- header row -->
          <div class="bg-[var(--p-content-background)] border-b border-[var(--p-content-border-color)] flex items-center px-4">
            <div class="px-2 py-[6px] shrink-0 w-[28px]"></div>
            <div class="px-2 py-[6px] font-bold text-[15px] text-[var(--p-text-color)] shrink-0" style="width: 380px">
              {{ t('live_order.label.product_name_spec') }}
            </div>
            <div class="px-2 py-[6px] font-bold text-[15px] text-[var(--p-text-color)] shrink-0" style="width: 120px">
              {{ t('live_order.label.cost') }}
            </div>
            <div class="px-2 py-[6px] font-bold text-[15px] text-[var(--p-text-color)] shrink-0" style="width: 120px">
              {{ t('live_order.label.price') }}
            </div>
            <div class="px-2 py-[6px] font-bold text-[15px] text-[var(--p-text-color)] shrink-0" style="width: 100px">
              {{ t('live_order.label.stock') }}
            </div>
            <div class="px-2 py-[6px] shrink-0 ml-auto" style="width: 80px"></div>
          </div>

          <!-- empty -->
          <div v-if="paged.length === 0" class="py-10 text-center text-[14px] text-[var(--p-text-muted-color)]">
            {{ t('live_order.bundle_picker.empty') }}
          </div>

          <template
            v-for="b in paged"
            :key="b.id"
          >
            <!-- 主列 -->
            <div
              :class="[
                'flex items-center w-full px-4',
                expanded.includes(b.id)
                  ? 'bg-[var(--p-content-hover-background)]'
                  : 'border-b border-[var(--p-content-border-color)]',
              ]"
            >
              <div class="px-2 py-[6px] shrink-0 w-[28px]">
                <button @click="toggleExpand(b.id)" class="w-full flex items-center justify-center">
                  <i
                    :class="[
                      'pi text-[14px] text-[var(--p-text-muted-color)]',
                      expanded.includes(b.id) ? 'pi-chevron-up' : 'pi-chevron-down',
                    ]"
                  ></i>
                </button>
              </div>
              <div class="px-2 py-[6px] flex gap-3 items-center shrink-0" style="width: 380px">
                <div class="w-[48px] h-[48px] rounded-[6px] bg-[var(--p-primary-50)] flex items-center justify-center shrink-0">
                  <FontAwesomeIcon :icon="['far', 'bag-shopping']" class="text-[var(--p-primary-color)]" style="font-size: 18px" />
                </div>
                <div class="flex flex-col gap-[2px]">
                  <span
                    class="font-medium text-[15px]"
                    :class="isExisting(b) ? 'text-[var(--p-text-muted-color)]' : 'text-[var(--p-text-color)]'"
                  >
                    {{ b.name }}
                  </span>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[12px] text-[var(--p-text-muted-color)]">{{ b.sku }}</span>
                    <span
                      class="text-[11px] font-medium text-[var(--p-primary-color)] bg-[var(--p-primary-50)] px-1.5 py-0.5 rounded"
                    >
                      {{ t('live_order.bundle_picker.keyword_with_value', { value: b.keyword }) }}
                    </span>
                    <span
                      v-if="isExisting(b)"
                      class="text-[11px] font-medium text-white bg-[var(--p-text-muted-color)] px-1.5 py-0.5 rounded"
                    >
                      {{ t('live_order.label.already_added') }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="px-2 py-[6px] shrink-0" style="width: 120px">
                <span class="text-[15px] text-[var(--p-text-color)]">{{ costApprox(b).toLocaleString() }}</span>
              </div>
              <div class="px-2 py-[6px] shrink-0" style="width: 120px">
                <span class="text-[15px] text-[var(--p-text-color)]">{{ b.price.toLocaleString() }}</span>
              </div>
              <div class="px-2 py-[6px] shrink-0" style="width: 100px">
                <span class="text-[15px]" :class="b.stock <= 10 ? 'text-[#ef4444]' : 'text-[var(--p-text-color)]'">
                  {{ b.stock }}
                </span>
              </div>
              <div class="px-2 py-[6px] shrink-0 ml-auto flex justify-center" style="width: 80px">
                <Checkbox
                  :model-value="selectedIds.has(b.id)"
                  binary
                  :disabled="isExisting(b)"
                  @change="toggle(b.id)"
                />
              </div>
            </div>

            <!-- 子商品展開列 -->
            <template v-if="expanded.includes(b.id)">
              <div
                v-for="(s, si) in subItemsOf(b)"
                :key="`${b.id}-${si}`"
                :class="[
                  'bg-[var(--p-content-hover-background)] flex items-center px-[40px]',
                  si === subItemsOf(b).length - 1 ? 'border-b border-[var(--p-content-border-color)]' : '',
                ]"
              >
                <div class="border-l border-[var(--p-content-border-color)] flex h-full items-center w-full">
                  <div class="px-2 py-[6px] flex gap-3 items-center shrink-0" style="width: 380px">
                    <div class="w-[36px] h-[36px] rounded-[6px] bg-[var(--p-content-background)] border border-dashed border-[var(--p-content-border-color)] flex items-center justify-center shrink-0">
                      <i class="pi pi-image text-[14px] text-[var(--p-text-muted-color)]"></i>
                    </div>
                    <div class="flex flex-col gap-[2px]">
                      <span class="text-[14px] text-[var(--p-text-color)] truncate">{{ s.name }}</span>
                      <span class="text-[12px] text-[var(--p-text-muted-color)]">{{ s.sku }}</span>
                    </div>
                  </div>
                  <div class="px-2 py-[6px] shrink-0" style="width: 120px"></div>
                  <div class="px-2 py-[6px] shrink-0" style="width: 120px">
                    <span class="text-[14px] text-[var(--p-text-color)]">{{ s.price.toLocaleString() }}</span>
                  </div>
                  <div class="px-2 py-[6px] shrink-0" style="width: 100px">
                    <span class="text-[14px] text-[var(--p-text-color)]">× {{ s.qty }}</span>
                  </div>
                  <div class="px-2 py-[6px] shrink-0 ml-auto" style="width: 80px"></div>
                </div>
              </div>
            </template>
          </template>
        </div>
      </div>

      <!-- 分頁 -->
      <Paginator
        v-if="filtered.length > pageSize"
        v-model:first="pageFirst"
        :rows="pageSize"
        :total-records="filtered.length"
        :template="{ default: 'PrevPageLink PageLinks NextPageLink' }"
        class="!justify-center !px-0 !py-1"
      />
    </div>

    <!-- Step 2：得標設定（共同設定一次套用到所有勾選的組合） -->
    <div v-else class="pt-3">
      <OrderSettingForm
        ref="orderSettingRef"
        multiple
        :picked-names="selectedNames"
      />
    </div>

    <template #footer>
      <div v-if="step === 'pick'" class="flex justify-end gap-2">
        <Button
          :label="t('live_order.button.cancel')"
          severity="secondary"
          variant="outlined"
          @click="close"
        />
        <Button
          :label="`${t('live_order.button.next_step')} (${selectedCount})`"
          icon="pi pi-arrow-right"
          icon-pos="right"
          :disabled="!canSubmit"
          @click="goToForm"
        />
      </div>
      <div v-else class="flex justify-between gap-2">
        <Button
          :label="t('live_order.button.back_to_pick')"
          icon="pi pi-arrow-left"
          severity="secondary"
          variant="outlined"
          @click="onBackToPick"
        />
        <Button
          :label="`${t('live_order.button.save')} (${selectedCount})`"
          icon="pi pi-save"
          :disabled="!canSubmit"
          @click="onSubmit"
        />
      </div>
    </template>
  </Dialog>
</template>
