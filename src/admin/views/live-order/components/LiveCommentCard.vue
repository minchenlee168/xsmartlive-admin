<template>
  <!-- 留言卡：6 種變體（Default / 黑名單 / VIP / 官方小編 × FB/IG/直播） -->
  <div :class="[
    'rounded-[8px] border px-2.5 py-2 flex gap-2 items-start shadow-sm',
    isPinned ? 'bg-[var(--p-primary-50)] border-[var(--p-primary-400)]' : 'bg-[var(--p-content-background)] border-[var(--p-content-border-color)]',
  ]">

    <!-- 左：頭像 + 底部標籤 -->
    <div class="flex flex-col items-center gap-1 shrink-0" style="width:48px">
      <!-- Avatar -->
      <div v-if="isBlacklist" class="w-[40px] h-[40px] rounded-full bg-[var(--p-text-color)] flex items-center justify-center">
        <i class="pi pi-lock text-white" style="font-size:16px"></i>
      </div>
      <div v-else class="w-[40px] h-[40px] rounded-full bg-[var(--p-content-border-color)] flex items-center justify-center">
        <i class="pi pi-user text-[var(--p-text-muted-color)]" style="font-size:18px"></i>
      </div>
      <!-- Badge -->
      <div v-if="comment.tagType === 'official'"
        class="bg-[var(--p-primary-color)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 leading-none whitespace-nowrap">
        <i class="pi pi-check-circle" style="font-size:8px"></i>{{ t('live_order.label.official_editor') }}
      </div>
      <span v-else-if="isBlacklist" class="bg-black text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">{{ t('live_order.label.blacklist') }}</span>
      <span v-else-if="comment.tagType === 'vip'" class="bg-[#fbbf24] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">{{ t('live_order.label.vip') }}</span>
      <div v-else-if="comment.stars" class="flex gap-0">
        <i v-for="i in 5" :key="i" :class="['pi', i <= comment.stars ? 'pi-star-fill text-[#fbbf24]' : 'pi-star text-[var(--p-content-border-color)]']" style="font-size:8px"></i>
      </div>
    </div>

    <!-- 中：名字 + 留言 -->
    <div class="flex-1 min-w-0 flex flex-col gap-0.5">
      <div class="flex items-center gap-1">
        <span class="text-[14px] font-bold text-[var(--p-text-color)] truncate">{{ comment.user }}</span>
      </div>
      <div class="flex items-center gap-1">
        <!-- 綠色實心圓 + 白勾：留言含「+N」或追加訂單成功時顯示（下單成功標示） -->
        <span v-if="hasOrdered"
          class="w-[14px] h-[14px] rounded-full bg-[#22c55e] flex items-center justify-center shrink-0">
          <i class="pi pi-check text-white" style="font-size:8px"></i>
        </span>
        <p class="text-[13px] text-[var(--p-text-color)] break-words leading-tight">{{ comment.text }}</p>
      </div>
    </div>

    <!-- 右：動作 icons + 平台 + 時間 -->
    <div class="flex flex-col items-end gap-1 shrink-0 h-full">
      <!-- 動作 icons：pinned/官方小編 不顯示 -->
      <div v-if="!isPinned" class="flex gap-1.5">
        <button @click="onLockClick" class="text-[var(--p-text-muted-color)] hover:text-[var(--p-text-color)]"
          v-tooltip.top="isBlacklist ? t('live_order.tooltip.remove_from_blacklist') : t('live_order.tooltip.add_to_blacklist')">
          <i :class="isBlacklist ? 'pi pi-lock-open' : 'pi pi-lock'" style="font-size:13px"></i>
        </button>
        <!-- 已下單 → 隱藏「查看訂單明細」按鈕；未下單時才顯示「追加訂單」 -->
        <button
          v-if="!hasOrdered"
          @click="onActionClick"
          class="text-[var(--p-text-muted-color)] hover:text-[var(--p-text-color)]"
          v-tooltip.top="t('live_order.tooltip.add_order')"
        >
          <i class="pi pi-plus" style="font-size:13px"></i>
        </button>
      </div>
      <div class="flex items-center gap-1 mt-auto">
        <FontAwesomeIcon
          :icon="platformMeta.platformIcon"
          :style="{ fontSize: '10px', color: platformMeta.platformColor }"
        />
        <span class="text-[10px] text-[var(--p-text-muted-color)] whitespace-nowrap">{{ comment.time }}</span>
      </div>
    </div>

    <!-- 訂單明細 Dialog -->
    <OrderDetailDialog
      v-model:visible="detailVisible"
      :comment="comment"
      :items="detailItems"
      :platform-meta="platformMeta"
      @remove="onOrderRemoved" />
    <!-- 追加訂單 Dialog：挑選收單中的商品 -->
    <AddOrderDialog v-model:visible="addOrderVisible" :products="liveProducts" :user="comment.user" @submit="onAddOrderSubmit" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import OrderDetailDialog from './OrderDetailDialog.vue'
import AddOrderDialog, { type AddOrderPayload } from './AddOrderDialog.vue'
import { setWinnersForComment, clearWinnersForComment } from '../utils/liveWinners'

interface LiveComment {
  id: number | string
  user?: string
  text?: string
  time?: string
  tagType?: string
  pinned?: boolean
  stars?: number
  platform?: string
  [key: string]: unknown
}

interface PlatformMeta {
  platformIcon: [string, string]
  platformColor: string
}

interface LiveProductLike {
  id: number
  name?: string
  keyword?: string
  sku?: string
  price?: number
  [key: string]: unknown
}

interface Props {
  comment: LiveComment
  platformMeta: PlatformMeta
  /** 目前收單中（status==='live'）的商品，供「追加訂單」挑選 */
  liveProducts?: LiveProductLike[]
  /** 當前場次所有商品（含尚未收單的）；訂單明細用此 prop 配對留言提及的商品。 */
  sessionProducts?: LiveProductLike[]
}
const props = withDefaults(defineProps<Props>(), {
  liveProducts: () => [],
  sessionProducts: () => [],
})

const emit = defineEmits<{
  blacklist: [id: number | string]
  unblacklist: [id: number | string]
}>()
const { t } = useI18n()
const confirm = useConfirm()
const toast = useToast()

const isPinned    = computed(() => !!props.comment.pinned || props.comment.tagType === 'official')
const isBlacklist = computed(() => props.comment.tagType === 'blacklist')
/** 透過「追加訂單」成功送出後標記為已下單（留言文字本身沒有「+N」） */
const manuallyOrdered = ref(false)
/** 訂單明細按「解除訂單」後本地標記，移除綠勾並把 action icon 切回「追加訂單」。 */
const isOrderRemoved = ref(false)
/** 「追加訂單」時記下使用者實際選的商品 / 規格 / 數量；訂單明細彈窗會用這個列出。 */
interface ManualItem { productId: number; specId?: number; qty: number }
const manualOrderItems = ref<ManualItem[]>([])

/**
 * 解析留言中的「{關鍵字}(+{規格})+{數量}」並配對到當前場次的商品（不限 status）。
 *
 * **關鍵字**：商品卡上顯示的 tag 內容（`product.keyword`，或 fallback 用 `sku` 前綴）
 *
 * 成功配對條件：
 * 1. 留言文字含 `+N`
 * 2. 留言文字含某商品的關鍵字
 * 3. **若該商品有規格**：留言文字必須再含其中一個規格 name 才算成立
 *    **若該商品沒規格**：關鍵字 + 數量 即可成立
 *
 * 範例（綠勾）：
 *  - 「STRW+1」（草莓大福無 specs 時）
 *  - 「STRW 原味+1」 / 「我要一個 STRW 大份+2」
 * 反例（不顯示綠勾）：
 *  - 「STRW+1」但草莓大福有 specs（沒指定規格）
 *  - 「abc+1」找不到任何 keyword
 *  - 「STRW」沒有 +N
 */
const orderMatch = computed<null | {
  keyword: string
  quantity: number
  product: LiveProductLike | null
  spec: { id?: number; name?: string;[key: string]: unknown } | null
  /** 競價成交價：留言出價 ≥ 商品 flatPrice（一刀價）時才有值，覆蓋訂單明細單價。 */
  bidPrice?: number
}>(() => {
  const text = props.comment.text || ''
  const pool = props.sessionProducts.length > 0 ? props.sessionProducts : props.liveProducts

  // ── 競價模式：留言格式「關鍵字 +(規格)+ 出價金額」（無 +N）；達到 flatPrice 才算成交。 ──
  // 有規格的競價商品 → 留言必須含其中一個規格 name；沒規格 → 關鍵字 + 金額即可。
  for (const p of pool) {
    if (!(p as { bidding?: boolean }).bidding) continue
    const kw = p.keyword || (p.sku ? p.sku.split('-')[0] : '')
    if (!kw || !text.includes(kw)) continue

    const flat = Number((p as { flatPrice?: number }).flatPrice ?? 0)
    if (flat <= 0) continue

    const specs = ((p as { selectedSpecs?: Array<{ name?: string }> }).selectedSpecs
      ?? (p as { specs?: Array<{ name?: string }> }).specs ?? []) as Array<{ id?: number; name?: string;[k: string]: unknown }>

    let matchedSpec: { id?: number; name?: string;[k: string]: unknown } | null = null
    if (specs.length > 0) {
      matchedSpec = specs.find((s) => s.name && text.includes(s.name)) ?? null
      if (!matchedSpec) continue
    }

    // 抓留言裡的任一數字；只要有任一個 ≥ flatPrice 就算成交（一刀價）
    const numbers = (text.match(/\d{1,7}/g) ?? []).map(Number)
    const bidAmount = numbers.find((n) => n >= flat)
    if (bidAmount === undefined) continue

    return {
      keyword: matchedSpec?.name ? `${kw} ${matchedSpec.name}` : kw,
      quantity: 1,
      product: p,
      spec: matchedSpec,
      bidPrice: bidAmount,
    }
  }

  // ── 一般「+N」格式（含規格匹配） ──
  const qtyMatch = text.match(/\+(\d+)/)
  if (!qtyMatch) return null
  const quantity = Number(qtyMatch[1])

  for (const p of pool) {
    // 競價商品不走 +N 流程（避免雙重判定）
    if ((p as { bidding?: boolean }).bidding) continue
    // 商品卡 tag 顯示的 keyword：優先 product.keyword、否則 sku 前綴
    const kw = p.keyword || (p.sku ? p.sku.split('-')[0] : '')
    if (!kw || !text.includes(kw)) continue

    const specs = ((p as { selectedSpecs?: Array<{ name?: string }> }).selectedSpecs
      ?? (p as { specs?: Array<{ name?: string }> }).specs ?? []) as Array<{ id?: number; name?: string;[k: string]: unknown }>

    if (specs.length > 0) {
      // 有規格 → 留言必須再帶到其中一個 spec name 才算成功下標
      const matchedSpec = specs.find((s) => s.name && text.includes(s.name))
      if (!matchedSpec) continue
      return { keyword: `${kw} ${matchedSpec.name}`, quantity, product: p, spec: matchedSpec }
    }
    // 沒規格 → 關鍵字 + 數量 就成立
    return { keyword: kw, quantity, product: p, spec: null }
  }
  return null
})

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 已成功下標：留言對應到場次商品（pattern 1 或 2）或追加訂單成功；且未黑名單、未解除 */
const hasOrdered = computed(() =>
  !isOrderRemoved.value
  && !isBlacklist.value
  && (orderMatch.value !== null || manuallyOrdered.value),
)

const detailVisible = ref(false)
const addOrderVisible = ref(false)

/** Prompt the user, then emit blacklist/unblacklist for this comment. */
function onLockClick(): void {
  if (isBlacklist.value) {
    confirm.require({
      message: t('live_order.dialog.unblacklist_message', { user: props.comment.user ?? '' }),
      header: t('live_order.dialog.unblacklist_header'),
      icon: 'pi pi-exclamation-triangle',
      rejectProps: { label: t('live_order.button.cancel'), severity: 'secondary', outlined: true },
      acceptProps: { label: t('live_order.dialog.unblacklist'), severity: 'warn' },
      accept: () => emit('unblacklist', props.comment.id),
    })
  } else {
    confirm.require({
      message: t('live_order.dialog.blacklist_message', { user: props.comment.user ?? '' }),
      header: t('live_order.dialog.blacklist_header'),
      icon: 'pi pi-exclamation-triangle',
      rejectProps: { label: t('live_order.button.cancel'), severity: 'secondary', outlined: true },
      acceptProps: { label: t('live_order.dialog.blacklist'), severity: 'danger' },
      accept: () => emit('blacklist', props.comment.id),
    })
  }
}

/** 已下單 → 開訂單明細；未下單 → 開追加訂單（挑收單中商品）。 */
function onActionClick(): void {
  if (hasOrdered.value) detailVisible.value = true
  else addOrderVisible.value = true
}

/**
 * OrderDetailDialog 按下「解除訂單」後：
 * - 標記本地 isOrderRemoved，hasOrdered 變 false → 綠勾消失、action icon 回到「追加訂單」
 * - 同步重設 manuallyOrdered，避免之前手動追加的狀態又把 hasOrdered 拉回 true
 * - 顯示 toast 通知使用者
 */
function onOrderRemoved(): void {
  isOrderRemoved.value = true
  manuallyOrdered.value = false
  manualOrderItems.value = []
  toast.removeAllGroups()
  toast.add({
    severity: 'success',
    summary: t('live_order.toast.order_removed'),
    detail: t('live_order.toast.order_removed_detail', { user: props.comment.user ?? '' }),
    life: 2500,
  })
}

/** 追加訂單送出：mock 以 toast 回饋（實際串接時改為寫入訂單），同時記下商品供明細彈窗顯示。 */
function onAddOrderSubmit(payload: AddOrderPayload): void {
  // 解除過後重新送出 → 取消 isOrderRemoved，hasOrdered 才會重新亮綠勾
  isOrderRemoved.value = false
  manuallyOrdered.value = true
  manualOrderItems.value = payload.items.map((it) => ({
    productId: it.productId,
    specId: it.specId,
    qty: it.qty,
  }))
  toast.removeAllGroups()
  toast.add({
    severity: 'success',
    summary: t('live_order.toast.order_added'),
    detail: t('live_order.toast.order_added_detail', {
      user: props.comment.user ?? '',
      count: payload.items.length,
    }),
    life: 2500,
  })
}

/**
 * 訂單明細彈窗用的 items：
 * - 留言匹配（orderMatch）→ 一筆，帶配對到的 product + spec + quantity；
 *   spec 存在時用 spec.price / spec.name；沒 spec 就用 product.price
 * - 追加訂單（manualOrderItems）→ 從 sessionProducts/liveProducts 查回 product 後展開
 */
interface DetailItemInput {
  name: string
  spec: string
  qty: number
  unitPrice: number
  isGift?: boolean
}
const detailItems = computed<DetailItemInput[]>(() => {
  const pool = props.sessionProducts.length > 0 ? props.sessionProducts : props.liveProducts
  if (orderMatch.value) {
    const { product, spec, quantity, bidPrice } = orderMatch.value
    if (!product) return []
    // 競價成交：以實際出價當單價；其他情況維持規格價 / 單品價
    const unitPrice = bidPrice
      ?? (spec?.price as number | undefined)
      ?? (product.price as number | undefined)
      ?? 0
    return [{
      name: (product.name as string | undefined) ?? '',
      spec: (spec?.name as string | undefined) ?? '',
      qty: quantity,
      unitPrice,
      isGift: !!(product as { isGift?: boolean }).isGift,
    }]
  }
  if (manualOrderItems.value.length > 0) {
    return manualOrderItems.value
      .map((it): DetailItemInput | null => {
        const p = pool.find((x) => x.id === it.productId)
        if (!p) return null
        // 有 specId → 從商品的 selectedSpecs / specs 找對應規格，帶 spec.name / spec.price
        let specName = ''
        let unitPrice = (p.price as number | undefined) ?? 0
        if (typeof it.specId === 'number') {
          const specs = (((p as { selectedSpecs?: Array<{ id?: number; name?: string; price?: number }> }).selectedSpecs
            ?? (p as { specs?: Array<{ id?: number; name?: string; price?: number }> }).specs ?? []) as Array<{ id?: number; name?: string; price?: number }>)
          const matched = specs.find((s) => s.id === it.specId)
          if (matched) {
            specName = matched.name ?? ''
            unitPrice = matched.price ?? unitPrice
          }
        }
        return {
          name: (p.name as string | undefined) ?? '',
          spec: specName,
          qty: it.qty,
          unitPrice,
          isGift: !!(p as { isGift?: boolean }).isGift,
        }
      })
      .filter((x): x is DetailItemInput => x !== null)
  }
  return []
})

/**
 * 同步「得標成功」到該商品的 winner 共享 store：
 * - hasOrdered + detailItems 有內容 → 把這則留言寫成 winners
 * - 反之 → 清掉這則留言的 winners
 */
watch(
  [hasOrdered, detailItems],
  ([ordered, items]) => {
    const cid = props.comment.id
    if (cid == null) return
    if (!ordered || items.length === 0) {
      clearWinnersForComment(cid)
      return
    }
    const pool = props.sessionProducts.length > 0 ? props.sessionProducts : props.liveProducts
    const winners = items
      .map((it) => {
        // detailItems 沒帶 productId；以 name 對齊回 pool
        const p = pool.find(x => (x.name as string | undefined) === it.name)
        const productId = p?.id ?? 0
        return {
          productId,
          productName: it.name,
          specName: it.spec || undefined,
          member: props.comment.user ?? '',
          commentText: props.comment.text ?? '',
          qty: it.qty,
          paid: false,
          createdAt: props.comment.time ?? '',
          unitPrice: it.unitPrice,
          isGift: !!it.isGift,
        }
      })
      .filter(w => w.productId > 0)
    setWinnersForComment(cid, winners)
  },
  { deep: true, immediate: true },
)
</script>
