import { useToast } from 'primevue/usetoast'

interface ToastOptions {
  summary?: string
  detail?: string
  life?: number
}

/**
 * Toast helper — 跟 portal-vue 的 `useGlobalToast` 對齊的最小介面。
 *
 * 內部走 PrimeVue 的 useToast；caller 只要傳 detail 即可，summary 可選。
 */
export function useGlobalToast() {
  const toast = useToast()

  function showSuccess(options: ToastOptions): void {
    toast.removeAllGroups()
    toast.add({
      severity: 'success',
      summary: options.summary ?? 'Success',
      detail: options.detail,
      life: options.life ?? 3000,
    })
  }

  function showError(options: ToastOptions): void {
    toast.removeAllGroups()
    toast.add({
      severity: 'error',
      summary: options.summary ?? 'Error',
      detail: options.detail,
      life: options.life ?? 4000,
    })
  }

  function showWarn(options: ToastOptions): void {
    toast.removeAllGroups()
    toast.add({
      severity: 'warn',
      summary: options.summary ?? 'Warning',
      detail: options.detail,
      life: options.life ?? 3500,
    })
  }

  function showInfo(options: ToastOptions): void {
    toast.removeAllGroups()
    toast.add({
      severity: 'info',
      summary: options.summary ?? 'Info',
      detail: options.detail,
      life: options.life ?? 3000,
    })
  }

  return {
    showSuccess,
    showError,
    showWarn,
    showInfo,
  }
}
