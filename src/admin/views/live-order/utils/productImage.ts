/**
 * 依商品名稱關鍵字推導對應的縮圖 URL（mock/原型用）。
 * 沒有 catalog 圖片欄位的情境下，前端 LiveProductCard 直接呼叫這支拿圖。
 */

const NAME_TO_IMAGE: Array<[RegExp, string]> = [
  [/iPad|平板/i,                                        'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=200&q=70'],
  [/iPhone|保護殼|手機殼|螢幕保護貼/i,                   'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=200&q=70'],
  [/JBL|藍牙喇叭|喇叭/i,                                'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=200&q=70'],
  [/耳機|Sony.*WH|耳罩|headphone/i,                     'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=70'],
  [/Switch|PS5|控制器|電玩|搖桿/i,                       'https://images.unsplash.com/photo-1580234811497-9df7fd2f357e?w=200&q=70'],
  [/鍵盤|機械鍵盤|Razer/i,                              'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&q=70'],
  [/滑鼠|ROG|mouse/i,                                   'https://images.unsplash.com/photo-1527814050087-3793815479db?w=200&q=70'],
  [/電視|QLED|TV|顯示器/i,                              'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=200&q=70'],
  [/錶帶|Watch|手錶/i,                                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=70'],
  [/包屁衣|嬰兒|寶寶|童裝|爬服/i,                        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&q=70'],
  [/T.?恤|polo|長袖|短袖|上衣/i,                         'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=70'],
  [/洋裝|連衣裙|公主裙|裙/i,                            'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=200&q=70'],
  [/外套|衝鋒衣|夾克|羊毛衫|套裝/i,                      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200&q=70'],
  [/錢包|皮夾|配件/i,                                   'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=200&q=70'],
]

/** 通用兜底：沒命中任何關鍵字時用商品/包裝感的中性圖 */
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=200&q=70'

export function imageForProductName(name: string | undefined | null): string {
  if (!name) return ''
  for (const [re, url] of NAME_TO_IMAGE) if (re.test(name)) return url
  return FALLBACK_IMAGE
}
