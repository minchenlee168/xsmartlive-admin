<script setup lang="ts">
import { computed, ref, watch } from 'vue'

/**
 * 分批出貨作業 — 全頁模式（依規範：訂單管理分頁改渲染此頁、不渲染表格）。
 *
 * 內容邏輯與原 SplitShippingDialog 相同：
 * - 主原始訂單視圖：設定 stepper → 建立新批次
 * - 批次視圖：狀態卡 / 商品 table / 出貨備註
 *
 * 全頁多了：頂部返回鍵 + 標題 + 訂單摘要
 */

interface OrderLite {
  orderNo: string
  buyerName: string
  amount: number
  itemCount: number
  cartTag: { label: string; bg: string; color: string }
}
interface Props {
  order: OrderLite
}
const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

interface ProductLine {
  id: number
  name: string
  spec: string
  unitPrice: number
  ordered: number
}
const products = ref<ProductLine[]>([])

type BatchStatus = 'pending' | 'preparing' | 'shipping' | 'arrived' | 'completed'
interface Batch {
  name: string
  items: Array<{ productId: number; qty: number }>
  status: BatchStatus
  note: string
}
const batches = ref<Batch[]>([])
const currentBatchIdx = ref<number>(-1)
const pendingAllocation = ref<Record<number, number>>({})

watch(() => props.order, () => {
  const unitPrice = Math.round(props.order.amount / Math.max(1, props.order.itemCount) - 120 / Math.max(1, props.order.itemCount))
  products.value = [{
    id: 1,
    name: props.order.cartTag.label === '服飾專區' ? '韓版寬鬆連帽外套（米白）' : '示意商品',
    spec: props.order.cartTag.label === '服飾專區' ? '尺寸 M / 米白色內裡' : '預設規格',
    unitPrice,
    ordered: props.order.itemCount,
  }]
  batches.value = []
  currentBatchIdx.value = -1
  pendingAllocation.value = {}
  products.value.forEach(p => { pendingAllocation.value[p.id] = 0 })
}, { immediate: true })

function allocatedTotal(productId: number): number {
  return batches.value.reduce((s, b) => {
    const it = b.items.find(i => i.productId === productId)
    return s + (it?.qty ?? 0)
  }, 0)
}
function remainingOf(p: ProductLine): number {
  return Math.max(0, p.ordered - allocatedTotal(p.id))
}

const originalPending = computed<number>(() => products.value.reduce((s, p) => s + remainingOf(p), 0))
const originalTotal = computed<number>(() => products.value.reduce((s, p) => s + p.unitPrice * p.ordered, 0))
const unallocatedCount = computed<number>(() => originalPending.value)

function allocateAll(): void {
  products.value.forEach((p) => {
    pendingAllocation.value[p.id] = remainingOf(p)
  })
}

function createNewBatch(): void {
  const items = products.value
    .map(p => ({ productId: p.id, qty: pendingAllocation.value[p.id] ?? 0 }))
    .filter(it => it.qty > 0)
  if (items.length === 0) return
  batches.value.push({
    name: `第 ${batches.value.length + 1} 批`,
    items,
    status: 'pending',
    note: '',
  })
  products.value.forEach(p => { pendingAllocation.value[p.id] = 0 })
  currentBatchIdx.value = batches.value.length - 1
}

function deleteBatch(idx: number): void {
  batches.value.splice(idx, 1)
  batches.value.forEach((b, i) => { b.name = `第 ${i + 1} 批` })
  currentBatchIdx.value = -1
}

const currentBatch = computed<Batch | null>(() =>
  currentBatchIdx.value >= 0 ? batches.value[currentBatchIdx.value] ?? null : null,
)

function batchTotal(b: Batch): number {
  return b.items.reduce((s, it) => {
    const p = products.value.find(pr => pr.id === it.productId)
    return s + (p?.unitPrice ?? 0) * it.qty
  }, 0)
}
const currentBatchTotal = computed(() => currentBatch.value ? batchTotal(currentBatch.value) : 0)

interface StepItem { key: BatchStatus; label: string; isCurrent: boolean; isPast: boolean }
const currentBatchSteps = computed<StepItem[]>(() => {
  const flow: Array<{ key: BatchStatus; label: string }> = [
    { key: 'pending',   label: '待出貨' },
    { key: 'preparing', label: '備貨中' },
    { key: 'shipping',  label: '已出貨' },
    { key: 'arrived',   label: '已送達' },
    { key: 'completed', label: '已完成' },
  ]
  const currentIdx = currentBatch.value
    ? flow.findIndex(s => s.key === currentBatch.value!.status)
    : -1
  return flow.map((s, i) => ({
    key: s.key,
    label: s.label,
    isCurrent: i === currentIdx,
    isPast: i < currentIdx,
  }))
})

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'
function statusMeta(s: BatchStatus): { label: string; severity: TagSeverity; icon: string; color: string } {
  const map: Record<BatchStatus, { label: string; severity: TagSeverity; icon: string; color: string }> = {
    pending:   { label: '尚未配送', severity: 'warn',      icon: 'pi pi-truck',        color: '#CA8A04' },
    preparing: { label: '備貨中',   severity: 'info',      icon: 'pi pi-box',          color: '#2563EB' },
    shipping:  { label: '已出貨',   severity: 'warn',      icon: 'pi pi-truck',        color: '#CA8A04' },
    arrived:   { label: '已送達',   severity: 'success',   icon: 'pi pi-map-marker',   color: '#16A34A' },
    completed: { label: '已完成',   severity: 'secondary', icon: 'pi pi-check-circle', color: '#334155' },
  }
  return map[s]
}

const currentBatchTableRows = computed(() => {
  if (!currentBatch.value) return []
  return currentBatch.value.items.map((it) => {
    const p = products.value.find(pr => pr.id === it.productId)!
    return {
      productId: p.id,
      name: p.name,
      spec: p.spec,
      unitPrice: p.unitPrice,
      qty: it.qty,
      subtotal: p.unitPrice * it.qty,
    }
  })
})

function saveAndClose(): void { emit('close') }
function cancel(): void { emit('close') }
</script>

<template>
  <div class="flex flex-col gap-4 flex-1 min-h-0">
    <!-- 頂部：返回鍵 + 標題 + 訂單摘要 -->
    <div class="flex items-center gap-4 flex-wrap">
      <Button
        icon="pi pi-arrow-left"
        severity="secondary"
        variant="outlined"
        size="small"
        label="返回訂單管理"
        @click="emit('close')"
      />
      <div class="flex flex-col gap-1 flex-1 min-w-0">
        <h1 class="text-xl font-medium text-[var(--p-text-color)]">分批出貨作業</h1>
        <span class="text-xs text-[var(--p-text-muted-color)]">
          訂單 {{ order.orderNo }}
          <span class="mx-1">·</span> 客戶 {{ order.buyerName }}
          <span class="mx-1">·</span> 共 {{ order.itemCount }} 件商品
          <span class="mx-1">·</span> 訂單總計 <span class="font-bold text-[var(--p-text-color)]">${{ order.amount.toLocaleString() }}</span>
        </span>
      </div>
    </div>

    <!-- 主內容 Card -->
    <Card
      :pt="{
        root: { class: 'w-full shrink-0 overflow-hidden' },
        body: { class: 'p-0' },
        content: { class: 'p-0' },
      }"
    >
      <template #content>
        <div class="flex gap-4 p-4">
          <!-- 左：分批結構 -->
          <div class="w-[240px] shrink-0 flex flex-col gap-2">
            <span class="text-[13px] font-medium text-[var(--p-text-muted-color)] px-1">分批結構</span>
            <button
              type="button"
              class="text-left rounded-md border p-3 flex flex-col gap-2 transition-colors"
              :class="currentBatchIdx === -1
                ? 'border-[var(--p-primary-color)] bg-[var(--p-primary-50)]'
                : 'border-[var(--p-content-border-color)] bg-[var(--p-content-background)] hover:border-[var(--p-primary-300)]'"
              @click="currentBatchIdx = -1"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--p-text-color)]">
                  <i class="pi pi-box text-[13px]"></i>
                  主原始訂單
                </span>
                <Tag
                  v-if="originalPending > 0"
                  :value="`待分配 ${originalPending}`"
                  severity="warn"
                />
              </div>
              <span class="text-xs text-[var(--p-text-muted-color)]">
                {{ products.length }} 件商品 · 原始總額 ${{ originalTotal.toLocaleString() }}
              </span>
            </button>
            <button
              v-for="(b, i) in batches"
              :key="i"
              type="button"
              class="text-left rounded-md border p-3 flex flex-col gap-2 transition-colors"
              :class="currentBatchIdx === i
                ? 'border-[var(--p-primary-color)] bg-[var(--p-primary-50)]'
                : 'border-[var(--p-content-border-color)] bg-[var(--p-content-background)] hover:border-[var(--p-primary-300)]'"
              @click="currentBatchIdx = i"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--p-text-color)]">
                  <i class="pi pi-inbox text-[13px]"></i>
                  {{ b.name }}
                </span>
                <Tag
                  :value="`${statusMeta(b.status).label} ${b.items.reduce((s, it) => s + it.qty, 0)} 件`"
                  :severity="statusMeta(b.status).severity"
                />
              </div>
            </button>
          </div>

          <!-- 右：主原始訂單 or 批次詳情 -->
          <div class="flex-1 min-w-0 rounded-lg border border-[var(--p-content-border-color)] bg-[var(--p-content-background)] p-4 flex flex-col gap-4">
            <!-- 主原始訂單視圖 -->
            <template v-if="currentBatchIdx === -1">
              <div class="flex items-center gap-2">
                <i class="pi pi-box text-[var(--p-primary-color)]"></i>
                <span class="text-base font-bold text-[var(--p-text-color)]">主原始訂單</span>
                <Tag
                  v-if="originalPending > 0"
                  :value="`待分配 ${originalPending} 件`"
                  severity="warn"
                />
              </div>
              <p class="text-[13px] text-[var(--p-text-muted-color)]">
                設定每項商品的分配數量，建立新批次或一鍵全部待出。
              </p>

              <div class="flex flex-col divide-y divide-[var(--p-content-border-color)]">
                <div
                  v-for="p in products"
                  :key="p.id"
                  class="py-3 flex items-center gap-3"
                >
                  <span class="size-2 rounded-full bg-[#CA8A04] shrink-0"></span>
                  <div class="flex-1 min-w-0 flex flex-col gap-1">
                    <span class="text-sm font-medium text-[var(--p-text-color)]">{{ p.name }}</span>
                    <span class="text-xs text-[var(--p-text-muted-color)]">
                      規格：{{ p.spec }}
                      <span class="mx-1">·</span> 單價：${{ p.unitPrice.toLocaleString() }}
                      <span class="mx-1">·</span> 訂購 {{ p.ordered }} 件
                    </span>
                  </div>
                  <span class="text-xs text-[var(--p-text-muted-color)] shrink-0">剩餘可分配 {{ remainingOf(p) }} 件</span>
                  <InputNumber
                    v-model="pendingAllocation[p.id]"
                    show-buttons
                    :min="0"
                    :max="remainingOf(p)"
                    button-layout="horizontal"
                    size="small"
                    input-class="!w-[50px] text-center"
                  />
                </div>
                <div v-if="products.length === 0" class="py-12 text-center text-[13px] text-[var(--p-text-muted-color)]">
                  沒有商品
                </div>
              </div>

              <div class="flex items-center justify-between gap-3 pt-2 border-t border-[var(--p-content-border-color)]">
                <span class="text-[13px] text-[var(--p-text-muted-color)]">
                  原始總額 <span class="text-[var(--p-text-color)] font-bold">${{ originalTotal.toLocaleString() }}</span>
                  <span class="mx-2">·</span>
                  預計分配 <span class="text-[var(--p-text-color)] font-bold">{{ Object.values(pendingAllocation).reduce((s, v) => s + v, 0) }}</span> 件
                </span>
                <div class="flex items-center gap-2">
                  <Button
                    label="全部待出"
                    icon="pi pi-arrow-up-right"
                    severity="secondary"
                    variant="outlined"
                    size="small"
                    :disabled="originalPending === 0"
                    @click="allocateAll"
                  />
                  <Button
                    label="建立新批次"
                    icon="pi pi-plus"
                    size="small"
                    :disabled="Object.values(pendingAllocation).every(v => v === 0)"
                    @click="createNewBatch"
                  />
                </div>
              </div>
            </template>

            <!-- 批次詳情視圖 -->
            <template v-else-if="currentBatch">
              <div class="flex items-center justify-between gap-2">
                <div class="flex flex-col gap-1">
                  <span class="text-base font-bold text-[var(--p-text-color)]">{{ currentBatch.name }} 明細</span>
                  <span class="text-xs text-[var(--p-text-muted-color)]">此批次已拆分商品細節與物流發貨階段控制。</span>
                </div>
                <Button
                  label="刪除此批"
                  icon="pi pi-trash"
                  severity="danger"
                  variant="outlined"
                  size="small"
                  @click="deleteBatch(currentBatchIdx)"
                />
              </div>

              <div class="rounded-md border border-[var(--p-content-border-color)] p-4 flex flex-col gap-4">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <span
                    class="inline-flex items-center gap-2 text-sm font-medium"
                    :style="{ color: statusMeta(currentBatch.status).color }"
                  >
                    <i :class="statusMeta(currentBatch.status).icon" class="text-sm"></i>
                    {{ statusMeta(currentBatch.status).label }}
                  </span>
                  <div class="flex items-center gap-2">
                    <Button label="切換狀態" icon="pi pi-sync" severity="secondary" variant="outlined" size="small" />
                    <Button label="配送設定" icon="pi pi-cog" size="small" />
                  </div>
                </div>
                <Timeline :value="currentBatchSteps" layout="horizontal" align="top" class="w-full">
                  <template #marker="{ item }">
                    <span
                      class="rounded-full inline-block shrink-0"
                      :style="{
                        width: item.isCurrent ? '14px' : '10px',
                        height: item.isCurrent ? '14px' : '10px',
                        background: item.isPast || item.isCurrent ? 'var(--p-primary-color)' : 'var(--p-content-border-color)',
                      }"
                    ></span>
                  </template>
                  <template #content="{ item }">
                    <div class="flex flex-col items-center gap-1 pt-1 whitespace-nowrap">
                      <span
                        class="text-xs"
                        :style="item.isCurrent
                          ? 'color: var(--p-primary-color); font-weight: 600'
                          : 'color: var(--p-text-muted-color)'"
                      >{{ item.label }}</span>
                      <span class="text-xs text-[var(--p-text-muted-color)]">—</span>
                    </div>
                  </template>
                  <template #connector>
                    <span class="block h-px w-full" style="background: var(--p-content-border-color)"></span>
                  </template>
                </Timeline>
              </div>

              <div class="flex flex-col gap-2">
                <span class="text-[13px] text-[var(--p-text-color)]">已分配商品</span>
                <DataTable
                  :value="currentBatchTableRows"
                  data-key="productId"
                  class="w-full"
                  :pt="{ column: { headerCell: { style: 'white-space: nowrap;' } } }"
                >
                  <Column header="商品名稱 / 規格">
                    <template #body="{ data }">
                      <div class="flex flex-col gap-1">
                        <span class="font-medium text-[var(--p-text-color)]">{{ data.name }}</span>
                        <span class="text-xs text-[var(--p-text-muted-color)]">{{ data.spec }}</span>
                      </div>
                    </template>
                  </Column>
                  <Column header="單價" body-class="text-right" header-class="text-right">
                    <template #body="{ data }">${{ data.unitPrice.toLocaleString() }}</template>
                  </Column>
                  <Column header="數量" body-class="text-right" header-class="text-right">
                    <template #body="{ data }">× {{ data.qty }}</template>
                  </Column>
                  <Column header="小計" body-class="text-right" header-class="text-right">
                    <template #body="{ data }">
                      <span class="font-bold">${{ data.subtotal.toLocaleString() }}</span>
                    </template>
                  </Column>
                </DataTable>
                <div class="flex flex-col gap-2 pt-2 border-t border-[var(--p-content-border-color)]">
                  <div class="flex items-center justify-between text-[13px]">
                    <span class="text-[var(--p-text-color)]">商品小計</span>
                    <span class="font-medium text-[var(--p-text-color)]">${{ currentBatchTotal.toLocaleString() }}</span>
                  </div>
                  <div class="flex items-center justify-between text-[13px]">
                    <span class="font-medium text-[var(--p-text-color)]">本批總額</span>
                    <span class="text-base font-bold text-[var(--p-primary-color)]">${{ currentBatchTotal.toLocaleString() }}</span>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <span class="text-[13px] text-[var(--p-text-color)]">出貨單備註</span>
                <Textarea v-model="currentBatch.note" rows="3" placeholder="輸入此批次出貨單備註..." class="w-full resize-none" />
              </div>
            </template>
          </div>
        </div>

        <!-- 底部：未分配提示 + 取消 / 儲存並返回 -->
        <div class="flex items-center justify-between w-full gap-3 border-t border-[var(--p-content-border-color)] px-4 py-3">
          <span
            v-if="unallocatedCount > 0"
            class="inline-flex items-center gap-2 text-[13px] text-[#CA8A04]"
          >
            <i class="pi pi-info-circle text-[13px]"></i>
            尚有 <span class="font-bold">{{ unallocatedCount }}</span> 件商品未分配至任何批次
          </span>
          <span v-else></span>
          <div class="flex items-center gap-2">
            <Button label="取消" severity="secondary" variant="outlined" @click="cancel" />
            <Button label="儲存並返回" icon="pi pi-save" @click="saveAndClose" />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
