import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import {
  ConnectionPoint,
  useConnectionStore,
  isConnectableElement,
  isLineElement,
} from '../connection'
import './AnchorOverlay.css'

interface AnchorOverlayProps {
  getExcalidrawAPI: () => any
  containerRef: React.RefObject<HTMLDivElement>
}

const ANCHOR_RADIUS = 5

const AnchorOverlay: React.FC<AnchorOverlayProps> = ({
  getExcalidrawAPI,
  containerRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null)
  const [draggingLineId, setDraggingLineId] = useState<string | null>(null)
  const showAnchors = useConnectionStore((s) => s.showAnchors)

  const getVisibleAnchors = useConnectionStore((s) => s.getVisibleAnchors)

  const drawAnchors = useCallback(
    (anchors: ConnectionPoint[]) => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      const api = getExcalidrawAPI()
      if (!api) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, rect.width, rect.height)

      const appState = api.getAppState()
      const zoom = appState.zoom.value
      const scrollX = appState.scrollX
      const scrollY = appState.scrollY
      const offsetX = appState.offsetLeft || 0
      const offsetY = appState.offsetTop || 0

      for (const anchor of anchors) {
        const screenX = (anchor.x + scrollX) * zoom + offsetX
        const screenY = (anchor.y + scrollY) * zoom + offsetY

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
    const anchors = getVisibleAnchors(allElements, hoveredElementId, draggingLineId)
    drawAnchors(anchors)
  }, [showAnchors, hoveredElementId, draggingLineId, getExcalidrawAPI, getVisibleAnchors, drawAnchors])

  useEffect(() => {
    const api = getExcalidrawAPI()
    if (!api) return

    const handlePointerMove = (_e: PointerEvent) => {
      const appState = api.getAppState()
      const allElements = api.getSceneElements() as ExcalidrawElement[]

      if (appState.draggingElement && isLineElement(appState.draggingElement as any)) {
        setDraggingLineId((appState.draggingElement as any).id)
      } else {
        setDraggingLineId(null)
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
  }, [getExcalidrawAPI, containerRef])

  useEffect(() => {
    const handleResize = () => {
      const api = getExcalidrawAPI()
      if (!api) return
      const allElements = api.getSceneElements() as ExcalidrawElement[]
      const anchors = getVisibleAnchors(allElements, hoveredElementId, draggingLineId)
      drawAnchors(anchors)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [hoveredElementId, draggingLineId, getExcalidrawAPI, getVisibleAnchors, drawAnchors])

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
