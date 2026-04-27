/**
 * Snap System - 图形吸附系统
 * 提供图形之间的边缘对齐吸附功能
 */

import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'

/**
 * 吸附类型
 */
export type SnapType = 'horizontal' | 'vertical' | 'both'

/**
 * 吸附边
 */
export type SnapEdge = 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY'

/**
 * 吸附线 - 用于可视化显示吸附关系
 */
export interface SnapLine {
  /** 唯一标识 */
  id: string
  /** 吸附线类型 */
  type: 'horizontal' | 'vertical'
  /** 水平吸附线: y坐标; 垂直吸附线: x坐标 */
  position: number
  /** 吸附线起点 */
  start: number
  /** 吸附线终点 */
  end: number
  /** 吸附来源边 */
  fromEdge: SnapEdge
  /** 吸附目标边 */
  toEdge: SnapEdge
  /** 目标元素ID */
  targetElementId: string
}

/**
 * 吸附结果
 */
export interface SnapResult {
  /** 是否发生吸附 */
  snapped: boolean
  /** 吸附后的X坐标偏移量 */
  deltaX: number
  /** 吸附后的Y坐标偏移量 */
  deltaY: number
  /** 吸附线（用于UI显示） */
  snapLines: SnapLine[]
  /** 吸附的目标元素ID列表 */
  targetElementIds: string[]
}

/**
 * 元素边缘信息
 */
export interface ElementEdges {
  /** 元素ID */
  elementId: string
  /** 左边缘 X */
  left: number
  /** 右边缘 X */
  right: number
  /** 上边缘 Y */
  top: number
  /** 下边缘 Y */
  bottom: number
  /** 中心 X */
  centerX: number
  /** 中心 Y */
  centerY: number
}

/**
 * 吸附配置
 */
export interface SnapConfig {
  /** 吸附距离阈值（像素） */
  threshold: number
  /** 是否启用水平吸附 */
  enableHorizontal: boolean
  /** 是否启用垂直吸附 */
  enableVertical: boolean
  /** 是否吸附到中心 */
  snapToCenter: boolean
  /** 是否吸附到边缘 */
  snapToEdges: boolean
}

/**
 * 创建默认吸附配置
 */
export function createDefaultSnapConfig(): SnapConfig {
  return {
    threshold: 10,
    enableHorizontal: true,
    enableVertical: true,
    snapToCenter: true,
    snapToEdges: true,
  }
}

/**
 * 计算元素的边缘坐标（考虑旋转）
 */
export function calculateElementEdges(element: ExcalidrawElement): ElementEdges {
  const { x, y, width, height, angle = 0 } = element

  // 如果没有旋转，直接返回
  if (angle === 0) {
    return {
      elementId: element.id,
      left: x,
      right: x + width,
      top: y,
      bottom: y + height,
      centerX: x + width / 2,
      centerY: y + height / 2,
    }
  }

  // 计算旋转后的四个角点
  const cx = x + width / 2
  const cy = y + height / 2
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const corners = [
    { x: x - cx, y: y - cy },
    { x: x + width - cx, y: y - cy },
    { x: x + width - cx, y: y + height - cy },
    { x: x - cx, y: y + height - cy },
  ].map((p) => ({
    x: cx + p.x * cos - p.y * sin,
    y: cy + p.x * sin + p.y * cos,
  }))

  // 找到边界框
  const xs = corners.map((p) => p.x)
  const ys = corners.map((p) => p.y)

  return {
    elementId: element.id,
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
    bottom: Math.max(...ys),
    centerX: cx,
    centerY: cy,
  }
}

/**
 * 判断元素是否可吸附
 */
export function isSnappableElement(element: ExcalidrawElement): boolean {
  const snappableTypes = [
    'rectangle',
    'ellipse',
    'diamond',
    'text',
    'frame',
    'embeddable',
    'magicframe',
    'image',
  ]
  return snappableTypes.includes(element.type)
}

/**
 * 查找最佳吸附位置
 * @param movingElement - 正在移动的元素
 * @param allElements - 画布上所有元素
 * @param config - 吸附配置
 * @param excludeIds - 排除的元素ID（如正在移动的元素自身）
 * @returns 吸附结果
 */
export function findBestSnap(
  movingElement: ExcalidrawElement,
  allElements: ExcalidrawElement[],
  config: SnapConfig = createDefaultSnapConfig(),
  excludeIds: string[] = []
): SnapResult {
  const movingEdges = calculateElementEdges(movingElement)
  const snapLines: SnapLine[] = []
  const targetElementIds: string[] = []

  let snapX: { delta: number; edge: SnapEdge; targetEdge: SnapEdge; targetId: string } | null = null
  let snapY: { delta: number; edge: SnapEdge; targetEdge: SnapEdge; targetId: string } | null = null

  for (const element of allElements) {
    if (excludeIds.includes(element.id)) continue
    if (!isSnappableElement(element)) continue

    const targetEdges = calculateElementEdges(element)

    // 水平方向吸附（X轴）
    if (config.enableHorizontal) {
      const horizontalPairs: [number, number, SnapEdge, SnapEdge][] = [
        [movingEdges.left, targetEdges.left, 'left', 'left'],
        [movingEdges.right, targetEdges.right, 'right', 'right'],
        [movingEdges.centerX, targetEdges.centerX, 'centerX', 'centerX'],
      ]

      if (config.snapToEdges) {
        horizontalPairs.push(
          [movingEdges.left, targetEdges.right, 'left', 'right'],
          [movingEdges.right, targetEdges.left, 'right', 'left']
        )
      }

      for (const [movingVal, targetVal, movingEdge, targetEdge] of horizontalPairs) {
        const dist = Math.abs(movingVal - targetVal)
        if (dist < config.threshold) {
          if (!snapX || dist < Math.abs(snapX.delta)) {
            snapX = {
              delta: targetVal - movingVal,
              edge: movingEdge,
              targetEdge,
              targetId: element.id,
            }
          }
        }
      }
    }

    // 垂直方向吸附（Y轴）
    if (config.enableVertical) {
      const verticalPairs: [number, number, SnapEdge, SnapEdge][] = [
        [movingEdges.top, targetEdges.top, 'top', 'top'],
        [movingEdges.bottom, targetEdges.bottom, 'bottom', 'bottom'],
        [movingEdges.centerY, targetEdges.centerY, 'centerY', 'centerY'],
      ]

      if (config.snapToEdges) {
        verticalPairs.push(
          [movingEdges.top, targetEdges.bottom, 'top', 'bottom'],
          [movingEdges.bottom, targetEdges.top, 'bottom', 'top']
        )
      }

      for (const [movingVal, targetVal, movingEdge, targetEdge] of verticalPairs) {
        const dist = Math.abs(movingVal - targetVal)
        if (dist < config.threshold) {
          if (!snapY || dist < Math.abs(snapY.delta)) {
            snapY = {
              delta: targetVal - movingVal,
              edge: movingEdge,
              targetEdge,
              targetId: element.id,
            }
          }
        }
      }
    }
  }

  // 生成吸附线
  if (snapX) {
    const targetEl = allElements.find((e) => e.id === snapX!.targetId)
    if (targetEl) {
      const targetEdges = calculateElementEdges(targetEl)
      const x = snapX.targetEdge === 'left' ? targetEdges.left :
                snapX.targetEdge === 'right' ? targetEdges.right :
                targetEdges.centerX

      snapLines.push({
        id: `snap-v-${Date.now()}`,
        type: 'vertical',
        position: x,
        start: Math.min(movingEdges.top, targetEdges.top) - 50,
        end: Math.max(movingEdges.bottom, targetEdges.bottom) + 50,
        fromEdge: snapX.edge,
        toEdge: snapX.targetEdge,
        targetElementId: snapX.targetId,
      })
      targetElementIds.push(snapX.targetId)
    }
  }

  if (snapY) {
    const targetEl = allElements.find((e) => e.id === snapY!.targetId)
    if (targetEl) {
      const targetEdges = calculateElementEdges(targetEl)
      const y = snapY.targetEdge === 'top' ? targetEdges.top :
                snapY.targetEdge === 'bottom' ? targetEdges.bottom :
                targetEdges.centerY

      snapLines.push({
        id: `snap-h-${Date.now()}`,
        type: 'horizontal',
        position: y,
        start: Math.min(movingEdges.left, targetEdges.left) - 50,
        end: Math.max(movingEdges.right, targetEdges.right) + 50,
        fromEdge: snapY.edge,
        toEdge: snapY.targetEdge,
        targetElementId: snapY.targetId,
      })
      if (!targetElementIds.includes(snapY.targetId)) {
        targetElementIds.push(snapY.targetId)
      }
    }
  }

  return {
    snapped: snapLines.length > 0,
    deltaX: snapX?.delta ?? 0,
    deltaY: snapY?.delta ?? 0,
    snapLines,
    targetElementIds,
  }
}

/**
 * 应用吸附结果到元素
 * @param element - 要移动的元素
 * @param snapResult - 吸附结果
 * @returns 更新后的元素
 */
export function applySnapToElement(
  element: ExcalidrawElement,
  snapResult: SnapResult
): ExcalidrawElement {
  if (!snapResult.snapped) return element

  return {
    ...element,
    x: element.x + snapResult.deltaX,
    y: element.y + snapResult.deltaY,
  }
}
