/**
 * Connection Point System - 连接点系统
 * 提供图形边缘锚点计算、吸附逻辑、连接线跟随等功能
 */

import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'

/**
 * 锚点位置类型
 * 定义图形边缘的预设锚点位置
 */
export type AnchorPosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'
  | 'center'

/**
 * 连接点 - 图形边缘的一个可吸附锚点
 */
export interface ConnectionPoint {
  /** 锚点唯一标识 */
  id: string
  /** 所属元素 ID */
  elementId: string
  /** 锚点位置类型 */
  position: AnchorPosition
  /** 锚点在画布上的绝对坐标 X */
  x: number
  /** 锚点在画布上的绝对坐标 Y */
  y: number
}

/**
 * 连接关系 - 描述一条线/箭头与图形锚点的绑定
 */
export interface ConnectionBinding {
  /** 唯一标识 */
  id: string
  /** 连接线元素 ID（arrow 或 line 类型元素） */
  lineElementId: string
  /** 绑定端：start 或 end */
  side: 'start' | 'end'
  /** 目标元素 ID */
  targetElementId: string
  /** 目标锚点位置 */
  anchorPosition: AnchorPosition
}

/**
 * 连接点系统状态
 */
export interface ConnectionState {
  /** 所有连接关系 */
  bindings: ConnectionBinding[]
  /** 吸附距离阈值（像素） */
  snapThreshold: number
  /** 是否显示锚点 */
  showAnchors: boolean
}

/**
 * 创建连接点的唯一 ID
 */
export function createConnectionPointId(
  elementId: string,
  position: AnchorPosition
): string {
  return `${elementId}::anchor::${position}`
}

/**
 * 创建连接关系的唯一 ID
 */
export function createBindingId(
  lineElementId: string,
  side: 'start' | 'end'
): string {
  return `${lineElementId}::${side}`
}

/**
 * 计算元素边缘锚点的绝对坐标
 * 根据元素的位置、尺寸和旋转角度计算
 */
export function calculateAnchorPoint(
  element: ExcalidrawElement,
  position: AnchorPosition
): { x: number; y: number } {
  const { x, y, width, height, angle = 0 } = element
  const cx = x + width / 2
  const cy = y + height / 2

  let localX: number
  let localY: number

  switch (position) {
    case 'top':
      localX = width / 2
      localY = 0
      break
    case 'bottom':
      localX = width / 2
      localY = height
      break
    case 'left':
      localX = 0
      localY = height / 2
      break
    case 'right':
      localX = width
      localY = height / 2
      break
    case 'topLeft':
      localX = 0
      localY = 0
      break
    case 'topRight':
      localX = width
      localY = 0
      break
    case 'bottomLeft':
      localX = 0
      localY = height
      break
    case 'bottomRight':
      localX = width
      localY = height
      break
    case 'center':
      localX = width / 2
      localY = height / 2
      break
    default:
      localX = width / 2
      localY = height / 2
  }

  if (angle === 0) {
    return { x: x + localX, y: y + localY }
  }

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dx = localX - width / 2
  const dy = localY - height / 2

  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  }
}

/**
 * 获取元素所有预设锚点
 */
export function getElementAnchorPoints(
  element: ExcalidrawElement
): ConnectionPoint[] {
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

/**
 * 查找距离给定点最近的锚点
 * @param pointX - 目标点 X
 * @param pointY - 目标点 Y
 * @param elements - 要搜索的元素列表
 * @param threshold - 吸附距离阈值
 * @param excludeElementIds - 排除的元素 ID（如连接线自身）
 * @returns 最近的锚点，如果距离超过阈值则返回 null
 */
export function findNearestAnchor(
  pointX: number,
  pointY: number,
  elements: ExcalidrawElement[],
  threshold: number = 15,
  excludeElementIds: string[] = []
): ConnectionPoint | null {
  let nearest: ConnectionPoint | null = null
  let minDist = threshold

  for (const element of elements) {
    if (excludeElementIds.includes(element.id)) continue
    if (!isConnectableElement(element)) continue

    const anchors = getElementAnchorPoints(element)
    for (const anchor of anchors) {
      const dist = Math.hypot(anchor.x - pointX, anchor.y - pointY)
      if (dist < minDist) {
        minDist = dist
        nearest = anchor
      }
    }
  }

  return nearest
}

/**
 * 判断元素是否可连接（矩形、椭圆、菱形、文本等有边界的图形）
 */
export function isConnectableElement(
  element: ExcalidrawElement
): boolean {
  const connectableTypes = [
    'rectangle',
    'ellipse',
    'diamond',
    'text',
    'frame',
    'embeddable',
    'magicframe',
  ]
  return connectableTypes.includes(element.type)
}

/**
 * 判断元素是否为连接线类型（箭头或直线）
 */
export function isLineElement(element: ExcalidrawElement): boolean {
  return element.type === 'arrow' || element.type === 'line'
}

/**
 * 获取连接线的端点坐标
 */
export function getLineEndpoint(
  element: ExcalidrawElement,
  side: 'start' | 'end'
): { x: number; y: number } {
  const points = (element as any).points || []
  if (points.length === 0) {
    return { x: element.x, y: element.y }
  }

  if (side === 'start') {
    const p = points[0]
    return { x: element.x + p[0], y: element.y + p[1] }
  } else {
    const p = points[points.length - 1]
    return { x: element.x + p[0], y: element.y + p[1] }
  }
}

/**
 * 更新连接线端点使其吸附到目标锚点
 */
export function snapLineToAnchor(
  lineElement: ExcalidrawElement,
  side: 'start' | 'end',
  anchor: ConnectionPoint
): ExcalidrawElement {
  const points = [...((lineElement as any).points || [])]
  if (points.length === 0) return lineElement

  const endpoint = getLineEndpoint(lineElement, side)

  const dx = anchor.x - endpoint.x
  const dy = anchor.y - endpoint.y

  if (side === 'start') {
    const newStart = [points[0][0] + dx, points[0][1] + dy]
    return {
      ...lineElement,
      x: lineElement.x + dx,
      y: lineElement.y + dy,
      points: [newStart, ...points.slice(1)],
    } as ExcalidrawElement
  } else {
    const lastIdx = points.length - 1
    const newEnd = [points[lastIdx][0] + dx, points[lastIdx][1] + dy]
    const newPoints = [...points.slice(0, lastIdx), newEnd]
    return {
      ...lineElement,
      points: newPoints,
    } as ExcalidrawElement
  }
}

/**
 * 当元素移动时，更新所有关联的连接线
 * @param movedElement - 移动后的元素
 * @param allElements - 画布上所有元素
 * @param bindings - 所有连接关系
 * @returns 更新后的元素数组
 */
export function updateConnectedLines(
  movedElement: ExcalidrawElement,
  allElements: ExcalidrawElement[],
  bindings: ConnectionBinding[]
): ExcalidrawElement[] {
  const relatedBindings = bindings.filter(
    (b) => b.targetElementId === movedElement.id
  )

  if (relatedBindings.length === 0) return allElements

  const elementMap = new Map<string, ExcalidrawElement>()
  for (const el of allElements) {
    elementMap.set(el.id, el)
  }

  for (const binding of relatedBindings) {
    const lineEl = elementMap.get(binding.lineElementId)
    if (!lineEl || !isLineElement(lineEl)) continue

    const anchor = calculateAnchorPoint(movedElement, binding.anchorPosition)
    const updatedLine = snapLineToAnchor(lineEl, binding.side, {
      id: createConnectionPointId(movedElement.id, binding.anchorPosition),
      elementId: movedElement.id,
      position: binding.anchorPosition,
      x: anchor.x,
      y: anchor.y,
    })

    elementMap.set(updatedLine.id, updatedLine)
  }

  return Array.from(elementMap.values())
}

/**
 * 检测连接线是否应该断开
 * 当连接线端点与目标锚点的距离超过断开阈值时
 */
export function shouldDisconnect(
  lineElement: ExcalidrawElement,
  binding: ConnectionBinding,
  allElements: ExcalidrawElement[],
  disconnectThreshold: number = 30
): boolean {
  const targetElement = allElements.find(
    (el) => el.id === binding.targetElementId
  )
  if (!targetElement) return true

  const endpoint = getLineEndpoint(lineElement, binding.side)
  const anchor = calculateAnchorPoint(targetElement, binding.anchorPosition)
  const dist = Math.hypot(endpoint.x - anchor.x, endpoint.y - anchor.y)

  return dist > disconnectThreshold
}

/**
 * 创建初始连接状态
 */
export function createInitialState(): ConnectionState {
  return {
    bindings: [],
    snapThreshold: 15,
    showAnchors: true,
  }
}
