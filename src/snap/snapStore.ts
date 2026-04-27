/**
 * Snap Store - 图形吸附系统状态管理
 */

import { create } from 'zustand'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import {
  SnapConfig,
  SnapResult,
  SnapLine,
  createDefaultSnapConfig,
  findBestSnap,
  applySnapToElement,
  isSnappableElement,
} from './snapTypes'

export interface SnapStoreState {
  /** 吸附配置 */
  config: SnapConfig
  /** 当前吸附线 */
  snapLines: SnapLine[]
  /** 是否正在拖动 */
  isDragging: boolean
  /** 正在移动的元素ID */
  draggingElementId: string | null
  /** 是否启用吸附 */
  enabled: boolean

  // Actions
  setConfig: (config: Partial<SnapConfig>) => void
  setEnabled: (enabled: boolean) => void
  setSnapLines: (lines: SnapLine[]) => void
  clearSnapLines: () => void
  startDragging: (elementId: string) => void
  stopDragging: () => void

  // Core snap logic
  handleElementDragging: (
    movingElement: ExcalidrawElement,
    allElements: ExcalidrawElement[]
  ) => SnapResult

  handleElementDropped: (
    movingElement: ExcalidrawElement,
    allElements: ExcalidrawElement[]
  ) => { element: ExcalidrawElement; snapResult: SnapResult }

  reset: () => void
}

export const useSnapStore = create<SnapStoreState>((set, get) => ({
  config: createDefaultSnapConfig(),
  snapLines: [],
  isDragging: false,
  draggingElementId: null,
  enabled: true,

  setConfig: (config) =>
    set((state) => ({
      config: { ...state.config, ...config },
    })),

  setEnabled: (enabled) => set({ enabled }),

  setSnapLines: (lines) => set({ snapLines: lines }),

  clearSnapLines: () => set({ snapLines: [] }),

  startDragging: (elementId) =>
    set({
      isDragging: true,
      draggingElementId: elementId,
      snapLines: [],
    }),

  stopDragging: () =>
    set({
      isDragging: false,
      draggingElementId: null,
      snapLines: [],
    }),

  handleElementDragging: (movingElement, allElements) => {
    const { config, enabled } = get()

    if (!enabled || !isSnappableElement(movingElement)) {
      set({ snapLines: [] })
      return {
        snapped: false,
        deltaX: 0,
        deltaY: 0,
        snapLines: [],
        targetElementIds: [],
      }
    }

    const snapResult = findBestSnap(
      movingElement,
      allElements,
      config,
      [movingElement.id]
    )

    set({ snapLines: snapResult.snapLines })
    return snapResult
  },

  handleElementDropped: (movingElement, allElements) => {
    const { config, enabled } = get()

    if (!enabled || !isSnappableElement(movingElement)) {
      set({ snapLines: [], isDragging: false, draggingElementId: null })
      return {
        element: movingElement,
        snapResult: {
          snapped: false,
          deltaX: 0,
          deltaY: 0,
          snapLines: [],
          targetElementIds: [],
        },
      }
    }

    const snapResult = findBestSnap(
      movingElement,
      allElements,
      config,
      [movingElement.id]
    )

    const snappedElement = applySnapToElement(movingElement, snapResult)

    set({
      snapLines: [],
      isDragging: false,
      draggingElementId: null,
    })

    return {
      element: snappedElement,
      snapResult,
    }
  },

  reset: () =>
    set({
      config: createDefaultSnapConfig(),
      snapLines: [],
      isDragging: false,
      draggingElementId: null,
      enabled: true,
    }),
}))
