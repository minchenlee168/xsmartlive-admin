<script setup lang="ts">
import DropdownMenu from '@/admin/components/portal-ui/DropdownMenu.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const SUPPORTED_LOCALES = computed(() => [
  { label: '繁體中文', value: 'zh-TW' },
  { label: 'English', value: 'en-US' },
])
</script>

<template>
  <DropdownMenu
    icon="globe"
    :model="SUPPORTED_LOCALES"
  >
    <template #item="{ item }">
      <div
        class="p-2 text-sm cursor-pointer"
        :class="{
          'bg-primary-50 dark:bg-primary': item.value === locale,
        }"
        @click="locale = item.value"
      >
        {{ item.label }}
      </div>
    </template>
  </DropdownMenu>
</template>
