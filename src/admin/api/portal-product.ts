/**
 * 商品表單相關的 mock API。
 *
 * 此檔案集中提供 PortalProductForm 所需的最小 API 集合（建立商品、
 * 套用分類預設圖、取得標籤池），全部以 setTimeout 模擬延遲，回傳穩定形狀。
 * 真實後端接入時可逐項替換 implementation，外部介面保持不變。
 */

/**
 * 建立商品 — mock 版本，固定延遲 300ms 後成功。
 *
 * @param _payload - 表單資料（mock 不做驗證，但保留參數讓 caller 對齊真實 API 簽名）
 */
export function createProductApi(
  _payload: Record<string, unknown>,
): Promise<{ success: true; data: { id: number } }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, data: { id: Math.floor(Math.random() * 1_000_000) } })
    }, 300)
  })
}

/**
 * 取得「分類預設圖」並回傳給商品做主圖。
 *
 * mock 永遠回固定 placeholder 圖網址；真實後端會依 categoryId 撈該分類設定的
 * 預設圖並建立 pending media。
 */
export function applyCategoryDefaultImageApi(
  _categoryId: number,
): Promise<{ success: true; data: { id: number; url: string } }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          id: Math.floor(Math.random() * 1_000_000),
          url: 'https://placehold.co/600x600?text=Category',
        },
      })
    }, 200)
  })
}

interface TagApi {
  id: number
  name: string
}

/**
 * 取得商家標籤池 — mock 回幾個固定標籤，供 MultiSelect 顯示。
 */
export function fetchTagListApi(): Promise<{ success: true; data: TagApi[] }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: [
          { id: 1, name: '熱銷' },
          { id: 2, name: '新品' },
          { id: 3, name: '限量' },
          { id: 4, name: '直播專屬' },
          { id: 5, name: '免運' },
        ],
      })
    }, 100)
  })
}
