<script setup lang="ts">
import { useSidebarMenu } from '@/admin/composables/useSidebarMenu';
import MenuItem from './MenuItem.vue';

const props = withDefaults(
  defineProps<{
    isExpanded?: boolean
  }>(),
  {
    isExpanded: true,
  },
);

const currentRouteMenuItems = defineModel<string[]>('currentRouteMenuItems', { default: () => [] });
const expandedMenuPath = defineModel<string[]>('expandMenuPath', { default: () => [] });

const { filteredMenu } = useSidebarMenu(expandedMenuPath, currentRouteMenuItems);
</script>

<template>
  <ul class="list-none">
    <template
      v-for="(item, index) in filteredMenu"
      :key="item.to ?? item.url ?? `${item.labelKey}-${index}`"
    >
      <MenuItem
        v-model:current-route-menu-items="currentRouteMenuItems"
        v-model:expand-menu-path="expandedMenuPath"
        :item="item"
        :index="index"
        :level="0"
        :is-expanded="props.isExpanded"
      />
    </template>
  </ul>
</template>
