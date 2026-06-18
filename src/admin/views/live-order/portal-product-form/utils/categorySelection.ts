import type { PortalCategory as Category } from '../schemas'

/**
 * 商品分類選擇的純函式 helpers — 與 portal-vue 一致，純粹處理 tree + ID 集合。
 *
 * @module views/live-order/portal-product-form/utils/categorySelection
 */

/**
 * 在 tree 內找到指定 id 的節點。
 *
 * @returns 找到回節點；否則 null。
 */
export function findCategoryNode(tree: Category[], id: number): Category | null {
  for (const node of tree) {
    if (node.id === id) return node
    if (node.child?.length) {
      const found = findCategoryNode(node.child, id)
      if (found) return found
    }
  }
  return null
}

/**
 * 從 tree root 走到 targetId 的 id 路徑（含 targetId）。
 *
 * @returns 路徑陣列；targetId 不在 tree 中為 null。
 */
export function findCategoryPath(tree: Category[], targetId: number): number[] | null {
  for (const node of tree) {
    if (node.id === targetId) return [node.id]
    if (node.child?.length) {
      const sub = findCategoryPath(node.child, targetId)
      if (sub) return [node.id, ...sub]
    }
  }
  return null
}

/**
 * 「分類 id 是否被當前 selectedIds 涵蓋」？
 * 涵蓋條件（任一）：id 直接在 selectedIds，或 id 的某祖先在 selectedIds。
 */
export function isCategoryCovered(
  tree: Category[],
  selectedIds: number[],
  id: number,
): boolean {
  const path = findCategoryPath(tree, id)
  if (!path) return false
  const selected = new Set(selectedIds)
  return path.some((pathId) => selected.has(pathId))
}

/**
 * 「id 是否直接命中 selectedIds」（不算祖先涵蓋）。
 */
export function isCategoryDirectlySelected(
  selectedIds: number[],
  id: number,
): boolean {
  return selectedIds.includes(id)
}

/**
 * 把 ids 列表 normalize 成 collapsed 形式：
 * 「某父分類的所有子都在 ids 中」→ 收斂成只剩父分類 id。
 */
export function normalizeCategoryIds(tree: Category[], ids: number[]): number[] {
  const idsSet = new Set(ids)
  const result: number[] = []
  for (const root of tree) {
    collectNormalized(root, idsSet, result)
  }
  return result
}

type CoverState = 'all' | 'partial' | 'none'

function collectNormalized(
  node: Category,
  ids: Set<number>,
  result: number[],
): CoverState {
  if (ids.has(node.id)) {
    result.push(node.id)
    return 'all'
  }

  const children = node.child ?? []
  if (children.length === 0) {
    return 'none'
  }

  const childResults: { state: CoverState; ids: number[] }[] = []
  for (const child of children) {
    const subIds: number[] = []
    const state = collectNormalized(child, ids, subIds)
    childResults.push({ state, ids: subIds })
  }

  const allChildrenAll = childResults.every((r) => r.state === 'all')
  if (allChildrenAll) {
    result.push(node.id)
    return 'all'
  }

  const anySelected = childResults.some((r) => r.state !== 'none')
  for (const r of childResults) {
    if (r.state !== 'none') {
      result.push(...r.ids)
    }
  }
  return anySelected ? 'partial' : 'none'
}
