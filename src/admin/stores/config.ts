import { defineStore } from 'pinia'
import { useLayoutStore } from '@/admin/stores/layout'
import { useThemeStore } from '@/admin/stores/theme'

/**
 * 對齊 portal-vue 的 `useConfigStore` 最小介面。
 *
 * 本 prototype 沒有 multi-tenant loginMode / 主題系統設定的概念，
 * 內部把 `isSidebarExpanded` / `toggleSidebar` 代理到 useLayoutStore；
 * `isDarkMode` / `loginMode` 給定固定值，讓 port 過來的 layout 元件可以直接用。
 */
export const useConfigStore = defineStore('admin-config', {
  state: () => ({}),
  getters: {
    /** 與 portal-vue 對齊：true 表示 sidebar 展開（與我們的 isSidebarCollapsed 相反）。 */
    isSidebarExpanded(): boolean {
      return !useLayoutStore().isSidebarCollapsed
    },
    /** 與 portal-vue 對齊：始終回傳 'merchant'，讓商家管理 button 永遠可見。 */
    loginMode(): 'merchant' {
      return 'merchant'
    },
    isDarkMode(): boolean {
      return useThemeStore().isDark
    },
  },
  actions: {
    toggleSidebar() {
      useLayoutStore().toggleSidebar()
    },
  },
})
