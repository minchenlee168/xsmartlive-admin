<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * MultiImageUploader stub — 與 portal-vue 的 MultiImageUploader 介面對齊，
 * 但簡化為：
 * - 選檔 → 讀檔成 base64 → 存進 model（id 自動產生流水號）
 * - 不支援編輯、不支援拖曳排序、不接 AI base64 cache
 *
 * 維持 `images` v-model 與相同的 prop / emit 介面，讓 PortalProductForm 不需要
 * 任何分支判斷。
 */

interface MultiImageUploaderItem {
  id: number
  url: string
}

const props = withDefaults(
  defineProps<{
    editorAspectRatio?: number
    maxCount?: number
    maxFileSize?: number
    disabled?: boolean
    accept?: string
    /** 與原元件對齊；此 stub 不使用此 prop。 */
    cacheBase64OnUpload?: boolean
  }>(),
  {
    editorAspectRatio: 1,
    maxCount: 9,
    maxFileSize: 5 * 1024 * 1024,
    disabled: false,
    accept: 'image/jpeg,image/png,image/webp',
    cacheBase64OnUpload: false,
  },
)

const images = defineModel<MultiImageUploaderItem[]>('images', { default: () => [] })

const emit = defineEmits<{
  (e: 'removed', payload: MultiImageUploaderItem): void
  (e: 'uploaded', payload: MultiImageUploaderItem[]): void
}>()

const { t } = useI18n()

const fileInputRef = useTemplateRef<HTMLInputElement>('fileInputRef')

const currentCount = computed(() => images.value?.length ?? 0)
const canAddMore = computed(() => currentCount.value < props.maxCount)

/** 產生 id 用的流水號 — 單純避免同畫面多張圖片 id 撞號（後端會給真實 id）。 */
let localIdSeed = -1
function nextLocalId(): number {
  localIdSeed -= 1
  return localIdSeed
}

function handleOpenFilePicker(): void {
  if (props.disabled || !canAddMore.value) return
  fileInputRef.value?.click()
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'))
    reader.readAsDataURL(file)
  })
}

async function handleNativeFileChange(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files ?? [])
  target.value = ''

  if (!files.length) return

  const remaining = Math.max(0, props.maxCount - currentCount.value)
  const accepted = files.slice(0, remaining).filter((f) => f.size <= props.maxFileSize)

  const newItems: MultiImageUploaderItem[] = []
  for (const file of accepted) {
    try {
      const url = await readAsDataUrl(file)
      newItems.push({ id: nextLocalId(), url })
    } catch (error) {
      console.error('Failed to read file', file.name, error)
    }
  }

  if (newItems.length === 0) return

  images.value = [...(images.value ?? []), ...newItems]
  emit('uploaded', newItems)
}

function handleRemove(index: number): void {
  const list = images.value ?? []
  const removed = list[index]
  if (!removed) return
  images.value = list.filter((_, i) => i !== index)
  emit('removed', removed)
}

defineExpose({
  /** 對齊原元件介面；stub 永遠不 cache，固定回 false。 */
  isCachingBase64: false,
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-4">
      <Button
        :label="t('portal_product.button.select_images')"
        :disabled="disabled || !canAddMore"
        @click="handleOpenFilePicker"
      >
        <template #icon>
          <i class="pi pi-plus" />
        </template>
      </Button>

      <div class="text-sm">
        {{ t('portal_product.form.hint.images_uploaded', { current: currentCount, max: maxCount }) }}
      </div>
    </div>

    <div
      v-if="(images?.length ?? 0) > 0"
      class="flex flex-wrap items-start gap-4"
    >
      <div
        v-for="(image, index) in images"
        :key="`${image.id}-${index}`"
        class="relative overflow-hidden w-24 h-28 border border-gray-200 rounded bg-white"
      >
        <img
          :src="image.url"
          :alt="`uploaded-image-${index}`"
          class="w-full h-full object-cover"
        >
        <div class="absolute bottom-0 inset-x-0 flex items-center h-7 bg-gray-700/95 text-white">
          <button
            type="button"
            class="flex flex-1 items-center justify-center h-full cursor-pointer transition hover:bg-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="disabled"
            @click="handleRemove(index)"
          >
            <i class="pi pi-trash text-xs" />
          </button>
        </div>
      </div>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      class="hidden"
      :accept="accept"
      :disabled="disabled || !canAddMore"
      multiple
      @change="handleNativeFileChange"
    >
  </div>
</template>
