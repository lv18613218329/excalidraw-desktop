import { useState, useCallback, useRef, useEffect } from 'react'
import { Excalidraw, restore, THEME } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI, AppState, BinaryFiles } from '@excalidraw/excalidraw/types'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import '@excalidraw/excalidraw/index.css'
import { useAppStore } from '../stores/appStore'
import './ExcalidrawCanvas.css'

const ExcalidrawCanvas: React.FC = () => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const setElements = useAppStore((s) => s.setElements)
  const setZoom = useAppStore((s) => s.setZoom)
  const setGridEnabled = useAppStore((s) => s.setGridEnabled)
  const setSelectedElementIds = useAppStore((s) => s.setSelectedElementIds)
  const setCurrentFilePath = useAppStore((s) => s.setCurrentFilePath)
  const setIsDirty = useAppStore((s) => s.setIsDirty)

  const handleAPIReady = useCallback((api: ExcalidrawImperativeAPI) => {
    setExcalidrawAPI(api)
  }, [])

  const handleChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: AppState, _files: BinaryFiles) => {
      setElements(elements as ExcalidrawElement[])

      if (appState.selectedElementIds) {
        const ids = Object.keys(appState.selectedElementIds).filter(
          (id) => appState.selectedElementIds[id]
        )
        setSelectedElementIds(ids)
      }

      const zoomPercent = Math.round(appState.zoom.value * 100)
      setZoom(zoomPercent)

      const isGridEnabled = appState.gridSize !== null
      setGridEnabled(isGridEnabled)

      setIsDirty(true)
    },
    [setElements, setSelectedElementIds, setZoom, setGridEnabled, setIsDirty]
  )

  useEffect(() => {
    const handleFileOpened = (data: { path: string; content: string }) => {
      if (!excalidrawAPI) return
      try {
        const parsed = JSON.parse(data.content)
        const restored = restore(parsed, null, null)
        excalidrawAPI.updateScene({
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
      if (!excalidrawAPI) return
      excalidrawAPI.resetScene()
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
  }, [excalidrawAPI, setCurrentFilePath, setIsDirty])

  return (
    <div className="excalidraw-canvas-container" ref={containerRef}>
      <Excalidraw
        excalidrawAPI={handleAPIReady}
        onChange={handleChange}
        langCode="zh-CN"
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: true,
            clearCanvas: true,
            export: false,
            loadScene: false,
            saveToActiveFile: false,
            toggleTheme: true,
            saveAsImage: false,
          },
          tools: {
            image: true,
          },
        }}
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
