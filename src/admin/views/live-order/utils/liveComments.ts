/**
 * 留言 mock 資料 + 模板套用工具，供直播模式（OrderModeView）與貼文/社團模式（LiveOrderPage Drawer）共用。
 */

export interface LiveComment {
  id: number
  user: string
  text: string
  platform: string
  tagType?: string
  pinned?: boolean
  stars?: number
  time: string
}

export interface CommentProductLite {
  name: string
  keyword: string
  isGift: boolean
  bidding: boolean
  flatPrice: number
  specs: string[]
}

export interface PlatformMeta {
  platformIcon: [string, string]
  platformColor: string
}

/** 30 筆留言模板（一半下單 / 一半閒聊 / 含競價與置頂公告） */
export const commentTemplates: LiveComment[] = [
  { id: 1,  user: '粉絲團小編',        text: '最後1分鐘～',                  platform: 'fb',    tagType: 'official', pinned: true, time: '2025-12-17 20:48:07' },
  { id: 2,  user: 'Haji Abdul Mali…',  text: '{kw0} {kw0-spec0}+1',          platform: 'fb',    stars: 3,             time: '2025-12-17 20:48:07' },
  { id: 3,  user: '陳大悅',            text: '早安',                         platform: 'ig',    stars: 3,             time: '2025-12-17 20:48:07' },
  { id: 4,  user: '王大天',            text: '{kw1} {kw1-spec1}+1',          platform: 'live',  stars: 3,             time: '2025-12-17 20:48:07' },
  { id: 5,  user: 'Jade Liu',          text: '{kw0} {kw0-spec1}+2',          platform: 'ig',    tagType: 'blacklist', time: '2025-12-17 20:48:07' },
  { id: 6,  user: '張曉明',            text: '{kw2}+1',                      platform: 'group', tagType: 'vip',       time: '2025-12-17 20:48:07' },
  { id: 7,  user: '林小美',            text: '{kw1} {kw1-spec0}+3',          platform: 'fb',    stars: 2,             time: '2025-12-17 20:49:12' },
  { id: 8,  user: '蔡先生',            text: '我要一件 {kw0} {kw0-spec0}+1', platform: 'live',  stars: 4,             time: '2025-12-17 20:49:30' },
  { id: 9,  user: '黃媽媽',            text: '{kw1} {kw1-spec1}+2',          platform: 'fb',    stars: 5,             time: '2025-12-17 20:49:45' },
  { id: 10, user: '阿志',              text: '{kw2}+2',                      platform: 'live',  stars: 3,             time: '2025-12-17 20:50:01' },
  { id: 11, user: '小美',              text: '{kw0} {kw0-spec1}+1',          platform: 'ig',    stars: 4,             time: '2025-12-17 20:50:15' },
  { id: 12, user: '阿明',              text: '+1 {kw1} {kw1-spec0}',         platform: 'group', stars: 3,             time: '2025-12-17 20:50:32' },
  { id: 13, user: '小芳',              text: '{kw2}+3 謝謝',                 platform: 'fb',    stars: 4,             time: '2025-12-17 20:50:48' },
  { id: 14, user: '競價快手',          text: '{bidhit}',                     platform: 'fb',    stars: 5,             time: '2025-12-17 20:51:02' },
  { id: 15, user: '小李',              text: '{bidlow}',                     platform: 'live',  stars: 3,             time: '2025-12-17 20:51:18' },
  { id: 16, user: '陳太太',            text: '{kw0} {kw0-spec0}+2',          platform: 'fb',    stars: 4,             time: '2025-12-17 20:51:35' },
  { id: 17, user: '小白',              text: '主播好棒！',                   platform: 'fb',    stars: 3,             time: '2025-12-17 20:51:40' },
  { id: 18, user: '雅婷',              text: '{kw1} {kw1-spec1}+1',          platform: 'ig',    stars: 4,             time: '2025-12-17 20:51:52' },
  { id: 19, user: '陳爸爸',            text: '請問還有貨嗎？',               platform: 'live',  stars: 3,             time: '2025-12-17 20:52:00' },
  { id: 20, user: 'Anna Wang',         text: '{kw2}+1 謝謝',                 platform: 'fb',    stars: 5,             time: '2025-12-17 20:52:15' },
  { id: 21, user: '黃先生',            text: '價格不錯！',                   platform: 'group', stars: 3,             time: '2025-12-17 20:52:28' },
  { id: 22, user: '阿銘',              text: '{kw0} {kw0-spec1}+3',          platform: 'live',  stars: 4,             time: '2025-12-17 20:52:40' },
  { id: 23, user: '小宇',              text: '剛來，有重點嗎？',             platform: 'fb',    stars: 3,             time: '2025-12-17 20:52:55' },
  { id: 24, user: '林媽',              text: '{kw1} {kw1-spec0}+2',          platform: 'ig',    stars: 4,             time: '2025-12-17 20:53:10' },
  { id: 25, user: '蕭先生',            text: '麻煩寄到超商',                 platform: 'live',  stars: 3,             time: '2025-12-17 20:53:22' },
  { id: 26, user: '吳小姐',            text: '{kw2}+2',                      platform: 'fb',    stars: 5,             time: '2025-12-17 20:53:38' },
  { id: 27, user: '王太太',            text: '好可愛！',                     platform: 'group', stars: 4,             time: '2025-12-17 20:53:50' },
  { id: 28, user: '老張',              text: '{kw0} {kw0-spec0}+1',          platform: 'fb',    stars: 3,             time: '2025-12-17 20:54:05' },
  { id: 29, user: '阿芬',              text: '哈囉～',                       platform: 'ig',    stars: 3,             time: '2025-12-17 20:54:18' },
  { id: 30, user: '小翔',              text: '{kw1} {kw1-spec1}+4',          platform: 'live',  stars: 5,             time: '2025-12-17 20:54:30' },
]

/**
 * 把 placeholder 換成商品實際值：
 * - `{kwN}` / `{kwN-specM}` / `{nameN}`：第 N 個商品的關鍵字 / 規格 / 名稱
 * - `{bidhit}`：第一個競價商品的「關鍵字 + 一刀價」（達標）
 * - `{bidlow}`：第一個競價商品的「關鍵字 + 一刀價 × 0.7」（未達）
 * 沒對應商品的 placeholder 直接吃成空字串。
 */
export function applyTemplate(text: string, products: CommentProductLite[], bidProduct: CommentProductLite | null): string {
  if (products.length === 0) return text
  const pick = (i: number): CommentProductLite | undefined => products[Number(i) % products.length]
  return text
    .replace(/\{kw(\d+)-spec(\d+)\}/g, (_, pi, si) => {
      const p = pick(Number(pi))
      const specs = p?.specs ?? []
      return specs.length > 0 ? (specs[Number(si) % specs.length] ?? '') : ''
    })
    .replace(/\{kw(\d+)\}/g, (_, i) => pick(Number(i))?.keyword ?? '')
    .replace(/\{name(\d+)\}/g, (_, i) => pick(Number(i))?.name ?? '')
    .replace(/\{bidhit\}/g, () => {
      if (!bidProduct) return ''
      const specStr = bidProduct.specs.length > 0 ? ` ${bidProduct.specs[0]}` : ''
      return `${bidProduct.keyword}${specStr} ${bidProduct.flatPrice}`
    })
    .replace(/\{bidlow\}/g, () => {
      if (!bidProduct) return ''
      const specStr = bidProduct.specs.length > 0 ? ` ${bidProduct.specs[0]}` : ''
      const amount = Math.max(0, Math.floor(bidProduct.flatPrice * 0.7))
      return `${bidProduct.keyword}${specStr} ${amount}`
    })
}

/** 平台 icon + 品牌色 meta，LiveCommentCard 右下顯示用 */
export function getPlatformMeta(platform: string): PlatformMeta {
  const map: Record<string, PlatformMeta> = {
    fb:    { platformIcon: ['fab', 'facebook'],  platformColor: '#1877f2' },
    ig:    { platformIcon: ['fab', 'instagram'], platformColor: '#db2777' },
    line:  { platformIcon: ['fab', 'line'],      platformColor: '#06c755' },
    tiktok:{ platformIcon: ['fab', 'tiktok'],    platformColor: '#000000' },
    live:  { platformIcon: ['fas', 'video'],     platformColor: '#7008e7' },
    group: { platformIcon: ['fab', 'facebook'],  platformColor: '#1877f2' },
  }
  return map[platform] ?? map.fb
}
