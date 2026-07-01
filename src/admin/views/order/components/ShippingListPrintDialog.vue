<script setup lang="ts">
import { computed, ref } from 'vue'

/**
 * 出貨單列印 Dialog（依規範第 4 節「出貨單列印格式」）。
 *
 * 結構：
 * - 「原始出貨單」在前：兩欄式訂單資訊 + 全部商品表 + 訂單金額
 * - 「本批出貨明細」附在後：只有物流 / 取號差異才顯示；商品表三欄（商品名稱/規格/數量）+ 本批出貨件數
 *
 * 列印範圍：
 * - 全部商品 → 原始出貨單 + 所有批次明細
 * - 批次 N → 原始出貨單 + 該批明細
 */

interface OrderLite {
  orderNo: string
  createdAt: string
  buyerName: string
  buyerPhone: string
  amount: number
  itemCount: number
  shippingMethod: string
  carrierName?: string
  trackingStatus?: string | null
  dispatchBatchCount?: number
  couponActivity?: string
  couponDiscount?: number
  pointsDiscount?: number
  cartTag: { label: string; bg: string; color: string }
}
interface Props {
  visible: boolean
  order: OrderLite | null
}
const props = defineProps<Props>()
const emit = defineEmits<{
  'update:visible': [v: boolean]
}>()

/** 商品明細（同 OrderRowDetail 邏輯，prototype 用單筆推算） */
const products = computed(() => {
  if (!props.order) return []
  const o = props.order
  const unitPrice = Math.round(o.amount / Math.max(1, o.itemCount) - 120 / Math.max(1, o.itemCount))
  return [{
    name: o.cartTag.label === '服飾專區' ? '韓版寬鬆連帽外套（米白）' : '示意商品',
    spec: o.cartTag.label === '服飾專區' ? '尺寸 M / 米白色內裡' : '預設規格',
    price: unitPrice,
    qty: o.itemCount,
  }]
})
const subtotal = computed(() => products.value.reduce((s, r) => s + r.price * r.qty, 0))
const shippingFee = 120
const couponDiscount = computed(() => props.order?.couponDiscount ?? 0)
const pointsDiscount = computed(() => props.order?.pointsDiscount ?? 0)
const total = computed(() => subtotal.value + shippingFee - couponDiscount.value - pointsDiscount.value)

/** 批次選項：全部商品 + 每個批次 */
const batchCount = computed(() => props.order?.dispatchBatchCount ?? 0)
const printScopeOptions = computed(() => {
  const opts = [{ label: '全部商品', value: 'all' }]
  for (let i = 1; i <= batchCount.value; i++) {
    opts.push({ label: `第 ${i} 批`, value: `batch_${i}` })
  }
  return opts
})
const printScope = ref<string>('all')

/** 批次 mock：dispatchBatchCount > 0 時，切訂購件數為多批（示意） */
interface BatchMock { index: number; itemQty: number; carrierDiff?: string; trackingDiff?: string }
const batchMocks = computed<BatchMock[]>(() => {
  const n = batchCount.value
  if (n === 0 || !props.order) return []
  const per = Math.max(1, Math.floor(props.order.itemCount / n))
  const rem = props.order.itemCount - per * (n - 1)
  return Array.from({ length: n }, (_, i) => ({
    index: i + 1,
    itemQty: i === n - 1 ? rem : per,
  }))
})
/** 依選擇的 scope 決定要印哪幾個批次 */
const printedBatches = computed<BatchMock[]>(() => {
  if (printScope.value === 'all') return batchMocks.value
  const m = printScope.value.match(/^batch_(\d+)$/)
  if (!m) return []
  const idx = Number(m[1])
  return batchMocks.value.filter(b => b.index === idx)
})

function doPrint(): void {
  // 用瀏覽器 print — CSS @media print 隱藏非列印區塊（style.css 需一併加規則）
  window.print()
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :draggable="false"
    :style="{ width: 'min(800px, calc(100vw - 32px))' }"
    :pt="{ content: { style: 'padding: 0' } }"
    @update:visible="(v) => emit('update:visible', v)"
  >
    <template #header>
      <div class="flex items-center gap-3 print:hidden">
        <div class="size-10 shrink-0 rounded-full bg-[var(--p-primary-50)] flex items-center justify-center">
          <i class="pi pi-print text-[var(--p-primary-color)] text-lg"></i>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-base font-bold text-[var(--p-text-color)]">出貨單列印</span>
          <span v-if="order" class="text-xs text-[var(--p-text-muted-color)]">訂單 {{ order.orderNo }} · {{ order.buyerName }}</span>
        </div>
      </div>
    </template>

    <!-- 列印範圍 selector（有批次時才顯示） -->
    <div v-if="batchCount > 0" class="p-4 border-b border-[var(--p-content-border-color)] flex items-center gap-3 flex-wrap print:hidden">
      <span class="text-[13px] font-medium text-[var(--p-text-color)]">列印範圍</span>
      <SelectButton
        v-model="printScope"
        :options="printScopeOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
      />
    </div>

    <!-- 出貨單內容（列印時只印這一區） -->
    <div v-if="order" class="p-6 flex flex-col gap-6 shipping-print-area">
      <!-- ─── 原始出貨單 ─── -->
      <section class="flex flex-col gap-4">
        <div class="flex items-center justify-between border-b-2 border-[var(--p-text-color)] pb-2">
          <span class="text-lg font-bold text-[var(--p-text-color)]">原始出貨單</span>
          <span class="text-xs text-[var(--p-text-muted-color)]">列印時間：{{ new Date().toLocaleString('zh-TW') }}</span>
        </div>

        <!-- 兩欄式訂單資訊 -->
        <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
          <div class="flex gap-2"><span class="text-[var(--p-text-muted-color)] w-[80px] shrink-0">訂單編號</span><span class="text-[var(--p-text-color)] font-medium">{{ order.orderNo }}</span></div>
          <div class="flex gap-2"><span class="text-[var(--p-text-muted-color)] w-[80px] shrink-0">訂單日期</span><span class="text-[var(--p-text-color)]">{{ order.createdAt }}</span></div>
          <div class="flex gap-2"><span class="text-[var(--p-text-muted-color)] w-[80px] shrink-0">客戶姓名</span><span class="text-[var(--p-text-color)]">{{ order.buyerName }}</span></div>
          <div class="flex gap-2"><span class="text-[var(--p-text-muted-color)] w-[80px] shrink-0">收件人</span><span class="text-[var(--p-text-color)]">{{ order.buyerName }}</span></div>
          <div class="flex gap-2"><span class="text-[var(--p-text-muted-color)] w-[80px] shrink-0">聯絡電話</span><span class="text-[var(--p-text-color)]">{{ order.buyerPhone }}</span></div>
          <div class="flex gap-2"><span class="text-[var(--p-text-muted-color)] w-[80px] shrink-0">E-mail</span><span class="text-[var(--p-text-color)]">customer@example.com</span></div>
          <div class="flex gap-2"><span class="text-[var(--p-text-muted-color)] w-[80px] shrink-0">送貨方式</span><span class="text-[var(--p-text-color)]">{{ order.shippingMethod }}</span></div>
          <div class="flex gap-2"><span class="text-[var(--p-text-muted-color)] w-[80px] shrink-0">物流商</span><span class="text-[var(--p-text-color)]">{{ order.carrierName ?? '—' }}</span></div>
          <div class="flex gap-2"><span class="text-[var(--p-text-muted-color)] w-[80px] shrink-0">物流取號</span><span class="text-[var(--p-text-color)]">{{ order.trackingStatus ?? '—' }}</span></div>
          <div class="flex gap-2"><span class="text-[var(--p-text-muted-color)] w-[80px] shrink-0">支付方式</span><span class="text-[var(--p-text-color)]">信用卡一次付清</span></div>
          <div class="flex gap-2 col-span-2"><span class="text-[var(--p-text-muted-color)] w-[80px] shrink-0">出貨地址</span><span class="text-[var(--p-text-color)]">台北市中山區南京東路二段50號</span></div>
          <div class="flex gap-2 col-span-2"><span class="text-[var(--p-text-muted-color)] w-[80px] shrink-0">用戶備註</span><span class="text-[var(--p-text-color)]">—</span></div>
        </div>

        <!-- 全部商品表 -->
        <table class="w-full text-[13px] border border-[var(--p-content-border-color)]">
          <thead class="bg-[var(--p-content-hover-background)]">
            <tr class="text-[var(--p-text-color)] font-semibold">
              <th class="text-left p-2 border-b border-[var(--p-content-border-color)]">商品名稱</th>
              <th class="text-left p-2 border-b border-[var(--p-content-border-color)]">規格</th>
              <th class="text-right p-2 border-b border-[var(--p-content-border-color)] w-[80px]">單價</th>
              <th class="text-right p-2 border-b border-[var(--p-content-border-color)] w-[60px]">數量</th>
              <th class="text-right p-2 border-b border-[var(--p-content-border-color)] w-[100px]">小計</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, i) in products" :key="i" class="border-b border-[var(--p-content-border-color)]">
              <td class="p-2">{{ p.name }}</td>
              <td class="p-2">{{ p.spec }}</td>
              <td class="text-right p-2">${{ p.price.toLocaleString() }}</td>
              <td class="text-right p-2">× {{ p.qty }}</td>
              <td class="text-right p-2 font-medium">${{ (p.price * p.qty).toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>

        <!-- 訂單金額 -->
        <div class="flex justify-end">
          <div class="flex flex-col gap-1 text-[13px] min-w-[240px]">
            <div class="flex items-center justify-between">
              <span class="text-[var(--p-text-muted-color)]">商品總額</span>
              <span class="text-[var(--p-text-color)]">${{ subtotal.toLocaleString() }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[var(--p-text-muted-color)]">運費</span>
              <span class="text-[var(--p-text-color)]">+${{ shippingFee }}</span>
            </div>
            <div v-if="couponDiscount > 0" class="flex items-center justify-between">
              <span class="text-[var(--p-text-muted-color)]">優惠券</span>
              <span class="text-[var(--p-text-color)]">-${{ couponDiscount.toLocaleString() }}</span>
            </div>
            <div v-if="pointsDiscount > 0" class="flex items-center justify-between">
              <span class="text-[var(--p-text-muted-color)]">紅利折抵</span>
              <span class="text-[var(--p-text-color)]">-${{ pointsDiscount.toLocaleString() }}</span>
            </div>
            <div class="flex items-center justify-between pt-2 border-t-2 border-[var(--p-text-color)]">
              <span class="font-bold text-[var(--p-text-color)]">訂單總計</span>
              <span class="text-base font-bold text-[var(--p-text-color)]">${{ total.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── 本批出貨明細 ─── -->
      <section
        v-for="b in printedBatches"
        :key="b.index"
        class="flex flex-col gap-3 pt-4 border-t border-dashed border-[var(--p-text-muted-color)]"
      >
        <div class="flex items-center justify-between">
          <span class="text-base font-bold text-[var(--p-text-color)]">本批出貨明細 — 第 {{ b.index }} 批</span>
          <span class="text-xs text-[var(--p-text-muted-color)]">本批出貨件數：<span class="font-bold text-[var(--p-text-color)]">{{ b.itemQty }} 件</span></span>
        </div>
        <div class="text-[13px] text-[var(--p-text-color)]">收件資訊：同原始出貨單</div>
        <!-- 差異行只有當本批物流/取號跟訂單不同時才顯示（prototype 假設無差異） -->
        <div v-if="b.carrierDiff || b.trackingDiff" class="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
          <div v-if="b.carrierDiff" class="flex gap-2"><span class="text-[var(--p-text-muted-color)] w-[80px] shrink-0">本批物流</span><span class="text-[var(--p-text-color)]">{{ b.carrierDiff }}</span></div>
          <div v-if="b.trackingDiff" class="flex gap-2"><span class="text-[var(--p-text-muted-color)] w-[80px] shrink-0">本批取號</span><span class="text-[var(--p-text-color)]">{{ b.trackingDiff }}</span></div>
        </div>

        <!-- 本批商品表：只有商品名稱 / 規格 / 數量 三欄 -->
        <table class="w-full text-[13px] border border-[var(--p-content-border-color)]">
          <thead class="bg-[var(--p-content-hover-background)]">
            <tr class="text-[var(--p-text-color)] font-semibold">
              <th class="text-left p-2 border-b border-[var(--p-content-border-color)]">商品名稱</th>
              <th class="text-left p-2 border-b border-[var(--p-content-border-color)]">規格</th>
              <th class="text-right p-2 border-b border-[var(--p-content-border-color)] w-[80px]">數量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, i) in products" :key="i" class="border-b border-[var(--p-content-border-color)]">
              <td class="p-2">{{ p.name }}</td>
              <td class="p-2">{{ p.spec }}</td>
              <td class="text-right p-2">× {{ b.itemQty }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <template #footer>
      <div class="print:hidden">
        <Button label="取消" severity="secondary" variant="outlined" @click="emit('update:visible', false)" />
        <Button label="列印" icon="pi pi-print" @click="doPrint" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
/* 列印時只顯示出貨單內容，隱藏 Dialog header / footer / SelectButton */
@media print {
  .print\:hidden {
    display: none !important;
  }
}
</style>
