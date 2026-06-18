import { defineStore } from 'pinia'

/** Sidebar 顯示模式。 */
export type SidebarMode = 'main' | 'merchant-management'

interface LayoutState {
  /** 側邊欄是否收合 */
  isSidebarCollapsed: boolean
  /** 當前展開的選單群組 key；null 表示全部收合 */
  activeGroup: string | null
  /** Sidebar 模式：主選單 / 商家管理子選單 */
  sidebarMode: SidebarMode
}

/**
 * 全域版面狀態 store（Sidebar 收合 / 當前展開群組 / Sidebar 模式）。
 */
export const useLayoutStore = defineStore('layout', {
  state: (): LayoutState => ({
    isSidebarCollapsed: false,
    activeGroup: 'live',
    sidebarMode: 'main',
  }),
  actions: {
    /**
     * 切換側邊欄展開狀態。
     */
    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed
    },
    /**
     * 設定當前展開群組；同一群組重複點擊會收合。
     */
    setActiveGroup(key: string) {
      this.activeGroup = this.activeGroup === key ? null : key
    },
    /**
     * 設定 sidebar 顯示模式。
     */
    setSidebarMode(mode: SidebarMode) {
      this.sidebarMode = mode
    },
  },
})
