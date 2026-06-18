<script setup lang="ts">
import logoMark from '@/admin/assets/logo-mark.svg'

withDefaults(defineProps<{
  width?: number
}>(), {
  width: 120,
})
</script>

<template>
  <Image
    :src="logoMark"
    alt="logo"
    :width="width"
  />
</template>
