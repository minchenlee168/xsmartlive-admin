<template>
  <!-- 直播收單：自訂版型（多收單來源） -->
  <!-- 上：Banner（hasAnySource）；上：Toolbar；下：空狀態 OR 收單操作頁 -->

  <div class="flex flex-col gap-2 flex-1 min-h-0">


    <!-- ── Body：空狀態 OR 收單操作頁 ───────────────── -->
    <!-- 貼文模式 + 尚未挑選來源 → 顯示貼文收單列表 -->
    <template v-if="isPostMode && !hasAnySource">
      <PostCollectionOverview
        :posts="postCollections"
        @select="onSelectPostEntry"
        @close="onClosePostCollection"
        @create="onCreatePostCollection"
        @view-winners="onViewPostWinners"
      />
    </template>

    <template v-else-if="!hasAnySource">
      <div class="flex flex-1 min-h-0 gap-2">
        <div class="flex-1 flex flex-col self-stretch min-w-0 gap-2">
          <!-- 左區 toolbar -->
          <div class="flex items-center gap-2 flex-wrap">
            <SessionSelector
              v-if="!isPostMode"
              :sessions="sessions"
              :selected="currentSession"
              :live-elapsed="elapsedDisplay"
              size="lg"
              @select="onSessionSelect"
              @create="createDialogVisible = true" />

            <!-- 「選擇商品」SplitButton -->
            <span v-tooltip.bottom="currentSession ? '' : t('live_order.tooltip.pick_source_first')" class="inline-flex">
              <SplitButton
                :label="t('live_order.button.add_product')"
                :model="addProductMenuItems"
                :disabled="!currentSession"
                icon="pi pi-plus"
                outlined
                size="small"
                @click="addProductDialogVisible = true"
              />
            </span>

            <!-- 「批次設定」SplitButton -->
            <span v-tooltip.bottom="currentSession ? '' : t('live_order.tooltip.pick_source_first')" class="inline-flex">
              <SplitButton
                :label="t('live_order.button.batch_edit')"
                :model="batchEditMenuItems"
                :disabled="!currentSession"
                outlined
                size="small"
                @click="batchEditDialogVisible = true"
              >
                <template #icon>
                  <FontAwesomeIcon :icon="['far', 'gear']" class="text-[14px] mr-1.5" />
                </template>
              </SplitButton>
            </span>

            <!-- 收單期間（貼文模式專用） -->
            <Button
              v-if="isPostMode"
              label="收單期間"
              icon="pi pi-calendar"
              outlined
              size="small"
              :disabled="!currentEnteredPost"
              @click="openPostPeriodDialog"
            />
          </div>

          <!-- 快速新增（與右側 panel 同高度起點） -->
          <QuickAddProductForm v-if="currentSession" ref="quickAddRef" @submit="onQuickAddProducts" />

          <div v-if="selectedProducts.length === 0" class="flex flex-col items-center justify-center gap-3 pt-12">
            <i class="pi pi-inbox text-5xl text-[var(--p-text-muted-color)]"></i>
            <p class="font-bold text-[18px] leading-normal text-[var(--p-text-color)]">{{ t('live_order.empty.no_product_content') }}</p>
            <p class="text-[14px] leading-normal text-[var(--p-text-muted-color)]">{{ t('live_order.empty.no_product_hint') }}</p>
          </div>
          <div v-else class="flex-1 overflow-y-auto">
            <!-- 列表式貼文收單：用 LiveProductTable，其他模式維持商品卡 grid -->
            <LiveProductTable
              v-if="isPostListMode"
              :products="selectedProducts"
              :sources="sources"
              :ordering-enabled="hasAnySource"
              @delete="onDeleteProduct"
              @end-ordering="onCardEndOrdering"
            />
            <div v-else class="grid gap-2" style="grid-template-columns: repeat(auto-fill, minmax(232px, 1fr))">
              <LiveProductCard
                v-for="p in selectedProducts"
                :key="p.id"
                :product="p"
                :ordering-enabled="hasAnySource"
                :is-post-mode="isPostMode"
                :locked="biddingLiveId !== null && p.id !== biddingLiveId && p.status === 'live'"
                v-model:status="p.status"
                @delete="onDeleteProduct"
                @end-ordering="onCardEndOrdering"
              />
            </div>
          </div>
        </div>

        <!-- 空狀態右側選擇收單來源（頂部對齊 QuickAdd） -->
        <div class="w-[340px] shrink-0 flex flex-col items-center gap-3 self-stretch pt-12">
          <i class="pi pi-inbox text-5xl text-[var(--p-text-muted-color)]"></i>
          <p class="font-bold text-[18px] leading-normal text-[var(--p-text-color)]">{{ t('live_order.empty.no_order_content') }}</p>
          <p class="text-[14px] leading-normal text-[var(--p-text-muted-color)]">{{ pickSourceHelperText }}</p>
          <span v-tooltip.bottom="pickSourceTooltip" class="mt-1">
            <button @click="onPickSource" :disabled="!canPickSource"
              :class="['border px-[13.25px] py-[9.75px] rounded-[6px] text-[15.75px] font-medium',
                canPickSource
                  ? 'bg-[var(--p-primary-color)] border-[var(--p-primary-color)] text-white hover:bg-[var(--p-primary-hover-color)]'
                  : 'bg-[var(--p-content-border-color)] border-[var(--p-content-border-color)] text-[var(--p-text-muted-color)] cursor-not-allowed']">
              {{ isPostMode ? t('live_order.button.pick_post') : t('live_order.button.pick_source') }}
            </button>
          </span>
        </div>
      </div>
    </template>

    <template v-else>
      <!-- 貼文模式進入後：頂部麵包屑可返回貼文收單列表 -->
      <Breadcrumb
        v-if="isPostMode"
        :model="postBreadcrumbItems"
        :home="{ icon: 'pi pi-list', label: '貼文收單列表', command: backToPostList }"
        class="!p-0 !bg-transparent"
        :pt="{ root: { class: '!border-0' } }"
      >
        <template #item="{ item }">
          <button
            v-if="item.command"
            class="flex items-center gap-1.5 text-[13px] text-[var(--p-primary-color)] hover:underline"
            @click="item.command"
          >
            <i v-if="item.icon" :class="item.icon" style="font-size: 12px" />
            {{ item.label }}
          </button>
          <span v-else class="flex items-center gap-1.5 text-[13px] text-[var(--p-text-color)]">
            <i v-if="item.icon" :class="item.icon" style="font-size: 12px" />
            {{ item.label }}
          </span>
        </template>
      </Breadcrumb>

      <OrderModeView
        :sources="sources"
        :products="selectedProducts"
        :show-comments="showComments"
        :use-table="isPostListMode"
        :is-post-mode="isPostMode"
        :bidding-live-id="biddingLiveId"
        @pick-source="onPickSource"
        @remove-source="onRemoveSource"
        @delete-product="onDeleteProduct"
        @end-ordering-product="onCardEndOrdering">

        <!-- 左區 toolbar：SessionSelector + 選擇商品 / 批次設定 SplitButton -->
        <template #left-toolbar>
          <div class="flex items-center gap-2 flex-wrap">
            <SessionSelector
              v-if="!isPostMode"
              :sessions="sessions"
              :selected="currentSession"
              :live-elapsed="elapsedDisplay"
              size="lg"
              @select="onSessionSelect"
              @create="createDialogVisible = true" />

            <span v-tooltip.bottom="currentSession ? '' : t('live_order.tooltip.pick_source_first')" class="inline-flex">
              <SplitButton
                :label="t('live_order.button.add_product')"
                :model="addProductMenuItems"
                :disabled="!currentSession"
                icon="pi pi-plus"
                outlined
                size="small"
                @click="addProductDialogVisible = true"
              />
            </span>

            <span v-tooltip.bottom="currentSession ? '' : t('live_order.tooltip.pick_source_first')" class="inline-flex">
              <SplitButton
                :label="t('live_order.button.batch_edit')"
                :model="batchEditMenuItems"
                :disabled="!currentSession"
                outlined
                size="small"
                @click="batchEditDialogVisible = true"
              >
                <template #icon>
                  <FontAwesomeIcon :icon="['far', 'gear']" class="text-[14px] mr-1.5" />
                </template>
              </SplitButton>
            </span>

            <!-- 收單期間（貼文模式專用） -->
            <Button
              v-if="isPostMode"
              label="收單期間"
              icon="pi pi-calendar"
              outlined
              size="small"
              :disabled="!currentEnteredPost"
              @click="openPostPeriodDialog"
            />
          </div>
        </template>

        <!-- 右區 toolbar：顯示留言 toggle + 結束收單 -->
        <template #right-toolbar>
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2">
              <i class="pi pi-comments text-[var(--p-text-color)]" style="font-size:14px"></i>
              <span class="text-[14px] font-medium text-[var(--p-text-color)]">{{ t('live_order.label.show_comments') }}</span>
              <ToggleSwitch v-model="showComments" />
            </div>
            <!-- 結束收單 SplitButton：主動作 = 結束所有收單中商品（先跳確認）；下拉 = 移除無收單商品卡 -->
            <SplitButton
              :label="t('live_order.button.end_ordering')"
              :model="quickActionMenuItems"
              icon="pi pi-power-off"
              severity="danger"
              outlined
              size="small"
              @click="askEndAllProducts"
            />
          </div>
        </template>

        <template #products-header>
          <QuickAddProductForm v-if="currentSession" ref="quickAddRef" @submit="onQuickAddProducts" />
        </template>
      </OrderModeView>
    </template>

    <LiveOrderSourceDialog v-model:visible="sourceDialogVisible"
      :used-post-ids="usedPostIds" :used-group-ids="usedGroupIds"
      :mode="isPostMode ? 'post' : 'live'"
      @confirm="onSourceConfirmed" />
    <CreateSessionDialog v-model:visible="createDialogVisible" @create="onSessionCreate" />
    <CreatePostCollectionDialog v-model:visible="createPostDialogVisible" @create="onCreatePostSubmit" />
    <WinnerListDialog v-model:visible="winnerDialogVisible" :product="winnerDialogProduct as never" />
    <AddProductDialog v-model:visible="addProductDialogVisible"
      :existing-products="selectedProducts" @add-products="onAddProducts" />
    <AddBundleDialog v-model:visible="addBundleDialogVisible"
      :existing-names="existingBundleNames" @add="onAddBundles" />
    <BatchEditDialog v-model:visible="batchEditDialogVisible"
      :products="selectedProducts" @apply="onBatchApply" @delete="onBatchDelete" />
    <PanelSettingsDialog v-model:visible="panelSettingsDialogVisible"
      :settings="panelSettings" @save="onPanelSettingsSave" />
    <PostPeriodDialog
      v-model:visible="postPeriodDialogVisible"
      :start-at="currentEnteredPost?.startAt"
      :end-at="currentEnteredPost?.endAt"
      @save="onPostPeriodSave" />
    <GiftFormDialog v-model:visible="giftDialogVisible" @submit="onGiftSubmit" />
    <EndOrderingSummaryDialog
      v-model:visible="endSummaryDialogVisible"
      :session-name="currentSession?.name ?? ''"
      :products="endingSummaryProducts"
      :mode="isPostMode ? 'post' : 'live'"
      @submit="onEndSummarySave"
    />
    <DuplicateProductDialog v-model:visible="duplicateDialogVisible" :names="duplicateNames" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import LiveOrderSourceDialog from './components/LiveOrderSourceDialog.vue'
import SessionSelector from './components/SessionSelector.vue'
import CreateSessionDialog from './components/CreateSessionDialog.vue'
import OrderModeView from './components/OrderModeView.vue'
import LiveProductCard from './components/LiveProductCard.vue'
import AddProductDialog from './components/AddProductDialog.vue'
import BatchEditDialog from './components/BatchEditDialog.vue'
import PanelSettingsDialog, { type PanelSettings } from './components/PanelSettingsDialog.vue'
import AddBundleDialog, { type BundlePickPayload } from './components/AddBundleDialog.vue'
import EndOrderingSummaryDialog, { type EndOrderingPayload } from './components/EndOrderingSummaryDialog.vue'
import QuickAddProductForm from './components/QuickAddProductForm.vue'
import LiveProductTable from './components/LiveProductTable.vue'
import PostCollectionOverview, { type PostCollection } from './components/PostCollectionOverview.vue'
import WinnerListDialog from './components/WinnerListDialog.vue'
import CreatePostCollectionDialog, { type CreatePostCollectionPayload } from './components/CreatePostCollectionDialog.vue'
import PostPeriodDialog from './components/PostPeriodDialog.vue'
import { addLiveOrderRecord } from './utils/liveOrderRecords'
import GiftFormDialog, { type GiftSubmitPayload } from './components/GiftFormDialog.vue'
import DuplicateProductDialog from './components/DuplicateProductDialog.vue'
import { addToCatalog, isCatalogDuplicate } from './utils/productCatalog'
import type { MenuItem } from 'primevue/menuitem'

interface ProductSpec {
  id?: number
  name?: string
  stock?: number
  sold?: number
  price?: number
  [key: string]: unknown
}

interface LiveProduct {
  id: number
  name?: string
  keyword?: string
  sku?: string
  price?: number
  stock?: number
  sold?: number
  status?: string
  startedAt?: number
  selectedSpecs?: ProductSpec[]
  specs?: ProductSpec[]
  [key: string]: unknown
}

interface LiveSource {
  id: number
  type: string
  label: string
  addedAt: Date
  postId?: number | string | null
  groupId?: number | string | null
}

interface LiveSession {
  id: number
  name: string
  date: string
  products: LiveProduct[]
  sources: LiveSource[]
}

interface SessionCreatePayload {
  name: string
  date: string
}

interface BatchApplyPayload {
  productIds: number[]
  patch: Record<string, unknown>
}

interface SourceConfirmExtras {
  postId?: number | string | null
  groupId?: number | string | null
}

const { t } = useI18n()
const confirm = useConfirm()
const toast = useToast()
const route = useRoute()

/**
 * 頁面模式：依 route 名稱判斷。
 * - `live.order` → 直播收單（完整功能）
 * - `live.order.post` → 貼文收單（無場次、無批次設定、無快速新增）
 * - `live.order.community` → 社群收單（保留完整功能）
 */
const isPostMode = computed(() =>
  route.name === 'live.order.post' || route.name === 'live.order.post.list',
)
/** 列表式貼文收單：body 改用 LiveProductTable 而非商品卡 grid。 */
const isPostListMode = computed(() => route.name === 'live.order.post.list')

const addProductDialogVisible = ref(false)
const addBundleDialogVisible = ref(false)
const giftDialogVisible = ref(false)

// SplitButton：主按鈕開選擇商品；下拉開組合商品 / 禮物
const addProductMenuItems = computed<MenuItem[]>(() => [
  {
    label: t('live_order.button.add_bundle'),
    icon: 'pi pi-box',
    command: () => { addBundleDialogVisible.value = true },
  },
  {
    label: t('live_order.button.send_gift'),
    icon: 'pi pi-gift',
    command: () => { giftDialogVisible.value = true },
  },
])

// SplitButton：主按鈕開批次設定；下拉開面板設定
const panelSettingsDialogVisible = ref(false)
const batchEditMenuItems = computed<MenuItem[]>(() => [
  {
    label: t('live_order.button.panel_setting'),
    icon: 'pi pi-sliders-h',
    command: () => { panelSettingsDialogVisible.value = true },
  },
])

// 貼文模式專屬：收單期間設定獨立按鈕（在「批次設定」SplitButton 右側）
const postPeriodDialogVisible = ref(false)
function openPostPeriodDialog(): void {
  postPeriodDialogVisible.value = true
}
function onPostPeriodSave(payload: { startAt: Date | null; endAt: Date | null }): void {
  const post = currentEnteredPost.value
  if (!post) return
  post.startAt = payload.startAt
  post.endAt = payload.endAt
  const dl = deadlineFieldsFor(post.startAt, post.endAt)
  post.deadlineText = dl.deadlineText
  post.deadlineSeverity = dl.deadlineSeverity
  post.deadlineMinutes = dl.deadlineMinutes
  toast.add({ severity: 'success', summary: '收單期間已更新', life: 1800 })
}

/** 當下從 overview 點進來的那筆 PostCollection（依 postSession.sources[0].postId 找） */
const currentEnteredPost = computed<PostCollection | undefined>(() => {
  if (!isPostMode.value) return undefined
  const enteredSource = postSession.value.sources?.[0] as { postId?: number } | undefined
  if (enteredSource?.postId == null) return undefined
  return postCollections.value.find((p) => p.id === enteredSource.postId)
})

// 結束收單 SplitButton 下拉：移除沒有收單過（sold === 0）的商品卡
const quickActionMenuItems = computed<MenuItem[]>(() => [
  {
    label: t('live_order.button.remove_done'),
    icon: 'pi pi-trash',
    disabled: !hasNoSaleProduct.value,
    command: () => { removeNoSaleProducts() },
  },
])

// 綜合收單頁設定：原型階段以本地 state 保存，存擋僅 toast
const panelSettings = ref<PanelSettings>({
  duplicateOrderMode: 'keep_latest',
  allowKeywordCancel: true,
  notifyOrderStart: true,
  notifyOrderEnd: true,
  notifyOutOfStock: true,
  notifyWinnerOrderCreated: false,
  autoPrintShipment: true,
})
function onPanelSettingsSave(next: PanelSettings): void {
  panelSettings.value = next
  toast.removeAllGroups()
  toast.add({
    severity: 'success',
    summary: t('live_order.toast.panel_setting_saved'),
    life: 2000,
  })
}

/**
 * 送禮物送出：把禮物加進當前場次商品列表，呈現為商品卡。
 *
 * `isGift: true` 旗標標記禮物來源，給商品卡渲染辨識。
 * 庫存扣減 / 入庫策略尚未規劃，暫時把 stock 直接設為發放數量，由後續實作決定是否扣除。
 */
function onGiftSubmit(payload: GiftSubmitPayload): void {
  if (!currentSession.value) return
  currentSession.value.products.push({
    id: Date.now(),
    name: payload.name,
    keyword: payload.keyword,
    price: 0,
    stock: payload.quantity,
    sold: 0,
    status: 'ready',
    specs: [],
    isGift: true,
    note: payload.message,
    imageUrl: payload.imageUrl,
  })
  toast.removeAllGroups();   toast.add({
    severity: 'success',
    summary: t('live_order.toast.gift_sent'),
    detail: payload.name,
    life: 2500,
  })
}
const batchEditDialogVisible = ref(false)
const showComments = ref(true)

/** Apply a batch-edit patch to selected products in the current session. */
function onBatchApply({ productIds, patch }: BatchApplyPayload): void {
  if (!currentSession.value) return
  const idSet = new Set(productIds)
  let updated = 0
  currentSession.value.products.forEach(p => {
    if (!idSet.has(p.id)) return
    Object.entries(patch).forEach(([key, value]) => { (p as Record<string, unknown>)[key] = value })
    updated++
  })
  toast.removeAllGroups();   toast.add({
    severity: 'success',
    summary: t('live_order.toast.batch_edit_done'),
    detail: t('live_order.toast.batch_edit_detail', { count: updated, fields: Object.keys(patch).length }),
    life: 2500,
  })
}

/** 批次刪除：依勾選 id 從當前場次的 products 移除，並 toast 提示。 */
function onBatchDelete(productIds: number[]): void {
  if (!currentSession.value || productIds.length === 0) return
  const idSet = new Set(productIds)
  const list = currentSession.value.products
  const before = list.length
  currentSession.value.products = list.filter(p => !idSet.has(p.id))
  const removed = before - currentSession.value.products.length
  if (removed > 0) {
    toast.removeAllGroups();     toast.add({
      severity: 'success',
      summary: t('live_order.toast.bulk_delete_done'),
      detail: t('live_order.toast.bulk_delete_detail', { count: removed }),
      life: 2500,
    })
  }
}

// ── 場次 ─────────────────────────────────────────
const sessions = ref<LiveSession[]>([
  { id: 1, name: '春季首播',   date: '2025/05/13', products: [], sources: [] },
  { id: 2, name: '母親節特賣', date: '2025/05/10', products: [], sources: [] },
])
const currentSession = ref<LiveSession | null>(null)

/**
 * 貼文收單獨立容器：和直播收單的 `sessions` 完全隔離，避免兩邊建立的商品 / 來源互相同步。
 * 不放進 `sessions` 陣列，避免 SessionSelector 把它列在直播模式可選清單。
 * name 給有意義的預設文字，結束收單彙總彈窗與收單紀錄寫入時才不會空白。
 */
const postSession = ref<LiveSession>({
  id: -1,
  name: '貼文收單',
  date: new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
  products: [],
  sources: [],
})

// 貼文收單總覽 mock：對齊 multi_post_collection_overview_mockup.html
const postCollections = ref<PostCollection[]>([
  {
    id: 8001,
    name: '日本藥妝代購',

    pendingCount: 22,
    updateNote: '3 分鐘前更新',
    soldCount: 188,
    commentCount: 210,
    deadlineText: '未設結單',
    deadlineSeverity: 'warning',
    status: 'waiting_close',
    deadlineMinutes: null,
    lastCommentMinutes: 3,
    products: [
      { id: 80101, name: '麗芙隆隔離乳 50ml', keyword: 'JP1', price: 590, stock: 200, sold: 70 },
      { id: 80102, name: '蜂王乳面膜 5 入', keyword: 'JP2', price: 320, stock: 250, sold: 90 },
      { id: 80103, name: '茶花泡澡入浴劑 10 入', keyword: 'JP3', price: 280, stock: 150, sold: 28 },
    ],
  },
  {
    id: 8002,
    name: '2/14 日韓零食團',

    pendingCount: 9,
    updateNote: '2 分鐘前更新',
    soldCount: 112,
    commentCount: 128,
    deadlineText: '今晚 21:00 結單',
    deadlineSeverity: 'secondary',
    status: 'ongoing',
    deadlineMinutes: 360,
    lastCommentMinutes: 2,
    products: [
      { id: 80201, name: '日本 LOTTE 巧克力派 12 入', keyword: 'A1', price: 199, stock: 100, sold: 45 },
      { id: 80202, name: '韓國 ORION 蜂蜜奶油薯片', keyword: 'A2', price: 89, stock: 200, sold: 67 },
    ],
  },
  {
    id: 8003,
    name: '母親節康乃馨預購',

    pendingCount: 4,
    updateNote: '11 分鐘前更新',
    soldCount: 60,
    commentCount: 64,
    deadlineText: '2 天後結單',
    deadlineSeverity: 'secondary',
    status: 'ongoing',
    deadlineMinutes: 60 * 24 * 2,
    lastCommentMinutes: 11,
    products: [
      { id: 80301, name: '康乃馨花束 6 朵', keyword: 'M1', price: 680, stock: 80, sold: 36 },
      { id: 80302, name: '永生花禮盒', keyword: 'M2', price: 1280, stock: 40, sold: 24 },
    ],
  },
  {
    id: 8004,
    name: '週三蔬菜箱',

    updateNote: '剛剛更新',
    soldCount: 45,
    commentCount: 45,
    deadlineText: '30 分鐘後',
    deadlineSeverity: 'danger',
    status: 'ongoing',
    deadlineMinutes: 30,
    lastCommentMinutes: 0,
    products: [
      { id: 80401, name: '有機葉菜綜合箱', keyword: 'V1', price: 480, stock: 60, sold: 30 },
      { id: 80402, name: '產地直送番茄', keyword: 'V2', price: 220, stock: 80, sold: 15 },
    ],
  },
  {
    id: 8005,
    name: '韓國服飾團',

    pendingCount: 3,
    updateNote: '已達結單時間',
    soldCount: 30,
    commentCount: 33,
    deadlineText: '待結單',
    deadlineSeverity: 'warning',
    status: 'waiting_close',
    deadlineMinutes: 0,
    lastCommentMinutes: 8,
    products: [
      { id: 80501, name: '韓版針織毛衣', keyword: 'K1', price: 890, stock: 50, sold: 18 },
      { id: 80502, name: '高腰寬褲', keyword: 'K2', price: 650, stock: 60, sold: 12 },
    ],
  },
])

/** 各貼文上一次離開時的商品 / 設定快照；以 post.id 為 key。
 *  從 overview 進入時優先吃 cache，沒有的話再用 post.products mock。 */
const postSessionCache = new Map<number, LiveProduct[]>()

/** 從總覽點按一筆 → 視為已挑選來源 + 把該貼文商品塞進 postSession，直接進入收單畫面 */
function onSelectPostEntry(id: number): void {
  const post = postCollections.value.find((p) => p.id === id)
  if (!post) return
  postSession.value.name = post.name
  // 收單期間自動判斷：post.startAt 為 null 或已過 → 商品直接 live 開始收單；
  // 尚未到 startAt → 商品先停在 ready，由排程 watcher 在時間到時自動切 live；
  // 已結束的貼文 → 商品停在 ready 供檢視
  const isStarted = !post.startAt || post.startAt.getTime() <= Date.now()
  const initialStatus = post.status === 'closed_today' ? 'ready' : (isStarted ? 'live' : 'ready')
  // 先看 cache 有沒有上次留下的狀態，沒有就用 overview 的 mock 商品
  const cached = postSessionCache.get(post.id)
  postSession.value.products = cached ?? (post.products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    keyword: p.keyword,
    price: p.price,
    stock: p.stock,
    sold: p.sold ?? 0,
    status: initialStatus,
    specs: [],
  }))
  postSession.value.sources = [{
    id: post.id,
    type: 'fb',
    label: post.name,
    postId: post.id,
  } as unknown as never]
  currentSession.value = postSession.value
}

/** 從貼文列表點「得標清單」icon → 開 WinnerListDialog（用該檔第一個商品） */
const winnerDialogVisible = ref(false)
const winnerDialogProduct = ref<Record<string, unknown>>({})
function onViewPostWinners(id: number): void {
  const post = postCollections.value.find((p) => p.id === id)
  const first = (postSessionCache.get(id)?.[0] ?? post?.products?.[0]) as Record<string, unknown> | undefined
  if (!first) {
    toast.add({ severity: 'info', summary: '此貼文尚無商品', life: 1500 })
    return
  }
  winnerDialogProduct.value = first
  winnerDialogVisible.value = true
}

/** 「結單」按鈕：把該檔狀態改為已結單、跳 toast，並把彙總寫進收單紀錄頁。
 *  優先採用 postSessionCache 的資料（包含使用者進入後的編輯與 ticker 累加），
 *  沒有 cache 才回退到 overview 上的 mock products。 */
function onClosePostCollection(id: number): void {
  const post = postCollections.value.find((p) => p.id === id)
  if (!post) return
  const cached = postSessionCache.get(id)
  const sourceProducts: Array<{
    id: number; name?: string; keyword?: string; price?: number; stock?: number; sold?: number;
    specs?: Array<{ name?: string; stock?: number; sold?: number; price?: number }>;
  }> = cached ?? (post.products ?? [])
  const recordedProducts = sourceProducts.map((p) => {
    const sold = p.sold ?? 0
    const price = p.price ?? 0
    const specs = (p.specs ?? []).map((s) => ({
      name: s.name ?? '',
      stock: s.stock ?? 0,
      winnerCount: s.sold ?? 0,
      sold: s.sold ?? 0,
      total: (s.price ?? price) * (s.sold ?? 0),
    }))
    return {
      id: p.id,
      name: p.name ?? '',
      keyword: p.keyword,
      price,
      winnerCount: sold,
      sold,
      total: price * sold,
      freeShipping: false,
      specs,
    }
  })
  const totalAmount = recordedProducts.reduce((s, p) => s + p.total, 0)
  const orderCount = recordedProducts.reduce((s, p) => s + p.winnerCount, 0)
  addLiveOrderRecord({
    sessionName: post.name,
    endedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    totalAmount,
    productCount: recordedProducts.length,
    orderCount,
    products: recordedProducts,
  })
  post.status = 'closed_today'
  toast.add({ severity: 'success', summary: `已結單「${post.name}」`, detail: '已寫入收單紀錄', life: 2000 })
}

/** 「新增貼文收單」按鈕：開啟命名 + 渠道對話框。 */
const createPostDialogVisible = ref(false)
function onCreatePostCollection(): void {
  createPostDialogVisible.value = true
}

/** 把 Date 起迄轉成 deadline*** 顯示欄位 */
function deadlineFieldsFor(startAt: Date | null, endAt: Date | null): {
  deadlineText: string
  deadlineSeverity: 'secondary' | 'warning' | 'danger'
  deadlineMinutes: number | null
  orderingPeriod: string
} {
  const fmt = (d: Date): string => {
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${m}/${day} ${hh}:${mm}`
  }
  const orderingPeriod = startAt && endAt
    ? `${fmt(startAt)} - ${fmt(endAt)}`
    : (endAt ? `- ${fmt(endAt)}` : '未設')
  if (!endAt) {
    return { deadlineText: '未設結單', deadlineSeverity: 'warning', deadlineMinutes: null, orderingPeriod }
  }
  const now = Date.now()
  const diffMin = Math.round((endAt.getTime() - now) / 60000)
  if (diffMin <= 0) {
    return { deadlineText: '已達結單時間', deadlineSeverity: 'warning', deadlineMinutes: 0, orderingPeriod }
  }
  let text: string
  let severity: 'secondary' | 'warning' | 'danger' = 'secondary'
  if (diffMin < 60) {
    text = `${diffMin} 分鐘後結單`
    severity = 'danger'
  } else if (diffMin < 60 * 24) {
    text = `今天 ${String(endAt.getHours()).padStart(2, '0')}:${String(endAt.getMinutes()).padStart(2, '0')} 結單`
    severity = 'warning'
  } else {
    const days = Math.ceil(diffMin / (60 * 24))
    text = `${days} 天後結單`
  }
  return { deadlineText: text, deadlineSeverity: severity, deadlineMinutes: diffMin, orderingPeriod }
}

/** 命名後送出 → 在 overview 最前面 unshift 新檔 + 自動進入該檔的收單頁 */
function onCreatePostSubmit(payload: CreatePostCollectionPayload): void {
  const newId = Date.now()
  const dl = deadlineFieldsFor(payload.startAt, payload.endAt)
  const newPost: PostCollection = {
    id: newId,
    name: payload.name,

    pendingCount: 0,
    updateNote: '剛建立',
    soldCount: 0,
    commentCount: 0,
    deadlineText: dl.deadlineText,
    deadlineSeverity: dl.deadlineSeverity,
    status: 'ongoing',
    deadlineMinutes: dl.deadlineMinutes,
    lastCommentMinutes: 0,
    products: [],
    startAt: payload.startAt,
    endAt: payload.endAt,
  }
  postCollections.value.unshift(newPost)
  onSelectPostEntry(newId)
}

/** 麵包屑：第二層顯示當前進入的貼文名稱 */
const postBreadcrumbItems = computed<MenuItem[]>(() => [
  { label: currentSession.value?.name ?? '貼文收單', icon: 'pi pi-file' },
])
/** 返回貼文收單列表：把當下商品快照寫進 cache、同步「已成單」回 overview，
 *  再清掉 postSession 的 source / products → 觸發 !hasAnySource → 回 overview */
function backToPostList(): void {
  syncPostStatsBack()
  postSession.value.sources = []
  postSession.value.products = []
  currentSession.value = postSession.value
}

/** 把 postSession 當下商品的 sold 加總，同步回 overview：
 *  - soldCount = 全部商品 sold 相加（得標總數）
 *  - 新增的得標數 → 從 pendingCount 扣掉（已消化的待處理留言）
 *  - commentCount 保持 >= soldCount + pendingCount（避免 progressbar 超過 100%）
 *  進度條 = soldCount / commentCount，會跟著一起刷新。
 *  同步順便把商品快照寫進 cache，下次進來能還原。 */
function syncPostStatsBack(): void {
  const enteredSource = postSession.value.sources?.[0] as { postId?: number } | undefined
  const postId = enteredSource?.postId
  if (postId == null) return
  const products = postSession.value.products as LiveProduct[]
  postSessionCache.set(postId, products)
  const post = postCollections.value.find((p) => p.id === postId)
  if (!post) return
  const newSold = products.reduce((s, p) => s + (p.sold ?? 0), 0)
  const delta = newSold - post.soldCount
  post.soldCount = newSold
  if (delta > 0) {
    post.pendingCount = Math.max(0, (post.pendingCount ?? 0) - delta)
    const minComment = newSold + (post.pendingCount ?? 0)
    if ((post.commentCount ?? 0) < minComment) post.commentCount = minComment
  }
}

/**
 * 切換模式時恢復對應容器，避免直播 ↔ 貼文之間殘留 currentSession：
 * - 進貼文模式：先保存目前直播選擇的場次，再切到 postSession
 * - 回直播模式：恢復先前的直播場次（null 表示尚未選擇）
 */
let lastLiveSession: LiveSession | null = null
watch(isPostMode, (post, oldPost) => {
  if (post) {
    if (oldPost !== undefined && currentSession.value !== postSession.value) {
      lastLiveSession = currentSession.value
    }
    currentSession.value = postSession.value
  } else if (oldPost !== undefined) {
    currentSession.value = lastLiveSession
  }
}, { immediate: true })

function onSessionSelect(s: LiveSession): void { currentSession.value = s }

const createDialogVisible = ref(false)
/** Create a new session from the dialog payload and select it. */
function onSessionCreate(payload: SessionCreatePayload): void {
  const newSession: LiveSession = { id: Date.now(), ...payload, products: [], sources: [] }
  sessions.value.unshift(newSession)
  currentSession.value = newSession
  toast.removeAllGroups();   toast.add({ severity: 'success', summary: t('live_order.toast.session_created'), detail: newSession.name, life: 2500 })
}

// ── 商品（綁定到當前場次）─────────────────────────
const selectedProducts = computed<LiveProduct[]>(() => currentSession.value?.products ?? [])

/**
 * 當前場次中正在「競價 + 收單中」的商品 id；任一支競價商品 live 時其他卡片就被鎖住。
 * 用於 OrderModeView / 空狀態 grid 把 `locked` 傳給非該卡的 LiveProductCard。
 */
const biddingLiveId = computed<number | null>(() => {
  const p = selectedProducts.value.find(p => (p as Record<string, unknown>).bidding && p.status === 'live')
  return p ? p.id : null
})

interface QuickAddProductPayload {
  id: number
  name: string
  keyword: string
  price: number
  stock: number
  specs: never[]
}

// 重複商品提示彈窗
const duplicateDialogVisible = ref(false)
const duplicateNames = ref<string[]>([])

/**
 * 快速新增商品：把每筆都加入當前場次的 products 清單；
 * 原型階段不做重複名稱檢查、不彈重複 dialog，只顯示一個成功 toast。
 */
function onQuickAddProducts(payloads: QuickAddProductPayload[]): void {
  if (!currentSession.value || payloads.length === 0) return
  payloads.forEach((p) => {
    currentSession.value!.products.push({
      id: p.id,
      name: p.name,
      keyword: p.keyword,
      price: p.price,
      stock: p.stock,
      sold: 0,
      status: 'ready',
      specs: [],
    })
    // 同步寫進「選擇商品」picker 的目錄；名稱重複就不重複加（避免 duplicate id 進去）
    if (!isCatalogDuplicate(p.name)) {
      addToCatalog({
        id: p.id,
        name: p.name,
        sku: p.keyword || `QA-${p.id}`,
        category: '快速新增',
        price: p.price,
        stock: p.stock,
        status: '上架中',
      })
    }
  })
  toast.removeAllGroups()
  toast.add({
    severity: 'success',
    summary: t('live_order.toast.products_added'),
    detail: t('live_order.toast.products_added_detail', { added: payloads.length }),
    life: 2000,
  })
}

/** Remove a product card from the current session. */
function onDeleteProduct(id: number): void {
  if (!currentSession.value) return
  const list = currentSession.value.products
  const idx = list.findIndex((p) => p.id === id)
  if (idx === -1) return
  list.splice(idx, 1)
}

/**
 * 從「組合商品」picker 把選好的 bundle 加進當前場次。
 * 每個 bundle 映射成一張 isBundle 卡：本身有獨立 keyword/price/stock；
 * 子商品 (bundleItems) 從 catalog 補上 name + spec 文字（顯示用）。
 */
function onAddBundles(payload: BundlePickPayload): void {
  if (!currentSession.value) return
  const target = currentSession.value.products
  const existingNames = new Set(target.map((p) => p.name).filter((n): n is string => !!n))
  let added = 0
  const setting = payload.orderSetting
  payload.bundles.forEach((b) => {
    if (existingNames.has(b.name)) return
    target.push({
      id: b.id,
      name: b.name,
      keyword: b.keyword,
      sku: b.sku,
      price: b.price,
      stock: b.stock,
      sold: 0,
      status: 'ready',
      specs: [],
      isBundle: true,
      bundleItems: b.bundleItems.map((it) => ({
        catalogProductId: it.catalogProductId,
        qty: it.qty,
      })),
      // 套用一次性的得標設定（與「選擇商品」流程一致）
      ...(setting
        ? {
            checkoutType: setting.checkoutType,
            multiCart: setting.multiCart,
            bidding: setting.bidding,
            flatPrice: setting.flatPrice,
            startingBid: setting.startingBid,
            allowMixColor: setting.allowMixColor,
            allowOversell: setting.allowOversell,
            pickSpecAfterWinning: setting.pickSpecAfterWinning,
            plusLimit: setting.plusLimit,
            starFilter: setting.starFilter,
            newCustomerAnyStar: setting.newCustomerAnyStar,
            memberOnly: setting.memberOnly,
            quantityDiscounts: setting.quantityDiscounts,
          }
        : {}),
    } as LiveProduct)
    added++
  })
  toast.removeAllGroups()
  toast.add({
    severity: added > 0 ? 'success' : 'warn',
    summary: added > 0 ? t('live_order.toast.bundles_added') : t('live_order.toast.bundles_not_added'),
    detail: t('live_order.toast.bundles_added_detail', { count: added }),
    life: 2500,
  })
}

/** 當前場次內已加入的商品名稱（供 bundle picker 標「已加入」用） */
const existingBundleNames = computed(() => new Set(
  selectedProducts.value.map((p) => p.name).filter((n): n is string => !!n),
))

/** Merge newly added products into the current session, skipping duplicates. */
function onAddProducts(products: LiveProduct[]): void {
  if (!currentSession.value) return
  const target = currentSession.value.products
  const ids = new Set(target.map(p => p.id))
  let added = 0
  products.forEach(p => {
    if (!ids.has(p.id)) {
      target.push({ ...p, status: p.status || 'ready', sold: p.sold ?? 0 })
      added++
    }
  })
  const skipped = products.length - added
  toast.removeAllGroups();   toast.add({
    severity: added > 0 ? 'success' : 'warn',
    summary: added > 0 ? t('live_order.toast.products_added') : t('live_order.toast.products_not_added'),
    detail: skipped > 0
      ? t('live_order.toast.products_added_with_skipped', { added, skipped })
      : t('live_order.toast.products_added_detail', { added }),
    life: 2500,
  })
}

// ── 收單來源（多筆，綁定到當前場次） ─────────────
const sourceDialogVisible = ref(false)
const sources = computed<LiveSource[]>(() => currentSession.value?.sources ?? [])

const hasAnySource = computed(() => sources.value.length > 0)

const hasLiveProduct = computed(() => selectedProducts.value.some(p => p.status === 'live'))

// 各狀態的商品數，給工具列上的小型統計顯示用
const statusCounts = computed(() => ({
  live: selectedProducts.value.filter(p => p.status === 'live').length,
  ready: selectedProducts.value.filter(p => p.status === 'ready' || !p.status).length,
  done: selectedProducts.value.filter(p => p.status === 'done').length,
}))

/**
 * 銷售總計：當前場次「已成功下標」商品金額（禮物不列入）。
 * 直接讀每商品實際的 `sold`（由 LiveProductCard 收單中 ticker 累計），
 * 因此會隨商品卡上升、所有商品結束收單後自然停在該金額。
 */
const salesTotal = computed(() => {
  return selectedProducts.value.reduce((sum, p) => {
    if ((p as { isGift?: boolean }).isGift) return sum
    const price = (p.price as number | undefined) ?? 0
    const sold = (p.sold as number | undefined) ?? 0
    return sum + price * sold
  }, 0)
})

/** 銷售總計顯示：>= 1000 用 k 後綴（保留至多 1 位小數，去掉尾 .0），小於則直接千分位。圖示已是錢符號，數字前不重複加 $。 */
const salesTotalDisplay = computed(() => {
  const n = salesTotal.value
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return n.toLocaleString()
})

const canPickSource = computed(() =>
  Boolean(currentSession.value) && selectedProducts.value.length > 0)

const pickSourceTooltip = computed(() => {
  if (!currentSession.value) return t('live_order.tooltip.pick_or_create_session')
  if (selectedProducts.value.length === 0) return t('live_order.tooltip.add_product_first')
  return ''
})

const pickSourceHelperText = computed(() => {
  if (!currentSession.value) return t('live_order.tooltip.pick_or_create_session')
  if (selectedProducts.value.length === 0) return t('live_order.empty.pick_source_after_adding')
  return t('live_order.empty.click_button_below_to_pick_source')
})

/** 快速新增區的 component ref，用來在切到收單來源 dialog 時程式化收合。 */
const quickAddRef = ref<{ collapse?: () => void } | null>(null)

function onPickSource(): void {
  if (!canPickSource.value) return
  // 點下「選擇收單來源」順手把快速新增收合，讓 dialog / 下方商品卡更聚焦
  quickAddRef.value?.collapse?.()
  sourceDialogVisible.value = true
}

/** Map a confirmed source type/extras to a LiveSource entry on the current session. */
function onSourceConfirmed(type: string, extras: SourceConfirmExtras = {}): void {
  const labelKeyMap: Record<string, string> = {
    fb: 'live_order.source_type_label.fb',
    ig: 'live_order.source_type_label.ig',
    group: 'live_order.source_type_label.group',
    live: 'live_order.source_type_label.live',
    tiktok: 'live_order.source_type_label.tiktok',
    livebuy: 'live_order.source_type_label.livebuy',
  }
  const labelKey = labelKeyMap[type]
  if (!labelKey) return
  const label = t(labelKey)
  if (!currentSession.value) return
  currentSession.value.sources.push({
    id: Date.now() + Math.random(),
    type,
    label,
    addedAt: new Date(),
    postId:  extras.postId  ?? null,
    groupId: extras.groupId ?? null,
  })
  toast.removeAllGroups();   toast.add({
    severity: 'success',
    summary: t('live_order.toast.source_added'),
    detail: label,
    life: 2500,
  })
}

// 當前場次已使用的貼文 / 社團 id 清單（傳入 dialog 用於 disable）
const usedPostIds = computed(() =>
  (currentSession.value?.sources ?? [])
    .filter(s => (s.type === 'fb' || s.type === 'ig') && s.postId != null)
    .map(s => s.postId as number | string)
)
const usedGroupIds = computed(() =>
  (currentSession.value?.sources ?? [])
    .filter(s => s.type === 'group' && s.groupId != null)
    .map(s => s.groupId as number | string)
)

function onRemoveSource(id: number | string): void {
  const target = sources.value.find(s => s.id === id)
  if (!target) return
  confirm.require({
    message: t('live_order.dialog.remove_source_message', { label: target.label }),
    header: t('live_order.dialog.remove_source_header'),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: t('live_order.button.cancel'), severity: 'secondary', outlined: true },
    acceptProps: { label: t('live_order.dialog.remove'), severity: 'danger' },
    accept: () => {
      if (!currentSession.value) return
      const arr = currentSession.value.sources
      const idx = arr.findIndex(s => s.id === id)
      if (idx !== -1) arr.splice(idx, 1)
      toast.removeAllGroups();       toast.add({ severity: 'info', summary: t('live_order.toast.source_removed'), detail: target.label, life: 2000 })
    },
  })
}

// ── 結束收單：開彙總 dialog；右上「結束收單」結束全部 live 商品，單卡按鈕只結束該張 ──
const endSummaryDialogVisible = ref(false)
/** 取消／關閉彙總彈窗時，把被凍結的商品 ticker 重新解凍（恢復累加）。 */
watch(endSummaryDialogVisible, (open) => {
  if (open) return
  selectedProducts.value.forEach((p) => {
    if (endingProductIds.value.has(p.id)) {
      ;(p as Record<string, unknown>).frozen = false
    }
  })
  endingProductIds.value = new Set()
})
/** 這次摘要要結束的商品 id 集合；dialog 內容與儲存時 status 歸位都依此 */
const endingProductIds = ref<Set<number>>(new Set())

const endingSummaryProducts = computed(() =>
  selectedProducts.value.filter((p) => endingProductIds.value.has(p.id)),
)

function confirmEndAllProducts(): void {
  // 結束收單彙總納入：仍在收單中 OR 已有得標（sold > 0）的商品
  const ids = selectedProducts.value
    .filter((p) => p.status === 'live' || (p.sold ?? 0) > 0)
    .map((p) => p.id)
  endingProductIds.value = new Set(ids)
  // 立刻凍結 ticker（避免結帳時還在累加）
  selectedProducts.value.forEach((p) => {
    if (endingProductIds.value.has(p.id)) (p as Record<string, unknown>).frozen = true
  })
  endSummaryDialogVisible.value = true
}

/** 按下右區「結束收單」主按鈕：先跳確認彈窗，確認後才開啟結束收單彙總（即便當下沒收單中商品，也會列出已有得標的紀錄）。 */
function askEndAllProducts(): void {
  confirm.require({
    header: t('live_order.dialog.end_ordering_confirm_header'),
    message: t('live_order.dialog.end_ordering_confirm_message'),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: t('live_order.button.cancel'), severity: 'secondary', outlined: true },
    acceptProps: { label: t('live_order.button.confirm'), severity: 'danger' },
    accept: () => { confirmEndAllProducts() },
  })
}

/** 一鍵移除：把當前場次中所有「沒有收單過」（sold 為 0 或 undefined）的商品卡刪掉 */
const hasNoSaleProduct = computed(() => selectedProducts.value.some(p => !(p.sold ?? 0) && p.status !== 'live'))
function removeNoSaleProducts(): void {
  if (!currentSession.value || !hasNoSaleProduct.value) return
  currentSession.value.products = currentSession.value.products.filter((p) => {
    // 留住：有售出 或 收單中（避免誤刪正在收單的卡）
    return (p.sold ?? 0) > 0 || p.status === 'live'
  })
  toast.add({
    severity: 'success',
    summary: t('live_order.toast.batch_edit_done'),
    detail: t('live_order.button.remove_done'),
    life: 2000,
  })
}

/** 商品卡（或 table 列）emit 的單筆結束收單 → 彙總彈窗只列那一張卡。 */
function onCardEndOrdering(id: number): void {
  endingProductIds.value = new Set([id])
  const p = selectedProducts.value.find((x) => x.id === id)
  if (p) (p as Record<string, unknown>).frozen = true
  endSummaryDialogVisible.value = true
}

/** Summary dialog 按下「儲存」：寫入收單紀錄、把摘要內商品 status 回 ready。 */
function onEndSummarySave(payload: EndOrderingPayload): void {
  const orderCount = payload.products.reduce((sum, p) => sum + p.winnerCount, 0)
  addLiveOrderRecord({
    sessionName: payload.sessionName,
    endedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    totalAmount: payload.totalAmount,
    productCount: payload.products.length,
    orderCount,
    products: payload.products.map((p) => ({
      id: p.id,
      name: p.name,
      keyword: p.keyword,
      price: p.price,
      winnerCount: p.winnerCount,
      sold: p.sold,
      total: p.total,
      freeShipping: p.freeShipping,
      specs: p.specs,
    })),
  })
  // 只把本次摘要的商品歸位：status 回 ready、sold / 規格 sold / 起算時間都重置，
  // 確保下一輪重新「開始收單」時 ticker 從 0 起算、不會接續累加
  let changed = 0
  selectedProducts.value.forEach((p) => {
    if (!endingProductIds.value.has(p.id)) return
    // 不論商品當下是 live 或 ready，結束收單彙總都歸位：status 回 ready、sold / 規格 sold / startedAt 重置
    p.status = 'ready'
    p.sold = 0
    ;(p.startedAt as number | undefined) = undefined
    ;(p as Record<string, unknown>).frozen = false
    const specs = (p.selectedSpecs?.length ? p.selectedSpecs : p.specs) ?? []
    specs.forEach((s) => { s.sold = 0 })
    changed++
  })
  endingProductIds.value = new Set()
  toast.removeAllGroups()
  toast.add({
    severity: 'success',
    summary: t('live_order.toast.ordering_ended'),
    detail: t('live_order.toast.ordering_ended_detail', { count: changed }),
    life: 2500,
  })
  // 結束收單儲存後：
  // - 直播模式：把該場次從 sessions 移除、currentSession = null（回空狀態）
  // - 貼文模式：清掉 postSession.sources（觸發 !hasAnySource）+ 把該檔狀態改成 closed_today → 回到 overview
  if (!isPostMode.value && currentSession.value) {
    const sid = currentSession.value.id
    sessions.value = sessions.value.filter((s) => s.id !== sid)
    currentSession.value = null
  } else if (isPostMode.value) {
    // 結束收單前先把當下 sold 同步回 overview 上的「已成單」
    syncPostStatsBack()
    const enteredSource = postSession.value.sources?.[0] as { postId?: number } | undefined
    const postId = enteredSource?.postId
    if (postId != null) {
      const post = postCollections.value.find((p) => p.id === postId)
      if (post) post.status = 'closed_today'
    }
    postSession.value.sources = []
    postSession.value.products = []
  }
}

// ── 計時器：以當前場次最早「開始收單」的商品為起點 ─────
// 商品狀態變為 live 時自動記錄 startedAt（首次記錄後保留，允許 undo 接續）
watch(
  () => selectedProducts.value.map(p => ({ id: p.id, status: p.status })),
  () => {
    selectedProducts.value.forEach(p => {
      if (p.status === 'live' && !p.startedAt) p.startedAt = Date.now()
    })
  },
  { deep: true, immediate: true }
)

/**
 * 競價模式互斥：場次內同一時間最多一支「競價 + 收單中」商品；
 * 任一商品 ready→live 時，若會跟既有的競價/其他 live 衝突 → 撤回剛上 live 的那支 + 跳提示。
 * - 競價想開始收單，但已有其他收單中商品 → 撤回競價、提示「請先暫停其他商品」
 * - 已有競價在收單中，其他商品想開始收單 → 撤回該商品、提示「競價中無法開啟其他收單」
 */
let isBiddingConflictDialogOpen = false
watch(
  () => selectedProducts.value.map(p => ({ id: p.id, status: p.status, bidding: !!(p as Record<string, unknown>).bidding })),
  (list, oldList) => {
    const biddingLive = list.find(p => p.status === 'live' && p.bidding)
    if (!biddingLive) return
    const otherLive = list.filter(p => p.id !== biddingLive.id && p.status === 'live')
    if (otherLive.length === 0) return

    // 找出「剛從 ready 變 live」的商品，那支才是要撤回的對象
    const justWentLive = list.find(p =>
      p.status === 'live'
      && oldList?.find(o => o.id === p.id)?.status !== 'live',
    )
    if (!justWentLive) return

    const revertTarget = selectedProducts.value.find(p => p.id === justWentLive.id)
    if (revertTarget) revertTarget.status = 'ready'

    if (isBiddingConflictDialogOpen) return
    isBiddingConflictDialogOpen = true

    // 文案依據撤回的是競價 / 其他商品分別給出
    const isBiddingBlocked = justWentLive.bidding
    confirm.require({
      header: isBiddingBlocked ? '無法開始競價' : '已有競價商品收單中',
      message: isBiddingBlocked
        ? `目前還有 ${otherLive.length} 件商品收單中，請先手動暫停所有收單中的商品後再開始競價。`
        : '目前有競價商品正在收單中，無法同時開啟其他商品的收單。請等競價結束後再進行。',
      icon: 'pi pi-exclamation-triangle',
      // 強制 modal + 不可關閉 X / 不可點 mask 關閉：使用者必須按「我知道了」才能繼續操作
      modal: true,
      closable: false,
      dismissableMask: false,
      closeOnEscape: false,
      // 用 style 隱藏 reject 按鈕（PrimeVue ConfirmDialog 沒有原生 rejectVisible prop）
      rejectProps: { style: 'display: none' },
      acceptProps: { label: '我知道了' },
      accept: () => { isBiddingConflictDialogOpen = false },
      reject: () => { isBiddingConflictDialogOpen = false },
      onHide: () => { isBiddingConflictDialogOpen = false },
    })
  },
  { deep: true },
)

const startedAt = computed<number | null>(() => {
  const live = selectedProducts.value.filter((p): p is LiveProduct & { startedAt: number } => p.status === 'live' && typeof p.startedAt === 'number')
  if (live.length === 0) return null
  return Math.min(...live.map(p => p.startedAt))
})
const now = ref(Date.now())
let timerId: ReturnType<typeof setInterval> | null = null

const elapsedDisplay = computed(() => {
  if (!startedAt.value) return '00:00:00'
  const sec = Math.max(0, Math.floor((now.value - startedAt.value) / 1000))
  const h = String(Math.floor(sec / 3600)).padStart(2, '0')
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0')
  const s = String(sec % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
})

watch(hasLiveProduct, (yes) => {
  if (yes) {
    now.value = Date.now()
    if (!timerId) timerId = setInterval(() => { now.value = Date.now() }, 1000)
  } else {
    if (timerId) { clearInterval(timerId); timerId = null }
  }
}, { immediate: true })

onUnmounted(() => { if (timerId) clearInterval(timerId) })

/** 排程自動開始收單：每 30 秒檢查當前進入的貼文 startAt 是否已到，
 *  若到了且還有商品停在 ready，就自動把它們切到 live，免去手動按開始收單。 */
let scheduleTimerId: ReturnType<typeof setInterval> | null = null
function checkScheduledStart(): void {
  if (!isPostMode.value) return
  const post = currentEnteredPost.value
  if (!post || post.status === 'closed_today') return
  if (!post.startAt) return
  if (post.startAt.getTime() > Date.now()) return
  postSession.value.products.forEach((p) => {
    if (p.status === 'ready') p.status = 'live'
  })
}
onMounted(() => {
  scheduleTimerId = setInterval(checkScheduledStart, 30_000)
})
onUnmounted(() => { if (scheduleTimerId) clearInterval(scheduleTimerId) })
</script>
