/**
 * 規格管理器
 *
 * @description
 * 管理商品規格（Spec[]）和變體（Variant[]），支援 1-3 層規格的自動組合生成、
 * 數據更新與規格選項排序。
 *
 * @module useSpecManager
 */

import { computed, ref, watch, type Ref } from 'vue'
import type {
  PortalProductSpec as Spec,
  PortalProductSpecChild as SpecChild,
  PortalProductVariant as Variant,
} from '../schemas'

/** 規格管理器介面 */
export interface ISpecManager {
  readonly specs: Ref<Spec[]>
  readonly variants: Ref<Variant[]>
  readonly flatVariants: Ref<FlatVariant[]>
  addSpec: (name?: string) => void
  removeSpec: (specIndex: number) => void
  updateSpecName: (specIndex: number, name: string) => void
  addSpecChild: (specIndex: number, childIndex: number, name?: string) => void
  removeSpecChild: (specIndex: number, childIndex: number) => void
  updateSpecChildName: (specIndex: number, childIndex: number, name: string) => void
  updateSpecChildren: (specIndex: number, children: { id: number; name: string }[]) => void
  updateSpecChildImage: (
    specIndex: number,
    childIndex: number,
    imageId: number,
    imageUrl: string,
  ) => void
  clearSpecChildImage: (specIndex: number, childIndex: number) => void
  moveSpecChild: (specIndex: number, fromIndex: number, toIndex: number) => void
  updateVariant: (
    specIndexArray: number[],
    field: 'cost' | 'originalPrice' | 'salePrice' | 'stock',
    value: number,
  ) => void
  importData: (specs: Spec[], variants: Variant[]) => void
  exportData: () => { specs: Spec[]; variants: Variant[] }
  reset: () => void
}

/** 扁平化變體（用於表格渲染） */
export interface FlatVariant {
  specNames: string[]
  specIndex: number[]
  cost: number
  originalPrice: number
  salePrice: number
  stock: number
  specImage?: { id: number; url: string }
}

function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]]
  if (arrays.length === 1) return arrays[0].map((item) => [item])

  return arrays.reduce<T[][]>(
    (acc, curr) => {
      const result: T[][] = []
      for (const prevGroup of acc) {
        for (const currItem of curr) {
          result.push([...prevGroup, currItem])
        }
      }
      return result
    },
    [[]],
  )
}

function specIndexToKey(specIndex: number[]): string {
  return specIndex.join('|')
}

/**
 * 使用規格管理器 — 同源自 portal-vue。
 */
export function useSpecManager(): ISpecManager {
  const specs = ref<Spec[]>([])
  const variantsMap = ref<Map<string, Variant>>(new Map())

  const variants = computed<Variant[]>(() => Array.from(variantsMap.value.values()))

  const flatVariants = computed<FlatVariant[]>(() => {
    if (specs.value.length === 0) return []

    const indexArrays = specs.value.map((spec) =>
      spec.children.map((_, index) => index),
    )
    const combinations = cartesianProduct(indexArrays)

    return combinations.map((specIndex) => {
      const key = specIndexToKey(specIndex)
      const variant = variantsMap.value.get(key) || {
        id: 0,
        cost: 0,
        originalPrice: 0,
        salePrice: 0,
        stock: 0,
        specIndex,
      }

      const specNames = specIndex.map(
        (childIndex, specIdx) => specs.value[specIdx]?.children[childIndex]?.name || '',
      )

      const firstChild = specs.value[0]?.children[specIndex[0]] as SpecChild | undefined
      const specImage =
        firstChild?.imageId && firstChild?.imageUrl
          ? { id: firstChild.imageId, url: firstChild.imageUrl }
          : undefined

      return {
        specNames,
        specIndex: variant.specIndex,
        cost: variant.cost,
        originalPrice: variant.originalPrice,
        salePrice: variant.salePrice,
        stock: variant.stock,
        specImage,
      }
    })
  })

  function addSpec(name = ''): void {
    if (specs.value.length >= 3) return
    specs.value.push({
      id: 0,
      name,
      children: [{ id: 0, name: '' }],
    })
  }

  function removeSpec(specIndex: number): void {
    if (specIndex < 0 || specIndex >= specs.value.length) return
    specs.value.splice(specIndex, 1)
    regenerateVariants()
  }

  function updateSpecName(specIndex: number, name: string): void {
    if (specIndex < 0 || specIndex >= specs.value.length) return
    specs.value[specIndex].name = name
  }

  function addSpecChild(specIndex: number, childIndex: number, name = ''): void {
    if (specIndex < 0 || specIndex >= specs.value.length) return
    const spec = specs.value[specIndex]
    spec.children.splice(childIndex + 1, 0, { id: 0, name })
    regenerateVariants()
  }

  function removeSpecChild(specIndex: number, childIndex: number): void {
    if (specIndex < 0 || specIndex >= specs.value.length) return
    const spec = specs.value[specIndex]
    if (spec.children.length <= 1) return

    remapVariantsForRemove(specIndex, childIndex)
    spec.children.splice(childIndex, 1)
    regenerateVariants()
  }

  function updateSpecChildImage(
    specIndex: number,
    childIndex: number,
    imageId: number,
    imageUrl: string,
  ): void {
    if (specIndex < 0 || specIndex >= specs.value.length) return
    const spec = specs.value[specIndex]
    if (childIndex < 0 || childIndex >= spec.children.length) return
    spec.children[childIndex].imageId = imageId
    spec.children[childIndex].imageUrl = imageUrl
  }

  function clearSpecChildImage(specIndex: number, childIndex: number): void {
    if (specIndex < 0 || specIndex >= specs.value.length) return
    const spec = specs.value[specIndex]
    if (childIndex < 0 || childIndex >= spec.children.length) return
    delete spec.children[childIndex].imageId
    delete spec.children[childIndex].imageUrl
  }

  function updateSpecChildName(specIndex: number, childIndex: number, name: string): void {
    if (specIndex < 0 || specIndex >= specs.value.length) return
    const spec = specs.value[specIndex]
    if (childIndex < 0 || childIndex >= spec.children.length) return
    spec.children[childIndex].name = name
  }

  function updateSpecChildren(
    specIndex: number,
    children: { id: number; name: string }[],
  ): void {
    if (specIndex < 0 || specIndex >= specs.value.length) return
    specs.value[specIndex].children = children.map((c) => ({ ...c }))
    regenerateVariants()
  }

  function moveSpecChild(specIndex: number, fromIndex: number, toIndex: number): void {
    if (specIndex < 0 || specIndex >= specs.value.length) return
    const spec = specs.value[specIndex]
    const { length } = spec.children
    if (fromIndex < 0 || fromIndex >= length || toIndex < 0 || toIndex >= length) return
    if (fromIndex === toIndex) return

    const [movedItem] = spec.children.splice(fromIndex, 1)
    spec.children.splice(toIndex, 0, movedItem)
    remapVariantsForMove(specIndex, fromIndex, toIndex)
  }

  function remapVariantsForMove(specDim: number, fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return
    const newMap = new Map<string, Variant>()

    for (const [key, variant] of variantsMap.value) {
      const indices = key.split('|').map(Number)
      const idx = indices[specDim]
      let newIdx = idx

      if (idx === fromIndex) {
        newIdx = toIndex
      } else if (fromIndex < toIndex && idx > fromIndex && idx <= toIndex) {
        newIdx = idx - 1
      } else if (fromIndex > toIndex && idx >= toIndex && idx < fromIndex) {
        newIdx = idx + 1
      }

      const newIndices = [...indices]
      newIndices[specDim] = newIdx
      const newKey = newIndices.join('|')
      newMap.set(newKey, { ...variant, specIndex: newIndices })
    }

    variantsMap.value = newMap
  }

  function remapVariantsForRemove(specDim: number, removeIdx: number): void {
    const newMap = new Map<string, Variant>()

    for (const [key, variant] of variantsMap.value) {
      const indices = key.split('|').map(Number)
      const idx = indices[specDim]

      if (idx === removeIdx) continue

      let newIdx = idx
      if (idx > removeIdx) newIdx = idx - 1

      const newIndices = [...indices]
      newIndices[specDim] = newIdx
      const newKey = newIndices.join('|')
      newMap.set(newKey, { ...variant, specIndex: newIndices })
    }

    variantsMap.value = newMap
  }

  function updateVariant(
    specIndexArray: number[],
    field: 'cost' | 'originalPrice' | 'salePrice' | 'stock',
    value: number,
  ): void {
    const key = specIndexToKey(specIndexArray)
    const variant = variantsMap.value.get(key)

    if (variant) {
      const newMap = new Map(variantsMap.value)
      newMap.set(key, { ...variant, [field]: value })
      variantsMap.value = newMap
    }
  }

  function regenerateVariants(): void {
    if (specs.value.length === 0) {
      variantsMap.value.clear()
      return
    }

    const indexArrays = specs.value.map((spec) => spec.children.map((_, index) => index))
    const combinations = cartesianProduct(indexArrays)

    const newMap = new Map<string, Variant>()
    for (const specIndex of combinations) {
      const key = specIndexToKey(specIndex)
      const existingVariant = variantsMap.value.get(key)

      newMap.set(
        key,
        existingVariant || {
          id: 0,
          cost: 0,
          originalPrice: 0,
          salePrice: 0,
          stock: 0,
          specIndex,
        },
      )
    }

    variantsMap.value = newMap
  }

  function importData(importSpecs: Spec[], importVariants: Variant[]): void {
    specs.value = importSpecs
    variantsMap.value.clear()

    for (const variant of importVariants) {
      const key = specIndexToKey(variant.specIndex)
      variantsMap.value.set(key, { ...variant })
    }

    variantsMap.value = new Map(variantsMap.value)
  }

  function exportData(): { specs: Spec[]; variants: Variant[] } {
    return {
      specs: specs.value,
      variants: Array.from(variantsMap.value.values()).map((v) => ({ ...v })),
    }
  }

  function reset(): void {
    specs.value = []
    variantsMap.value.clear()
  }

  watch(
    () => specs.value.map((s) => s.children.length),
    () => {
      regenerateVariants()
    },
    { deep: true },
  )

  return {
    specs,
    variants,
    flatVariants,
    addSpec,
    removeSpec,
    updateSpecName,
    addSpecChild,
    removeSpecChild,
    updateSpecChildName,
    updateSpecChildren,
    moveSpecChild,
    updateVariant,
    updateSpecChildImage,
    clearSpecChildImage,
    importData,
    exportData,
    reset,
  }
}
