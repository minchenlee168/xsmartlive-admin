import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'
import { fileURLToPath, URL } from 'node:url'
import { execSync } from 'node:child_process'

/**
 * 抓最後一次 commit 時間注入到 client，TopBar 用來顯示 prototype 更新時間。
 * 失敗時退回 build 當下時間（避免 CI 沒有 git 時 crash）。
 */
const lastCommitTime = (() => {
  try {
    return execSync('git log -1 --format=%cI', {
      cwd: fileURLToPath(new URL('.', import.meta.url)),
    }).toString().trim()
  } catch {
    return new Date().toISOString()
  }
})()

export default defineConfig({
  base: '/xsmartlive-admin/',
  define: {
    __LAST_COMMIT_TIME__: JSON.stringify(lastCommitTime),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    vue(),
    tailwindcss(),
    Components({
      dts: false,
      resolvers: [PrimeVueResolver()],
    }),
  ],
})
