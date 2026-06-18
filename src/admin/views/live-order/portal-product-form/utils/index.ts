/**
 * 工具函式 re-export — 與 portal-vue 一致，集中收口讓 component 不必個別 import。
 *
 * 目前在 live-commerce 內僅需 categorySelection helpers，原本的
 * `transformProductToFormData`/`extractLeafCategories` 仰賴後端 ProductApi
 * 形狀，stub 化專案不需要直接照搬。
 */

export {
  findCategoryNode,
  findCategoryPath,
  isCategoryCovered,
  isCategoryDirectlySelected,
  normalizeCategoryIds,
} from './categorySelection'
