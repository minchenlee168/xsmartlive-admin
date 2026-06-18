<script setup lang="ts">
import Mask from '@/admin/components/portal-ui/Mask.vue';
import { useConfigStore } from '@/admin/stores/config';
import { RouteName } from '@/admin/router';
import SidebarMenu from './SidebarMenu.vue';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const configStore = useConfigStore();
const router = useRouter();
const { t } = useI18n();

const isSidebarHovering = ref(false);
const currentRouteMenuItems = ref<string[]>([]);
const expandedMenuPath = ref<string[]>([]);

const isSidebarHoverExpanded = computed(() => configStore.isSidebarExpanded || isSidebarHovering.value);

const isMerchantMode = computed(() => configStore.loginMode === 'merchant');

const isMerchantManagementMode = computed(() => {
  const name = router.currentRoute.value.name;
  return typeof name === 'string'
    && (name === 'merchant-management' || name.startsWith('merchant-management.'));
});

async function handleClickMerchantManagement() {
  if (isMerchantManagementMode.value) {
    await router.push({ name: RouteName.LiveOrder });
    return;
  }
  await router.push({ name: RouteName.StoreManagement });
}
</script>

<template>
  <Transition name="fade">
    <Mask
      v-if="configStore.isSidebarExpanded"
      class="cursor-pointer sm:hidden"
      :class="[
        configStore.isSidebarExpanded ? '' : 'opacity-0 w-0 pointer-events-none'
      ]"
      @click="configStore.toggleSidebar"
    >
      <div
        class="flex flex-col h-full border-gray-200 border-r bg-white cursor-auto dark:border-gray-700 dark:bg-black"
        :class="[
          configStore.isSidebarExpanded ? 'w-64' : 'w-0'
        ]"
        @click.stop
      >
        <div class="overflow-y-auto flex-1">
          <SidebarMenu
            v-model:current-route-menu-items="currentRouteMenuItems"
            v-model:expand-menu-path="expandedMenuPath"
            :is-expanded="isSidebarHoverExpanded"
          />
        </div>
        <button
          v-if="isMerchantMode"
          type="button"
          class="merchant-management-button"
          :class="{ 'merchant-management-button--active': isMerchantManagementMode }"
          @click="handleClickMerchantManagement"
        >
          <FontAwesomeIcon
            :icon="['far', isMerchantManagementMode ? 'chevron-left' : 'building-user']"
            class="text-base"
          />
          <span
            v-if="isSidebarHoverExpanded"
            class="truncate"
          >
            {{ isMerchantManagementMode
              ? t('layout.button.back_to_main')
              : t('nav.merchant_management.merchant_management') }}
          </span>
        </button>
      </div>
    </Mask>
  </Transition>

  <div
    class="hidden relative shrink-0 sm:block"
    :class="[configStore.isSidebarExpanded ? 'w-64' : 'w-14']"
    @mouseenter="isSidebarHovering = true"
    @mouseleave="isSidebarHovering = false"
  >
    <div
      class="sidebar-panel flex flex-col relative h-full border-gray-200 border-r bg-white dark:border-gray-700 dark:bg-black"
      :class="[
        configStore.isSidebarExpanded
          ? 'w-64 sidebar-panel--dock'
          : (
            isSidebarHovering
              ? 'absolute left-0 top-0 w-64 shadow-2xl sidebar-panel--overlay'
              : 'w-14 sidebar-panel--dock'
          )
      ]"
    >
      <div
        class="flex-1"
        :class="[
          (configStore.isSidebarExpanded || isSidebarHovering)
            ? 'overflow-y-auto'
            : 'overflow-y-hidden'
        ]"
      >
        <SidebarMenu
          v-model:current-route-menu-items="currentRouteMenuItems"
          v-model:expand-menu-path="expandedMenuPath"
          :is-expanded="isSidebarHoverExpanded"
        />
      </div>
      <button
        type="button"
        class="merchant-management-button"
        :class="{ 'merchant-management-button--active': isMerchantManagementMode }"
        @click="handleClickMerchantManagement"
      >
        <FontAwesomeIcon
          :icon="['far', isMerchantManagementMode ? 'chevron-left' : 'building-user']"
          class="text-base"
        />
        <span
          v-if="isSidebarHoverExpanded"
          class="truncate"
        >
          {{ isMerchantManagementMode
            ? t('layout.button.back_to_main')
            : t('nav.merchant_management.merchant_management') }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
  will-change: opacity, transform;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}

.sidebar-panel {
  transition-property: width, box-shadow, z-index;
  transition-duration: 200ms, 200ms, 0ms;
  transition-timing-function: ease, ease, linear;
}

.sidebar-panel--dock {
  z-index: 0;
  transition-delay: 0ms, 0ms, 200ms;
}

.sidebar-panel--overlay {
  z-index: 50;
  transition-delay: 0ms, 0ms, 0ms;
}

.merchant-management-button {
  @apply flex items-center gap-3 shrink-0 w-full h-12 px-4 border-t cursor-pointer transition-colors;
  border-color: var(--p-content-border-color);
  color: var(--p-text-color);
}

.merchant-management-button:hover {
  background-color: var(--p-content-hover-background);
}

.merchant-management-button--active {
  color: var(--p-primary-color);
  background-color: var(--p-highlight-background);
}
</style>
