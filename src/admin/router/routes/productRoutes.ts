import type { RouteRecordRaw } from 'vue-router'

/**
 * 商品管理模組路由 name。
 *
 * 目前只實作「商品列表」；賣場分頁 / 常用規格 / 商品標籤 暫以 sidebar `planning: true` 呈現，
 * 之後實作完成再補對應的 RouteName + route record。
 */
export const ProductRouteName = {
  ProductList: 'product.list',
} as const

export const productRoutes: RouteRecordRaw[] = [
  {
    path: 'product/list',
    name: ProductRouteName.ProductList,
    component: () => import('@/admin/views/product/ProductListPage.vue'),
    meta: {
      i18nKey: 'route.product_list',
      layout: 'default',
    },
  },
]
