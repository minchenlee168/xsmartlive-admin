<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ManagedProduct, ManagedProductSpec } from '../utils/productMock'

/**
 * 批量調整庫存 dialog（從商品列表 → 庫存欄旁筆 icon 開啟）。
 *
 * 結構：
 * - 上半部：規格庫存調整 table — 每個 spec 一列，可輸入庫存增減 + 選原因，
 *   即時顯示「調整後」庫存。送出時 emit 一份完整的調整清單。
 * - 下半部：近十筆調整紀錄（accordion 可收合）+ 規格篩選 chips + 原因關鍵字搜尋。
 *   歷史紀錄目前是 mock，方便視覺驗證；之後接 API 替換 mockHistory 即可。
 */

interface AdjustmentReason {
  label: string
  value: string
}
const ADJUSTMENT_REASONS: AdjustmentReason[] = [
  { label: '進貨', value: 'restock' },
  { label: '退貨', value: 'return' },
  { label: '盤點', value: 'inventory' },
  { label: '內部使用', value: 'internal' },
  { label: '報廢', value: 'discard' },
  { label: '其他', value: 'other' },
]

interface AdjustmentRow {
  specId: number
  specName: string
  currentStock: number
  delta: number
  reason: string
}

export interface StockAdjustmentPayload {
  productId: number
  adjustments: AdjustmentRow[]
}

interface Props {
  visible?: boolean
  product?: ManagedProduct | null
}
const props = withDefaults(defineProps<Props>(), {
  visible: false,
  product: null,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [payload: StockAdjustmentPayload]
}>()

const adjustments = ref<AdjustmentRow[]>([])
const showHistory = ref(true)
const historyFilter = ref<number | 'all'>('all')
const historyKeyword = ref('')

/** dialog 開啟時：依商品的規格初始化空 adjustment rows（沒人改就 delta=0、reason=空） */
watch(
  () => [props.visible, props.product] as const,
  ([v, p]) => {
    if (!v || !p) return
    adjustments.value = (p as ManagedProduct).specs.map((s) => ({
      specId: s.id,
      specName: s.name,
      currentStock: s.stock,
      delta: 0,
      reason: 'restock',
    }))
    historyFilter.value = 'all'
    historyKeyword.value = ''
    showHistory.value = true
  },
  { immediate: true },
)

function close(): void { emit('update:visible', false) }
function onSave(): void {
  if (!props.product) return
  // 只送有實際增減的列（delta != 0）
  const changes = adjustments.value.filter((a) => a.delta !== 0)
  emit('save', { productId: props.product.id, adjustments: changes })
  close()
}

// ── 近十筆調整紀錄（mock）─────────────────────
interface HistoryEntry {
  id: number
  time: string
  specId: number
  specName: string
  before: number
  delta: number
  after: number
  reason: string
  operator: string
}
function buildMockHistory(p: ManagedProduct | null): HistoryEntry[] {
  if (!p) return []
  // 為每個規格塞 2 筆假紀錄；總筆數 = specs * 2，最多 10
  const reasons = ['進貨', '進貨', '盤點', '退貨', '內部使用']
  const operators = ['Test Name', '阿明', '小芳', '王太太']
  const list: HistoryEntry[] = []
  let id = 1
  p.specs.forEach((s, si) => {
    for (let i = 0; i < 2; i++) {
      const delta = i === 0 ? 100 : -20
      const before = s.stock + (i === 0 ? 500 : 600)
      list.push({
        id: id++,
        time: `2026-03-${(24 - id).toString().padStart(2, '0')} ${(14 - i).toString().padStart(2, '0')}:30`,
        specId: s.id,
        specName: s.name,
        before,
        delta,
        after: before + delta,
        reason: reasons[(si + i) % reasons.length],
        operator: operators[(si + i) % operators.length],
      })
    }
  })
  return list.slice(0, 10)
}
const allHistory = computed(() => buildMockHistory(props.product))

const filteredHistory = computed(() => {
  let list = allHistory.value
  if (historyFilter.value !== 'all') {
    list = list.filter((h) => h.specId === historyFilter.value)
  }
  const k = historyKeyword.value.trim()
  if (k) list = list.filter((h) => h.reason.includes(k))
  return list
})
</script>

<template>
  <Drawer
    :visible="visible"
    position="right"
    :modal="true"
    :dismissable="true"
    :style="{ width: '900px' }"
    :pt="{
      root:    { class: '!max-w-[95vw]' },
      header:  { style: 'padding: 17.5px' },
      content: { style: 'padding: 0 17.5px 17.5px' },
    }"
    @update:visible="(v) => emit('update:visible', v)"
  >
    <template #header>
      <span class="font-semibold text-[var(--p-text-color)]" style="font-size: 21px">
        批量調整庫存 - {{ product?.name ?? '' }}
      </span>
    </template>

    <!-- 規格庫存調整 -->
    <div class="flex flex-col gap-3">
      <span class="text-[13px] text-[var(--p-text-muted-color)]">規格庫存調整</span>

      <!-- 比照 Figma：無外框、無 striped；每列僅底部分隔線、白底、padding 較鬆 -->
      <div>
        <!-- header -->
        <div class="grid items-center gap-3 px-3 py-3 border-b border-[var(--p-content-border-color)]"
             style="grid-template-columns: 1fr 100px 180px 200px 100px">
          <span class="text-[14px] font-semibold text-[var(--p-text-color)]">規格名稱</span>
          <span class="text-[14px] font-semibold text-[var(--p-text-color)]">目前庫存</span>
          <span class="text-[14px] font-semibold text-[var(--p-text-color)]">庫存調整</span>
          <span class="text-[14px] font-semibold text-[var(--p-text-color)]">調整原因</span>
          <span class="text-[14px] font-semibold text-[var(--p-text-color)]">調整後</span>
        </div>
        <div
          v-for="row in adjustments"
          :key="row.specId"
          class="grid items-center gap-3 px-3 py-3 border-b border-[var(--p-content-border-color)]"
          style="grid-template-columns: 1fr 100px 180px 200px 100px"
        >
          <span class="text-[14px] text-[var(--p-text-color)]">{{ row.specName }}</span>
          <span class="text-[14px] text-[var(--p-text-color)]">{{ row.currentStock }}</span>
          <InputNumber
            v-model="row.delta"
            show-buttons
            button-layout="stacked"
            :input-style="{ width: '110px' }"
            :pt="{ root: { class: 'w-[150px]' } }"
          />
          <Select
            v-model="row.reason"
            :options="ADJUSTMENT_REASONS"
            option-label="label"
            option-value="value"
            class="w-[180px]"
          />
          <span class="text-[14px] text-[var(--p-text-color)]">{{ row.currentStock + (row.delta ?? 0) }}</span>
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <Button label="取消" severity="secondary" outlined @click="close" />
        <Button label="確認" @click="onSave" />
      </div>
    </div>

    <!-- 分隔線 -->
    <div class="border-t border-[var(--p-content-border-color)] my-4"></div>

    <!-- 近十筆調整紀錄 -->
    <div class="flex flex-col gap-3">
      <button
        type="button"
        class="flex items-center justify-between gap-2 text-left"
        @click="showHistory = !showHistory"
      >
        <span class="text-[14px] font-semibold text-[var(--p-text-color)]">近十筆調整紀錄</span>
        <i :class="showHistory ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" style="font-size: 12px"></i>
      </button>

      <template v-if="showHistory">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              class="px-3 py-1.5 rounded-[6px] text-[13px] font-medium border"
              :class="historyFilter === 'all'
                ? 'bg-[var(--p-primary-color)] text-white border-[var(--p-primary-color)]'
                : 'bg-[var(--p-content-background)] text-[var(--p-text-color)] border-[var(--p-content-border-color)] hover:bg-[var(--p-content-hover-background)]'"
              @click="historyFilter = 'all'"
            >全部規格</button>
            <button
              v-for="s in product?.specs ?? []"
              :key="s.id"
              type="button"
              class="px-3 py-1.5 rounded-[6px] text-[13px] font-medium border"
              :class="historyFilter === s.id
                ? 'bg-[var(--p-primary-color)] text-white border-[var(--p-primary-color)]'
                : 'bg-[var(--p-content-background)] text-[var(--p-text-color)] border-[var(--p-content-border-color)] hover:bg-[var(--p-content-hover-background)]'"
              @click="historyFilter = s.id"
            >{{ s.name }}</button>
          </div>
          <InputGroup class="!w-[260px]">
            <InputGroupAddon>
              <i class="pi pi-search" style="font-size: 13px"></i>
            </InputGroupAddon>
            <InputText v-model="historyKeyword" placeholder="搜尋操作原因" />
          </InputGroup>
        </div>

        <!-- 比照規格庫存調整 table：白底、無外框、列底分隔線 -->
        <div>
          <div class="grid items-center gap-3 px-3 py-3 border-b border-[var(--p-content-border-color)]"
               style="grid-template-columns: 160px 80px 80px 80px 80px 120px 1fr">
            <span class="text-[14px] font-semibold text-[var(--p-text-color)]">時間</span>
            <span class="text-[14px] font-semibold text-[var(--p-text-color)]">規格</span>
            <span class="text-[14px] font-semibold text-[var(--p-text-color)]">調整前</span>
            <span class="text-[14px] font-semibold text-[var(--p-text-color)]">異動</span>
            <span class="text-[14px] font-semibold text-[var(--p-text-color)]">調整後</span>
            <span class="text-[14px] font-semibold text-[var(--p-text-color)]">調整原因</span>
            <span class="text-[14px] font-semibold text-[var(--p-text-color)]">操作人員</span>
          </div>
          <div
            v-for="h in filteredHistory"
            :key="h.id"
            class="grid items-center gap-3 px-3 py-3 border-b border-[var(--p-content-border-color)]"
            style="grid-template-columns: 160px 80px 80px 80px 80px 120px 1fr"
          >
            <span class="text-[13px] text-[var(--p-text-color)]">{{ h.time }}</span>
            <span class="text-[13px] text-[var(--p-text-color)]">{{ h.specName }}</span>
            <span class="text-[13px] text-[var(--p-text-color)]">{{ h.before }}</span>
            <span
              class="inline-flex items-center self-start px-1.5 py-0.5 rounded-[6px] text-[12.25px] font-bold leading-none w-fit"
              :style="h.delta >= 0
                ? 'background:#d1fae5;color:#047857'
                : 'background:#fee2e2;color:#b91c1c'"
            >{{ h.delta >= 0 ? '+' : '' }}{{ h.delta }}</span>
            <span class="text-[13px] text-[var(--p-text-color)]">{{ h.after }}</span>
            <span class="text-[13px] text-[var(--p-text-color)]">{{ h.reason }}</span>
            <span class="text-[13px] text-[var(--p-text-color)]">{{ h.operator }}</span>
          </div>
          <div v-if="filteredHistory.length === 0" class="py-6 text-center text-[13px] text-[var(--p-text-muted-color)]">
            沒有符合條件的調整紀錄
          </div>
        </div>

        <div class="flex justify-center">
          <Button label="查看更多紀錄" severity="primary" outlined size="small" />
        </div>
      </template>
    </div>
  </Drawer>
</template>
