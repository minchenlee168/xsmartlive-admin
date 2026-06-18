<template>
  <div class="flex gap-6">

    <!-- 左欄：商品圖 + 備註 -->
    <div class="w-[280px] shrink-0 flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)] flex items-center gap-1">
          {{ t('live_order.form.field.product_image') }}
          <i v-if="isLocked('image')" v-tooltip.top="t('live_order.text.locked_field_hint')" class="pi pi-lock text-[var(--p-text-muted-color)]" style="font-size:12px"></i>
        </label>
        <div class="aspect-square border-2 border-dashed border-[var(--p-content-border-color)] rounded-[6px] bg-[var(--p-content-hover-background)] flex items-center justify-center">
          <i class="pi pi-image text-[var(--p-text-muted-color)]" style="font-size:64px"></i>
        </div>
        <Button :label="t('live_order.button.upload_from_app')" icon="pi pi-camera" class="w-full" severity="info" :disabled="isLocked('image')" />
      </div>

      <div class="flex flex-col gap-2 flex-1">
        <label class="text-[14px] font-medium text-[var(--p-text-color)]">{{ t('live_order.form.field.note') }}</label>
        <Textarea v-model="form.note" rows="6" class="w-full resize-none" />
      </div>
    </div>

    <!-- 右欄：表單 grid -->
    <div class="flex-1 grid grid-cols-4 gap-4 content-start">

      <!-- 競價模式提示：直播關鍵字與庫存不計入 -->
      <div
        v-if="form.bidding"
        class="col-span-4 flex items-center gap-2 text-[13px] text-[var(--p-text-color)] bg-[var(--p-content-hover-background)] border border-[var(--p-content-border-color)] rounded-[6px] px-3 py-2"
      >
        <i class="pi pi-info-circle text-[var(--p-primary-color)]" style="font-size:14px"></i>
        {{ t('live_order.text.bidding_exclude_hint') }}
      </div>

      <div class="col-span-4 flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)]">{{ t('live_order.form.field.checkout_type') }}</label>
        <Select v-model="form.checkoutType" :options="checkoutTypes" option-label="label" option-value="value" :placeholder="t('live_order.form.placeholder.general_cart')" class="w-full" />
      </div>

      <div class="col-span-4 flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)]">{{ t('live_order.form.field.multi_cart') }}</label>
        <div class="flex gap-2">
          <Select v-model="form.multiCart" :options="multiCarts" option-label="label" option-value="value" :placeholder="t('live_order.form.placeholder.multi_cart_name')" class="flex-1" />
          <Button icon="pi pi-plus" outlined severity="secondary" />
        </div>
      </div>

      <div class="col-span-2 flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)]">
          <span class="text-[#dc2626]">{{ t('live_order.text.required') }}</span>{{ t('live_order.form.field.product_name') }}
        </label>
        <InputText v-model="form.name" :class="{ 'p-invalid': hasError && !form.name?.trim() }" class="w-full" />
        <span v-if="hasError && !form.name?.trim()" class="text-[12px] text-[#dc2626]">{{ t('live_order.form.validation.product_name_required') }}</span>
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)]">{{ t('live_order.form.field.spec') }}</label>
        <Button
          icon="pi pi-tags"
          severity="primary"
          class="w-full"
          :badge="specGroupSummary || undefined"
          v-tooltip.top="t('live_order.form.hint.set_spec')"
          @click="specEditorVisible = true"
        />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)]">{{ t('live_order.form.field.discount_price') }}</label>
        <Button icon="pi pi-dollar" severity="primary" class="w-full" v-tooltip.top="t('live_order.form.hint.set_discount_price')" />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)] flex items-center gap-1">
          {{ t('live_order.form.field.keyword') }}
          <i v-if="form.bidding" v-tooltip.top="t('live_order.text.bidding_locked_hint')" class="pi pi-lock text-[var(--p-text-muted-color)]" style="font-size:12px"></i>
        </label>
        <InputText v-model="form.keyword" :placeholder="t('live_order.form.placeholder.prefix')" :disabled="form.bidding" class="w-full" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)]">{{ t('live_order.form.field.code') }}</label>
        <InputText v-model="form.code" class="w-full" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)] flex items-center gap-1">
          {{ t('live_order.form.field.cost') }}
          <i v-if="isLocked('cost')" v-tooltip.top="t('live_order.text.locked_field_hint')" class="pi pi-lock text-[var(--p-text-muted-color)]" style="font-size:12px"></i>
        </label>
        <InputNumber v-model="form.cost" :min="0" :disabled="isLocked('cost')" class="w-full" :input-style="{ width: '100%' }" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)] flex items-center gap-1">
          {{ t('live_order.form.field.price') }}
          <i v-if="isLocked('price')" v-tooltip.top="t('live_order.text.locked_field_hint')" class="pi pi-lock text-[var(--p-text-muted-color)]" style="font-size:12px"></i>
        </label>
        <InputNumber v-model="form.price" :min="0" :disabled="isLocked('price')" class="w-full" :input-style="{ width: '100%' }" />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)] flex items-center gap-1">
          {{ t('live_order.form.field.total_stock') }}
          <i
            v-if="isLocked('stock') || form.bidding"
            v-tooltip.top="isLocked('stock') ? t('live_order.text.locked_field_hint') : t('live_order.text.bidding_locked_hint')"
            class="pi pi-lock text-[var(--p-text-muted-color)]"
            style="font-size:12px"
          ></i>
        </label>
        <InputNumber v-model="form.stock" :min="0" :disabled="isLocked('stock') || form.bidding" class="w-full" :input-style="{ width: '100%' }" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)]">{{ t('live_order.form.field.weight') }}</label>
        <InputNumber v-model="form.weight" :min="0" class="w-full" :input-style="{ width: '100%' }" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)]">{{ t('live_order.form.field.bidding') }}</label>
        <ToggleSwitch v-model="form.bidding" />
      </div>
      <div v-if="form.bidding" class="flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)]">{{ t('live_order.form.field.flat_price') }}</label>
        <InputNumber v-model="form.flatPrice" :min="0" class="w-full" :input-style="{ width: '100%' }" />
      </div>
      <div v-if="form.bidding" class="flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)]">{{ t('live_order.form.field.starting_bid') }}</label>
        <InputNumber v-model="form.startingBid" :min="0" class="w-full" :input-style="{ width: '100%' }" />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)] flex items-center gap-1">
          {{ t('live_order.form.field.allow_mix_color') }}
          <i class="pi pi-info-circle text-[var(--p-text-muted-color)]" style="font-size:12px" v-tooltip.top="t('live_order.form.hint.allow_mix_color_tooltip')"></i>
        </label>
        <ToggleSwitch v-model="form.allowMixColor" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)]">{{ t('live_order.form.field.allow_oversell') }}</label>
        <ToggleSwitch v-model="form.allowOversell" />
      </div>
      <div class="col-span-2 flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)] flex items-center gap-1">
          {{ t('live_order.form.field.pick_spec_after_winning') }}
          <i class="pi pi-info-circle text-[var(--p-text-muted-color)]" style="font-size:12px" v-tooltip.top="t('live_order.form.hint.pick_spec_after_winning_tooltip')"></i>
        </label>
        <ToggleSwitch v-model="form.pickSpecAfterWinning" />
      </div>
      <div class="col-span-2 flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)]">{{ t('live_order.form.field.sku') }}</label>
        <InputText v-model="form.sku" class="w-full" />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)]">{{ t('live_order.form.field.plus_one_limit') }}</label>
        <InputNumber v-model="form.plusLimit" :min="0" class="w-full" :input-style="{ width: '100%' }" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)]">{{ t('live_order.form.field.star_filter') }}</label>
        <Select v-model="form.starFilter" :options="starOptions" option-label="label" option-value="value" :placeholder="t('live_order.form.placeholder.no_limit')" class="w-full" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)]">{{ t('live_order.form.field.new_customer_any_star') }}</label>
        <ToggleSwitch v-model="form.newCustomerAnyStar" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-[14px] font-medium text-[var(--p-text-color)]">{{ t('live_order.form.field.member_only') }}</label>
        <ToggleSwitch v-model="form.memberOnly" />
      </div>

    </div>
  </div>

  <SpecEditorDialog
    v-model:visible="specEditorVisible"
    :initial-specs="initialSpecsForEditor"
    @save="onSpecGroupsSave"
  />
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SpecEditorDialog, {
  type SpecGroup,
  type SpecRow,
  type SpecEditorSavePayload,
} from './SpecEditorDialog.vue'

const { t } = useI18n()

interface ExistingSpec {
  id?: number
  name?: string
  stock?: number
  price?: number
}

interface ProductInput {
  id?: number
  name?: string
  sku?: string
  keyword?: string
  cost?: number
  price?: number
  stock?: number
  specs?: ExistingSpec[]
  [key: string]: unknown
}

interface GeneratedSpec {
  id: number
  name: string
  stock: number
  price: number
}

interface ProductForm {
  name: string
  checkoutType: string
  multiCart: string | null
  keyword: string
  code: string
  cost: number
  price: number
  stock: number
  weight: number
  bidding: boolean
  flatPrice: number
  /** 起標價格：僅競價模式有意義（bidding 關閉時歸 0） */
  startingBid: number
  allowMixColor: boolean
  allowOversell: boolean
  /** 得標後再選規格：買家先 +1 不選規格，結帳前再挑；下單不扣庫存 */
  pickSpecAfterWinning: boolean
  sku: string
  plusLimit: number
  starFilter: string
  newCustomerAnyStar: boolean
  memberOnly: boolean
  note: string
}

interface Props {
  product?: ProductInput
  /** 欄位 key 列表；列在內的欄位 input 會被 disable（用於「選擇商品」帶入後鎖定 cost/price/stock） */
  readonlyFields?: string[]
}
const props = withDefaults(defineProps<Props>(), {
  product: () => ({}),
  readonlyFields: () => [],
})

const lockedFields = computed<Set<string>>(() => new Set(props.readonlyFields))
function isLocked(key: string): boolean {
  return lockedFields.value.has(key)
}

const hasError = ref(false)
const form = reactive<ProductForm>({
  name: '',
  checkoutType: '一般購物車',
  multiCart: null,
  keyword: '',
  code: '',
  cost: 0,
  price: 0,
  stock: 0,
  weight: 0,
  bidding: false,
  flatPrice: 0,
  startingBid: 0,
  // 預設 false：「允許包色」會把卡片下方 chip 從「規格+1」整批換成「{kw}包+1」單顆。
  // 預設 true 會吃掉個別規格的顯示，故改 false，由使用者自行 opt-in。
  allowMixColor: false,
  allowOversell: true,
  pickSpecAfterWinning: false,
  sku: '',
  plusLimit: 0,
  starFilter: 'any',
  newCustomerAnyStar: false,
  memberOnly: false,
  note: '',
})

// ── 規格群組（由 SpecEditorDialog 維護） ─────────
const specEditorVisible = ref(false)
const specGroups = ref<SpecGroup[]>([])
const specRows = ref<SpecRow[]>([])
/**
 * 是否曾透過 SpecEditorDialog 編輯過規格。
 * getData() 用這旗標決定 specs 要不要回傳——避免「沒開過 dialog 就 save」誤把
 * 既有 product.specs 清成空陣列。
 */
const hasEditedSpecs = ref(false)

/**
 * 傳給 dialog 當作初始值的「既有規格」清單；只在第一次開 dialog 時用。
 * 若使用者已透過 dialog 編輯過 (specGroups 非空)，dialog 內部會以該已存 groups 為主。
 */
const initialSpecsForEditor = computed<ExistingSpec[]>(() => {
  if (specGroups.value.length > 0) {
    return specGroups.value.flatMap((g) =>
      g.values.map((v) => ({ name: g.name ? `${g.name}：${v}` : v })),
    )
  }
  return props.product.specs ?? []
})

function onSpecGroupsSave(payload: SpecEditorSavePayload): void {
  specGroups.value = payload.groups
  specRows.value = payload.rows
  hasEditedSpecs.value = true
}

/** 規格按鈕 badge 顯示規格表筆數，沒設定時不顯示 */
const specGroupSummary = computed<string>(() => {
  if (specRows.value.length === 0) return ''
  return String(specRows.value.length)
})

/** 由 specRows 轉成 LiveProduct.specs 用的扁平 specs 陣列（含成本/售價/庫存） */
function buildGeneratedSpecs(): GeneratedSpec[] {
  if (specRows.value.length === 0) return []
  const baseId = Date.now()
  return specRows.value.map((row, idx) => ({
    id: baseId + idx,
    name: row.parts.join(' / '),
    stock: row.stock,
    price: row.salePrice || form.price || 0,
  }))
}

watch(() => props.product, p => {
  hasError.value = false
  if (!p) return
  form.name          = p.name || ''
  form.keyword       = p.keyword || ''
  form.code          = p.sku  || ''
  form.cost          = p.cost  ?? 0
  form.price         = p.price ?? 0
  form.stock         = p.stock ?? 0
  form.sku           = p.sku  || ''
  form.allowMixColor = (p as { allowMixColor?: boolean }).allowMixColor ?? false
  form.pickSpecAfterWinning = (p as { pickSpecAfterWinning?: boolean }).pickSpecAfterWinning ?? false
  // 換商品時重置已編輯的 specGroups/specRows，下一次開 dialog 由 initialSpecsForEditor 還原
  specGroups.value = []
  specRows.value = []
  hasEditedSpecs.value = false
}, { immediate: true, deep: true })

// 競價模式關閉時把一刀價格、起標價格歸 0（兩者僅競價模式有意義）
watch(() => form.bidding, (bidding) => {
  if (!bidding) {
    form.flatPrice = 0
    form.startingBid = 0
  }
})

const checkoutTypes = computed(() => [
  { label: t('live_order.checkout_type.normal'),               value: '一般購物車' },
  { label: t('live_order.checkout_type.preorder_on_arrival'),  value: '預購-到貨再結帳' },
  { label: t('live_order.checkout_type.multi_cart_separate'),  value: '多購物車-獨立結帳' },
])
const multiCarts = computed(() => [
  { label: t('live_order.multi_cart.live_cart'), value: 'live-cart' },
  { label: t('live_order.multi_cart.vip_cart'),  value: 'vip-cart' },
])
const starOptions = computed(() => [
  { label: t('live_order.star_filter.any'),        value: 'any' },
  { label: t('live_order.star_filter.one_plus'),   value: '1' },
  { label: t('live_order.star_filter.two_plus'),   value: '2' },
  { label: t('live_order.star_filter.three_plus'), value: '3' },
  { label: t('live_order.star_filter.four_plus'),  value: '4' },
  { label: t('live_order.star_filter.five'),       value: '5' },
])

/** Validate the form. Returns true when valid; sets hasError otherwise. */
function validate(): boolean {
  if (!form.name?.trim()) { hasError.value = true; return false }
  return true
}

/**
 * 回傳當前 form 資料 + 自動產生的 id / sku fallback。
 * `specs` 只在使用者真的開過 SpecEditorDialog 編輯後才回傳；
 * 否則 undefined，由 caller 決定是否略過（避免清掉原 product.specs）。
 */
function getData(): ProductForm & { id: number; specs?: GeneratedSpec[] } {
  return {
    ...form,
    id: Date.now(),
    sku: form.sku || form.code || `NEW-${Date.now()}`,
    specs: hasEditedSpecs.value ? buildGeneratedSpecs() : undefined,
  }
}

/** Reset the form fields back to defaults. */
function reset(): void {
  Object.assign(form, {
    name: '', checkoutType: '一般購物車', multiCart: null, keyword: '', code: '',
    cost: 0, price: 0, stock: 0, weight: 0, bidding: false, flatPrice: 0, startingBid: 0,
    allowMixColor: false, allowOversell: true, pickSpecAfterWinning: false, sku: '', plusLimit: 0,
    starFilter: 'any', newCustomerAnyStar: false, memberOnly: false, note: '',
  })
  hasError.value = false
  specGroups.value = []
  specRows.value = []
  hasEditedSpecs.value = false
}

defineExpose({ validate, getData, reset })
</script>
