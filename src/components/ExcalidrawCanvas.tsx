import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Excalidraw, restore, THEME } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI, AppState, BinaryFiles } from '@excalidraw/excalidraw/types'
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
  }), [updateElementProperties, selectedElementIds])

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
