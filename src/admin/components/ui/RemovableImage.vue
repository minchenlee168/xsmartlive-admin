<script setup lang="ts">
withDefaults(
  defineProps<{
    showRemoveButton?: boolean
  }>(),
  {
    showRemoveButton: true,
  },
)

const emit = defineEmits<{
  (e: 'remove'): void
}>()

/** Stop propagation so click on the trash button doesn't bubble to surrounding handlers. */
function handleRemove(event: Event): void {
  event.stopPropagation()
  emit('remove')
}
</script>

<template>
  <div class="relative inline-block">
    <Image
      v-bind="$attrs"
      preview
    />

    <Button
      v-if="showRemoveButton"
      severity="secondary"
      size="small"
      rounded
      raised
      class="absolute -top-3 -right-3"
      @click="handleRemove"
    >
      <template #icon>
        <i class="pi pi-times" />
      </template>
    </Button>
  </div>
</template>
