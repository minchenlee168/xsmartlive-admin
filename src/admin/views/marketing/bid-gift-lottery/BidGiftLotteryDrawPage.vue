<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { useGlobalToast } from '@/admin/composables/useGlobalToast';
import { RouteName } from '@/admin/router';
import { mockLotteryList } from './mockData';
import { generateCandidates } from './candidateMock';

import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { showInfo, showSuccess, showError } = useGlobalToast();

const lotteryId = computed(() => String(route.params.id ?? ''));
const lottery = computed(() => mockLotteryList.find((row) => row.id === lotteryId.value));
// 場次名稱優先讀 query（讓不同抽獎類型可共用此頁），否則回查得標禮 mock
const sessionName = computed(() => (
  (typeof route.query.session === 'string' && route.query.session)
  || lottery.value?.sessionName
  || ''
));

function handleBackToList() {
  router.push({ name: RouteName.BidGiftLotteryList });
}

const isWinnerDialogVisible = ref(false);
const isCandidateDialogVisible = ref(false);

const winnerList = computed(() => winners.value);

function handleShowWinnerList() {
  isWinnerDialogVisible.value = true;
}

function handleShowCandidateList() {
  isCandidateDialogVisible.value = true;
}

type DrawStage = 'idle' | 'drawing' | 'result';

const BASE = import.meta.env.BASE_URL;
const STAGE_SRC: Record<DrawStage, string> = {
  idle: `${BASE}lottery/idle.html`,
  drawing: `${BASE}lottery/drawing.html`,
  result: `${BASE}lottery/result.html`,
};

const stage = ref<DrawStage>('idle');
const backgroundFrame = useTemplateRef<HTMLIFrameElement>('backgroundFrame');

// 階段切換時通知背景：drawing 啟動光束、result 立即停下光束（煙火等 result.html 通知後才觸發）
watch(stage, (next, prev) => {
  const message = next === 'drawing' ? 'start-burst' : next === 'result' ? 'stop-burst' : null;
  if (message) backgroundFrame.value?.contentWindow?.postMessage(message, '*');

  if (next === 'drawing') startCycling();
  else if (prev === 'drawing') stopCycling();

  // 進入 result 後，揭曉動畫播完前禁止再抽一位
  if (next === 'result') isAwaitingReveal.value = true;
});

// result.html 在得獎圓框展開後會 postMessage 'winner-revealed'：揭曉煙火，同時把 pending 併入名單
function handleStageMessage(event: MessageEvent) {
  if (event.data !== 'winner-revealed') return;
  backgroundFrame.value?.contentWindow?.postMessage('celebrate', '*');
  if (pendingWinner.value) {
    winners.value.push(pendingWinner.value);
    pendingWinner.value = null;
  }
  isAwaitingReveal.value = false;
}

const stageSrc = computed(() => {
  const base = STAGE_SRC[stage.value];
  if (stage.value !== 'result' || latestWinner.value === null) return base;
  const params = new URLSearchParams({ name: latestWinner.value.name, avatar: latestWinner.value.avatar });
  return `${base}?${params.toString()}`;
});

// 每輪重建 iframe，避免 result.html 重用造成動畫不重播
const stageFrameKey = computed(() => `${stage.value}-${round.value}`);
const stageLabel = computed(() => `bid_gift_lottery_draw.status.${stage.value}`);

// 完整抽獎名單（原型階段：mock 120 位以驗證高人數分級顯示）
const candidateList = ref(generateCandidates(120));

// 累積得獎者；逐輪抽，每輪扣除已抽中者；底部以頭像格陣顯示全部剩餘候選人
// pendingWinner：停下時即決定但尚未在圓框揭曉，揭曉後（winner-revealed）才併入 winners 計入名單
const winners = ref<Array<{ name: string; avatar: string }>>([]);
const pendingWinner = ref<{ name: string; avatar: string } | null>(null);
const remainingCandidates = computed(() => (
  candidateList.value.filter((person) => (
    !winners.value.includes(person) && person !== pendingWinner.value
  ))
));
const latestWinner = computed(() => pendingWinner.value ?? winners.value.at(-1) ?? null);

// 候選人格陣採雙層景深：後排（小、模糊）+ 前排（清晰、輪動），多出來摺成右上「+X 人」
const POOL_FRONT_LIMIT = 22;
const POOL_BACK_LIMIT = 30;
const POOL_CYCLE_INTERVAL = 200;

const foregroundCandidates = computed(() => remainingCandidates.value.slice(0, POOL_FRONT_LIMIT));
const backgroundCandidates = computed(() => (
  remainingCandidates.value.slice(POOL_FRONT_LIMIT, POOL_FRONT_LIMIT + POOL_BACK_LIMIT)
));
const overflowCount = computed(() => Math.max(
  0,
  remainingCandidates.value.length - POOL_FRONT_LIMIT - POOL_BACK_LIMIT,
));

const activeSlotIndex = ref<number | null>(0);
const round = ref(0);
const isAwaitingReveal = ref(false);
const frontRowEl = useTemplateRef<HTMLDivElement>('frontRowEl');
const trackerStyle = ref<Record<string, string>>({ opacity: '0' });
let cycleTimer: number | null = null;

// 浮動主色外框：依 activeSlotIndex 移動到目前頭像位置，產生「外框跟著頭像跑」的感覺
watch([activeSlotIndex, foregroundCandidates], async () => {
  await nextTick();
  if (activeSlotIndex.value === null || !frontRowEl.value) {
    trackerStyle.value = { opacity: '0' };
    return;
  }
  const items = frontRowEl.value.querySelectorAll<HTMLElement>('.lottery-draw__pool-item');
  const target = items[activeSlotIndex.value];
  if (!target) {
    trackerStyle.value = { opacity: '0' };
    return;
  }
  trackerStyle.value = {
    transform: `translate(${target.offsetLeft}px, ${target.offsetTop}px)`,
    width: `${target.offsetWidth}px`,
    height: `${target.offsetHeight}px`,
    opacity: '1',
  };
});

function startCycling() {
  let idx = 0;
  activeSlotIndex.value = idx;
  round.value += 1;
  cycleTimer = window.setInterval(() => {
    if (foregroundCandidates.value.length === 0) return;
    idx = (idx + 1) % foregroundCandidates.value.length;
    activeSlotIndex.value = idx;
  }, POOL_CYCLE_INTERVAL);
}

function stopCycling() {
  if (cycleTimer !== null) {
    clearInterval(cycleTimer);
    cycleTimer = null;
  }
  // 從剩餘名單隨機挑一位作為本輪得獎者（暫存 pending，圓框揭曉後才併入 winners）
  if (remainingCandidates.value.length > 0) {
    const randomIndex = Math.floor(Math.random() * remainingCandidates.value.length);
    pendingWinner.value = remainingCandidates.value[randomIndex];
  }
  activeSlotIndex.value = null;
}

const candidateCount = computed(() => candidateList.value.length);
const winnerCount = computed(() => winners.value.length);

const canStart = computed(() => (
  (stage.value === 'idle' || (stage.value === 'result' && !isAwaitingReveal.value))
  && remainingCandidates.value.length > 0
));
const startButtonLabelKey = computed(() => (
  winners.value.length === 0 ? 'bid_gift_lottery_draw.button.start' : 'bid_gift_lottery_draw.button.draw_again'
));
const canStop = computed(() => stage.value === 'drawing');
const canSubmit = computed(() => stage.value === 'result');
const canCopy = computed(() => stage.value === 'result');

function handleStart() {
  if (!canStart.value) return;
  stage.value = 'drawing';
}

function handleStop() {
  if (!canStop.value) return;
  stage.value = 'result';
}

function handleSubmit() {
  showInfo({
    summary: t('bid_gift_lottery_draw.toast.submit_summary'),
    detail: t('bid_gift_lottery_draw.toast.submit_detail'),
  });
}

async function handleCopy() {
  const lines = winners.value.map((person, idx) => `${idx + 1}. ${person.name}`);
  const text = [sessionName.value, ...lines].filter(Boolean).join('\n');

  try {
    await navigator.clipboard.writeText(text);
    showSuccess({ detail: t('bid_gift_lottery_draw.toast.copied') });
  } catch {
    showError({ detail: t('bid_gift_lottery_draw.toast.copy_failed') });
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.code !== 'Space') return;

  // 避免目前 focus 在按鈕時，按鈕的 keydown 又觸發一次 click 造成雙重觸發
  const active = document.activeElement as HTMLElement | null;
  if (active && (active.tagName === 'BUTTON' || active.tagName === 'A')) {
    active.blur();
  }

  event.preventDefault();
  if (stage.value === 'drawing') {
    handleStop();
  } else if (canStart.value) {
    handleStart();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('message', handleStageMessage);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('message', handleStageMessage);
  stopCycling();
});
</script>

<template>
  <div class="lottery-draw">
    <iframe
      ref="backgroundFrame"
      class="lottery-draw__background"
      :src="`${BASE}lottery/background.html`"
      title="background"
      aria-hidden="true"
      tabindex="-1"
    />

    <div class="lottery-draw__content">
      <div class="lottery-draw__topbar">
        <button
          type="button"
          class="lottery-draw__back"
          :aria-label="$t('bid_gift_lottery_draw.button.back_to_list')"
          @click="handleBackToList"
        >
          <FontAwesomeIcon :icon="['fas', 'chevron-left']" />
        </button>

        <span class="lottery-draw__session-name">{{ sessionName }}</span>

        <div class="lottery-draw__topbar-actions">
          <button
            type="button"
            class="lottery-draw__pill"
            @click="handleShowWinnerList"
          >
            <span>{{ $t('bid_gift_lottery_draw.button.winner_list') }}</span>
            <span class="lottery-draw__pill-count">{{ winnerCount }}</span>
          </button>
          <button
            type="button"
            class="lottery-draw__pill"
            @click="handleShowCandidateList"
          >
            <span>{{ $t('bid_gift_lottery_draw.button.candidate_list') }}</span>
            <span class="lottery-draw__pill-count">{{ candidateCount }}</span>
          </button>
        </div>
      </div>

      <div class="lottery-draw__stage">
        <iframe
          :key="stageFrameKey"
          class="lottery-draw__stage-frame"
          :src="stageSrc"
          title="lottery-stage"
        />
        <p class="lottery-draw__stage-label">
          {{ $t(stageLabel) }}
        </p>
      </div>

      <div class="lottery-draw__pool">
        <div
          ref="frontRowEl"
          class="lottery-draw__pool-row lottery-draw__pool-row--front"
        >
          <div
            v-for="(person, index) in foregroundCandidates"
            :key="`front-${person.name}-${index}`"
            v-tooltip.top="person.name"
            class="lottery-draw__pool-item"
          >
            <img
              class="lottery-draw__pool-avatar"
              :src="person.avatar"
              :alt="person.name"
            >
          </div>
          <div
            class="lottery-draw__pool-tracker"
            :style="trackerStyle"
          />
        </div>
        <div class="lottery-draw__pool-row lottery-draw__pool-row--back">
          <div
            v-for="(person, index) in backgroundCandidates"
            :key="`back-${person.name}-${index}`"
            v-tooltip.top="person.name"
            class="lottery-draw__pool-item lottery-draw__pool-item--back"
          >
            <img
              class="lottery-draw__pool-avatar"
              :src="person.avatar"
              :alt="person.name"
            >
          </div>
          <button
            v-if="overflowCount > 0"
            type="button"
            class="lottery-draw__pool-more"
            @click="handleShowCandidateList"
          >
            +{{ overflowCount }} 人
          </button>
        </div>
      </div>

      <div class="lottery-draw__actions">
        <Button
          :label="$t(startButtonLabelKey)"
          severity="info"
          rounded
          size="large"
          class="lottery-draw__action"
          :disabled="!canStart"
          @click="handleStart"
        />
        <Button
          :label="$t('bid_gift_lottery_draw.button.stop')"
          severity="danger"
          rounded
          size="large"
          class="lottery-draw__action"
          :class="{ 'lottery-draw__action--pulse': canStop }"
          :disabled="!canStop"
          @click="handleStop"
        />
        <Button
          :label="$t('bid_gift_lottery_draw.button.submit')"
          severity="success"
          rounded
          size="large"
          class="lottery-draw__action"
          :disabled="!canSubmit"
          @click="handleSubmit"
        />
        <Button
          :label="$t('bid_gift_lottery_draw.button.copy')"
          severity="help"
          rounded
          size="large"
          class="lottery-draw__action"
          :disabled="!canCopy"
          @click="handleCopy"
        />
      </div>

      <p class="lottery-draw__hint">
        {{ $t('bid_gift_lottery_draw.hint.spacebar') }}
      </p>
    </div>

    <Dialog
      v-model:visible="isWinnerDialogVisible"
      modal
      dismissable-mask
      :header="$t('bid_gift_lottery_draw.button.winner_list') + ` (${winnerCount})`"
      :style="{ width: '28rem' }"
      :pt="{ closeButton: { class: 'border-0! bg-transparent! shadow-none! hover:bg-transparent!' } }"
    >
      <ul
        v-if="winnerList.length"
        class="lottery-draw__people"
      >
        <li
          v-for="(person, index) in winnerList"
          :key="index"
          class="lottery-draw__person"
        >
          <img
            :src="person.avatar"
            :alt="person.name"
            class="lottery-draw__person-avatar"
          >
          <span class="lottery-draw__person-name">{{ person.name }}</span>
        </li>
      </ul>
      <div
        v-else
        class="lottery-draw__empty"
      >
        {{ $t('bid_gift_lottery_draw.dialog.no_winner') }}
      </div>
    </Dialog>

    <Dialog
      v-model:visible="isCandidateDialogVisible"
      modal
      dismissable-mask
      :header="$t('bid_gift_lottery_draw.button.candidate_list') + ` (${candidateCount})`"
      :style="{ width: '28rem' }"
      :pt="{ closeButton: { class: 'border-0! bg-transparent! shadow-none! hover:bg-transparent!' } }"
    >
      <ul class="lottery-draw__people">
        <li
          v-for="(person, index) in candidateList"
          :key="index"
          class="lottery-draw__person"
        >
          <img
            :src="person.avatar"
            :alt="person.name"
            class="lottery-draw__person-avatar"
          >
          <span class="lottery-draw__person-name">{{ person.name }}</span>
        </li>
      </ul>
    </Dialog>
  </div>
</template>

<style scoped>
.lottery-draw {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.lottery-draw__background {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  pointer-events: none;
}

.lottery-draw__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 1.25rem 2rem 2.5rem;
}

.lottery-draw__topbar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.25rem 0.5rem;
}

.lottery-draw__back {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.6);
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease, transform 0.15s ease;
}

.lottery-draw__back:hover {
  background-color: rgba(255, 255, 255, 0.25);
  transform: translateX(-2px);
}

.lottery-draw__session-name {
  flex: 1;
  text-align: left;
  padding-left: 0.5rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.lottery-draw__topbar-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.lottery-draw__pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.9rem;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.55);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.lottery-draw__pill:hover {
  background-color: rgba(255, 255, 255, 0.28);
}

.lottery-draw__pill-count {
  min-width: 1.5rem;
  padding: 0.05rem 0.45rem;
  border-radius: 9999px;
  background-color: #fff;
  color: rgba(0, 0, 0, 0.78);
  font-size: 0.85rem;
  font-weight: 700;
  text-align: center;
}

.lottery-draw__stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  flex: 1;
  justify-content: center;
}

.lottery-draw__stage-frame {
  width: 960px;
  height: 425px;
  max-width: 90vw;
  border: 0;
  background: transparent;
}

.lottery-draw__stage-label {
  font-size: 1rem;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
}

.lottery-draw__pool {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: fit-content;
  max-width: min(70rem, 92vw);
  margin: 0 auto 1.25rem;
  padding: 0.5rem;
}

.lottery-draw__pool-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.4rem;
  max-width: min(64rem, 86vw);
}

.lottery-draw__pool-row--front {
  position: relative;
}

.lottery-draw__pool-row--back {
  gap: 0.3rem;
  opacity: 0.55;
}

.lottery-draw__pool-tracker {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 9999px;
  box-shadow: 0 0 0 3px var(--p-primary-color), 0 0 14px 4px color-mix(in srgb, var(--p-primary-color) 60%, transparent);
  pointer-events: none;
  transition: transform 0.18s ease, opacity 0.2s ease, width 0.18s, height 0.18s;
  z-index: 2;
}

.lottery-draw__pool-item {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
  position: relative;
}

.lottery-draw__pool-item--back {
  width: 1.75rem;
  height: 1.75rem;
}

.lottery-draw__pool-avatar {
  width: 100%;
  height: 100%;
  border-radius: 9999px;
  object-fit: cover;
  display: block;
  border: 2px solid #fff;
  background-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.lottery-draw__pool-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3.25rem;
  height: 1.75rem;
  padding: 0 0.6rem;
  border-radius: 9999px;
  border: 1px dashed rgba(255, 255, 255, 0.7);
  background-color: rgba(255, 255, 255, 0.22);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease;
  white-space: nowrap;
}

.lottery-draw__pool-more:hover {
  background-color: rgba(255, 255, 255, 0.35);
}

.lottery-draw__actions {
  display: flex;
  gap: 1.25rem;
  margin-bottom: 0.5rem;
}

.lottery-draw__action {
  min-width: 9rem;
}

.lottery-draw__action--pulse {
  animation: pulseStop 1.1s ease-in-out infinite;
  box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.55);
}

@keyframes pulseStop {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.55);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 0 14px rgba(239, 68, 68, 0);
    transform: scale(1.04);
  }
}

.lottery-draw__hint {
  font-size: 0.85rem;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
}

.lottery-draw__people {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 22rem;
  overflow-y: auto;
}

.lottery-draw__person {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.5rem;
  background-color: rgba(0, 0, 0, 0.04);
}

.lottery-draw__person-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  object-fit: cover;
}

.lottery-draw__person-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.8);
}

.lottery-draw__empty {
  padding: 1.5rem 0;
  text-align: center;
  color: rgba(0, 0, 0, 0.5);
}
</style>
