import React, { useCallback, useEffect, useRef } from 'react'
import { useSnapStore } from './snapStore'
import type { SnapLine } from './snapTypes'
import './SnapOverlay.css'

interface SnapOverlayProps {
  getExcalidrawAPI: () => any
  containerRef: React.RefObject<HTMLDivElement>
}

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

const SnapOverlay: React.FC<SnapOverlayProps> = ({
  getExcalidrawAPI,
  containerRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const snapLines = useSnapStore((s) => s.snapLines)
  const enabled = useSnapStore((s) => s.enabled)

  const drawSnapLines = useCallback(
    (lines: SnapLine[]) => {
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

      if (lines.length === 0) return

      const appState = api.getAppState()
      const zoom = appState.zoom.value
      const scrollX = appState.scrollX
      const scrollY = appState.scrollY
      const offsetLeft = appState.offsetLeft || 0
      const offsetTop = appState.offsetTop || 0

      const containerLeft = containerRect.left
      const containerTop = containerRect.top

      // 绘制吸附线
      ctx.strokeStyle = '#ff6b6b'
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 5])

      for (const line of lines) {
        if (line.type === 'horizontal') {
          const { y: screenY } = sceneCoordsToContainerCoords(
            0,
            line.position,
            zoom,
            scrollX,
            scrollY,
            offsetLeft,
            offsetTop,
            containerLeft,
            containerTop
          )
          const { x: startX } = sceneCoordsToContainerCoords(
            line.start,
            0,
            zoom,
            scrollX,
            scrollY,
            offsetLeft,
            offsetTop,
            containerLeft,
            containerTop
          )
          const { x: endX } = sceneCoordsToContainerCoords(
            line.end,
            0,
            zoom,
            scrollX,
            scrollY,
            offsetLeft,
            offsetTop,
            containerLeft,
            containerTop
          )

          ctx.beginPath()
          ctx.moveTo(startX, screenY)
          ctx.lineTo(endX, screenY)
          ctx.stroke()
        } else {
          const { x: screenX } = sceneCoordsToContainerCoords(
            line.position,
            0,
            zoom,
            scrollX,
            scrollY,
            offsetLeft,
            offsetTop,
            containerLeft,
            containerTop
          )
          const { y: startY } = sceneCoordsToContainerCoords(
            0,
            line.start,
            zoom,
            scrollX,
            scrollY,
            offsetLeft,
            offsetTop,
            containerLeft,
            containerTop
          )
          const { y: endY } = sceneCoordsToContainerCoords(
            0,
            line.end,
            zoom,
            scrollX,
            scrollY,
            offsetLeft,
            offsetTop,
            containerLeft,
            containerTop
          )

          ctx.beginPath()
          ctx.moveTo(screenX, startY)
          ctx.lineTo(screenX, endY)
          ctx.stroke()
        }
      }

      ctx.setLineDash([])

      // 绘制吸附点高亮
      ctx.fillStyle = '#ff6b6b'
      for (const line of lines) {
        if (line.type === 'horizontal') {
          const { y: screenY } = sceneCoordsToContainerCoords(
            0,
            line.position,
            zoom,
            scrollX,
            scrollY,
            offsetLeft,
            offsetTop,
            containerLeft,
            containerTop
          )
          const { x: startX } = sceneCoordsToContainerCoords(
            line.start,
            0,
            zoom,
            scrollX,
            scrollY,
            offsetLeft,
            offsetTop,
            containerLeft,
            containerTop
          )
          const { x: endX } = sceneCoordsToContainerCoords(
            line.end,
            0,
            zoom,
            scrollX,
            scrollY,
            offsetLeft,
            offsetTop,
            containerLeft,
            containerTop
          )

          // 绘制起点和终点的小圆点
          ctx.beginPath()
          ctx.arc(startX, screenY, 4, 0, Math.PI * 2)
          ctx.fill()

          ctx.beginPath()
          ctx.arc(endX, screenY, 4, 0, Math.PI * 2)
          ctx.fill()
        } else {
          const { x: screenX } = sceneCoordsToContainerCoords(
            line.position,
            0,
            zoom,
            scrollX,
            scrollY,
            offsetLeft,
            offsetTop,
            containerLeft,
            containerTop
          )
          const { y: startY } = sceneCoordsToContainerCoords(
            0,
            line.start,
            zoom,
            scrollX,
            scrollY,
            offsetLeft,
            offsetTop,
            containerLeft,
            containerTop
          )
          const { y: endY } = sceneCoordsToContainerCoords(
            0,
            line.end,
            zoom,
            scrollX,
            scrollY,
            offsetLeft,
            offsetTop,
            containerLeft,
            containerTop
          )

          // 绘制起点和终点的小圆点
          ctx.beginPath()
          ctx.arc(screenX, startY, 4, 0, Math.PI * 2)
          ctx.fill()

          ctx.beginPath()
          ctx.arc(screenX, endY, 4, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    },
    [getExcalidrawAPI, containerRef]
  )

  useEffect(() => {
    if (!enabled) return
    drawSnapLines(snapLines)
  }, [snapLines, enabled, drawSnapLines])

  useEffect(() => {
    const handleResize = () => {
      if (enabled) {
        drawSnapLines(snapLines)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [snapLines, enabled, drawSnapLines])

  if (!enabled) return null

  return (
    <canvas
      ref={canvasRef}
      className="snap-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    />
  )
}

export default SnapOverlay
