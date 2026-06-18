<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import PostListTable, { type OrderPost } from '@/admin/views/live-order/components/PostListTable.vue'
import WinnerListDialog from '@/admin/views/live-order/components/WinnerListDialog.vue'
import { liveOrderRecords } from '@/admin/views/live-order/utils/liveOrderRecords'

/**
 * 收單紀錄頁：顯示所有結束收單後寫入的紀錄。
 * - 直播收單儲存後寫入的 `liveOrderRecords` → 自動以 OrderPost 形式列在最前
 * - 既有貼文收單 mock 列在後方（之後可整合）
 * 點檢視得標清單會開啟 WinnerListDialog 顯示得標明細。
 */

const toast = useToast()

/** 起訖 → 顯示字串；只有結單時間就只顯示「~ 結束時間」，兩者皆空為「未設」 */
function formatPeriod(startAt: Date | null, endAt: Date | null): string {
  const fmt = (d: Date): string => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${y}/${m}/${day} ${hh}:${mm}`
  }
  if (!startAt && !endAt) return '未設'
  if (startAt && endAt) return `${fmt(startAt)} ~ ${fmt(endAt)}`
  if (endAt) return `~ ${fmt(endAt)}`
  return `${fmt(startAt as Date)} ~`
}

const baseMockPosts = ref<OrderPost[]>([
  {
    id: 9001,
    name: '貼文2026/02/10',
    orderCount: 120,
    salesAmount: 405,
    createdAt: '2026-02-01 22:00',
    startAt: new Date('2026-02-10T20:00:00'),
    endAt: new Date('2026-03-02T23:59:00'),
    orderingPeriod: '2026/02/10 20:00 ~ 2026/03/02 23:59',
    createdBy: '酒伍二漆',
    status: 'ended',
    products: [
      { id: 91001, name: '寶寶連身包屁衣', keyword: 'A1', price: 199, stock: 50, sold: 32 },
      { id: 91002, name: '嬰兒抗 UV 遮陽帽', keyword: 'A2', price: 150, stock: 30, sold: 18 },
    ],
  },
  {
    id: 9002,
    name: '貼文2026/06/12',
    orderCount: 58,
    salesAmount: 16240,
    createdAt: '2026-06-12 09:30',
    startAt: new Date('2026-06-12T10:00:00'),
    endAt: new Date('2026-06-15T23:59:00'),
    orderingPeriod: '2026/06/12 10:00 ~ 2026/06/15 23:59',
    createdBy: '管理員 A',
    status: 'ongoing',
    products: [
      {
        id: 92001, name: '女童碎花連衣裙', keyword: 'B1', price: 320, stock: 40, sold: 22,
        specs: [
          { name: '110cm', stock: 20, sold: 12, price: 320 },
          { name: '120cm', stock: 20, sold: 10, price: 320 },
        ],
      },
      { id: 92002, name: '男童純棉長袖上衣', keyword: 'B2', price: 280, stock: 50, sold: 14 },
    ],
  },
  {
    id: 9003,
    name: '貼文2026/06/14',
    orderCount: 0,
    salesAmount: 0,
    createdAt: '2026-06-14 18:00',
    startAt: null,
    endAt: new Date('2026-06-20T23:59:00'),
    orderingPeriod: '~ 2026/06/20 23:59',
    createdBy: '管理員 B',
    status: 'ready',
    products: [],
  },
])

/** 收單期間 cell 內存檔 → 寫回 startAt / endAt 並重算顯示字串 */
function onUpdatePostPeriod(payload: { id: number; startAt: Date | null; endAt: Date | null }): void {
  const post = baseMockPosts.value.find(p => p.id === payload.id)
  if (!post) {
    toast.add({ severity: 'warn', summary: '此筆紀錄無法編輯收單期間', life: 1500 })
    return
  }
  post.startAt = payload.startAt
  post.endAt = payload.endAt
  post.orderingPeriod = formatPeriod(payload.startAt, payload.endAt)
  toast.removeAllGroups()
  toast.add({ severity: 'success', summary: '已更新收單期間', detail: post.orderingPeriod, life: 2000 })
}

// 直播收單結束後寫入的紀錄 → 轉成 OrderPost shape，放在列表最前（status=ended）
const recordedPosts = computed<OrderPost[]>(() =>
  liveOrderRecords.map((r) => ({
    id: r.id,
    name: r.sessionName,
    orderCount: r.orderCount,
    salesAmount: r.totalAmount,
    createdAt: r.endedAt,
    orderingPeriod: r.endedAt,
    createdBy: '系統',
    status: 'ended' as const,
    products: r.products.map((p) => ({
      id: p.id,
      name: p.name,
      keyword: p.keyword,
      price: p.price,
      stock: p.specs.reduce((sum, s) => sum + s.stock, 0),
      sold: p.sold,
      specs: p.specs.map((s) => ({
        name: s.name,
        stock: s.stock,
        sold: s.sold,
        price: p.price,
      })),
    })),
  }))
)
const posts = computed<OrderPost[]>(() => [...recordedPosts.value, ...baseMockPosts.value])

function onDeletePost(id: number): void {
  // 紀錄來自 store 的不允許在這頁刪；只能刪 mock 貼文
  const isFromStore = liveOrderRecords.some((r) => r.id === id)
  if (isFromStore) {
    toast.add({ severity: 'warn', summary: '結束收單紀錄無法刪除', life: 1500 })
    return
  }
  baseMockPosts.value = baseMockPosts.value.filter(p => p.id !== id)
  toast.removeAllGroups()
  toast.add({ severity: 'success', summary: '已刪除貼文', life: 1500 })
}
function onBatchDeletePosts(ids: number[]): void {
  const idSet = new Set(ids)
  baseMockPosts.value = baseMockPosts.value.filter(p => !idSet.has(p.id))
  toast.removeAllGroups()
  toast.add({ severity: 'success', summary: `已刪除 ${ids.length} 筆貼文`, life: 1500 })
}

// 得標清單彈窗：點貼文 / 紀錄列的「檢視得標清單」開啟
const winnerDialogVisible = ref(false)
const winnerDialogProduct = ref<unknown>({})
function onViewPostWinners(id: number): void {
  const post = posts.value.find(p => p.id === id)
  const firstProduct = post?.products?.[0]
  if (!firstProduct) {
    toast.add({ severity: 'info', summary: '此筆紀錄沒有商品', life: 1500 })
    return
  }
  winnerDialogProduct.value = firstProduct
  winnerDialogVisible.value = true
}
function onViewPostProducts(id: number): void {
  toast.removeAllGroups()
  toast.add({ severity: 'info', summary: `檢視貼文 ${id} 的商品清單`, life: 1500 })
}
/** 切換貼文收單狀態：ready → ongoing → ended。 */
function onTogglePostStatus(id: number): void {
  const post = posts.value.find(p => p.id === id)
  if (!post) return
  if (post.status === 'ready') {
    post.status = 'ongoing'
    toast.add({ severity: 'success', summary: `已開始「${post.name}」收單`, life: 1500 })
  } else if (post.status === 'ongoing') {
    post.status = 'ended'
    toast.add({ severity: 'info', summary: `已結束「${post.name}」收單`, life: 1500 })
  }
}
function onPickPost(): void {
  toast.add({ severity: 'info', summary: '請至貼文收單頁選擇貼文後再來收單紀錄查看', life: 2500 })
}
</script>

<template>
  <div class="flex flex-col gap-4 flex-1 min-h-0">
    <PostListTable
      :posts="posts"
      :can-pick-post="true"
      @delete="onDeletePost"
      @batch-delete="onBatchDeletePosts"
      @view-winners="onViewPostWinners"
      @view-products="onViewPostProducts"
      @toggle-status="onTogglePostStatus"
      @pick-post="onPickPost"
      @update-period="onUpdatePostPeriod"
    />

    <!-- 得標清單彈窗：來自結束收單紀錄與貼文紀錄共用 -->
    <WinnerListDialog v-model:visible="winnerDialogVisible" :product="winnerDialogProduct as never" />
  </div>
</template>
