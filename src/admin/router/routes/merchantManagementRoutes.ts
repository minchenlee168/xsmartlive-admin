import type { RouteRecordRaw } from 'vue-router'

/**
 * 商家管理路由（後台 `/admin` 下的子路由）。
 *
 * 實際 URL：`/admin/merchant-management/store-management`。
 */
export const MerchantManagementRouteName = {
  StoreManagement: 'merchant-management.store-management',
} as const

export const merchantManagementRoutes: RouteRecordRaw[] = [
  {
    path: 'merchant-management/store-management',
    name: MerchantManagementRouteName.StoreManagement,
    component: () =>
      import('@/admin/views/merchant-management/store-management/StoreManagementPage.vue'),
    meta: {
      i18nKey: 'route.merchant_management.store_management',
      layout: 'default',
    },
  },
]
