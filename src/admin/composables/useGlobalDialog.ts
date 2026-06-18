import { useConfirm } from 'primevue/useconfirm'

export interface ConfirmOptions {
  message?: string
  header?: string
  acceptLabel?: string
  rejectLabel?: string
}

/**
 * 全域 dialog helper — 對齊 portal-vue 的 `useGlobalDialog` 最小介面。
 *
 * 目前只 expose `confirm`，回傳 `Promise<boolean>`（accept → true、reject/close → false）。
 * 內部包 PrimeVue 的 useConfirm。
 */
export function useGlobalDialog() {
  const confirm = useConfirm()

  function confirmDialog(options: ConfirmOptions = {}): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      confirm.require({
        header: options.header ?? '確認',
        message: options.message ?? '',
        acceptLabel: options.acceptLabel ?? '確定',
        rejectLabel: options.rejectLabel ?? '取消',
        accept: () => resolve(true),
        reject: () => resolve(false),
        onHide: () => resolve(false),
      })
    })
  }

  return {
    confirm: confirmDialog,
  }
}
