<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    className?: string
    hintSeverity?: 'default' | 'error'
  }>(),
  {
    label: '',
    hint: '',
    className: '',
    hintSeverity: 'default',
  },
)

const hintClass = computed(() =>
  props.hintSeverity === 'error' ? 'text-red-500' : 'text-gray-500',
)
</script>

<template>
  <div
    class="max-w-lg flex flex-col gap-2"
    :class="props.className"
  >
    <span
      v-if="props.label"
      class="text-sm font-medium cursor-default"
    >
      {{ props.label }}
    </span>

    <slot />

    <small
      v-if="props.hint"
      :class="hintClass"
    >
      {{ props.hint }}
    </small>
  </div>
</template>
