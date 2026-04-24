import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import {
  ConnectionPoint,
  useConnectionStore,
  isConnectableElement,
} from '../connection'
import './AnchorOverlay.css'

interface AnchorOverlayProps {
  getExcalidrawAPI: () => any
  containerRef: React.RefObject<HTMLDivElement>
}

const ANCHOR_RADIUS = 5

function sceneCoordsToContainerCoords(
  sceneX: number,
  sceneY: number,
  zoom: number,
  scrollX: number,
  scrollY: number,
  offsetLeft: number,
  offsetTop: number,
  containerLeft: number,
  containerTop: number
): { x: number; y: number } {
  const viewportX = (sceneX + scrollX) * zoom + offsetLeft
  const viewportY = (sceneY + scrollY) * zoom + offsetTop
  return {
    x: viewportX - containerLeft,
    y: viewportY - containerTop,
  }
}

function isLineToolActive(appState: any): boolean {
  const toolType = appState.activeTool?.type || appState.activeTool
  return toolType === 'arrow' || toolType === 'line'
}

const AnchorOverlay: React.FC<AnchorOverlayProps> = ({
  getExcalidrawAPI,
  containerRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null)
  const [lineToolActive, setLineToolActive] = useState(false)
  const [redrawTick, setRedrawTick] = useState(0)
  const showAnchors = useConnectionStore((s) => s.showAnchors)
  const getVisibleAnchors = useConnectionStore((s) => s.getVisibleAnchors)

  const drawAnchors = useCallback(
    (anchors: ConnectionPoint[]) => {
      const overlayCanvas = canvasRef.current
      const container = containerRef.current
      if (!overlayCanvas || !container) return

      const api = getExcalidrawAPI()
      if (!api) return

      const ctx = overlayCanvas.getContext('2d')
      if (!ctx) return

      const containerRect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      overlayCanvas.width = containerRect.width * dpr
      overlayCanvas.height = containerRect.height * dpr
      overlayCanvas.style.width = `${containerRect.width}px`
      overlayCanvas.style.height = `${containerRect.height}px`
      overlayCanvas.style.left = '0px'
      overlayCanvas.style.top = '0px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, containerRect.width, containerRect.height)

      const appState = api.getAppState()
      const zoom = appState.zoom.value
      const scrollX = appState.scrollX
      const scrollY = appState.scrollY
      const offsetLeft = appState.offsetLeft || 0
      const offsetTop = appState.offsetTop || 0

      const containerLeft = containerRect.left
      const containerTop = containerRect.top

      for (const anchor of anchors) {
        const { x: screenX, y: screenY } = sceneCoordsToContainerCoords(
          anchor.x,
          anchor.y,
          zoom,
          scrollX,
          scrollY,
          offsetLeft,
          offsetTop,
          containerLeft,
          containerTop
        )

        ctx.beginPath()
        ctx.arc(screenX, screenY, ANCHOR_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = '#4a90d9'
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(screenX, screenY, ANCHOR_RADIUS + 3, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(74, 144, 217, 0.4)'
        ctx.lineWidth = 1
        ctx.stroke()
      }
    },
    [getExcalidrawAPI, containerRef]
  )

  useEffect(() => {
    if (!showAnchors) {
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      return
    }

    const api = getExcalidrawAPI()
    if (!api) return

    const allElements = api.getSceneElements() as ExcalidrawElement[]
    const anchors = getVisibleAnchors(allElements, hoveredElementId, lineToolActive)
    drawAnchors(anchors)
  }, [showAnchors, hoveredElementId, lineToolActive, redrawTick, getExcalidrawAPI, getVisibleAnchors, drawAnchors])

  useEffect(() => {
    const api = getExcalidrawAPI()
    if (!api) return

    const handlePointerMove = (_e: PointerEvent) => {
      const appState = api.getAppState()
      const allElements = api.getSceneElements() as ExcalidrawElement[]

      const active = isLineToolActive(appState)
      if (active !== lineToolActive) {
        setLineToolActive(active)
      }

      const selectedIds = Object.keys(appState.selectedElementIds || {}).filter(
        (id) => appState.selectedElementIds[id]
      )

      if (selectedIds.length === 1) {
        const el = allElements.find((e: ExcalidrawElement) => e.id === selectedIds[0])
        if (el && isConnectableElement(el)) {
          setHoveredElementId(el.id)
          return
        }
      }

      const hoveredId = appState.hoveredElementId
      if (hoveredId) {
        const el = allElements.find((e: ExcalidrawElement) => e.id === hoveredId)
        if (el && isConnectableElement(el)) {
          setHoveredElementId(el.id)
          return
        }
      }

      setHoveredElementId(null)
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('pointermove', handlePointerMove)
      return () => container.removeEventListener('pointermove', handlePointerMove)
    }
  }, [getExcalidrawAPI, containerRef, lineToolActive])

  useEffect(() => {
    const api = getExcalidrawAPI()
    if (!api) return

    const onChange = () => {
      const appState = api.getAppState()
      const active = isLineToolActive(appState)
      setLineToolActive(active)
      setRedrawTick((t) => t + 1)
    }

    const unsub = api.onChange(onChange)
    return () => {
      if (typeof unsub === 'function') unsub()
    }
  }, [getExcalidrawAPI])

  useEffect(() => {
    const handleResize = () => {
      setRedrawTick((t) => t + 1)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="anchor-overlay-canvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  )
}

export default AnchorOverlay
