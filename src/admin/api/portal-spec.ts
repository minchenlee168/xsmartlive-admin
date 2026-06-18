/**
 * 規格清單 mock API。
 * 對應 portal-vue 的 `@/api/spec` `fetchSpecListApi`，回傳商家已建立的規格定義
 * （每個規格含 name 與 children 陣列）。AutoComplete 下拉用此資料源。
 */

export interface SpecListChild {
  id: number
  name: string
}

export interface SpecListItem {
  id: number
  name: string
  children: SpecListChild[]
}

interface ApiSuccess<T> {
  success: true
  message: string
  data: T
}

const MOCK_SPEC_LIST: SpecListItem[] = [
  { id: 1, name: '顏色', children: [
    { id: 101, name: '紅' },
    { id: 102, name: '白' },
    { id: 103, name: '黑' },
  ] },
  { id: 2, name: '尺寸', children: [
    { id: 201, name: 'S' },
    { id: 202, name: 'M' },
    { id: 203, name: 'L' },
  ] },
  { id: 3, name: '款式', children: [
    { id: 301, name: '經典款' },
    { id: 302, name: '限定款' },
  ] },
  { id: 4, name: '口味', children: [
    { id: 401, name: '巧克力' },
    { id: 402, name: '香草' },
    { id: 403, name: '薄荷' },
  ] },
  { id: 5, name: '重量', children: [
    { id: 501, name: '100g' },
    { id: 502, name: '250g' },
    { id: 503, name: '500g' },
  ] },
  { id: 6, name: '容量', children: [
    { id: 601, name: '250ml' },
    { id: 602, name: '500ml' },
    { id: 603, name: '1L' },
  ] },
  { id: 7, name: '材質', children: [
    { id: 701, name: '棉' },
    { id: 702, name: '聚酯纖維' },
  ] },
  { id: 8, name: '型號', children: [
    { id: 801, name: '標準版' },
    { id: 802, name: 'Pro 版' },
  ] },
]

export async function fetchSpecListApi(): Promise<ApiSuccess<SpecListItem[]>> {
  await new Promise((resolve) => setTimeout(resolve, 150))
  return { success: true, message: 'ok', data: MOCK_SPEC_LIST.map((item) => ({
    ...item,
    children: item.children.map((c) => ({ ...c })),
  })) }
}
