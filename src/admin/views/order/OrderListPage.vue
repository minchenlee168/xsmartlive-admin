<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import OrderRowDetail from './components/OrderRowDetail.vue'

/**
 * 訂單管理 → 訂單列表頁。
 *
 * 排版：頁首（標題 + 副標 + 右側 4 顆批次操作鈕）置於 Card 外；篩選列、進階篩選、
 * 快速篩選 chips 與訂單 table 全部裝進一張 Card。
 *
 * 欄位：建立時間 / 購物車 + 訂單編號 / 訂購人 / 金額 / 商品數量 /
 * 出貨方式 / 付款狀態 / 出貨狀態 / 物流商資訊 / 取號狀態 / 操作。
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
  /** 已設定的物流商顯示名稱（配送設定 confirm 後寫入） */
  carrierName?: string
  /** 進階篩選欄位（不顯示在表格內，僅參與篩選） */
  orderSource: 'live' | 'shop'
  socialPlatform?: 'facebook' | 'line' | 'instagram' | 'tiktok' | 'other'
  multiCart: 'default' | 'main' | 'ice' | 'ice_grocery'
  sessionName?: 'session_0620' | 'session_0622' | 'session_0624' | 'session_0625'
}

// 篩選欄位「草稿」狀態：使用者調整 UI 控件即時更新；只有按下「搜尋」才會 commit 到 applied。
const keyword = ref('')
/** 日期區間：PrimeVue DatePicker range 模式 — 初始 null（不可為 [null, null]，否則內部會在 null.getFullYear() 噴錯）。 */
const dateRange = ref<Date[] | null>(null)

interface FilterOption { label: string; value: string }
const shippingMethodOptions: FilterOption[] = [
  { label: '宅配',     value: 'home' },
  { label: '超商配送', value: 'cvs' },
  { label: '自取',     value: 'pickup' },
]
const paymentStatusOptions: FilterOption[] = [
  { label: '已付款', value: 'paid' },
  { label: '待付款', value: 'unpaid' },
]
const shippingStatusOptions: FilterOption[] = [
  { label: '待出貨', value: 'pending' },
  { label: '備貨中', value: 'preparing' },
  { label: '出貨中', value: 'shipping' },
  { label: '待收貨', value: 'awaiting_receipt' },
  { label: '已送達', value: 'arrived' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]
const carrierOptions: FilterOption[] = [
  { label: '7-11 B2C 冷凍到府收件',       value: 'cvs711_b2c_cold' },
  { label: '7-11 B2C 到府收件',            value: 'cvs711_b2c_normal' },
  { label: '7-11 交貨便（門市寄件）',      value: 'cvs711_handover' },
  { label: 'Presco 跨境物流（宅配）',      value: 'presco_home' },
  { label: 'Presco 跨境物流（超商取貨）',  value: 'presco_cvs' },
  { label: '全家冷凍到府收件',             value: 'fm_cold_home' },
  { label: '全家常溫',                     value: 'fm_normal' },
  { label: '嘉里大榮低溫',                 value: 'kerry_cold' },
  { label: '嘉里大榮常溫',                 value: 'kerry_normal' },
  { label: '新竹物流',                     value: 'hct' },
  { label: '郵局（商家自建）',             value: 'post_self' },
  { label: '黑貓宅急便',                   value: 'tcat' },
  { label: '黑貓宅急便（門市寄件）',       value: 'tcat_handover' },
  { label: '未分類',                       value: 'uncategorized' },
]
const paymentMethodOptions: FilterOption[] = [
  { label: '信用卡一次付清', value: 'credit_once' },
  { label: 'ATM 轉帳',       value: 'atm' },
  { label: '轉帳匯款',       value: 'transfer' },
  { label: '貨到付款',       value: 'cod' },
  { label: 'LINE Pay',       value: 'line_pay' },
  { label: 'Apple Pay',      value: 'apple_pay' },
  { label: 'iPASS MONEY',    value: 'ipass' },
  { label: '超商代碼',       value: 'cvs_code' },
  { label: '數位簽',         value: 'digital_sign' },
]
const trackingStatusOptions: FilterOption[] = [
  { label: '已取號', value: 'taken' },
  { label: '未取號', value: 'untaken' },
]
const channelOptions: FilterOption[] = [
  { label: '全部',         value: '' },
  { label: '商城',         value: 'shop' },
  { label: 'Facebook',     value: 'facebook' },
  { label: 'LINE',         value: 'line' },
  { label: 'Instagram',    value: 'instagram' },
  { label: 'YouTube Live', value: 'youtube' },
  { label: '蝦皮',         value: 'shopee' },
  { label: 'PChome',       value: 'pchome' },
]
const orderSourceOptions: FilterOption[] = [
  { label: '直播', value: 'live' },
  { label: '商城', value: 'shop' },
]
const socialPlatformOptions: FilterOption[] = [
  { label: 'Facebook',  value: 'facebook' },
  { label: 'LINE',      value: 'line' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'TikTok',    value: 'tiktok' },
  { label: '其他',      value: 'other' },
]
const multiCartOptions: FilterOption[] = [
  { label: '預設購物車',          value: 'default' },
  { label: '主購物車',            value: 'main' },
  { label: '冰品專區',            value: 'ice' },
  { label: '冰品專區 / 生活雜貨', value: 'ice_grocery' },
]
const sessionNameOptions: FilterOption[] = [
  { label: '6/20 開箱直播',     value: 'session_0620' },
  { label: '6/22 美妝直播',     value: 'session_0622' },
  { label: '6/24 晚間生鮮直播', value: 'session_0624' },
  { label: '6/25 服飾團',       value: 'session_0625' },
]
/** 精準欄位篩選：使用者選欄位 + 輸入文字，按搜尋後做精準（或包含）比對 */
const precisionFieldOptions: FilterOption[] = [
  { label: 'Facebook ID 或 Livebuy ID', value: 'liveId' },
  { label: '訂購人姓名',     value: 'buyerName' },
  { label: '收件人姓名',     value: 'receiverName' },
  { label: '物流寄件編號',   value: 'trackingNo' },
  { label: '電話',           value: 'phone' },
  { label: '商家匯款末五碼', value: 'remitLast5' },
  { label: '結帳編號',       value: 'orderNo' },
]

const filterShipping = ref('')
const filterPayment = ref('')
const filterShippingStatus = ref('')
const filterCarrier = ref('')
const filterPaymentMethod = ref('')
const filterTracking = ref('')
const filterChannel = ref('')
const filterOrderSource = ref('')
const filterSocialPlatform = ref('')
const filterMultiCart = ref('')
const filterSessionName = ref('')
/** 精準欄位篩選：選哪個欄位 + 輸入要比對的值 */
const filterPrecisionField = ref<string>('buyerName')
const filterPrecisionValue = ref<string>('')
/** placeholder 隨選擇欄位變動：精準比對「XXX」欄位 */
const precisionPlaceholder = computed<string>(() => {
  const opt = precisionFieldOptions.find(o => o.value === filterPrecisionField.value)
  return opt ? `精準比對「${opt.label}」欄位` : ''
})

/** 進階篩選收摺：預設收起，點 toggle button 才展開（11 個 Select 太占空間） */
const advancedFilterExpanded = ref(false)
/** 顯示已套用的進階篩選數量，提示使用者「進階篩選 (N)」 */
const appliedAdvancedCount = computed<number>(() => {
  return [
    filterShipping.value, filterPayment.value, filterShippingStatus.value,
    filterCarrier.value, filterPaymentMethod.value, filterTracking.value, filterChannel.value,
    filterOrderSource.value, filterSocialPlatform.value, filterMultiCart.value, filterSessionName.value,
    filterPrecisionValue.value.trim(),
  ].filter(Boolean).length
})
/** 一鍵清除所有進階篩選 Select 的值（不影響 keyword / 日期 / quick filter） */
function clearAdvancedFilters(): void {
  filterShipping.value = ''
  filterPayment.value = ''
  filterShippingStatus.value = ''
  filterCarrier.value = ''
  filterPaymentMethod.value = ''
  filterTracking.value = ''
  filterChannel.value = ''
  filterOrderSource.value = ''
  filterSocialPlatform.value = ''
  filterMultiCart.value = ''
  filterSessionName.value = ''
  filterPrecisionValue.value = ''
}

type QuickFilter = 'all' | 'pending' | 'preparing' | 'shipping' | 'arrived' | 'paid' | 'unpaid'
const quickFilter = ref<QuickFilter>('all')
const quickFilters: Array<{ value: QuickFilter; label: string }> = [
  { value: 'all',       label: '全部' },
  { value: 'pending',   label: '待出貨' },
  { value: 'preparing', label: '備貨中' },
  { value: 'shipping',  label: '出貨中' },
  { value: 'arrived',   label: '待收貨' },
  { value: 'paid',      label: '已付款' },
  { value: 'unpaid',    label: '待付款' },
]

// 篩選「已套用」狀態：computed 過濾依此計算。按下「搜尋」才會把草稿值寫進來。
interface AppliedFilter {
  keyword: string
  payment: string
  shippingStatus: string
  quickFilter: QuickFilter
  orderSource: string
  socialPlatform: string
  multiCart: string
  sessionName: string
  precisionField: string
  precisionValue: string
}
const applied = ref<AppliedFilter>({
  keyword: '',
  payment: '',
  shippingStatus: '',
  quickFilter: 'all',
  orderSource: '',
  socialPlatform: '',
  multiCart: '',
  sessionName: '',
  precisionField: '',
  precisionValue: '',
})
function onApplyFilters(): void {
  applied.value = {
    keyword: keyword.value,
    payment: filterPayment.value,
    shippingStatus: filterShippingStatus.value,
    quickFilter: quickFilter.value,
    orderSource: filterOrderSource.value,
    socialPlatform: filterSocialPlatform.value,
    multiCart: filterMultiCart.value,
    sessionName: filterSessionName.value,
    precisionField: filterPrecisionField.value,
    precisionValue: filterPrecisionValue.value.trim(),
  }
}

const CART_TAGS: Record<string, { bg: string; color: string }> = {
  '服飾專區': { bg: '#f2ebff', color: '#7008e7' },
  '生活雜貨': { bg: '#dcfce7', color: '#16a34a' },
  '美食專區': { bg: '#fef3c7', color: '#b45309' },
}
function tagFor(name: string) {
  return { label: name, ...(CART_TAGS[name] ?? { bg: '#f1f5f9', color: '#64748b' }) }
}

const orders = ref<OrderRow[]>([
  { id: '1', createdAt: '2026-05-10 10:20', cartTag: tagFor('服飾專區'), orderNo: 'A20260510101', buyerName: '楊雅雯', buyerPhone: '0925-111-222', amount: 1400, itemCount: 1, shippingMethod: '常溫宅配', paymentStatus: 'paid',   shippingStatus: 'pending', carrierStatus: 'unconfigured', trackingStatus: null, orderSource: 'live', socialPlatform: 'facebook',  multiCart: 'default',     sessionName: 'session_0620' },
  { id: '2', createdAt: '2026-05-10 15:45', cartTag: tagFor('生活雜貨'), orderNo: 'A20260510102', buyerName: '楊雅雯', buyerPhone: '0925-111-222', amount:  405, itemCount: 3, shippingMethod: '常溫宅配', paymentStatus: 'paid',   shippingStatus: 'pending', carrierStatus: 'unconfigured', trackingStatus: null, orderSource: 'shop',                              multiCart: 'ice_grocery'                              },
  { id: '3', createdAt: '2026-05-10 11:30', cartTag: tagFor('服飾專區'), orderNo: 'A20260510103', buyerName: '蔡明宏', buyerPhone: '0936-333-444', amount: 1300, itemCount: 2, shippingMethod: '常溫宅配', paymentStatus: 'unpaid', shippingStatus: 'pending', carrierStatus: 'unconfigured', trackingStatus: null, orderSource: 'live', socialPlatform: 'line',      multiCart: 'main',        sessionName: 'session_0622' },
  { id: '4', createdAt: '2026-05-11 09:00', cartTag: tagFor('服飾專區'), orderNo: 'A20260511101', buyerName: '何併併', buyerPhone: '0912-345-678', amount:  510, itemCount: 1, shippingMethod: '常溫宅配', paymentStatus: 'paid',   shippingStatus: 'pending', carrierStatus: 'unconfigured', trackingStatus: null, orderSource: 'live', socialPlatform: 'instagram', multiCart: 'default',     sessionName: 'session_0624' },
  { id: '5', createdAt: '2026-05-11 10:30', cartTag: tagFor('服飾專區'), orderNo: 'A20260511102', buyerName: '何併併', buyerPhone: '0912-345-678', amount: 1250, itemCount: 1, shippingMethod: '常溫宅配', paymentStatus: 'paid',   shippingStatus: 'pending', carrierStatus: 'unconfigured', trackingStatus: null, orderSource: 'shop',                              multiCart: 'main'                                     },
  { id: '6', createdAt: '2026-05-11 13:15', cartTag: tagFor('服飾專區'), orderNo: 'A20260511103', buyerName: '何併併', buyerPhone: '0912-345-678', amount: 1250, itemCount: 2, shippingMethod: '常溫宅配', paymentStatus: 'paid',   shippingStatus: 'pending', carrierStatus: 'unconfigured', trackingStatus: null, orderSource: 'live', socialPlatform: 'tiktok',    multiCart: 'ice',         sessionName: 'session_0625' },
])

/** 全站合計 85 筆（圖中右上的總數）— 顯示用，篩選後仍顯示原始總數。 */
const TOTAL_ORDERS = 85

const filtered = computed<OrderRow[]>(() => {
  let list = orders.value
  const a = applied.value
  if (a.keyword.trim()) {
    const k = a.keyword.trim().toLowerCase()
    list = list.filter(o => o.orderNo.toLowerCase().includes(k) || o.buyerName.toLowerCase().includes(k))
  }
  if (a.payment) list = list.filter(o => o.paymentStatus === a.payment)
  if (a.shippingStatus) list = list.filter(o => o.shippingStatus === a.shippingStatus)
  if (a.orderSource) list = list.filter(o => o.orderSource === a.orderSource)
  if (a.socialPlatform) list = list.filter(o => o.socialPlatform === a.socialPlatform)
  if (a.multiCart) list = list.filter(o => o.multiCart === a.multiCart)
  if (a.sessionName) list = list.filter(o => o.sessionName === a.sessionName)
  if (a.precisionValue) {
    const v = a.precisionValue
    list = list.filter((o) => {
      if (a.precisionField === 'buyerName')   return o.buyerName === v
      if (a.precisionField === 'orderNo')     return o.orderNo === v
      if (a.precisionField === 'phone')       return o.buyerPhone === v
      // 其他欄位（liveId / receiverName / trackingNo / remitLast5）mock 沒對應資料 → 0 筆
      return false
    })
  }
  if (a.quickFilter === 'paid')   list = list.filter(o => o.paymentStatus === 'paid')
  else if (a.quickFilter === 'unpaid') list = list.filter(o => o.paymentStatus === 'unpaid')
  else if (a.quickFilter !== 'all') list = list.filter(o => o.shippingStatus === a.quickFilter)
  return list
})

function statusBadgeForPayment(s: OrderRow['paymentStatus']) {
  return s === 'paid'
    ? { label: '已付款', bg: '#dcfce7', color: '#16a34a' }
    : { label: '待付款', bg: '#ffedd5', color: '#c2410c' }
}
function statusBadgeForShipping(s: OrderRow['shippingStatus']) {
  const map = {
    pending:           { label: '待出貨', bg: '#f1f5f9', color: '#64748b' },
    preparing:         { label: '備貨中', bg: '#dbeafe', color: '#1d4ed8' },
    shipping:          { label: '出貨中', bg: '#fef3c7', color: '#b45309' },
    awaiting_receipt:  { label: '待收貨', bg: '#ede9fe', color: '#6d28d9' },
    arrived:           { label: '已送達', bg: '#dcfce7', color: '#16a34a' },
    completed:         { label: '已完成', bg: '#f1f5f9', color: '#475569' },
    cancelled:         { label: '已取消', bg: '#fee2e2', color: '#dc2626' },
  } as const
  return map[s]
}

function setDateRangePreset(preset: 'today' | 'last7' | 'thisMonth' | 'lastMonth'): void {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)
  if (preset === 'last7') start.setDate(now.getDate() - 6)
  else if (preset === 'thisMonth') start.setDate(1)
  else if (preset === 'lastMonth') {
    start.setMonth(now.getMonth() - 1, 1)
    end.setMonth(now.getMonth(), 0)
  }
  dateRange.value = [start, end]
}

function onCopyOrderNo(no: string): void {
  navigator.clipboard?.writeText(no)
}

/** 「查看更多」彈窗：點眼睛 icon 開 Dialog 顯示 OrderRowDetail */
const detailDialogVisible = ref(false)
const detailDialogOrder = ref<OrderRow | null>(null)
function openDetailDialog(o: OrderRow): void {
  detailDialogOrder.value = o
  detailDialogVisible.value = true
}
// ── Loading 狀態：初始載入 + 手動刷新都會顯示 LoaderSpinner 蓋在表格上 ──
const isLoading = ref(true)
onMounted(() => {
  // 模擬初始載入 1.2 秒
  setTimeout(() => { isLoading.value = false }, 1200)
})
function onRefresh(): void {
  isLoading.value = true
  setTimeout(() => { isLoading.value = false }, 1500)
}

// ── 顯示欄位設定（出貨狀態 badge / 進度條） ─────────
type ShippingDisplayMode = 'badge' | 'progress'
const shippingDisplayMode = ref<ShippingDisplayMode>('badge')
const shippingDisplayOptions: Array<{ label: string; value: ShippingDisplayMode }> = [
  { label: '單一標籤',   value: 'badge' },
  { label: '進度條樣式', value: 'progress' },
]
interface PopoverApi { toggle: (event: Event) => void }
const columnSettingPopoverRef = ref<PopoverApi | null>(null)
function openColumnSetting(event: Event): void {
  columnSettingPopoverRef.value?.toggle(event)
}

/** 出貨狀態進度條 5 階段（待出貨 → 備貨中 → 已出貨 → 已送達 → 已完成）。 */
interface ProgressStep { key: OrderRow['shippingStatus']; label: string }
const PROGRESS_STEPS: ProgressStep[] = [
  { key: 'pending',   label: '待出貨' },
  { key: 'preparing', label: '備貨中' },
  { key: 'shipping',  label: '已出貨' },
  { key: 'arrived',   label: '已送達' },
  { key: 'completed', label: '已完成' },
]
/** 訂單目前在進度條的 index（找不到 → 視為第一階段）。 */
function currentStepIndex(s: OrderRow['shippingStatus']): number {
  const i = PROGRESS_STEPS.findIndex(x => x.key === s)
  return i === -1 ? 0 : i
}
/** 把 PROGRESS_STEPS 變成 Timeline 用的資料：附加 isCurrent / isPast。 */
interface ProgressItem extends ProgressStep { isCurrent: boolean; isPast: boolean }
function progressItemsFor(s: OrderRow['shippingStatus']): ProgressItem[] {
  const idx = currentStepIndex(s)
  return PROGRESS_STEPS.map((step, i) => ({
    ...step,
    isCurrent: i === idx,
    isPast: i < idx,
  }))
}
</script>

<template>
  <div class="flex flex-col gap-4 flex-1 min-h-0">

    <!-- ── 篩選 Card：標題 + 副標 + 右側批次操作 + 搜尋 / 篩選 — shrink-0 鎖內容高度，不隨 viewport 壓縮 ── -->
    <Card
      :pt="{
        root: { class: 'w-full shrink-0 overflow-hidden' },
        body: { class: 'p-0' },
        content: { class: 'p-0' },
      }"
    >
      <template #content>
        <!-- 頁首：標題 + 副標 + 右側批次操作 -->
        <div class="flex items-start justify-between gap-3 px-5 pt-5 pb-2 flex-wrap">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <h1 class="text-[22px] font-bold text-[var(--p-text-color)]">訂單管理</h1>
              <button
                v-tooltip.top="'手動刷新訂單資訊'"
                class="size-[28px] flex items-center justify-center rounded-full hover:bg-[var(--p-primary-50)]"
                style="color: var(--p-primary-color)"
                @click="onRefresh"
              >
                <i class="pi pi-sync" style="font-size: 15px"></i>
              </button>
            </div>
            <p class="text-[13px] text-[var(--p-text-muted-color)]">
              查看與管理所有來自商城與直播的訂單，可篩選狀態、查詢訂單編號或買家姓名。
            </p>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <Button label="批次設定" />
            <Button label="預設配送設定"  severity="warn"      variant="outlined" />
            <Button
              label="顯示欄位"
              icon="pi pi-table"
              severity="secondary"
              variant="outlined"
              aria-haspopup="true"
              aria-controls="column-setting-popover"
              @click="openColumnSetting"
            />
            <Button label="匯出 CSV"      icon="pi pi-upload"  severity="secondary" variant="outlined" />

            <!-- 顯示欄位設定 popover：SelectButton 切換出貨狀態呈現方式 -->
            <Popover ref="columnSettingPopoverRef" id="column-setting-popover">
              <div class="flex flex-col gap-2 w-[220px]">
                <p class="text-[13px] font-semibold text-[var(--p-text-color)]">出貨狀態欄位</p>
                <SelectButton
                  v-model="shippingDisplayMode"
                  :options="shippingDisplayOptions"
                  option-label="label"
                  option-value="value"
                  :allow-empty="false"
                />
              </div>
            </Popover>
          </div>
        </div>

        <!-- 搜尋 + 日期區間 + 快速日期 -->
        <div class="flex items-center gap-3 px-5 py-3 flex-wrap">
          <InputText v-model="keyword" placeholder="搜尋訂單編號 / 買家姓名" class="!w-[260px]" />

          <!-- 日期區間：PrimeVue DatePicker range 模式 -->
          <DatePicker
            v-model="dateRange"
            selection-mode="range"
            show-icon
            date-format="yy/mm/dd"
            placeholder="年 / 月 / 日  至  年 / 月 / 日"
            class="!w-[320px]"
          />

          <div class="flex items-center gap-1.5">
            <Button label="今日"     severity="secondary" variant="outlined" size="small" @click="setDateRangePreset('today')" />
            <Button label="近 7 天"  severity="secondary" variant="outlined" size="small" @click="setDateRangePreset('last7')" />
            <Button label="本月"     severity="secondary" variant="outlined" size="small" @click="setDateRangePreset('thisMonth')" />
            <Button label="上月"     severity="secondary" variant="outlined" size="small" @click="setDateRangePreset('lastMonth')" />
          </div>
        </div>

        <!-- 進階篩選 toggle：預設收摺，點開展開所有 Select；右側「清除」一鍵歸零 -->
        <div class="px-5 py-2 flex items-center gap-3">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 text-[13px] text-[var(--p-text-color)] hover:text-[var(--p-primary-color)]"
            @click="advancedFilterExpanded = !advancedFilterExpanded"
          >
            <span class="font-medium">進階篩選</span>
            <span
              v-if="appliedAdvancedCount > 0"
              class="bg-[var(--p-primary-color)] text-white text-[10px] font-bold leading-none rounded-full min-w-[16px] h-[16px] px-1 inline-flex items-center justify-center"
            >{{ appliedAdvancedCount }}</span>
            <i :class="advancedFilterExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" style="font-size: 11px"></i>
          </button>
          <Button
            v-if="appliedAdvancedCount > 0"
            label="清除"
            icon="pi pi-times"
            severity="secondary"
            variant="text"
            size="small"
            @click="clearAdvancedFilters"
          />
        </div>

        <!-- 進階篩選展開區：11 個 Select + 精準欄位篩選（最後一列） -->
        <div v-if="advancedFilterExpanded" class="flex flex-col gap-2 px-5 pb-3">
          <!-- 既有 Select 群 -->
          <div class="flex items-center gap-2 flex-wrap">
          <Select v-model="filterShipping"      :options="shippingMethodOptions" option-label="label" option-value="value" placeholder="出貨方式" class="!w-[140px]" show-clear />
          <Select v-model="filterPayment"       :options="paymentStatusOptions"  option-label="label" option-value="value" placeholder="付款狀態" class="!w-[140px]" show-clear />
          <Select v-model="filterShippingStatus" :options="shippingStatusOptions" option-label="label" option-value="value" placeholder="出貨狀態" class="!w-[140px]" show-clear />
          <Select v-model="filterCarrier"       :options="carrierOptions"        option-label="label" option-value="value" placeholder="物流商"   class="!w-[140px]" scroll-height="auto" show-clear />
          <Select v-model="filterPaymentMethod" :options="paymentMethodOptions"  option-label="label" option-value="value" placeholder="付款方式" class="!w-[140px]" scroll-height="auto" show-clear />
          <Select v-model="filterTracking"      :options="trackingStatusOptions" option-label="label" option-value="value" placeholder="取號狀態" class="!w-[140px]" show-clear />
          <Select v-model="filterChannel"       :options="channelOptions"        option-label="label" option-value="value" placeholder="購買通路" class="!w-[140px]" show-clear />
          <Select v-model="filterOrderSource"   :options="orderSourceOptions"    option-label="label" option-value="value" placeholder="訂單來源" class="!w-[140px]" show-clear />
          <Select v-model="filterSocialPlatform" :options="socialPlatformOptions" option-label="label" option-value="value" placeholder="社群平台" class="!w-[140px]" show-clear />
          <Select v-model="filterMultiCart"     :options="multiCartOptions"      option-label="label" option-value="value" placeholder="多購物車" class="!w-[140px]" show-clear />
          <Select v-model="filterSessionName"   :options="sessionNameOptions"    option-label="label" option-value="value" placeholder="場次名稱" class="!w-[160px]" show-clear />
          </div>
          <!-- 精準欄位篩選：Select 選欄位 + InputText 輸入要比對的值 -->
          <div class="flex items-stretch gap-2 flex-wrap">
            <Select
              v-model="filterPrecisionField"
              :options="precisionFieldOptions"
              option-label="label"
              option-value="value"
              class="!w-[200px]"
              scroll-height="auto"
            />
            <InputText
              v-model="filterPrecisionValue"
              :placeholder="precisionPlaceholder"
              class="flex-1 min-w-[240px]"
              @keyup.enter="onApplyFilters"
            />
          </div>
        </div>

        <!-- 快速篩選 chips + 搜尋按鈕 + 總筆數 -->
        <div class="flex items-center justify-between gap-3 px-5 py-2 flex-wrap">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-[13px] text-[var(--p-text-muted-color)] shrink-0 mr-1">快速篩選</span>
            <button
              v-for="q in quickFilters"
              :key="q.value"
              class="px-3 py-1.5 rounded-full text-[13px] border transition-colors"
              :style="quickFilter === q.value
                ? 'background: var(--p-primary-50); color: var(--p-primary-color); border-color: var(--p-primary-color)'
                : 'background: var(--p-content-background); color: var(--p-text-muted-color); border-color: var(--p-content-border-color)'"
              @click="quickFilter = q.value"
            >{{ q.label }}</button>
            <!-- 搜尋按鈕：依目前搜尋 Card 內所有篩選條件 commit 到 applied 觸發過濾 -->
            <Button label="搜尋" @click="onApplyFilters" />
          </div>
          <span class="text-[13px] text-[var(--p-text-muted-color)]">
            共 <span class="text-[var(--p-text-color)] font-bold">{{ TOTAL_ORDERS }}</span> 筆訂單
          </span>
        </div>

      </template>
    </Card>

    <!-- ── 表格 Card：橫向卷軸、操作欄固定右側；flex chain 讓 DataTable scrollable 能容納展開內容 ── -->
    <Card
      :pt="{
        root: { class: 'w-full flex-1 min-h-0 flex flex-col overflow-hidden' },
        body: { class: 'p-0 flex-1 min-h-0 flex flex-col' },
        content: { class: 'p-0 flex-1 min-h-0 flex flex-col' },
      }"
    >
      <template #content>
        <div class="p-5 relative flex-1 min-h-0 flex flex-col">
          <!-- Loading 蓋層：用 PrimeVue 標準 ProgressSpinner，不走品牌 logo 動畫 -->
          <div
            v-if="isLoading"
            class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[var(--p-content-background)]/85 backdrop-blur-sm rounded-[8px]"
          >
            <ProgressSpinner style="width: 48px; height: 48px" stroke-width="4" animation-duration=".9s" />
            <span class="text-[13px] text-[var(--p-text-muted-color)]">載入中…</span>
          </div>

          <DataTable
            :value="filtered"
            :striped-rows="true"
            scrollable
            data-key="id"
            class="w-full"
            paginator
            :rows="20"
            :rows-per-page-options="[10, 20, 50, 100]"
            current-page-report-template="{first} - {last} / 共 {totalRecords} 筆"
            paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
            :pt="{
              column: {
                headerCell: { style: 'white-space: nowrap;' },
                bodyCell:   { style: 'white-space: nowrap;' },
              },
            }"
          >
          <Column header="建立時間" field="createdAt">
            <template #body="{ data }">
              <span class="text-[13px] text-[var(--p-text-color)]">{{ data.createdAt }}</span>
            </template>
          </Column>

          <Column header="購物車 / 訂單編號">
            <template #body="{ data }">
              <div class="flex flex-col gap-1">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-md text-[11.5px] font-semibold leading-none w-fit"
                  :style="{ background: data.cartTag.bg, color: data.cartTag.color }"
                >{{ data.cartTag.label }}</span>
                <div class="flex items-center gap-1.5">
                  <span class="text-[13px] font-medium text-[var(--p-text-color)]">{{ data.orderNo }}</span>
                  <button
                    v-tooltip.top="'複製'"
                    class="size-[20px] flex items-center justify-center rounded text-[var(--p-text-muted-color)] hover:bg-[var(--p-content-hover-background)]"
                    @click="onCopyOrderNo(data.orderNo)"
                  >
                    <i class="pi pi-copy" style="font-size: 12px"></i>
                  </button>
                </div>
              </div>
            </template>
          </Column>

          <Column header="訂購人">
            <template #body="{ data }">
              <div class="flex flex-col gap-0.5">
                <span class="text-[13px] text-[var(--p-text-color)]">{{ data.buyerName }}</span>
                <span class="text-[12px] text-[var(--p-text-muted-color)]">{{ data.buyerPhone }}</span>
              </div>
            </template>
          </Column>

          <Column header="金額" field="amount" body-class="text-right" header-class="text-right">
            <template #body="{ data }">
              <span class="text-[14px] font-bold text-[var(--p-primary-color)]">${{ data.amount.toLocaleString() }}</span>
            </template>
          </Column>

          <Column header="商品數量" field="itemCount" body-class="text-right" header-class="text-right">
            <template #body="{ data }">
              <span class="text-[13px] text-[var(--p-text-color)]">{{ data.itemCount }}</span>
            </template>
          </Column>

          <Column header="出貨方式">
            <template #body="{ data }">
              <span class="inline-flex items-center gap-1.5 text-[13px] text-[var(--p-text-color)]">
                <i class="pi pi-truck" style="font-size: 13px; color: var(--p-text-muted-color)"></i>
                {{ data.shippingMethod }}
              </span>
            </template>
          </Column>

          <Column header="付款狀態">
            <template #body="{ data }">
              <span
                class="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold leading-none"
                :style="{ background: statusBadgeForPayment(data.paymentStatus).bg, color: statusBadgeForPayment(data.paymentStatus).color }"
              >{{ statusBadgeForPayment(data.paymentStatus).label }}</span>
            </template>
          </Column>

          <Column header="出貨狀態">
            <template #body="{ data }">
              <!-- 模式 A：單一標籤 -->
              <span
                v-if="shippingDisplayMode === 'badge'"
                class="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold leading-none"
                :style="{ background: statusBadgeForShipping(data.shippingStatus).bg, color: statusBadgeForShipping(data.shippingStatus).color }"
              >{{ statusBadgeForShipping(data.shippingStatus).label }}</span>
              <!-- 模式 B：PrimeVue Timeline 顯示 5 階段，水平排列，目前階段主色加粗 -->
              <Timeline
                v-else
                :value="progressItemsFor(data.shippingStatus)"
                layout="horizontal"
                align="top"
                class="order-shipping-timeline min-w-[260px]"
              >
                <template #marker="{ item }">
                  <span
                    class="rounded-full shrink-0"
                    :style="{
                      width: item.isCurrent ? '12px' : '8px',
                      height: item.isCurrent ? '12px' : '8px',
                      background: item.isCurrent ? 'var(--p-primary-color)' : 'var(--p-content-border-color)',
                    }"
                  ></span>
                </template>
                <template #content="{ item }">
                  <span
                    class="text-[11px] whitespace-nowrap pt-1.5 pr-2"
                    :style="item.isCurrent
                      ? 'color: var(--p-primary-color); font-weight: 600'
                      : 'color: var(--p-text-muted-color)'"
                  >{{ item.label }}</span>
                </template>
                <template #connector>
                  <span class="block h-px w-full" style="background: var(--p-content-border-color)"></span>
                </template>
              </Timeline>
            </template>
          </Column>

          <Column header="物流商資訊">
            <template #body>
              <Button label="設定配送" icon="pi pi-truck" size="small" />
            </template>
          </Column>

          <Column header="取號狀態">
            <template #body="{ data }">
              <span class="text-[13px] text-[var(--p-text-muted-color)]">{{ data.trackingStatus ?? '—' }}</span>
            </template>
          </Column>

          <Column
            header="操作"
            frozen
            align-frozen="right"
            header-class="text-right"
            body-class="text-right"
          >
            <template #body="{ data }">
              <div class="flex items-center justify-end gap-1">
                <button
                  v-tooltip.top="'出貨單列印'"
                  class="size-[32px] flex items-center justify-center rounded-[6px] text-[var(--p-text-color)] hover:bg-[var(--p-content-hover-background)]"
                >
                  <i class="pi pi-print" style="font-size: 15.75px"></i>
                </button>
                <button
                  v-tooltip.top="'標籤列印'"
                  class="size-[32px] flex items-center justify-center rounded-[6px] text-[var(--p-text-color)] hover:bg-[var(--p-content-hover-background)]"
                >
                  <i class="pi pi-tag" style="font-size: 15.75px"></i>
                </button>
                <button
                  v-tooltip.top="'開立發票'"
                  class="size-[32px] flex items-center justify-center rounded-[6px] text-[var(--p-text-color)] hover:bg-[var(--p-content-hover-background)]"
                >
                  <i class="pi pi-file" style="font-size: 15.75px"></i>
                </button>
                <button
                  v-tooltip.top="'查看更多'"
                  class="size-[32px] flex items-center justify-center rounded-[6px] text-[var(--p-text-color)] hover:bg-[var(--p-content-hover-background)]"
                  @click="openDetailDialog(data)"
                >
                  <i class="pi pi-eye" style="font-size: 15.75px"></i>
                </button>
              </div>
            </template>
          </Column>

          <template #empty>
            <div class="py-8 text-center text-[14px] text-[var(--p-text-muted-color)]">
              目前無訂單。
            </div>
          </template>
          </DataTable>
        </div>
      </template>
    </Card>

    <!-- 「查看更多」彈窗：點訂單列眼睛 icon 開啟，顯示 OrderRowDetail 完整資訊 -->
    <Dialog
      v-model:visible="detailDialogVisible"
      modal
      :draggable="false"
      :header="detailDialogOrder ? `訂單 ${detailDialogOrder.orderNo}` : '訂單詳情'"
      :style="{ width: 'min(1200px, calc(100vw - 32px))' }"
      :pt="{ content: { style: 'padding: 0' } }"
    >
      <OrderRowDetail v-if="detailDialogOrder" :order="detailDialogOrder" />
      <!-- footer：取消訂單獨立靠左（destructive 動作分區）；右側維持取消/儲存 -->
      <template #footer>
        <div class="flex items-center justify-between gap-2 w-full">
          <Button label="取消訂單" icon="pi pi-ban" severity="danger" variant="outlined" />
          <div class="flex items-center gap-2">
            <Button label="取消" severity="secondary" variant="outlined" @click="detailDialogVisible = false" />
            <Button label="儲存" @click="detailDialogVisible = false" />
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>
