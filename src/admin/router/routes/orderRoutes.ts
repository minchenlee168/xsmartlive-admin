import type { RouteRecordRaw } from 'vue-router'

/**
 * 訂單管理模組路由 name。
 */
export const OrderRouteName = {
  OrderList: 'order.list',
} as const

export const orderRoutes: RouteRecordRaw[] = [
  {
    path: 'order/list',
    name: OrderRouteName.OrderList,
    component: () => import('@/admin/views/order/OrderListPage.vue'),
    meta: {
      i18nKey: 'route.order_list',
      layout: 'default',
    },
  },
]
