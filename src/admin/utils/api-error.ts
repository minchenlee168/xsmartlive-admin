/**
 * 從 catch 到的 error 物件擷取訊息。
 *
 * 此專案為前端展示用，無真實後端與 ApiError 體系，因此實作較精簡：
 * 優先讀 `Error.message`，其他情況退回 fallback。
 *
 * @param error - 任意 catch 到的值
 * @param fallback - 取不到時使用的訊息（預設為通用「未知錯誤」）
 * @returns 可顯示的字串
 */
export function getApiErrorMessage(error: unknown, fallback = 'Unknown error'): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}
