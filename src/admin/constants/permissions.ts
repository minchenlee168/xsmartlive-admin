/**
 * 權限常數定義。
 *
 * 命名格式：`SCREAMING_SNAKE_CASE`，前綴對應模組。
 * 於 route meta（`meta.permissionKey`）、`vPermission` directive、`usePermission()` 處引用，
 * 避免散落字串造成 typo。
 */
export const PERMISSIONS = {
  LIVE_ORDER_VIEW: 'live_order.view',
  LIVE_ORDER_MANAGE: 'live_order.manage',
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
