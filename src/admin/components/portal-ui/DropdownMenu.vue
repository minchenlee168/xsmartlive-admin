<script setup lang="ts">
import { onUnmounted, ref } from 'vue';
import type { MenuItem } from 'primevue/menuitem';

/**
 * 行內精簡版 debounce — 取代 lodash-es 的同名函式，僅保留 cancel()，
 * 與本元件 hideDebounced 的用法吻合。
 */
function debounce<T extends (...args: never[]) => void>(fn: T, wait: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const wrapped = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  (wrapped as unknown as { cancel: () => void }).cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  return wrapped as T & { cancel: () => void };
}

interface DropdownItem extends MenuItem {
  label: string
  icon?: string
  onClick?: () => void
}

withDefaults(defineProps<{
  icon: string
  model: DropdownItem[]
  severity?: string
  variant?: string
  rounded?: boolean
}>(), {
  severity: 'contrast',
  variant: 'text',
  rounded: true,
});

const menu = ref();

function toggle(event: MouseEvent) {
  menu.value.toggle(event);
};

function handleClick(item: DropdownItem) {
  item.onClick?.();
};

const hideDebounced = debounce(() => {
  if (!menu.value) {
    return;
  }

  menu.value.hide();
}, 50);

function showOnHover(event: MouseEvent) {
  hideDebounced.cancel();

  if (!menu.value) {
    return;
  }

  menu.value.show(event);
}

onUnmounted(() => hideDebounced.cancel());
</script>

<template>
  <div>
    <Button
      tabindex="-1"
      :severity="severity"
      :variant="variant"
      :rounded="rounded"
      @click="toggle"
      @mouseenter="showOnHover"
      @mouseleave="hideDebounced"
    >
      <template #icon>
        <FontAwesomeIcon :icon="['far', icon]" />
      </template>
    </Button>

    <Menu
      ref="menu"
      :model="model"
      popup
      @mouseenter="hideDebounced.cancel"
      @mouseleave="hideDebounced"
    >
      <template #item="slotProps">
        <slot
          name="item"
          v-bind="slotProps"
        >
          <div
            class="cursor-pointer flex items-center gap-2 p-2 text-sm"
            @click="handleClick(slotProps.item as DropdownItem)"
          >
            <FontAwesomeIcon
              v-if="slotProps.item.icon"
              :icon="['far', slotProps.item.icon as string]"
            />
            {{ slotProps.item.label }}
          </div>
        </slot>
      </template>
    </Menu>
  </div>
</template>
