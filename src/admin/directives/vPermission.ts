import type { Directive } from 'vue'
import { usePermission } from '@/admin/composables/usePermission'
import type { PermissionKey } from '@/admin/constants/permissions'

/**
 * `v-permission` directive：權限不足時把元素從 DOM 移除。
 *
 * 用法：
 * ```vue
 * <Button v-permission="'live_order.manage'" label="編輯" />
 * ```
 *
 * mock 場景固定回 true，所以實際不會移除任何元素；保留 API 讓組件可直接套用。
 */
export const vPermission: Directive<HTMLElement, PermissionKey> = {
  mounted(el, binding) {
    const { has } = usePermission()
    if (!has(binding.value)) {
      el.parentNode?.removeChild(el)
    }
  },
}
