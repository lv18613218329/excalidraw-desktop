import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'

interface Point2D {
  x: number
  y: number
}

export interface SplitResult {
  elements: ExcalidrawElement[]
  splitCount: number
  message?: string
}

const baseElementProps = {
  angle: 0,
  strokeColor: '#1e1e1e',
  backgroundColor: 'transparent',
  fillStyle: 'solid',
  strokeWidth: 2,
  strokeStyle: 'solid',
  roughness: 1,
  opacity: 100,
  groupIds: [] as string[],
  frameId: null,
  index: 'a0',
  roundness: null,
  seed: Math.floor(Math.random() * 100000),
  version: 1,
  versionNonce: Math.floor(Math.random() * 100000),
  isDeleted: false,
  boundElements: null,
  updated: Date.now(),
  link: null,
  locked: false,
}

function cross2D(ax: number, ay: number, bx: number, by: number): number {
  return ax * by - ay * bx
}

function lineSegmentIntersection(
  p1: Point2D, p2: Point2D,
  p3: Point2D, p4: Point2D
): { point: Point2D; s: number } | null {
  const d1x = p2.x - p1.x
  const d1y = p2.y - p1.y
  const d2x = p4.x - p3.x
  const d2y = p4.y - p3.y

  const denom = cross2D(d1x, d1y, d2x, d2y)
  if (Math.abs(denom) < 1e-10) return null

  const d3x = p3.x - p1.x
  const d3y = p3.y - p1.y

  const t = cross2D(d3x, d3y, d2x, d2y) / denom
  const s = cross2D(d3x, d3y, d1x, d1y) / denom

  if (t < -1e-8 || t > 1 + 1e-8 || s < -1e-8 || s > 1 + 1e-8) return null

  return {
    point: {
      x: p1.x + t * d1x,
      y: p1.y + t * d1y,
    },
    s: Math.max(0, Math.min(1, s)),
  }
}

interface RectCorners {
  tl: Point2D
  tr: Point2D
  br: Point2D
  bl: Point2D
}

function getRectCorners(el: ExcalidrawElement): RectCorners {
  const x = (el as any).x || 0
  const y = (el as any).y || 0
  const w = (el as any).width || 0
  const h = (el as any).height || 0
  return {
    tl: { x, y },
    tr: { x: x + w, y },
    br: { x: x + w, y: y + h },
    bl: { x, y: y + h },
  }
}

interface IntersectionInfo {
  point: Point2D
  edgeIndex: number
  perimeterParam: number
}

function findLineRectIntersections(
  lineStart: Point2D,
  lineEnd: Point2D,
  corners: RectCorners
): IntersectionInfo[] {
  const edges: [Point2D, Point2D][] = [
    [corners.tl, corners.tr],
    [corners.tr, corners.br],
    [corners.br, corners.bl],
    [corners.bl, corners.tl],
  ]

  const results: IntersectionInfo[] = []

  for (let i = 0; i < edges.length; i++) {
    const [e1, e2] = edges[i]
    const intersection = lineSegmentIntersection(lineStart, lineEnd, e1, e2)
    if (intersection) {
      results.push({
        point: intersection.point,
        edgeIndex: i,
        perimeterParam: i + intersection.s,
      })
    }
  }

  results.sort((a, b) => a.perimeterParam - b.perimeterParam)

  const filtered: IntersectionInfo[] = []
  for (const r of results) {
    if (
      filtered.length === 0 ||
      Math.hypot(
        r.point.x - filtered[filtered.length - 1].point.x,
        r.point.y - filtered[filtered.length - 1].point.y
      ) > 0.5
    ) {
      filtered.push(r)
    }
  }

  return filtered
}

function splitRectByLine(
  rectElement: ExcalidrawElement,
  lineStart: Point2D,
  lineEnd: Point2D
): Point2D[][] | null {
  const corners = getRectCorners(rectElement)
  const intersections = findLineRectIntersections(lineStart, lineEnd, corners)

  if (intersections.length !== 2) return null

  const [int1, int2] = intersections
  const cornerArr = [corners.tl, corners.tr, corners.br, corners.bl]

  const poly1: Point2D[] = [int1.point]
  let edgeIdx = int1.edgeIndex
  while (edgeIdx !== int2.edgeIndex) {
    poly1.push(cornerArr[(edgeIdx + 1) % 4])
    edgeIdx = (edgeIdx + 1) % 4
  }
  poly1.push(int2.point)

  const poly2: Point2D[] = [int2.point]
  edgeIdx = int2.edgeIndex
  while (edgeIdx !== int1.edgeIndex) {
    poly2.push(cornerArr[(edgeIdx + 1) % 4])
    edgeIdx = (edgeIdx + 1) % 4
  }
  poly2.push(int1.point)

  return [poly1, poly2]
}

function getLineEndpoints(el: ExcalidrawElement): { start: Point2D; end: Point2D } | null {
  const elType = (el as any).type
  if (elType !== 'line' && elType !== 'arrow') return null

  const x = (el as any).x || 0
  const y = (el as any).y || 0
  const points = (el as any).points || []

  if (points.length < 2) return null

  const p0 = points[0]
  const p1 = points[points.length - 1]

  const start: Point2D = {
    x: x + (Array.isArray(p0) ? p0[0] : p0.x || 0),
    y: y + (Array.isArray(p0) ? p0[1] : p0.y || 0),
  }
  const end: Point2D = {
    x: x + (Array.isArray(p1) ? p1[0] : p1.x || 0),
    y: y + (Array.isArray(p1) ? p1[1] : p1.y || 0),
  }

  return { start, end }
}

function isSplittableShape(el: ExcalidrawElement): boolean {
  const elType = (el as any).type
  return elType === 'rectangle' || elType === 'diamond'
}

function isLineOrArrow(el: ExcalidrawElement): boolean {
  const elType = (el as any).type
  return elType === 'line' || elType === 'arrow'
}

function createPolygonElement(
  vertices: Point2D[],
  style: {
    strokeColor?: string
    backgroundColor?: string
    fillStyle?: string
    strokeWidth?: number
    strokeStyle?: string
    opacity?: number
  },
  index: number
): ExcalidrawElement {
  const minX = Math.min(...vertices.map((v) => v.x))
  const minY = Math.min(...vertices.map((v) => v.y))
  const maxX = Math.max(...vertices.map((v) => v.x))
  const maxY = Math.max(...vertices.map((v) => v.y))

  const points = vertices.map((v) => [v.x - minX, v.y - minY])
  points.push([vertices[0].x - minX, vertices[0].y - minY])

  return {
    ...baseElementProps,
    type: 'line',
    id: `split-poly-${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
    points,
    strokeColor: style.strokeColor || '#1e1e1e',
    backgroundColor: style.backgroundColor || 'transparent',
    fillStyle: style.fillStyle || 'solid',
    strokeWidth: style.strokeWidth || 2,
    strokeStyle: style.strokeStyle || 'solid',
    opacity: style.opacity ?? 100,
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: null,
  } as unknown as ExcalidrawElement
}

export function splitShapes(
  allElements: ExcalidrawElement[],
  selectedElementIds: string[]
): SplitResult {
  if (selectedElementIds.length < 2) {
    return {
      elements: allElements,
      splitCount: 0,
      message: '请同时选中一个图形和一条穿过它的线条',
    }
  }

  const selectedElements = allElements.filter((el) =>
    selectedElementIds.includes(el.id)
  )

  const shapes = selectedElements.filter(isSplittableShape)
  const lines = selectedElements.filter(isLineOrArrow)

  if (shapes.length === 0) {
    return {
      elements: allElements,
      splitCount: 0,
      message: '请选中一个可分割的图形（矩形、菱形）',
    }
  }

  if (lines.length === 0) {
    return {
      elements: allElements,
      splitCount: 0,
      message: '请选中一条穿过图形的线条来分割',
    }
  }

  const removedIds = new Set<string>()
  const newElements: ExcalidrawElement[] = []
  let splitCount = 0
  let polyIndex = 0

  for (const shape of shapes) {
    if (removedIds.has(shape.id)) continue

    for (const line of lines) {
      if (removedIds.has(line.id)) continue

      const endpoints = getLineEndpoints(line)
      if (!endpoints) continue

      const polygons = splitRectByLine(shape, endpoints.start, endpoints.end)
      if (!polygons) continue

      const shapeStyle = {
        strokeColor: (shape as any).strokeColor,
        backgroundColor: (shape as any).backgroundColor,
        fillStyle: (shape as any).fillStyle,
        strokeWidth: (shape as any).strokeWidth,
        strokeStyle: (shape as any).strokeStyle,
        opacity: (shape as any).opacity,
      }

      for (const vertices of polygons) {
        const polyEl = createPolygonElement(vertices, shapeStyle, polyIndex++)
        newElements.push(polyEl)
      }

      removedIds.add(shape.id)
      // 保留分割线，只删除被分割的图形
      // removedIds.add(line.id)
      splitCount++
      break
    }
  }

  if (splitCount === 0) {
    return {
      elements: allElements,
      splitCount: 0,
      message: '线条未穿过图形，无法分割。请确保线条横跨图形的两个对边',
    }
  }

  const updatedElements = allElements
    .filter((el) => !removedIds.has(el.id))
    .concat(newElements)

  // 计算实际的多边形数量
  const polygonCount = splitCount * 2

  return {
    elements: updatedElements,
    splitCount,
    message: `已将图形分割为 ${polygonCount} 个子图形`,
  }
}

export function canSplitSelection(
  allElements: ExcalidrawElement[],
  selectedElementIds: string[]
): boolean {
  if (selectedElementIds.length < 2) return false

  const selectedElements = allElements.filter((el) =>
    selectedElementIds.includes(el.id)
  )
  const hasShape = selectedElements.some(isSplittableShape)
  const hasLine = selectedElements.some(isLineOrArrow)

  return hasShape && hasLine
}

export function isGroupedElement(element: ExcalidrawElement): boolean {
  return (
    Array.isArray((element as any).groupIds) &&
    (element as any).groupIds.length > 0
  )
}

export function getGroupIds(element: ExcalidrawElement): string[] {
  return (element as any).groupIds || []
}

export function splitGroupedElements(
  allElements: ExcalidrawElement[],
  selectedElementIds: string[]
): SplitResult {
  const selectedElements = allElements.filter((el) =>
    selectedElementIds.includes(el.id)
  )

  const allGroupIds = new Set<string>()
  for (const el of selectedElements) {
    for (const gid of getGroupIds(el)) {
      allGroupIds.add(gid)
    }
  }

  if (allGroupIds.size === 0) {
    return { elements: allElements, splitCount: 0 }
  }

  const groupMembers: ExcalidrawElement[] = []
  const seenIds = new Set<string>()
  for (const el of allElements) {
    if (seenIds.has(el.id)) continue
    const elGroupIds = getGroupIds(el)
    for (const gid of elGroupIds) {
      if (allGroupIds.has(gid)) {
        groupMembers.push(el)
        seenIds.add(el.id)
        break
      }
    }
  }

  const elementMap = new Map<string, ExcalidrawElement>()
  for (const el of allElements) {
    elementMap.set(el.id, el)
  }

  let splitCount = 0
  for (const el of groupMembers) {
    const groupIds = getGroupIds(el)
    if (groupIds.length > 0) {
      const updated = {
        ...el,
        groupIds: [],
        version: ((el as any).version || 0) + 1,
        versionNonce: Math.floor(Math.random() * 1000000),
        updated: Date.now(),
      } as ExcalidrawElement
      elementMap.set(el.id, updated)
      splitCount++
    }
  }

  return {
    elements: Array.from(elementMap.values()),
    splitCount,
  }
}
