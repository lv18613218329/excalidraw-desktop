/**
 * Library Utilities - Convert custom shapes to Excalidraw library items
 */

import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import { MathShape, mathShapes } from './math'

/**
 * Base properties common to all Excalidraw elements
 */
const baseElementProps = {
  angle: 0,
  strokeColor: '#1e1e1e',
  backgroundColor: 'transparent',
  fillStyle: 'solid',
  strokeWidth: 2,
  strokeStyle: 'solid',
  roughness: 1,
  opacity: 100,
  groupIds: [],
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

/**
 * Convert SVG string to Excalidraw elements
 * This is a simplified conversion - creates basic shape elements
 */
export function convertSvgToElements(
  svgString: string,
): ExcalidrawElement[] {
  const elements: ExcalidrawElement[] = []

  // Extract dimensions
  const widthMatch = svgString.match(/width="(\d+)"/)
  const heightMatch = svgString.match(/height="(\d+)"/)
  const width = widthMatch ? parseInt(widthMatch[1]) : 100
  const height = heightMatch ? parseInt(heightMatch[1]) : 100

  // Parse text elements from SVG
  const textMatches = svgString.matchAll(/<text[^>]*>([^<]*)<\/text>/g)
  for (const match of textMatches) {
    const textContent = match[1]
    const xAttrMatch = match[0].match(/x="(\d+)"/)
    const yAttrMatch = match[0].match(/y="(\d+)"/)
    const fontSizeMatch = match[0].match(/font-size="(\d+)"/)

    const x = xAttrMatch ? parseInt(xAttrMatch[1]) : width / 2
    const y = yAttrMatch ? parseInt(yAttrMatch[1]) : height / 2
    const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1]) : 20

    elements.push({
      ...baseElementProps,
      type: 'text',
      id: `math-text-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      x: x - fontSize / 2,
      y: y - fontSize,
      width: fontSize,
      height: fontSize,
      text: textContent,
      fontSize: fontSize,
      fontFamily: 3, // Hand-drawn style
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: null,
      originalText: textContent,
      lineHeight: 1.25,
      autoResize: true,
    } as unknown as ExcalidrawElement)
  }

  // Parse polygon elements
  const polygonMatches = svgString.matchAll(/<polygon[^>]*points="([^"]*)"[^>]*>/g)
  for (const match of polygonMatches) {
    const pointsStr = match[1]
    const points = pointsStr.split(/[\s,]+/).map(Number)
    const strokeMatch = match[0].match(/stroke="([^"]*)"/)
    const strokeWidthMatch = match[0].match(/stroke-width="(\d+)"/)

    // Create line elements for each polygon edge
    for (let i = 0; i < points.length - 2; i += 2) {
      const x1 = points[i]
      const y1 = points[i + 1]
      const x2 = points[i + 2] || points[0]
      const y2 = points[i + 3] || points[1]

      elements.push({
        ...baseElementProps,
        type: 'line',
        id: `math-line-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(x2 - x1) || 1,
        height: Math.abs(y2 - y1) || 1,
        points: [[x1 - Math.min(x1, x2), y1 - Math.min(y1, y2)], [x2 - Math.min(x1, x2), y2 - Math.min(y1, y2)]],
        strokeColor: strokeMatch ? strokeMatch[1] : '#1e1e1e',
        strokeWidth: strokeWidthMatch ? parseInt(strokeWidthMatch[1]) : 2,
        startBinding: null,
        endBinding: null,
        startArrowhead: null,
        endArrowhead: null,
      } as unknown as ExcalidrawElement)
    }
  }

  // Parse circle elements
  const circleMatches = svgString.matchAll(/<circle[^>]*cx="(\d+)"[^>]*cy="(\d+)"[^>]*r="(\d+)"[^>]*>/g)
  for (const match of circleMatches) {
    const cx = parseInt(match[1])
    const cy = parseInt(match[2])
    const r = parseInt(match[3])
    const strokeMatch = match[0].match(/stroke="([^"]*)"/)
    const strokeWidthMatch = match[0].match(/stroke-width="(\d+)"/)
    const fillMatch = match[0].match(/fill="([^"]*)"/)

    elements.push({
      ...baseElementProps,
      type: 'ellipse',
      id: `math-circle-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      x: cx - r,
      y: cy - r,
      width: r * 2,
      height: r * 2,
      strokeColor: strokeMatch ? strokeMatch[1] : '#1e1e1e',
      backgroundColor: fillMatch && fillMatch[1] !== 'none' ? fillMatch[1] : 'transparent',
      fillStyle: fillMatch && fillMatch[1] !== 'none' ? 'solid' : 'hachure',
      strokeWidth: strokeWidthMatch ? parseInt(strokeWidthMatch[1]) : 2,
      roundness: { type: 1, value: 8 },
    } as unknown as ExcalidrawElement)
  }

  // Parse rect elements
  const rectMatches = svgString.matchAll(/<rect[^>]*x="(\d+)"[^>]*y="(\d+)"[^>]*width="(\d+)"[^>]*height="(\d+)"[^>]*>/g)
  for (const match of rectMatches) {
    const x = parseInt(match[1])
    const y = parseInt(match[2])
    const w = parseInt(match[3])
    const h = parseInt(match[4])
    const strokeMatch = match[0].match(/stroke="([^"]*)"/)
    const strokeWidthMatch = match[0].match(/stroke-width="(\d+)"/)
    const fillMatch = match[0].match(/fill="([^"]*)"/)

    elements.push({
      ...baseElementProps,
      type: 'rectangle',
      id: `math-rect-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      x,
      y,
      width: w,
      height: h,
      strokeColor: strokeMatch ? strokeMatch[1] : '#1e1e1e',
      backgroundColor: fillMatch && fillMatch[1] !== 'none' ? fillMatch[1] : 'transparent',
      fillStyle: fillMatch && fillMatch[1] !== 'none' ? 'solid' : 'hachure',
      strokeWidth: strokeWidthMatch ? parseInt(strokeWidthMatch[1]) : 2,
    } as unknown as ExcalidrawElement)
  }

  // Parse line elements
  const lineMatches = svgString.matchAll(/<line[^>]*x1="(\d+)"[^>]*y1="(\d+)"[^>]*x2="(\d+)"[^>]*y2="(\d+)"[^>]*>/g)
  for (const match of lineMatches) {
    const x1 = parseInt(match[1])
    const y1 = parseInt(match[2])
    const x2 = parseInt(match[3])
    const y2 = parseInt(match[4])
    const strokeMatch = match[0].match(/stroke="([^"]*)"/)
    const strokeWidthMatch = match[0].match(/stroke-width="(\d+)"/)

    elements.push({
      ...baseElementProps,
      type: 'line',
      id: `math-line-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1) || 1,
      height: Math.abs(y2 - y1) || 1,
      points: [[x1 - Math.min(x1, x2), y1 - Math.min(y1, y2)], [x2 - Math.min(x1, x2), y2 - Math.min(y1, y2)]],
      strokeColor: strokeMatch ? strokeMatch[1] : '#1e1e1e',
      strokeWidth: strokeWidthMatch ? parseInt(strokeWidthMatch[1]) : 2,
      startBinding: null,
      endBinding: null,
      startArrowhead: null,
      endArrowhead: null,
    } as unknown as ExcalidrawElement)
  }

  // Parse path elements (for complex shapes) - simplified as freedraw
  const pathMatches = svgString.matchAll(/<path[^>]*d="([^"]*)"[^>]*>/g)
  for (const match of pathMatches) {
    const strokeMatch = match[0].match(/stroke="([^"]*)"/)
    const strokeWidthMatch = match[0].match(/stroke-width="(\d+)"/)
    const fillMatch = match[0].match(/fill="([^"]*)"/)

    elements.push({
      ...baseElementProps,
      type: 'freedraw',
      id: `math-path-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      strokeColor: strokeMatch ? strokeMatch[1] : '#1e1e1e',
      backgroundColor: fillMatch && fillMatch[1] !== 'none' ? fillMatch[1] : 'transparent',
      fillStyle: fillMatch && fillMatch[1] !== 'none' ? 'solid' : 'hachure',
      strokeWidth: strokeWidthMatch ? parseInt(strokeWidthMatch[1]) : 2,
      pressures: [],
      simulatePressure: true,
      lastCommittedPoint: null,
    } as unknown as ExcalidrawElement)
  }

  return elements
}

/**
 * Convert a MathShape to Excalidraw library item elements
 */
export function convertMathShapeToElements(shape: MathShape): ExcalidrawElement[] {
  const elements = convertSvgToElements(shape.svg)

  // Group all elements together if multiple
  if (elements.length > 1) {
    const groupId = `group-${shape.id}-${Date.now()}`
    // Create new elements with groupIds set
    return elements.map(el => ({
      ...el,
      groupIds: [groupId],
    })) as ExcalidrawElement[]
  }

  return elements
}

/**
 * Create a library item from a MathShape
 */
export function createLibraryItemFromShape(shape: MathShape): { elements: ExcalidrawElement[] } {
  return {
    elements: convertMathShapeToElements(shape),
  }
}

/**
 * Get all math shapes as library items
 */
export function getMathLibraryItems(): Array<{ elements: ExcalidrawElement[] }> {
  return mathShapes.map(shape => createLibraryItemFromShape(shape))
}