import { useState, useCallback, useRef, useEffect } from 'react'
import { Excalidraw, restore, THEME } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI, AppState, BinaryFiles } from '@excalidraw/excalidraw/types'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import '@excalidraw/excalidraw/index.css'
import { useAppStore } from '../stores/appStore'
import './ExcalidrawCanvas.css'

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

const ExcalidrawCanvas: React.FC = () => {
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
    <div className="excalidraw-canvas-container" ref={containerRef}>
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
}

export default ExcalidrawCanvas
