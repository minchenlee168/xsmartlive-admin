import type { Router } from 'vue-router'
import { i18n } from '@/admin/i18n'

/**
 * 路由切換時依 `meta.i18nKey` 更新 `document.title`。
 *
 * 對應 portal-vue 規範：所有 route 帶 `meta.i18nKey`，title 由 i18n 翻譯而非寫死。
 *
 * @param {Router} router - Vue Router 實例
 */
export function registerTitleGuard(router: Router): void {
  router.afterEach((to) => {
    const key = to.meta?.i18nKey as string | undefined
    const baseTitle = '直播管家'
    if (key) {
      const t = i18n.global.t as unknown as (k: string) => string
      const pageTitle = t(key)
      document.title = `${pageTitle} - ${baseTitle}`
    } else {
      document.title = baseTitle
    }
  })
}
