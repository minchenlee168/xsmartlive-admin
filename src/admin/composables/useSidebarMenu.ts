import type { Ref } from 'vue';
import { sidebarMenu, merchantManagementMenu, type MenuItem } from '@/admin/constants/sidebarMenu';

import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usePermission } from '@/admin/composables/usePermission';

/**
 * 路由 name 以 `merchant-management` 開頭時 sidebar 切換為商家管理子選單。
 * Why: 模式直接由 route 推導，避免另存獨立 state 與 route 不同步。
 */
function isMerchantManagementRoute(routeName: unknown): boolean {
  return typeof routeName === 'string'
    && (routeName === 'merchant-management' || routeName.startsWith('merchant-management.'));
}

function filterMenuItems(
  items: readonly MenuItem[],
  hasPermission: (required?: MenuItem['permissionKey']) => boolean,
): MenuItem[] {
  return items.reduce<MenuItem[]>((result, item) => {
    if (item.permissionKey && !hasPermission(item.permissionKey)) {
      return result;
    }

    if (!item.items) {
      result.push(item);
      return result;
    }

    const children = filterMenuItems(item.items, hasPermission);
    if (children.length === 0) {
      return result;
    }

    result.push({
      ...item,
      items: children,
    });

    return result;
  }, []);
}

function findActiveMenuPath(
  items: readonly MenuItem[],
  routeName: string | null | undefined,
  parentKeys: string[] = [],
): string[] | null {
  if (!routeName) {
    return null;
  }

  for (const [index, item] of items.entries()) {
    const currentPath = [...parentKeys, String(index)];

    if (item.to === routeName) {
      return currentPath;
    }

    if (item.items) {
      const childPath = findActiveMenuPath(item.items, routeName, currentPath);

      if (childPath) {
        return childPath;
      }
    }
  }

  return null;
}

function normalizeRouteName(routeName: unknown): string | undefined {
  if (typeof routeName !== 'string') {
    return undefined;
  }

  const trimmed = routeName.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function useSidebarMenu(expandedMenuPath: Ref<string[]>, currentRouteMenuItems: Ref<string[]>) {
  const { hasPermission } = usePermission();
  const router = useRouter();

  const isMerchantManagementMode = computed(() => isMerchantManagementRoute(router.currentRoute.value.name));

  const filteredMenu = computed(() => {
    const source = isMerchantManagementMode.value ? merchantManagementMenu : sidebarMenu;
    return filterMenuItems(source, hasPermission);
  });

  function setCurrentMenuPath(path: string[] | null) {
    const nextPath = path ?? [];

    expandedMenuPath.value = [...nextPath];
    currentRouteMenuItems.value = [...nextPath];
  }

  const syncActiveMenu = () => {
    const routeName = normalizeRouteName(router.currentRoute.value.name);
    const path = findActiveMenuPath(filteredMenu.value, routeName);
    setCurrentMenuPath(path);
  };

  watch(
    [() => router.currentRoute.value.name, filteredMenu],
    syncActiveMenu,
    { immediate: true },
  );

  return {
    filteredMenu,
    syncActiveMenu,
    isMerchantManagementMode,
  };
}
