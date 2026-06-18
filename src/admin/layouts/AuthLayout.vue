<script setup lang="ts">
/**
 * 未登入頁面共用 layout（登入 / 忘記密碼 / 重設密碼）。
 *
 * 此 mock 專案目前無對應頁面，保留以對齊 portal-vue layout pattern；
 * 未來新增 auth 頁時 route meta 設 `layout: 'auth'` 即會套用。
 */
</script>

<template>
  <div class="min-h-screen bg-[var(--p-app-background)] flex items-center justify-center">
    <RouterView />
  </div>
</template>
