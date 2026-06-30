<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

/**
 * 訂單列表 row expansion 展開內容。
 *
 * 三大區塊：
 * 1. 上方 4 卡（grid）：配送資訊 / 訂單來源 / 付款方式 / 發票資訊
 * 2. 出貨管理：動作按鈕列 + 配送物流/發票狀態 + 出貨進度 Timeline + 出貨單備註
 * 3. 商品明細 table + 用戶備註 + 訂單總計（運費 / 商品總額 / 總計）
 */

interface OrderRow {
  id: string
  createdAt: string
  cartTag: { label: string; bg: string; color: string }
  orderNo: string
  buyerName: string
  buyerPhone: string
  amount: number
  itemCount: number
  shippingMethod: string
  paymentStatus: 'paid' | 'unpaid'
  shippingStatus: 'pending' | 'preparing' | 'shipping' | 'awaiting_receipt' | 'arrived' | 'completed' | 'cancelled'
  carrierStatus: 'unconfigured' | 'configured'
  trackingStatus: string | null
  /** 已設定的物流商顯示名稱（confirmShippingConfig 後寫入） */
  carrierName?: string
  orderSource: 'live' | 'shop'
  socialPlatform?: 'facebook' | 'line' | 'instagram' | 'tiktok' | 'other'
  multiCart: 'default' | 'main' | 'ice' | 'ice_grocery'
  sessionName?: 'session_0620' | 'session_0622' | 'session_0624' | 'session_0625'
}

interface Props {
  order: OrderRow
}
const props = defineProps<Props>()

/** 出貨狀態 → 標籤顏色（同 OrderListPage 的 statusBadgeForShipping） */
const shippingBadge = computed(() => {
  const map = {
    pending:          { label: '待出貨', bg: '#fef3c7', color: '#b45309' },
    preparing:        { label: '備貨中', bg: '#dbeafe', color: '#1d4ed8' },
    shipping:         { label: '出貨中', bg: '#fef3c7', color: '#b45309' },
    awaiting_receipt: { label: '待收貨', bg: '#ede9fe', color: '#6d28d9' },
    arrived:          { label: '已送達', bg: '#dcfce7', color: '#16a34a' },
    completed:        { label: '已完成', bg: '#f1f5f9', color: '#475569' },
    cancelled:        { label: '已取消', bg: '#fee2e2', color: '#dc2626' },
  } as const
  return map[props.order.shippingStatus]
})

/** 訂單來源 → 顯示文字 */
const sourceLabel = computed(() => props.order.orderSource === 'live' ? '直播' : '商城')
const socialLabel = computed(() => {
  const map = { facebook: 'Facebook', line: 'LINE', instagram: 'Instagram', tiktok: 'TikTok', other: '其他' } as const
  return props.order.socialPlatform ? map[props.order.socialPlatform] : '—'
})
const cartLabel = computed(() => {
  const map = { default: '預設購物車', main: '主購物車', ice: '冰品專區', ice_grocery: '冰品專區 / 生活雜貨' } as const
  return map[props.order.multiCart]
})
const sessionLabel = computed(() => {
  const map = { session_0620: '6/20 開箱直播', session_0622: '6/22 美妝直播', session_0624: '6/24 晚間生鮮直播', session_0625: '6/25 服飾團' } as const
  return props.order.sessionName ? map[props.order.sessionName] : '—'
})

/** 出貨進度 5 階段 Timeline */
interface StepItem { key: string; label: string; isCurrent: boolean; isPast: boolean; time: string }
const progressSteps = computed<StepItem[]>(() => {
  const order: Array<{ key: OrderRow['shippingStatus']; label: string }> = [
    { key: 'pending',    label: '待出貨' },
    { key: 'preparing',  label: '備貨中' },
    { key: 'shipping',   label: '已出貨' },
    { key: 'arrived',    label: '已送達' },
    { key: 'completed',  label: '已完成' },
  ]
  const currentIdx = order.findIndex(s => s.key === props.order.shippingStatus)
  return order.map((s, i) => ({
    key: s.key,
    label: s.label,
    isCurrent: i === currentIdx,
    isPast: i < currentIdx,
    time: i === currentIdx ? props.order.createdAt.slice(5, 10).replace('-', '/') + ' ' + props.order.createdAt.slice(11, 16) : '—',
  }))
})

/** 商品明細：prototype mock 一筆，依照 cart tag 給名稱 */
interface ProductRow { name: string; spec: string; source: string; price: number; qty: number }
const productRows = computed<ProductRow[]>(() => {
  // mock：用訂單金額 ÷ 商品數量推單價
  const unitPrice = Math.round(props.order.amount / Math.max(1, props.order.itemCount) - 120 / Math.max(1, props.order.itemCount))
  return [{
    name: props.order.cartTag.label === '服飾專區' ? '韓版寬鬆連帽外套（米白）' : '示意商品',
    spec: props.order.cartTag.label === '服飾專區' ? '尺寸 M / 米白色內裡' : '預設規格',
    source: sourceLabel.value,
    price: unitPrice,
    qty: props.order.itemCount,
  }]
})
const subtotal = computed(() => productRows.value.reduce((sum, r) => sum + r.price * r.qty, 0))
const shippingFee = 120
const total = computed(() => subtotal.value + shippingFee)

/** 付款狀態 inline 編輯：點筆 icon → Select 模式；按打勾 commit 回 Tag 模式 */
const paymentStatusOptions = [
  { label: '已付款', value: 'paid' },
  { label: '待付款', value: 'unpaid' },
]
const editingPayment = ref(false)
const editPaymentValue = ref<'paid' | 'unpaid'>(props.order.paymentStatus)
// 切換不同訂單時同步初始值
watch(() => props.order.id, () => {
  editPaymentValue.value = props.order.paymentStatus
  editingPayment.value = false
})
function commitPayment(): void {
  // prototype 直接寫回 props.order；接後端時改 emit('update' ...)
  props.order.paymentStatus = editPaymentValue.value
  editingPayment.value = false
}

/** 狀態切換 Dialog：依目前出貨狀態推下一階段，按「確定切換」commit */
const STATUS_FLOW: Array<{ key: OrderRow['shippingStatus']; label: string }> = [
  { key: 'pending',          label: '待出貨' },
  { key: 'preparing',        label: '備貨中' },
  { key: 'shipping',         label: '已出貨' },
  { key: 'arrived',          label: '已送達' },
  { key: 'completed',        label: '已完成' },
]
const statusSwitchDialogVisible = ref(false)
const currentStatusLabel = computed(() => STATUS_FLOW.find(s => s.key === props.order.shippingStatus)?.label ?? '')
const nextStatusInfo = computed(() => {
  const idx = STATUS_FLOW.findIndex(s => s.key === props.order.shippingStatus)
  if (idx < 0 || idx >= STATUS_FLOW.length - 1) return null
  return STATUS_FLOW[idx + 1]
})
function openStatusSwitchDialog(): void {
  if (!nextStatusInfo.value) return
  statusSwitchDialogVisible.value = true
}
function confirmStatusSwitch(): void {
  if (!nextStatusInfo.value) return
  props.order.shippingStatus = nextStatusInfo.value.key
  statusSwitchDialogVisible.value = false
}

/** 設定配送 Dialog：選物流商 → 自動帶物流方式 → 可選擇取號 */
const shippingConfigDialogVisible = ref(false)
interface CarrierOption { label: string; value: string; method: string; trackingPrefix: string }
const carrierOptions: CarrierOption[] = [
  { label: '7-11 交貨便',   value: 'cvs711',  method: '超商取貨', trackingPrefix: 'CVS711' },
  { label: '全家常溫',      value: 'fm',      method: '超商取貨', trackingPrefix: 'FM'     },
  { label: '黑貓宅急便',    value: 'tcat',    method: '常溫宅配', trackingPrefix: 'TCAT'   },
  { label: '新竹物流',      value: 'hct',     method: '常溫宅配', trackingPrefix: 'HCT'    },
  { label: '嘉里大榮',      value: 'kerry',   method: '常溫宅配', trackingPrefix: 'KERRY'  },
]
const selectedCarrier = ref<string>('')
const trackingNoInput = ref<string>('')
const selectedCarrierOption = computed<CarrierOption | undefined>(() =>
  carrierOptions.find(c => c.value === selectedCarrier.value),
)
const selectedCarrierMethod = computed<string>(() => selectedCarrierOption.value?.method ?? '')
function openShippingConfigDialog(): void {
  // 開啟時帶入既有設定（已設定過就不要清空）
  selectedCarrier.value = carrierOptions.find(c => c.label === props.order.carrierName)?.value ?? ''
  trackingNoInput.value = props.order.trackingStatus ?? ''
  shippingConfigDialogVisible.value = true
}
/** 取號格式：{prefix}-{YYMMDD}-{3 碼隨機} 例如 HCT-260630-991；產生後跳 toast 提示 */
function generateTrackingNo(): void {
  const opt = selectedCarrierOption.value
  if (!opt) return
  const d = new Date()
  const yy = String(d.getFullYear() % 100).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  const no = `${opt.trackingPrefix}-${yy}${mm}${dd}-${rand}`
  trackingNoInput.value = no
  toast.add({ severity: 'info', summary: `已產生取號：${no}`, life: 2000, closable: true })
}
function confirmShippingConfig(): void {
  const opt = selectedCarrierOption.value
  if (!opt) return
  props.order.carrierStatus = 'configured'
  props.order.carrierName = opt.label
  props.order.trackingStatus = trackingNoInput.value || null
  shippingConfigDialogVisible.value = false
}
</script>

<template>
  <div class="flex flex-col gap-4 p-4 bg-[var(--p-content-hover-background)]">
    <!-- 上方 4 卡 grid：手機 1 欄、桌機 4 欄 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
      <!-- 配送資訊 -->
      <div class="rounded-[8px] border border-[var(--p-content-border-color)] bg-[var(--p-content-background)] p-4 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-[14px] font-bold text-[var(--p-text-color)]">配送資訊</span>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold leading-none"
            :style="{ background: shippingBadge.bg, color: shippingBadge.color }">{{ shippingBadge.label }}</span>
        </div>
        <div class="flex items-center gap-1.5 text-[13px] text-[var(--p-text-color)]">
          <i class="pi pi-truck" style="font-size: 13px; color: var(--p-text-muted-color)"></i>
          {{ order.shippingMethod }}
        </div>
        <div class="flex items-start gap-1.5 text-[13px] text-[var(--p-text-color)]">
          <i class="pi pi-map-marker mt-0.5" style="font-size: 13px; color: var(--p-text-muted-color)"></i>
          <div class="flex flex-col gap-0.5">
            <span>{{ order.buyerName }} / {{ order.buyerPhone }}</span>
            <span class="text-[12px] text-[var(--p-text-muted-color)]">台北市中山區南京東路二段50號</span>
          </div>
        </div>
      </div>

      <!-- 訂單來源 -->
      <div class="rounded-[8px] border border-[var(--p-content-border-color)] bg-[var(--p-content-background)] p-4 flex flex-col gap-2">
        <span class="text-[14px] font-bold text-[var(--p-text-color)]">訂單來源</span>
        <div class="flex items-center justify-between text-[13px]">
          <span class="text-[var(--p-text-muted-color)]">訂單來源</span>
          <span class="font-medium text-[var(--p-text-color)]">{{ sourceLabel }}</span>
        </div>
        <div class="flex items-center justify-between text-[13px]">
          <span class="text-[var(--p-text-muted-color)]">社群平台</span>
          <span class="text-[var(--p-text-color)]">{{ socialLabel }}</span>
        </div>
        <div class="flex items-center justify-between text-[13px]">
          <span class="text-[var(--p-text-muted-color)]">多購物車</span>
          <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11.5px] font-semibold leading-none"
            :style="{ background: order.cartTag.bg, color: order.cartTag.color }">{{ cartLabel }}</span>
        </div>
        <div class="flex items-center justify-between text-[13px]">
          <span class="text-[var(--p-text-muted-color)]">場次名稱</span>
          <span class="text-[var(--p-text-color)]">{{ sessionLabel }}</span>
        </div>
      </div>

      <!-- 付款方式 -->
      <div class="rounded-[8px] border border-[var(--p-content-border-color)] bg-[var(--p-content-background)] p-4 flex flex-col gap-2">
        <span class="text-[14px] font-bold text-[var(--p-text-color)]">付款方式</span>
        <div class="flex items-center justify-between text-[13px]">
          <span class="text-[var(--p-text-muted-color)]">付款狀態</span>
          <!-- 編輯模式：Select + 打勾 commit；檢視模式：Tag + 筆 進入編輯 -->
          <span v-if="editingPayment" class="inline-flex items-center gap-1">
            <Select
              v-model="editPaymentValue"
              :options="paymentStatusOptions"
              option-label="label"
              option-value="value"
              size="small"
              class="!w-[100px]"
            />
            <button
              v-tooltip.top="'確認'"
              class="size-[28px] flex items-center justify-center rounded text-[var(--p-primary-color)] hover:bg-[var(--p-primary-50)]"
              @click="commitPayment"
            >
              <i class="pi pi-check" style="font-size: 13px"></i>
            </button>
          </span>
          <span v-else class="inline-flex items-center gap-1">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold leading-none"
              :style="order.paymentStatus === 'paid'
                ? { background: '#dcfce7', color: '#16a34a' }
                : { background: '#ffedd5', color: '#c2410c' }">{{ order.paymentStatus === 'paid' ? '已付款' : '待付款' }}</span>
            <button
              v-tooltip.top="'編輯'"
              class="size-[20px] flex items-center justify-center rounded text-[var(--p-text-muted-color)] hover:bg-[var(--p-content-hover-background)]"
              @click="editingPayment = true"
            >
              <i class="pi pi-pencil" style="font-size: 11px"></i>
            </button>
          </span>
        </div>
        <div class="flex items-center justify-between text-[13px]">
          <span class="text-[var(--p-text-muted-color)]">付款方式</span>
          <span class="text-[var(--p-text-color)]">信用卡一次付清</span>
        </div>
        <div class="flex items-center justify-between text-[13px]">
          <span class="text-[var(--p-text-muted-color)]">應付金額</span>
          <span class="font-bold text-[var(--p-primary-color)]">${{ order.amount.toLocaleString() }}</span>
        </div>
      </div>

      <!-- 發票資訊 -->
      <div class="rounded-[8px] border border-[var(--p-content-border-color)] bg-[var(--p-content-background)] p-4 flex flex-col gap-2">
        <span class="text-[14px] font-bold text-[var(--p-text-color)]">發票資訊</span>
        <div class="flex items-center gap-1.5 text-[13px] text-[var(--p-text-color)]">
          <i class="pi pi-id-card" style="font-size: 13px; color: var(--p-text-muted-color)"></i>
          電子發票（會員載具）
        </div>
      </div>
    </div>

    <!-- 出貨管理 -->
    <div class="rounded-[8px] border border-[var(--p-content-border-color)] bg-[var(--p-content-background)] p-4 flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <i class="pi pi-clipboard" style="color: var(--p-primary-color)"></i>
        <span class="text-[14px] font-bold text-[var(--p-text-color)]">出貨管理</span>
      </div>
      <!-- 動作按鈕列 -->
      <div class="flex items-center gap-2 flex-wrap">
        <Button label="設定配送" icon="pi pi-cog" size="small" @click="openShippingConfigDialog" />
        <Button
          label="狀態切換"
          icon="pi pi-sync"
          severity="secondary"
          variant="outlined"
          size="small"
          :disabled="!nextStatusInfo"
          @click="openStatusSwitchDialog"
        />
        <Button label="分批出貨" icon="pi pi-th-large" severity="secondary" variant="outlined" size="small" />
        <Button label="列印出貨單" icon="pi pi-print" severity="secondary" variant="outlined" size="small" />
        <Button label="列印標籤" icon="pi pi-tag" severity="secondary" variant="outlined" size="small" />
        <Button label="開立發票" icon="pi pi-file" severity="secondary" variant="outlined" size="small" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 左：配送物流 + 發票狀態 + 出貨進度 -->
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2 text-[13px]">
            <span class="text-[var(--p-text-muted-color)] w-[80px] shrink-0">配送物流</span>
            <!-- 已設定：truck + 物流商 · 取號 N；未設定：警示 -->
            <span v-if="order.carrierStatus === 'configured'" class="inline-flex items-center gap-1.5 text-[var(--p-text-color)]">
              <i class="pi pi-truck text-[var(--p-primary-color)]" style="font-size: 13px"></i>
              <span class="font-medium">{{ order.carrierName }}</span>
              <template v-if="order.trackingStatus">
                <span class="text-[var(--p-text-muted-color)]">·</span>
                <span>取號 {{ order.trackingStatus }}</span>
              </template>
            </span>
            <span v-else class="inline-flex items-center gap-1 text-[#f97316]">
              <i class="pi pi-exclamation-circle" style="font-size: 13px"></i>
              尚未指定物流商與取號
            </span>
          </div>
          <div class="flex items-center gap-2 text-[13px]">
            <span class="text-[var(--p-text-muted-color)] w-[80px] shrink-0">發票</span>
            <span class="inline-flex items-center gap-1 text-[#f97316]">
              <i class="pi pi-exclamation-circle" style="font-size: 13px"></i>
              尚未開立
            </span>
          </div>

          <!-- 出貨進度 5 階段（水平 dot + connector） -->
          <div class="flex flex-col gap-2 mt-2">
            <span class="text-[12px] text-[var(--p-text-muted-color)] text-center">出貨進度</span>
            <div class="flex items-start gap-0">
              <template v-for="(s, i) in progressSteps" :key="s.key">
                <!-- 步驟點 -->
                <div class="flex flex-col items-center gap-1 shrink-0" style="width: 60px">
                  <span
                    class="rounded-full inline-flex items-center justify-center"
                    :style="{
                      width: s.isCurrent ? '32px' : '24px',
                      height: s.isCurrent ? '32px' : '24px',
                      background: s.isCurrent ? 'var(--p-primary-color)' : (s.isPast ? 'var(--p-primary-color)' : 'var(--p-content-hover-background)'),
                      color: s.isCurrent || s.isPast ? '#fff' : 'var(--p-text-muted-color)',
                      border: s.isCurrent || s.isPast ? 'none' : '1px solid var(--p-content-border-color)',
                    }"
                  >
                    <i :class="i === 0 ? 'pi pi-clock' : i === 1 ? 'pi pi-box' : i === 2 ? 'pi pi-truck' : i === 3 ? 'pi pi-map-marker' : 'pi pi-check-circle'" style="font-size: 12px"></i>
                  </span>
                  <span class="text-[11px]" :style="s.isCurrent ? 'color: var(--p-primary-color); font-weight: 600' : 'color: var(--p-text-muted-color)'">{{ s.label }}</span>
                  <span class="text-[10px] text-[var(--p-text-muted-color)]">{{ s.time }}</span>
                </div>
                <!-- 連接線 -->
                <span v-if="i < progressSteps.length - 1" class="h-px flex-1 mt-3" :style="s.isPast ? 'background: var(--p-primary-color)' : 'background: var(--p-content-border-color)'"></span>
              </template>
            </div>
          </div>
        </div>

        <!-- 右：出貨單備註 -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span class="text-[13px] text-[var(--p-text-color)]">出貨單備註</span>
            <label class="flex items-center gap-1.5 text-[12px] text-[var(--p-text-muted-color)] cursor-pointer">
              <Checkbox binary />
              <span>同步顯示於出貨單</span>
            </label>
          </div>
          <Textarea placeholder="輸入出貨相關備註...（將同步顯示於出貨單）" rows="5" class="w-full resize-none" />
        </div>
      </div>
    </div>

    <!-- 商品明細 -->
    <div class="rounded-[8px] border border-[var(--p-content-border-color)] bg-[var(--p-content-background)] p-4 flex flex-col gap-3">
      <span class="text-[14px] font-bold text-[var(--p-text-color)]">商品明細</span>
      <DataTable :value="productRows" class="w-full"
        :pt="{ column: { headerCell: { style: 'white-space: nowrap;' } } }">
        <Column header="商品名稱" field="name" />
        <Column header="規格" field="spec" />
        <Column header="訂單來源" field="source" />
        <Column header="單價" body-class="text-right" header-class="text-right">
          <template #body="{ data }">${{ data.price.toLocaleString() }}</template>
        </Column>
        <Column header="數量" body-class="text-right" header-class="text-right">
          <template #body="{ data }">×{{ data.qty }}</template>
        </Column>
        <Column header="小計" body-class="text-right" header-class="text-right">
          <template #body="{ data }">
            <span class="font-bold">${{ (data.price * data.qty).toLocaleString() }}</span>
          </template>
        </Column>
      </DataTable>

      <div class="flex items-start justify-between gap-4 pt-3 border-t border-[var(--p-content-border-color)]">
        <div class="flex-1 flex flex-col gap-1">
          <span class="text-[13px] text-[var(--p-text-color)]">用戶備註</span>
          <span class="text-[12px] text-[var(--p-text-muted-color)]">客人未填寫備註</span>
        </div>
        <div class="flex flex-col gap-1 text-[13px] min-w-[180px]">
          <div class="flex items-center justify-between">
            <span class="text-[var(--p-text-muted-color)]">商品總額</span>
            <span class="text-[var(--p-text-color)]">${{ subtotal.toLocaleString() }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[var(--p-text-muted-color)]">運費</span>
            <span class="text-[var(--p-text-color)]">+${{ shippingFee }}</span>
          </div>
          <div class="flex items-center justify-between pt-1.5 border-t border-[var(--p-content-border-color)]">
            <span class="font-medium text-[var(--p-text-color)]">訂單總計</span>
            <span class="text-[16px] font-bold text-[var(--p-primary-color)]">${{ total.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 狀態切換確認彈窗：跟「設定配送」一致的 #header slot 樣式 -->
    <Dialog
      v-model:visible="statusSwitchDialogVisible"
      modal
      :draggable="false"
      :style="{ width: 'min(420px, calc(100vw - 32px))' }"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div class="size-[40px] shrink-0 rounded-full bg-[var(--p-primary-50)] flex items-center justify-center">
            <i class="pi pi-truck text-[var(--p-primary-color)]" style="font-size: 18px"></i>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-[15px] font-bold text-[var(--p-text-color)]">切換產品貨態</span>
            <span class="text-[12px] text-[var(--p-text-muted-color)]">訂單 {{ order.orderNo }} · {{ order.buyerName }}</span>
          </div>
        </div>
      </template>
      <p class="text-[14px] text-[var(--p-text-color)] leading-snug">
        確定要將產品貨態由「{{ currentStatusLabel }}」切換為「{{ nextStatusInfo?.label ?? '' }}」嗎？
      </p>
      <template #footer>
        <Button label="取消" severity="secondary" variant="outlined" @click="statusSwitchDialogVisible = false" />
        <Button label="確定切換" @click="confirmStatusSwitch" />
      </template>
    </Dialog>

    <!-- 設定配送 Dialog -->
    <Dialog
      v-model:visible="shippingConfigDialogVisible"
      modal
      :draggable="false"
      :style="{ width: 'min(560px, calc(100vw - 32px))' }"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div class="size-[40px] shrink-0 rounded-full bg-[var(--p-primary-50)] flex items-center justify-center">
            <i class="pi pi-truck text-[var(--p-primary-color)]" style="font-size: 18px"></i>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-[15px] font-bold text-[var(--p-text-color)]">配送設定</span>
            <span class="text-[12px] text-[var(--p-text-muted-color)]">訂單 {{ order.orderNo }} · {{ order.buyerName }}</span>
          </div>
        </div>
      </template>

      <div class="flex flex-col gap-4">
        <!-- 物流商選擇（必填） -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[13px] font-medium text-[var(--p-text-color)]">
            選擇已啟用物流商 <span class="text-[#dc2626]">*</span>
          </label>
          <Select
            v-model="selectedCarrier"
            :options="carrierOptions"
            option-label="label"
            option-value="value"
            placeholder="請選擇已啟用物流商..."
            class="w-full"
          />
        </div>

        <!-- 物流方式（依物流商自動帶入） -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[13px] font-medium text-[var(--p-text-color)]">採用的物流方式</label>
          <InputText
            :model-value="selectedCarrierMethod"
            placeholder="↑ 選擇物流商後自動帶入"
            class="w-full"
            disabled
          />
        </div>

        <!-- 物流取號（選填） -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[13px] font-medium text-[var(--p-text-color)]">
            物流取號 <span class="text-[12px] text-[var(--p-text-muted-color)]">（選填）</span>
          </label>
          <div class="flex items-stretch gap-2">
            <InputText
              v-model="trackingNoInput"
              placeholder="先選擇物流，可稍後再取號"
              class="flex-1"
              :disabled="!selectedCarrier"
            />
            <Button
              label="取號"
              icon="pi pi-hashtag"
              severity="contrast"
              :disabled="!selectedCarrier"
              @click="generateTrackingNo"
            />
          </div>
          <span class="text-[12px] text-[var(--p-text-muted-color)]">可自動產生取號或手動輸入取號編碼</span>
        </div>
      </div>

      <template #footer>
        <Button label="取消" severity="secondary" variant="outlined" @click="shippingConfigDialogVisible = false" />
        <Button label="確認" :disabled="!selectedCarrier" @click="confirmShippingConfig" />
      </template>
    </Dialog>
  </div>
</template>
