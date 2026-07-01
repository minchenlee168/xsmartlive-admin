<script setup lang="ts">
import { computed, ref, watch } from 'vue'

/**
 * 差額調整 Dialog（訂單層級 / 批次層級共用）。
 *
 * 對應欄位字典第 4 節 DiffAdj：amount / settleType / payMethod / refundMethod
 * / reason / invoiceMode / validity / faceValue / status / at
 *
 * 三種結算方式：
 * - 商家自行吸收 (absorb)：不算訂單調整，內部記帳
 * - 向客戶補收 (charge)：算訂單調整，需選補款方式 + 事由 + 發票處理
 * - 退錢給客戶 (refund)：算訂單調整，需選退還方式：
 *     - 退款 (refund_method=refund)：需事由 + 發票處理
 *     - 優惠券 (coupon)：不算訂單調整（另外發放），需券面額 + 有效期限
 *     - 紅利點數 (points)：不算訂單調整（另外發放），需點數 + 有效期限
 */

export interface DiffAdjPayload {
  amount: number
  settleType: 'absorb' | 'charge' | 'refund'
  payMethod?: 'link' | 'atm' | 'cod'
  refundMethod?: 'refund' | 'coupon' | 'points'
  reason?: string
  invoiceMode?: 'auto' | 'manual'
  validity?: '90' | '180' | '365' | 'none'
  faceValue?: number
  status: string
  at: number
}

interface Props {
  visible: boolean
  initial?: DiffAdjPayload | null
}
const props = withDefaults(defineProps<Props>(), { initial: null })
const emit = defineEmits<{
  'update:visible': [v: boolean]
  confirm: [payload: DiffAdjPayload]
  remove: []
}>()

const settleTypeOptions = [
  { label: '商家自行吸收', value: 'absorb' as const },
  { label: '向客戶補收',   value: 'charge' as const },
  { label: '退錢給客戶',   value: 'refund' as const },
]
const payMethodOptions = [
  { label: '付款連結',     value: 'link' as const },
  { label: 'ATM 轉帳',     value: 'atm' as const },
  { label: '貨到一併代收', value: 'cod' as const },
]
const refundMethodOptions = [
  { label: '退款（退刷）', value: 'refund' as const },
  { label: '優惠券',       value: 'coupon' as const },
  { label: '紅利點數',     value: 'points' as const },
]
const invoiceModeOptions = [
  { label: '自動處理', value: 'auto' as const },
  { label: '手動處理', value: 'manual' as const },
]
const validityOptions = [
  { label: '90 天',    value: '90' as const },
  { label: '180 天',   value: '180' as const },
  { label: '365 天',   value: '365' as const },
  { label: '無期限',   value: 'none' as const },
]

const amount = ref<number>(0)
const settleType = ref<'absorb' | 'charge' | 'refund'>('absorb')
const payMethod = ref<'link' | 'atm' | 'cod'>('link')
const refundMethod = ref<'refund' | 'coupon' | 'points'>('refund')
const reason = ref<string>('')
const invoiceMode = ref<'auto' | 'manual'>('auto')
const validity = ref<'90' | '180' | '365' | 'none'>('365')
const faceValue = ref<number>(0)

/** 開啟時依 initial 帶入既有值 */
watch(() => [props.visible, props.initial], () => {
  if (!props.visible) return
  if (props.initial) {
    amount.value = props.initial.amount
    settleType.value = props.initial.settleType
    payMethod.value = props.initial.payMethod ?? 'link'
    refundMethod.value = props.initial.refundMethod ?? 'refund'
    reason.value = props.initial.reason ?? ''
    invoiceMode.value = props.initial.invoiceMode ?? 'auto'
    validity.value = props.initial.validity ?? '365'
    faceValue.value = props.initial.faceValue ?? 0
  } else {
    amount.value = 0
    settleType.value = 'absorb'
    payMethod.value = 'link'
    refundMethod.value = 'refund'
    reason.value = ''
    invoiceMode.value = 'auto'
    validity.value = '365'
    faceValue.value = 0
  }
}, { immediate: true })

/** 目前設定會影響訂單金額嗎？（absorb / coupon / points 不算訂單調整） */
const affectsOrderTotal = computed<boolean>(() => {
  if (settleType.value === 'absorb') return false
  if (settleType.value === 'refund' && (refundMethod.value === 'coupon' || refundMethod.value === 'points')) return false
  return true
})

/** 依結算方式 + 退還方式決定金流狀態文字 */
const statusText = computed<string>(() => {
  if (settleType.value === 'absorb') return '商家自行吸收'
  if (settleType.value === 'charge') return '待補款'
  if (settleType.value === 'refund') {
    if (refundMethod.value === 'refund') return '待退款'
    if (refundMethod.value === 'coupon') return '已發優惠券'
    if (refundMethod.value === 'points') return '已贈點'
  }
  return ''
})

/** 提交前檢查：charge / refund 必填事由；coupon / points 必填面額 */
const canConfirm = computed<boolean>(() => {
  if (amount.value <= 0) return false
  if (settleType.value === 'charge' && !reason.value.trim()) return false
  if (settleType.value === 'refund') {
    if (refundMethod.value === 'refund' && !reason.value.trim()) return false
    if ((refundMethod.value === 'coupon' || refundMethod.value === 'points') && faceValue.value <= 0) return false
  }
  return true
})

function confirm(): void {
  if (!canConfirm.value) return
  const payload: DiffAdjPayload = {
    amount: amount.value,
    settleType: settleType.value,
    reason: reason.value.trim() || undefined,
    status: statusText.value,
    at: Date.now(),
  }
  if (settleType.value === 'charge') {
    payload.payMethod = payMethod.value
    payload.invoiceMode = invoiceMode.value
  }
  if (settleType.value === 'refund') {
    payload.refundMethod = refundMethod.value
    if (refundMethod.value === 'refund') payload.invoiceMode = invoiceMode.value
    if (refundMethod.value === 'coupon' || refundMethod.value === 'points') {
      payload.faceValue = faceValue.value
      payload.validity = validity.value
    }
  }
  emit('confirm', payload)
  emit('update:visible', false)
}

function removeAdj(): void {
  emit('remove')
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :draggable="false"
    :style="{ width: 'min(560px, calc(100vw - 32px))' }"
    @update:visible="(v) => emit('update:visible', v)"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="size-10 shrink-0 rounded-full bg-[var(--p-primary-50)] flex items-center justify-center">
          <i class="pi pi-dollar text-[var(--p-primary-color)] text-lg"></i>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-base font-bold text-[var(--p-text-color)]">差額調整</span>
          <span class="text-xs text-[var(--p-text-muted-color)]">補收 / 退款 / 商家吸收</span>
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-4">
      <!-- 金額 -->
      <div class="flex flex-col gap-2">
        <label class="text-[13px] font-medium text-[var(--p-text-color)]">
          調整金額 <span class="text-[#DC2626]">*</span>
        </label>
        <InputNumber
          v-model="amount"
          :min="0"
          mode="currency"
          currency="TWD"
          locale="zh-TW"
          class="w-full"
        />
      </div>

      <!-- 結算方式 -->
      <div class="flex flex-col gap-2">
        <label class="text-[13px] font-medium text-[var(--p-text-color)]">
          結算方式 <span class="text-[#DC2626]">*</span>
        </label>
        <SelectButton
          v-model="settleType"
          :options="settleTypeOptions"
          option-label="label"
          option-value="value"
          :allow-empty="false"
        />
      </div>

      <!-- charge：補款方式 + 事由 + 發票處理 -->
      <template v-if="settleType === 'charge'">
        <div class="flex flex-col gap-2">
          <label class="text-[13px] font-medium text-[var(--p-text-color)]">
            補款方式 <span class="text-[#DC2626]">*</span>
          </label>
          <Select
            v-model="payMethod"
            :options="payMethodOptions"
            option-label="label"
            option-value="value"
            class="w-full"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-[13px] font-medium text-[var(--p-text-color)]">
            事由 <span class="text-[#DC2626]">*</span>
          </label>
          <InputText v-model="reason" placeholder="請輸入補收原因" class="w-full" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-[13px] font-medium text-[var(--p-text-color)]">發票處理</label>
          <Select
            v-model="invoiceMode"
            :options="invoiceModeOptions"
            option-label="label"
            option-value="value"
            class="w-full"
          />
        </div>
      </template>

      <!-- refund：退還方式 + 條件式欄位 -->
      <template v-else-if="settleType === 'refund'">
        <div class="flex flex-col gap-2">
          <label class="text-[13px] font-medium text-[var(--p-text-color)]">
            退還方式 <span class="text-[#DC2626]">*</span>
          </label>
          <Select
            v-model="refundMethod"
            :options="refundMethodOptions"
            option-label="label"
            option-value="value"
            class="w-full"
          />
        </div>
        <template v-if="refundMethod === 'refund'">
          <div class="flex flex-col gap-2">
            <label class="text-[13px] font-medium text-[var(--p-text-color)]">
              事由 <span class="text-[#DC2626]">*</span>
            </label>
            <InputText v-model="reason" placeholder="請輸入退款原因" class="w-full" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-[13px] font-medium text-[var(--p-text-color)]">發票處理</label>
            <Select
              v-model="invoiceMode"
              :options="invoiceModeOptions"
              option-label="label"
              option-value="value"
              class="w-full"
            />
          </div>
        </template>
        <template v-else>
          <!-- coupon / points 都要面額 + 有效期限 -->
          <div class="flex flex-col gap-2">
            <label class="text-[13px] font-medium text-[var(--p-text-color)]">
              {{ refundMethod === 'coupon' ? '券面額' : '點數' }} <span class="text-[#DC2626]">*</span>
            </label>
            <InputNumber
              v-model="faceValue"
              :min="0"
              class="w-full"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-[13px] font-medium text-[var(--p-text-color)]">有效期限</label>
            <Select
              v-model="validity"
              :options="validityOptions"
              option-label="label"
              option-value="value"
              class="w-full"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-[13px] font-medium text-[var(--p-text-color)]">事由</label>
            <InputText v-model="reason" placeholder="（選填）發放原因" class="w-full" />
          </div>
        </template>
      </template>

      <!-- 影響金額提示 -->
      <div
        class="rounded-md border px-3 py-2 flex items-start gap-2 text-xs"
        :class="affectsOrderTotal
          ? 'border-[#CA8A04] bg-[#FEF9C3] text-[var(--p-text-color)]'
          : 'border-[var(--p-content-border-color)] bg-[var(--p-content-hover-background)] text-[var(--p-text-muted-color)]'"
      >
        <i class="pi pi-info-circle mt-1"></i>
        <span v-if="affectsOrderTotal">此設定<strong>會計入訂單調整</strong>，訂單總計連動；金流狀態：<strong>{{ statusText }}</strong></span>
        <span v-else>此設定<strong>不算訂單調整</strong>（另外發放 / 內部記帳）；狀態：<strong>{{ statusText }}</strong></span>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full gap-2">
        <Button
          v-if="initial"
          label="刪除調整"
          icon="pi pi-trash"
          severity="danger"
          variant="outlined"
          @click="removeAdj"
        />
        <span v-else></span>
        <div class="flex items-center gap-2">
          <Button label="取消" severity="secondary" variant="outlined" @click="emit('update:visible', false)" />
          <Button label="確定" :disabled="!canConfirm" @click="confirm" />
        </div>
      </div>
    </template>
  </Dialog>
</template>
