/**
 * Connection Store - 连接点系统状态管理
 */

import { create } from 'zustand'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import {
  ConnectionBinding,
  ConnectionState,
  ConnectionPoint,
  AnchorPosition,
  createBindingId,
  createInitialState,
  calculateAnchorPoint,
  createConnectionPointId,
  findNearestAnchor,
  isConnectableElement,
  getLineEndpoint,
  snapLineToAnchor,
  updateConnectedLines,
} from './connectionTypes'

export interface ConnectionStoreState extends ConnectionState {
  addBinding: (binding: ConnectionBinding) => void
  removeBinding: (lineElementId: string, side: 'start' | 'end') => void
  removeBindingsForElement: (elementId: string) => void
  getBindingsForElement: (elementId: string) => ConnectionBinding[]
  getBindingForLineEnd: (lineElementId: string, side: 'start' | 'end') => ConnectionBinding | undefined
  setSnapThreshold: (threshold: number) => void
  setShowAnchors: (show: boolean) => void
  reset: () => void

  handleElementMoved: (
    movedElement: ExcalidrawElement,
    allElements: ExcalidrawElement[]
  ) => ExcalidrawElement[]

  handleLineDragging: (
    lineElement: ExcalidrawElement,
    side: 'start' | 'end',
    allElements: ExcalidrawElement[]
  ) => { element: ExcalidrawElement; anchor: ConnectionPoint | null }

  handleLineReleased: (
    lineElement: ExcalidrawElement,
    allElements: ExcalidrawElement[]
  ) => ExcalidrawElement[]

  getVisibleAnchors: (
    allElements: ExcalidrawElement[],
    hoveredElementId: string | null,
    lineToolActive: boolean
  ) => ConnectionPoint[]
}

export const useConnectionStore = create<ConnectionStoreState>((set, get) => ({
  ...createInitialState(),

  addBinding: (binding) =>
    set((state) => {
      const id = createBindingId(binding.lineElementId, binding.side)
      const filtered = state.bindings.filter((b) => b.id !== id)
      return { bindings: [...filtered, { ...binding, id }] }
    }),

  removeBinding: (lineElementId, side) =>
    set((state) => {
      const id = createBindingId(lineElementId, side)
      return { bindings: state.bindings.filter((b) => b.id !== id) }
    }),

  removeBindingsForElement: (elementId) =>
    set((state) => ({
      bindings: state.bindings.filter(
        (b) => b.targetElementId !== elementId && b.lineElementId !== elementId
      ),
    })),

  getBindingsForElement: (elementId) => {
    return get().bindings.filter((b) => b.targetElementId === elementId)
  },

  getBindingForLineEnd: (lineElementId, side) => {
    const id = createBindingId(lineElementId, side)
    return get().bindings.find((b) => b.id === id)
  },

  setSnapThreshold: (threshold) => set({ snapThreshold: threshold }),
  setShowAnchors: (show) => set({ showAnchors: show }),
  reset: () => set(createInitialState()),

  handleElementMoved: (movedElement, allElements) => {
    const { bindings } = get()
    return updateConnectedLines(movedElement, allElements, bindings)
  },

  handleLineDragging: (lineElement, side, allElements) => {
    const endpoint = getLineEndpoint(lineElement, side)
    const { snapThreshold } = get()

    const anchor = findNearestAnchor(
      endpoint.x,
      endpoint.y,
      allElements,
      snapThreshold,
      [lineElement.id]
    )

    if (anchor) {
      const snapped = snapLineToAnchor(lineElement, side, anchor)
      return { element: snapped, anchor }
    }

    return { element: lineElement, anchor: null }
  },

  handleLineReleased: (lineElement, allElements) => {
    const { bindings, snapThreshold } = get()
    const newBindings = [...bindings]
    const elementsToUpdate = [lineElement]
    let currentLine = lineElement

    for (const side of ['start', 'end'] as const) {
      const endpoint = getLineEndpoint(currentLine, side)
      const anchor = findNearestAnchor(
        endpoint.x,
        endpoint.y,
        allElements,
        snapThreshold,
        [currentLine.id]
      )

      const bindingId = createBindingId(currentLine.id, side)
      const existingIdx = newBindings.findIndex((b) => b.id === bindingId)

      if (anchor) {
        const binding: ConnectionBinding = {
          id: bindingId,
          lineElementId: currentLine.id,
          side,
          targetElementId: anchor.elementId,
          anchorPosition: anchor.position,
        }

        if (existingIdx >= 0) {
          newBindings[existingIdx] = binding
        } else {
          newBindings.push(binding)
        }

        currentLine = snapLineToAnchor(currentLine, side, anchor)
        elementsToUpdate[0] = currentLine
      } else {
        if (existingIdx >= 0) {
          newBindings.splice(existingIdx, 1)
        }
      }
    }

    set({ bindings: newBindings })

    const elementMap = new Map<string, ExcalidrawElement>()
    for (const el of allElements) {
      elementMap.set(el.id, el)
    }
    for (const el of elementsToUpdate) {
      elementMap.set(el.id, el)
    }

    return Array.from(elementMap.values())
  },

  getVisibleAnchors: (allElements, hoveredElementId, lineToolActive) => {
    const { showAnchors } = get()
    if (!showAnchors) return []

    const anchors: ConnectionPoint[] = []

    if (hoveredElementId) {
      const el = allElements.find((e) => e.id === hoveredElementId)
      if (el && isConnectableElement(el)) {
        anchors.push(...getElementAnchorPoints(el))
      }
    }

    if (lineToolActive) {
      for (const el of allElements) {
        if (isConnectableElement(el)) {
          anchors.push(...getElementAnchorPoints(el))
        }
      }
    }

    return anchors
  },
}))

function getElementAnchorPoints(element: ExcalidrawElement): ConnectionPoint[] {
  const positions: AnchorPosition[] = [
    'top',
    'bottom',
    'left',
    'right',
    'topLeft',
    'topRight',
    'bottomLeft',
    'bottomRight',
    'center',
  ]

  return positions.map((position) => {
    const point = calculateAnchorPoint(element, position)
    return {
      id: createConnectionPointId(element.id, position),
      elementId: element.id,
      position,
      x: point.x,
      y: point.y,
    }
  })
}
