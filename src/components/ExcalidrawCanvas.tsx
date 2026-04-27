import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Excalidraw, restore, THEME } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI, AppState, BinaryFiles, NormalizedZoomValue } from '@excalidraw/excalidraw/types'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import '@excalidraw/excalidraw/index.css'
import { useAppStore } from '../stores/appStore'
import { MathShape, convertMathShapeToElements } from '../libraries'
import { useConnectionStore, isLineElement, isConnectableElement, getLineEndpoint, findNearestAnchor, shouldDisconnect } from '../connection'
import { splitShapes, canSplitSelection } from '../split'
import { useSnapStore, isSnappableElement } from '../snap'
import AnchorOverlay from '../connection/AnchorOverlay'
import SnapOverlay from '../snap/SnapOverlay'
import RotationCenterOverlay from './RotationCenterOverlay'
import './ExcalidrawCanvas.css'

/**
 * Properties that can be updated on Excalidraw elements
 */
export interface ElementProperties {
  strokeColor?: string
  backgroundColor?: string
  fillStyle?: 'hachure' | 'cross-hatch' | 'solid' | 'zigzag'
  strokeWidth?: number
  strokeStyle?: 'solid' | 'dashed' | 'dotted'
  roughness?: number
  opacity?: number
  roundness?: 'round' | 'sharp' | null
}

/**
 * Interface for the ExcalidrawCanvas component's exposed methods
 */
export interface ExcalidrawCanvasRef {
  /**
   * Check if the Excalidraw API is ready
   */
  isReady: () => boolean

  /**
   * Get the Excalidraw API instance
   */
  getAPI: () => ExcalidrawImperativeAPI | null

  /**
   * Update properties of selected elements or specific elements by ID
   * @param properties - The properties to update
   * @param elementIds - Optional array of element IDs to update. If not provided, updates currently selected elements.
   */
  updateElementProperties: (properties: ElementProperties, elementIds?: string[]) => void

  /**
   * Get currently selected element IDs
   */
  getSelectedElementIds: () => string[]

  /**
   * Get all scene elements
   */
  getSceneElements: () => ExcalidrawElement[]

  /**
   * Clear the canvas and reset state
   */
  clearCanvas: () => void

  /**
   * Zoom in - increase zoom by 25% (max 400%)
   */
  zoomIn: () => void

  /**
   * Zoom out - decrease zoom by 25% (min 25%)
   */
  zoomOut: () => void

  /**
   * Set zoom to a specific value
   * @param value - Zoom value (0.25 = 25% to 4 = 400%)
   */
  setZoom: (value: number) => void

  /**
   * Fit all elements to the visible canvas area
   * Automatically adjusts zoom and scroll position to show all content
   */
  fitToScreen: () => void

  /**
   * Reset zoom to actual size (100%)
   * Sets zoom back to 1:1 pixel ratio
   */
  resetZoom: () => void

  /**
   * Toggle grid visibility on/off
   * gridSize null = grid hidden, gridSize number = grid visible
   */
  toggleGrid: () => void

  /**
   * Set grid size
   * If grid is currently hidden, it will be shown first
   * @param size - Grid size in pixels (e.g., 10, 20, 30)
   */
  setGridSize: (size: number) => void

  /**
   * Set canvas background color
   * @param color - Background color (e.g., '#ffffff' for white, '#1e1e1e' for dark)
   */
  setBackgroundColor: (color: string) => void

  /**
   * Set canvas theme (light/dark)
   * @param theme - Theme mode ('light' or 'dark')
   */
  setTheme: (theme: 'light' | 'dark') => void

  /**
   * Undo last action
   */
  undo: () => void

  /**
   * Redo last undone action
   */
  redo: () => void

  /**
   * Insert a math shape onto the canvas
   * @param shape - The MathShape to insert
   * @param position - Optional position {x, y} to insert at. If not provided, inserts at center.
   */
  insertMathShape: (shape: MathShape, position?: { x: number; y: number }) => void

  /**
   * Split selected shape by a crossing line into sub-shapes
   * Select a shape (rectangle/diamond) + a line that crosses it, then split
   * @returns The split count and optional message
   */
  splitSelectedGroup: () => { count: number; message?: string }

  /**
   * Check if the current selection can be split (contains grouped elements)
   */
  canSplitSelection: () => boolean

  /**
   * Rotate selected elements by a specified angle
   * @param angle - Rotation angle in degrees (positive = clockwise, negative = counter-clockwise)
   * @param centerX - Optional center X coordinate for rotation (default: element center)
   * @param centerY - Optional center Y coordinate for rotation (default: element center)
   */
  rotateElements: (angle: number, centerX?: number, centerY?: number) => void

  /**
   * Set absolute rotation angle for selected elements
   * @param angle - Absolute rotation angle in degrees (0-360)
   * @param centerX - Optional center X coordinate for rotation (default: element center)
   * @param centerY - Optional center Y coordinate for rotation (default: element center)
   */
  setRotation: (angle: number, centerX?: number, centerY?: number) => void
}

const UI_OPTIONS = {
  canvasActions: {
    changeViewBackgroundColor: true,
    clearCanvas: true,
    export: false as const,
    loadScene: false,
    saveToActiveFile: false,
    toggleTheme: true,
    saveAsImage: false,
  },
  tools: {
    image: true,
  },
}

interface ExcalidrawCanvasProps {
  className?: string
  showRotationCenter?: boolean
  rotationCenterX?: number
  rotationCenterY?: number
  onRotationCenterChange?: (x: number, y: number) => void
}

const ExcalidrawCanvas = forwardRef<ExcalidrawCanvasRef, ExcalidrawCanvasProps>((props, ref) => {
  const { 
    className, 
    showRotationCenter = false, 
    rotationCenterX = 0, 
    rotationCenterY = 0,
    onRotationCenterChange
  } = props
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const [, forceUpdate] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const prevZoomRef = useRef(100)
  const prevGridRef = useRef(true)
  const prevSelectedIdsRef = useRef<string>('')

  const setElements = useAppStore((s) => s.setElements)
  const setZoom = useAppStore((s) => s.setZoom)
  const setGridEnabled = useAppStore((s) => s.setGridEnabled)
  const setSelectedElementIds = useAppStore((s) => s.setSelectedElementIds)
  const setCurrentFilePath = useAppStore((s) => s.setCurrentFilePath)
  const setIsDirty = useAppStore((s) => s.setIsDirty)
  const theme = useAppStore((s) => s.theme)
  const setThemeInStore = useAppStore((s) => s.setTheme)

  // Get current selected element IDs from store
  const selectedElementIds = useAppStore((s) => s.selectedElementIds)

  /**
   * Update properties of elements
   * @param properties - The properties to update
   * @param elementIds - Optional array of element IDs to update. If not provided, updates currently selected elements.
   */
  const updateElementProperties = useCallback((properties: ElementProperties, elementIds?: string[]) => {
    const api = excalidrawAPIRef.current
    if (!api) {
      console.warn('Excalidraw API is not ready. Cannot update element properties.')
      return
    }

    // Get the IDs of elements to update
    const targetIds = elementIds || selectedElementIds
    if (targetIds.length === 0) {
      console.warn('No elements selected or specified for update.')
      return
    }

    // Get current scene elements
    const currentElements = api.getSceneElements()

    // Update the target elements with new properties
    // We need to create a new object for each updated element to handle readonly properties
    const updatedElements = currentElements.map((element) => {
      if (!targetIds.includes(element.id)) {
        return element
      }

      // Build the updates object
      const updates: Record<string, unknown> = {}

      if (properties.strokeColor !== undefined) {
        updates.strokeColor = properties.strokeColor
      }
      if (properties.backgroundColor !== undefined) {
        updates.backgroundColor = properties.backgroundColor
      }
      if (properties.fillStyle !== undefined) {
        updates.fillStyle = properties.fillStyle
      }
      if (properties.strokeWidth !== undefined) {
        updates.strokeWidth = properties.strokeWidth
      }
      if (properties.strokeStyle !== undefined) {
        updates.strokeStyle = properties.strokeStyle
      }
      if (properties.roughness !== undefined) {
        updates.roughness = properties.roughness
      }
      if (properties.opacity !== undefined) {
        updates.opacity = properties.opacity
      }
      if (properties.roundness !== undefined) {
        // Handle roundness update
        if (properties.roundness === null) {
          updates.roundness = null
        } else if (element.roundness === null) {
          // Initialize roundness for elements that don't have it
          updates.roundness = {
            type: properties.roundness === 'round' ? 1 : 2, // ROUNDNESS.PROPORTIONAL_RADIUS = 1, ROUNDNESS.ADAPTIVE_RADIUS = 2
            value: 4, // default value
          }
        } else {
          // Update existing roundness type
          updates.roundness = {
            ...element.roundness,
            type: properties.roundness === 'round' ? 1 : 2,
          }
        }
      }

      // Return a new object with merged properties (spread creates a new mutable object)
      return { ...element, ...updates } as ExcalidrawElement
    })

    // Apply updates to the scene
    api.updateScene({
      elements: updatedElements,
    })
  }, [selectedElementIds])

  /**
   * Clear the canvas
   */
  const clearCanvas = useCallback(() => {
    const api = excalidrawAPIRef.current
    if (!api) {
      console.warn('Excalidraw API is not ready. Cannot clear canvas.')
      return
    }
    api.resetScene()
    setCurrentFilePath(null)
    setIsDirty(false)
  }, [setCurrentFilePath, setIsDirty])

  /**
   * Zoom in - increase zoom by 25% (max 400%)
   */
  const zoomIn = useCallback(() => {
    const api = excalidrawAPIRef.current
    if (!api) {
      console.warn('Excalidraw API is not ready. Cannot zoom in.')
      return
    }

    const appState = api.getAppState()
    const currentZoom = appState.zoom.value
    const newZoom = Math.min(currentZoom * 1.25, 4) as NormalizedZoomValue // Max 400%

    api.updateScene({ appState: { zoom: { value: newZoom } } })
  }, [])

  /**
   * Zoom out - decrease zoom by 25% (min 25%)
   */
  const zoomOut = useCallback(() => {
    const api = excalidrawAPIRef.current
    if (!api) {
      console.warn('Excalidraw API is not ready. Cannot zoom out.')
      return
    }

    const appState = api.getAppState()
    const currentZoom = appState.zoom.value
    const newZoom = Math.max(currentZoom * 0.75, 0.25) as NormalizedZoomValue // Min 25%

    api.updateScene({ appState: { zoom: { value: newZoom } } })
  }, [])

  /**
   * Set zoom to a specific value (25% - 400%)
   */
  const setZoomValue = useCallback((value: number) => {
    const api = excalidrawAPIRef.current
    if (!api) {
      console.warn('Excalidraw API is not ready. Cannot set zoom.')
      return
    }

    // Validate and clamp value to range 0.25 - 4
    const clampedValue = Math.max(0.25, Math.min(4, value)) as NormalizedZoomValue

    api.updateScene({ appState: { zoom: { value: clampedValue } } })
  }, [])

  /**
   * Reset zoom to actual size (100%)
   * Sets zoom back to 1:1 pixel ratio
   */
  const resetZoom = useCallback(() => {
    const api = excalidrawAPIRef.current
    if (!api) {
      console.warn('Excalidraw API is not ready. Cannot reset zoom.')
      return
    }

    api.updateScene({ appState: { zoom: { value: 1.0 as NormalizedZoomValue } } })
  }, [])

  /**
   * Toggle grid visibility on/off
   * gridSize null = grid hidden, gridSize number = grid visible
   */
  const toggleGrid = useCallback(() => {
    const api = excalidrawAPIRef.current
    if (!api) {
      console.warn('Excalidraw API is not ready. Cannot toggle grid.')
      return
    }

    const appState = api.getAppState()
    const currentGridSize = appState.gridSize

    // Toggle: if null/0 (hidden), show grid with size 20; if truthy (visible), hide grid
    // Note: Excalidraw uses gridSize: null to hide grid at runtime, but type is number
    const newGridSize = currentGridSize ? null : 20

    api.updateScene({ appState: { gridSize: newGridSize as unknown as number } })
  }, [])

  /**
   * Set grid size
   * If grid is currently hidden, it will be shown first
   * @param size - Grid size in pixels (e.g., 10, 20, 30)
   */
  const setGridSize = useCallback((size: number) => {
    const api = excalidrawAPIRef.current
    if (!api) {
      console.warn('Excalidraw API is not ready. Cannot set grid size.')
      return
    }

    // Validate size is positive
    if (size <= 0) {
      console.warn('Grid size must be a positive number.')
      return
    }

    // Set grid size - this will automatically show grid if hidden
    api.updateScene({ appState: { gridSize: size } })
  }, [])

  /**
   * Set canvas background color
   * @param color - Background color (e.g., '#ffffff' for white, '#1e1e1e' for dark)
   */
  const setBackgroundColor = useCallback((color: string) => {
    const api = excalidrawAPIRef.current
    if (!api) {
      console.warn('Excalidraw API is not ready. Cannot set background color.')
      return
    }

    // Validate color is a valid hex color string
    if (!color || typeof color !== 'string') {
      console.warn('Invalid color value.')
      return
    }

    // Set canvas background color
    api.updateScene({ appState: { viewBackgroundColor: color } })
  }, [])

  /**
   * Set canvas theme (light/dark)
   * @param theme - Theme mode ('light' or 'dark')
   */
  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    const api = excalidrawAPIRef.current
    if (!api) {
      console.warn('Excalidraw API is not ready. Cannot set theme.')
      return
    }

    // Update Excalidraw theme
    const excalidrawTheme = newTheme === 'light' ? THEME.LIGHT : THEME.DARK
    api.updateScene({ appState: { theme: excalidrawTheme } })

    // Update app store
    setThemeInStore(newTheme)
  }, [setThemeInStore])

  /**
   * Fit all elements to the visible canvas area
   * Automatically adjusts zoom and scroll position to show all content
   */
  const fitToScreen = useCallback(() => {
    const api = excalidrawAPIRef.current
    if (!api) {
      console.warn('Excalidraw API is not ready. Cannot fit to screen.')
      return
    }

    const elements = api.getSceneElements()
    if (elements.length === 0) {
      console.log('No elements to fit.')
      return
    }

    // Calculate bounding box of all elements
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const element of elements) {
      const x = element.x
      const y = element.y
      const width = element.width
      const height = element.height

      // Handle rotated elements by considering all corners
      const angle = element.angle || 0
      if (angle === 0) {
        // No rotation, simple case
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x + width)
        maxY = Math.max(maxY, y + height)
      } else {
        // Rotated element - calculate bounding box of rotated rectangle
        const cx = x + width / 2
        const cy = y + height / 2
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)

        const corners = [
          { x: x, y: y },
          { x: x + width, y: y },
          { x: x + width, y: y + height },
          { x: x, y: y + height },
        ]

        for (const corner of corners) {
          const rotatedX = cx + (corner.x - cx) * cos - (corner.y - cy) * sin
          const rotatedY = cy + (corner.x - cx) * sin + (corner.y - cy) * cos
          minX = Math.min(minX, rotatedX)
          minY = Math.min(minY, rotatedY)
          maxX = Math.max(maxX, rotatedX)
          maxY = Math.max(maxY, rotatedY)
        }
      }
    }

    // Get canvas dimensions from the container
    const container = containerRef.current
    if (!container) {
      console.warn('Container ref not available.')
      return
    }

    const canvasWidth = container.clientWidth
    const canvasHeight = container.clientHeight

    // Calculate content dimensions with padding
    const padding = 50 // Padding around content
    const contentWidth = maxX - minX + padding * 2
    const contentHeight = maxY - minY + padding * 2

    // Calculate zoom to fit content in canvas
    // Leave some margin around the content
    const marginFactor = 0.9 // 90% of canvas size
    const zoomX = (canvasWidth * marginFactor) / contentWidth
    const zoomY = (canvasHeight * marginFactor) / contentHeight
    const calculatedZoom = Math.min(zoomX, zoomY)

    // Clamp zoom to valid range and cast to NormalizedZoomValue
    const newZoom = Math.max(0.1, Math.min(4, calculatedZoom)) as NormalizedZoomValue

    // Calculate center of content
    const contentCenterX = (minX + maxX) / 2
    const contentCenterY = (minY + maxY) / 2

    // Update scene with new zoom and scroll position to center content
    api.updateScene({
      appState: {
        zoom: { value: newZoom },
        scrollX: contentCenterX - canvasWidth / 2 / newZoom,
        scrollY: contentCenterY - canvasHeight / 2 / newZoom,
      },
    })
  }, [])

  /**
   * Undo last action
   */
  const undo = useCallback(() => {
    const api = excalidrawAPIRef.current as any
    if (!api) {
      console.warn('Excalidraw API is not ready. Cannot undo.')
      return
    }
    api.undo()
  }, [])

  /**
   * Redo last undone action
   */
  const redo = useCallback(() => {
    const api = excalidrawAPIRef.current as any
    if (!api) {
      console.warn('Excalidraw API is not ready. Cannot redo.')
      return
    }
    api.redo()
  }, [])

  /**
   * Insert a math shape onto the canvas
   * Converts MathShape SVG to Excalidraw elements and adds them to the scene
   */
  const insertMathShape = useCallback((shape: MathShape, position?: { x: number; y: number }) => {
    const api = excalidrawAPIRef.current
    if (!api) {
      console.warn('Excalidraw API is not ready. Cannot insert shape.')
      return
    }

    // Convert shape to Excalidraw elements
    const elements = convertMathShapeToElements(shape)

    // Get current scene elements
    const currentElements = api.getSceneElements()

    // Calculate insertion position
    const appState = api.getAppState()
    const canvasWidth = containerRef.current?.clientWidth || 800
    const canvasHeight = containerRef.current?.clientHeight || 600
    const zoom = appState.zoom.value
    const scrollX = appState.scrollX
    const scrollY = appState.scrollY

    // If position is provided, use it; otherwise insert at canvas center
    const centerX = position?.x ?? (canvasWidth / 2 / zoom - scrollX)
    const centerY = position?.y ?? (canvasHeight / 2 / zoom - scrollY)

    // Offset elements to the insertion position
    const offsetX = centerX - (shape.defaultWidth || 100) / 2
    const offsetY = centerY - (shape.defaultHeight || 100) / 2

    const offsetElements = elements.map((el, idx) => {
      return {
        ...el,
        x: (el.x || 0) + offsetX,
        y: (el.y || 0) + offsetY,
        id: `${el.id}-${Date.now()}-${idx}`,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: Math.floor(Math.random() * 100000),
        updated: Date.now(),
      } as ExcalidrawElement
    })

    // Add new elements to the scene
    api.updateScene({
      elements: [...currentElements, ...offsetElements],
    })

    // Select the newly added elements
    const newElementIds = offsetElements.map(el => el.id)
    const newSelectedIds: Record<string, true> = {}
    newElementIds.forEach(id => {
      newSelectedIds[id] = true
    })

    api.updateScene({
      appState: {
        selectedElementIds: newSelectedIds,
      },
    })

    setIsDirty(true)
  }, [setIsDirty])

  const splitSelectedGroup = useCallback((): { count: number; message?: string } => {
    const api = excalidrawAPIRef.current
    if (!api) {
      console.warn('Excalidraw API is not ready. Cannot split.')
      return { count: 0, message: '画布未就绪' }
    }

    const currentElements = api.getSceneElements() as ExcalidrawElement[]
    const selectedIds = selectedElementIds

    const result = splitShapes(currentElements, selectedIds)

    if (result.splitCount > 0) {
      api.updateScene({ elements: result.elements })
      setIsDirty(true)
    }

    return { count: result.splitCount, message: result.message }
  }, [selectedElementIds, setIsDirty])

  const checkCanSplitSelection = useCallback((): boolean => {
    const api = excalidrawAPIRef.current
    if (!api) return false

    const currentElements = api.getSceneElements() as ExcalidrawElement[]
    return canSplitSelection(currentElements, selectedElementIds)
  }, [selectedElementIds])

  /**
   * Rotate selected elements by a specified angle
   */
  const rotateElements = useCallback((angleDeg: number, centerX?: number, centerY?: number) => {
    const api = excalidrawAPIRef.current
    if (!api) {
      console.warn('Excalidraw API is not ready. Cannot rotate.')
      return
    }

    const currentElements = api.getSceneElements() as ExcalidrawElement[]
    const selectedIds = selectedElementIds

    if (selectedIds.length === 0) {
      console.warn('No elements selected for rotation.')
      return
    }

    // Convert degrees to radians
    const angleRad = (angleDeg * Math.PI) / 180

    const updatedElements = currentElements.map(el => {
      if (!selectedIds.includes(el.id)) {
        return el
      }

      // Calculate element center
      const elCenterX = el.x + (el.width || 0) / 2
      const elCenterY = el.y + (el.height || 0) / 2

      // Use custom center or element center
      const rotCenterX = centerX ?? elCenterX
      const rotCenterY = centerY ?? elCenterY

      // If rotating around element's own center, just update the angle
      if (centerX === undefined && centerY === undefined) {
        return {
          ...el,
          angle: ((el.angle || 0) + angleRad) % (2 * Math.PI),
          version: (el as any).version + 1,
          versionNonce: Math.floor(Math.random() * 1000000),
          updated: Date.now(),
        }
      }

      // Otherwise, need to rotate position as well
      const dx = elCenterX - rotCenterX
      const dy = elCenterY - rotCenterY

      const cos = Math.cos(angleRad)
      const sin = Math.sin(angleRad)

      const newDx = dx * cos - dy * sin
      const newDy = dx * sin + dy * cos

      const newX = rotCenterX + newDx - (el.width || 0) / 2
      const newY = rotCenterY + newDy - (el.height || 0) / 2

      return {
        ...el,
        x: newX,
        y: newY,
        angle: ((el.angle || 0) + angleRad) % (2 * Math.PI),
        version: (el as any).version + 1,
        versionNonce: Math.floor(Math.random() * 1000000),
        updated: Date.now(),
      }
    })

    api.updateScene({ elements: updatedElements })
    setIsDirty(true)
  }, [selectedElementIds, setIsDirty])

  /**
   * Set absolute rotation angle for selected elements
   * @param angleDeg - Absolute rotation angle in degrees (0-360)
   * @param centerX - Optional center X coordinate for rotation (default: element center)
   * @param centerY - Optional center Y coordinate for rotation (default: element center)
   */
  const setRotation = useCallback((angleDeg: number, centerX?: number, centerY?: number) => {
    const api = excalidrawAPIRef.current
    if (!api) {
      console.warn('Excalidraw API is not ready. Cannot set rotation.')
      return
    }

    const currentElements = api.getSceneElements() as ExcalidrawElement[]
    const selectedIds = selectedElementIds

    if (selectedIds.length === 0) {
      console.warn('No elements selected.')
      return
    }

    // Normalize angle to 0-360 range
    const normalizedAngle = ((angleDeg % 360) + 360) % 360
    const angleRad = (normalizedAngle * Math.PI) / 180

    // Calculate the bounding box center of selected elements for custom rotation
    let customCenterX = centerX
    let customCenterY = centerY
    if (centerX !== undefined && centerY !== undefined) {
      // Use provided center
    } else {
      // Calculate center from selected elements
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      selectedIds.forEach(id => {
        const el = currentElements.find(e => e.id === id)
        if (el) {
          minX = Math.min(minX, el.x)
          maxX = Math.max(maxX, el.x + (el.width || 0))
          minY = Math.min(minY, el.y)
          maxY = Math.max(maxY, el.y + (el.height || 0))
        }
      })
      customCenterX = (minX + maxX) / 2
      customCenterY = (minY + maxY) / 2
    }

    const updatedElements = currentElements.map(el => {
      if (!selectedIds.includes(el.id)) {
        return el
      }

      // Calculate element center
      const elCenterX = el.x + (el.width || 0) / 2
      const elCenterY = el.y + (el.height || 0) / 2

      // If no custom center provided and element has no previous rotation, just set angle
      if (centerX === undefined && centerY === undefined && !(el.angle || 0)) {
        return {
          ...el,
          angle: angleRad,
          version: (el as any).version + 1,
          versionNonce: Math.floor(Math.random() * 1000000),
          updated: Date.now(),
        }
      }

      // Calculate current position relative to rotation center
      const currentAngle = el.angle || 0
      const currentAngleDeg = (currentAngle * 180) / Math.PI
      
      // Calculate the distance from rotation center to element center
      const dx = elCenterX - (customCenterX ?? elCenterX)
      const dy = elCenterY - (customCenterY ?? elCenterY)
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // Calculate the initial angle when element was at 0 rotation
      const initialAngle = Math.atan2(dy, dx) - currentAngle
      
      // Calculate new position based on new rotation angle
      const newAngleRad = initialAngle + angleRad
      const newDx = Math.cos(newAngleRad) * distance
      const newDy = Math.sin(newAngleRad) * distance
      
      const newX = (customCenterX ?? elCenterX) + newDx - (el.width || 0) / 2
      const newY = (customCenterY ?? elCenterY) + newDy - (el.height || 0) / 2

      return {
        ...el,
        x: newX,
        y: newY,
        angle: angleRad,
        version: (el as any).version + 1,
        versionNonce: Math.floor(Math.random() * 1000000),
        updated: Date.now(),
      }
    })

    api.updateScene({ elements: updatedElements })
    setIsDirty(true)
  }, [selectedElementIds, setIsDirty])

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    isReady: () => excalidrawAPIRef.current !== null,

    getAPI: () => excalidrawAPIRef.current,

    updateElementProperties,

    getSelectedElementIds: () => selectedElementIds,

    getSceneElements: () => {
      const api = excalidrawAPIRef.current
      if (!api) {
        console.warn('Excalidraw API is not ready.')
        return []
      }
      return api.getSceneElements() as ExcalidrawElement[]
    },

    clearCanvas,

    zoomIn,

    zoomOut,

    setZoom: setZoomValue,

    fitToScreen,

    resetZoom,

    toggleGrid,

    setGridSize,

    setBackgroundColor,

    setTheme,

    undo,

    redo,

    insertMathShape,

    splitSelectedGroup,

    canSplitSelection: checkCanSplitSelection,

    rotateElements,

    setRotation,
  }), [updateElementProperties, selectedElementIds, clearCanvas, zoomIn, zoomOut, setZoomValue, fitToScreen, resetZoom, toggleGrid, setGridSize, setBackgroundColor, setTheme, undo, redo, insertMathShape, splitSelectedGroup, checkCanSplitSelection, rotateElements, setRotation])

  const handleAPIReady = useCallback((api: ExcalidrawImperativeAPI) => {
    excalidrawAPIRef.current = api
    forceUpdate((n) => n + 1)
  }, [])

  const prevElementsRef = useRef<ExcalidrawElement[]>([])
  const draggingElementRef = useRef<ExcalidrawElement | null>(null)

  const connectionStore = useConnectionStore
  const snapStore = useSnapStore

  const handleChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: AppState, _files: BinaryFiles) => {
      const currentElements = elements as ExcalidrawElement[]
      setElements(currentElements)

      const connStore = connectionStore.getState()
      const snapState = snapStore.getState()
      const prevElements = prevElementsRef.current
      const isDragging = (appState as any).draggingElement != null
      const isResizing = (appState as any).resizingElement != null

      // Handle snap system during dragging
      if (isDragging) {
        const draggingId = (appState as any).draggingElement?.id
        if (draggingId) {
          const draggingEl = currentElements.find((e) => e.id === draggingId)
          if (draggingEl && isSnappableElement(draggingEl)) {
            // Start dragging if not already started
            if (!draggingElementRef.current || draggingElementRef.current.id !== draggingId) {
              draggingElementRef.current = draggingEl
              snapState.startDragging(draggingId)
            }

            // Always check for snap during dragging
            const snapResult = snapState.handleElementDragging(draggingEl, currentElements)
            if (snapResult.snapped) {
              // Apply snap offset to element
              const api = excalidrawAPIRef.current
              if (api && (snapResult.deltaX !== 0 || snapResult.deltaY !== 0)) {
                const updatedEl = {
                  ...draggingEl,
                  x: draggingEl.x + snapResult.deltaX,
                  y: draggingEl.y + snapResult.deltaY,
                }
                const updatedElements = currentElements.map((e) =>
                  e.id === draggingId ? updatedEl : e
                )
                api.updateScene({ elements: updatedElements })
              }
            }
          }
        }
      } else {
        // Dragging ended - clear state
        if (draggingElementRef.current) {
          snapState.stopDragging()
          draggingElementRef.current = null
        }
      }

      if (!isDragging && !isResizing && prevElements.length > 0) {
        const elementMap = new Map<string, ExcalidrawElement>()
        for (const el of currentElements) {
          elementMap.set(el.id, el)
        }

        for (const prevEl of prevElements) {
          const currEl = elementMap.get(prevEl.id)
          if (!currEl) continue

          const moved =
            prevEl.x !== currEl.x ||
            prevEl.y !== currEl.y ||
            prevEl.width !== currEl.width ||
            prevEl.height !== currEl.height ||
            prevEl.angle !== currEl.angle

          if (moved && isConnectableElement(currEl)) {
            const updatedElements = connStore.handleElementMoved(currEl, currentElements)
            const api = excalidrawAPIRef.current
            if (api) {
              const sceneElements = api.getSceneElements()
              const sceneMap = new Map<string, ExcalidrawElement>()
              for (const el of sceneElements) {
                sceneMap.set(el.id, el)
              }
              for (const el of updatedElements) {
                sceneMap.set(el.id, el)
              }
              const needsUpdate = Array.from(sceneMap.values())
              const currentIds = sceneElements.map((e: ExcalidrawElement) => e.id).sort().join(',')
              const newIds = needsUpdate.map((e: ExcalidrawElement) => e.id).sort().join(',')
              if (currentIds !== newIds || sceneElements.length !== needsUpdate.length) {
                api.updateScene({ elements: needsUpdate })
              }
            }
          }

          if (moved && isLineElement(currEl)) {
            const startBinding = connStore.getBindingForLineEnd(currEl.id, 'start')
            const endBinding = connStore.getBindingForLineEnd(currEl.id, 'end')

            if (startBinding && shouldDisconnect(currEl, startBinding, currentElements)) {
              connStore.removeBinding(currEl.id, 'start')
            }
            if (endBinding && shouldDisconnect(currEl, endBinding, currentElements)) {
              connStore.removeBinding(currEl.id, 'end')
            }
          }
        }

        for (const el of currentElements) {
          if (isLineElement(el)) {
            const startBinding = connStore.getBindingForLineEnd(el.id, 'start')
            const endBinding = connStore.getBindingForLineEnd(el.id, 'end')

            if (!startBinding) {
              const startPt = getLineEndpoint(el, 'start')
              const anchor = findNearestAnchor(startPt.x, startPt.y, currentElements, connStore.snapThreshold, [el.id])
              if (anchor) {
                connStore.addBinding({
                  id: '',
                  lineElementId: el.id,
                  side: 'start',
                  targetElementId: anchor.elementId,
                  anchorPosition: anchor.position,
                })
              }
            }

            if (!endBinding) {
              const endPt = getLineEndpoint(el, 'end')
              const anchor = findNearestAnchor(endPt.x, endPt.y, currentElements, connStore.snapThreshold, [el.id])
              if (anchor) {
                connStore.addBinding({
                  id: '',
                  lineElementId: el.id,
                  side: 'end',
                  targetElementId: anchor.elementId,
                  anchorPosition: anchor.position,
                })
              }
            }
          }
        }
      }

      prevElementsRef.current = currentElements

      if (appState.selectedElementIds) {
        const ids = Object.keys(appState.selectedElementIds).filter(
          (id) => appState.selectedElementIds[id]
        )
        const idsKey = ids.sort().join(',')
        if (idsKey !== prevSelectedIdsRef.current) {
          prevSelectedIdsRef.current = idsKey
          setSelectedElementIds(ids)
        }
      }

      const zoomPercent = Math.round(appState.zoom.value * 100)
      if (zoomPercent !== prevZoomRef.current) {
        prevZoomRef.current = zoomPercent
        setZoom(zoomPercent)
      }

      const isGridEnabled = appState.gridSize !== null
      if (isGridEnabled !== prevGridRef.current) {
        prevGridRef.current = isGridEnabled
        setGridEnabled(isGridEnabled)
      }
    },
    [setElements, setSelectedElementIds, setZoom, setGridEnabled, connectionStore, snapStore]
  )

  useEffect(() => {
    const handleFileOpened = (data: { path: string; content: string }) => {
      const api = excalidrawAPIRef.current
      if (!api) return
      try {
        const parsed = JSON.parse(data.content)
        const restored = restore(parsed, null, null)
        api.updateScene({
          elements: restored.elements,
          appState: restored.appState,
        })
        setCurrentFilePath(data.path)
        setIsDirty(false)
      } catch (err) {
        console.error('Failed to load file:', err)
      }
    }

    const handleMenuNew = () => {
      const api = excalidrawAPIRef.current
      if (!api) return
      api.resetScene()
      setCurrentFilePath(null)
      setIsDirty(false)
    }

    if (window.electronAPI) {
      const unsubFileOpened = window.electronAPI.onFileOpened(handleFileOpened)
      const unsubMenuNew = window.electronAPI.onMenuNew(handleMenuNew)
      return () => {
        unsubFileOpened()
        unsubMenuNew()
      }
    }
  }, [setCurrentFilePath, setIsDirty])

  // Get current app state for rotation center overlay
  const [currentAppState, setCurrentAppState] = useState<AppState | null>(null)

  // Wrap handleChange to capture app state
  const handleChangeWithAppState = useCallback(
    (elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
      setCurrentAppState(appState)
      handleChange(elements, appState, files)
    },
    [handleChange]
  )

  // Get scene elements for rotation center bounds checking
  const getSceneElementsForRotation = useCallback(() => {
    const api = excalidrawAPIRef.current
    if (!api) return []
    return api.getSceneElements().map((el) => ({
      id: el.id,
      x: el.x,
      y: el.y,
      width: el.width || 0,
      height: el.height || 0,
    }))
  }, [])

  return (
    <div className={`excalidraw-canvas-container ${className || ''}`} ref={containerRef}>
      <Excalidraw
        excalidrawAPI={handleAPIReady}
        onChange={handleChangeWithAppState}
        langCode="zh-CN"
        UIOptions={UI_OPTIONS}
        gridModeEnabled={true}
        viewModeEnabled={false}
        zenModeEnabled={false}
        theme={theme === 'light' ? THEME.LIGHT : THEME.DARK}
        validateEmbeddable={false}
      />
      <AnchorOverlay
        getExcalidrawAPI={() => excalidrawAPIRef.current}
        containerRef={containerRef}
      />
      <SnapOverlay
        getExcalidrawAPI={() => excalidrawAPIRef.current}
        containerRef={containerRef}
      />
      <RotationCenterOverlay
        visible={showRotationCenter}
        centerX={rotationCenterX}
        centerY={rotationCenterY}
        onCenterChange={onRotationCenterChange}
        appState={currentAppState}
        selectedElementIds={selectedElementIds}
        getSceneElements={getSceneElementsForRotation}
      />
    </div>
  )
})

ExcalidrawCanvas.displayName = 'ExcalidrawCanvas'

export default ExcalidrawCanvas
