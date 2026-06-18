import { z } from 'zod'
import { i18n } from '@/admin/i18n'

const globalI18n = i18n.global as unknown as { t: (key: string) => string }

const tv = (key: string) => String(globalI18n.t(`portal_product.form.validation.${key}`))
const tr = (key: string) => () => tv(key)

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: tr('name_required')() })
    .max(200, { message: tr('name_max')() }),
  intro: z.string().trim().optional(),
  keyword: z.string().trim().optional(),
  note: z.string().trim().optional(),
  weight: z.coerce.number().min(0).optional(),
  status: z.boolean().optional(),
  allowOversell: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  categoryIds: z.array(z.number()).optional(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

/**
 * PortalProductForm 內部用的商品結構。
 *
 * 與 portal-vue 的 ProductForm 對齊（去除 promote 多件優惠），讓未來可以直接
 * 把這份資料丟回後端而不必再做形狀轉換。
 */
export interface PortalProduct {
  id?: number
  name: string
  categoryIds: number[]
  intro?: string
  tags?: string[]
  note?: string
  weight?: number
  hasSpec: boolean
  allowOversell: boolean
  keyword?: string
  publishAt?: string
  unpublishAt?: string
  productImageIds?: number[]
  productImages?: PortalProductImage[]
  specs?: PortalProductSpec[]
  variants?: PortalProductVariant[]
  isCouponEnabled: boolean
}

/** 商品圖片。url 為前端展示用；id 為後端 media 識別。 */
export interface PortalProductImage {
  id: number
  url: string
}

/** 規格群組（顏色、尺寸…）。 */
export interface PortalProductSpec {
  id: number
  name: string
  children: PortalProductSpecChild[]
}

/** 規格選項；imageId / imageUrl 僅第一層規格使用。 */
export interface PortalProductSpecChild {
  id: number
  name: string
  imageId?: number
  imageUrl?: string
}

/**
 * 規格組合對應的變體（價格、庫存）。
 * specIndex 為對應 specs[] 各群組內的索引；例 (M, Red) 在 [尺寸,顏色] 下為 [1,0]
 */
export interface PortalProductVariant {
  id: number
  cost: number
  originalPrice: number
  salePrice: number
  stock: number
  specIndex: number[]
}

/**
 * 分類樹節點 — 採與 portal-vue 一致的 `child` 屬性命名以利共用 helpers。
 */
export interface PortalCategory {
  id: number
  name: string
  imageUrl?: string | null
  child?: PortalCategory[]
}
