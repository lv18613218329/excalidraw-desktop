import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Excalidraw, restore, THEME } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI, AppState, BinaryFiles, NormalizedZoomValue } from '@excalidraw/excalidraw/types'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import '@excalidraw/excalidraw/index.css'
import { useAppStore } from '../stores/appStore'
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
}

const ExcalidrawCanvas = forwardRef<ExcalidrawCanvasRef, ExcalidrawCanvasProps>((props, ref) => {
  const { className } = props
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
  }), [updateElementProperties, selectedElementIds, clearCanvas, zoomIn, zoomOut, setZoomValue, fitToScreen, resetZoom, toggleGrid, setGridSize])

  const handleAPIReady = useCallback((api: ExcalidrawImperativeAPI) => {
    excalidrawAPIRef.current = api
    forceUpdate((n) => n + 1)
  }, [])

  const handleChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: AppState, _files: BinaryFiles) => {
      setElements(elements as ExcalidrawElement[])

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
    [setElements, setSelectedElementIds, setZoom, setGridEnabled]
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

  return (
    <div className={`excalidraw-canvas-container ${className || ''}`} ref={containerRef}>
      <Excalidraw
        excalidrawAPI={handleAPIReady}
        onChange={handleChange}
        langCode="zh-CN"
        UIOptions={UI_OPTIONS}
        gridModeEnabled={true}
        viewModeEnabled={false}
        zenModeEnabled={false}
        theme={THEME.LIGHT}
        validateEmbeddable={false}
      />
    </div>
  )
})

ExcalidrawCanvas.displayName = 'ExcalidrawCanvas'

export default ExcalidrawCanvas
