<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/admin/layouts/DefaultLayout.vue'
import AuthLayout from '@/admin/layouts/AuthLayout.vue'

const route = useRoute()
const layoutComponent = computed(() => {
  const layoutName = (route.meta?.layout as string | undefined) ?? 'default'
  return layoutName === 'auth' ? AuthLayout : DefaultLayout
})
</script>

<template>
  <component :is="layoutComponent" />
</template>
