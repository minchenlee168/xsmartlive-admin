import { defineStore } from 'pinia'

interface ThemeState {
  /** 是否為暗色模式 */
  isDark: boolean
}

/**
 * 亮 / 暗色模式 store。
 *
 * - 初始值從 `localStorage.theme` 還原（'dark' 為 true，其它為 false）
 * - `toggle()` 後同步 `documentElement.classList` 與 `localStorage`
 * - PrimeVue 與 Tailwind 同用 `.dark` selector，故只需切換 documentElement class
 */
export const useThemeStore = defineStore('theme', {
  state: (): ThemeState => ({
    isDark: localStorage.getItem('theme') === 'dark',
  }),
  actions: {
    /**
     * 把當前狀態套用到 DOM；應用啟動時呼叫一次以還原使用者選擇。
     */
    applyToDom() {
      document.documentElement.classList.toggle('dark', this.isDark)
    },
    /**
     * 切換亮暗並落 localStorage + DOM。
     */
    toggle() {
      this.isDark = !this.isDark
      localStorage.setItem('theme', this.isDark ? 'dark' : 'light')
      this.applyToDom()
    },
  },
})
