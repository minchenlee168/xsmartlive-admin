<script setup lang="ts">
/**
 * 空狀態元件 — 規範對齊 design-tokens.json `empty-state`。
 *
 * - container: py-16, gap-4, 虛線邊框 (var(--p-content-border-color))
 * - icon-container: w-16 h-16 圓形, bg var(--p-content-hover-background), 28px icon
 * - title: 16px semibold var(--p-text-color)
 * - description: 14px var(--p-text-muted-color)
 * - slot "actions" 放 CTA 按鈕
 */

interface Props {
  title: string
  description?: string
  icon?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'pi pi-inbox',
})
</script>

<template>
  <div class="empty-state">
    <div class="empty-state-icon">
      <i :class="icon" class="text-[28px]"></i>
    </div>
    <div class="empty-state-text">
      <p class="text-[16px] font-semibold text-color">{{ title }}</p>
      <p v-if="description" class="text-[14px] text-color-secondary">{{ description }}</p>
    </div>
    <slot name="actions" />
  </div>
</template>

<style scoped>
@reference "@/admin/style.css";

.empty-state {
  @apply flex flex-col items-center justify-center py-16 gap-4 rounded-[8px] border border-dashed;
  border-color: var(--p-content-border-color);
}
.empty-state-icon {
  @apply w-16 h-16 rounded-full flex items-center justify-center;
  background: var(--p-content-hover-background);
  color: var(--p-text-muted-color);
}
.empty-state-text {
  @apply flex flex-col items-center gap-1;
}
</style>
