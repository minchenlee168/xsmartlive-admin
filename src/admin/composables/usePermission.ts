import type { PermissionKey } from '@/admin/constants/permissions'

/**
 * 權限檢查 composable。
 *
 * 此專案為前端展示用，**無真實後端**；mock 為固定回 `true`，
 * 保持 API surface 與 portal-vue 對齊，未來接 auth store 時只需替換 implementation。
 *
 * @returns {{ has: (key: PermissionKey) => boolean }} 權限檢查介面
 */
export function usePermission() {
  function has(_key: PermissionKey): boolean {
    return true
  }
  // portal-vue useSidebarMenu 呼叫的介面：接受 undefined / 單一 key / key 陣列。
  function hasPermission(_required?: PermissionKey | PermissionKey[]): boolean {
    return true
  }
  return { has, hasPermission }
}
