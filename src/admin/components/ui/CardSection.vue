<script setup lang="ts">
const props = defineProps<{
  title: string
}>()
</script>

<template>
  <Card class="border border-gray-200 dark:border-gray-700">
    <template #title>
      <p class="text-lg font-semibold">
        {{ props.title }}
      </p>
    </template>

    <template #content>
      <div class="space-y-6">
        <slot />
      </div>
    </template>
  </Card>
</template>
