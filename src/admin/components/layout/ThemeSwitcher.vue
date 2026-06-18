<script setup lang="ts">
import DropdownMenu from '@/admin/components/portal-ui/DropdownMenu.vue'
import { useThemeStore } from '@/admin/stores/theme'
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const themeStore = useThemeStore()
const { isDark } = storeToRefs(themeStore)

const buttonIcon = computed(() => (isDark.value ? 'moon' : 'sun-bright'))
const options = computed(() => [
  { label: t('common.theme.light'), value: 'light', icon: 'sun-bright' },
  { label: t('common.theme.dark'), value: 'dark', icon: 'moon' },
])

function setTheme(value: string) {
  if ((value === 'dark') !== isDark.value) themeStore.toggle()
}
</script>

<template>
  <DropdownMenu
    :icon="buttonIcon"
    :model="options"
  >
    <template #item="{ item }">
      <div
        class="flex items-center p-2 gap-2 text-sm cursor-pointer"
        :class="{
          'bg-primary-50 dark:bg-primary': item.value === (isDark ? 'dark' : 'light'),
        }"
        @click="setTheme(item.value)"
      >
        <FontAwesomeIcon :icon="['far', item.icon]" />
        {{ item.label }}
      </div>
    </template>
  </DropdownMenu>
</template>
