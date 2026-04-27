import React, { useState, useCallback, useRef, useEffect } from 'react'
import './RotationCenterOverlay.css'

interface RotationCenterOverlayProps {
  visible: boolean
  centerX: number
  centerY: number
  onCenterChange?: (x: number, y: number) => void
  appState?: any
  selectedElementIds?: string[]
  getSceneElements?: () => { id: string; x: number; y: number; width: number; height: number }[]
}

const RotationCenterOverlay: React.FC<RotationCenterOverlayProps> = ({
  visible,
  centerX,
  centerY,
  onCenterChange,
  appState,
  selectedElementIds = [],
  getSceneElements,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const centerStartRef = useRef({ x: 0, y: 0 })

  // Extract values from appState safely
  const zoom = appState?.zoom?.value || 1
  const scrollX = appState?.scrollX || 0
  const scrollY = appState?.scrollY || 0

  // Calculate viewport coordinates
  const viewportX = centerX * zoom + scrollX
  const viewportY = centerY * zoom + scrollY

  // Get the bounding box of selected elements
  const getSelectedBounds = useCallback(() => {
    if (!getSceneElements || selectedElementIds.length === 0) {
      return null
    }
    const elements = getSceneElements()
    const selected = elements.filter((el) => selectedElementIds.includes(el.id))
    if (selected.length === 0) return null

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity
    selected.forEach((el) => {
      minX = Math.min(minX, el.x)
      maxX = Math.max(maxX, el.x + el.width)
      minY = Math.min(minY, el.y)
      maxY = Math.max(maxY, el.y + el.height)
    })
    return { minX, maxX, minY, maxY }
  }, [getSceneElements, selectedElementIds])

  // Clamp center point within selected elements' bounds
  const clampToBounds = useCallback(
    (x: number, y: number) => {
      const bounds = getSelectedBounds()
      if (!bounds) return { x, y }
      return {
        x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
        y: Math.max(bounds.minY, Math.min(bounds.maxY, y)),
      }
    },
    [getSelectedBounds]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!onCenterChange) return
      e.preventDefault()
      e.stopPropagation()

      setIsDragging(true)
      dragStartRef.current = { x: e.clientX, y: e.clientY }
      centerStartRef.current = { x: centerX, y: centerY }
    },
    [onCenterChange, centerX, centerY]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.x
      const deltaY = e.clientY - dragStartRef.current.y

      // Convert delta to scene coordinates
      const sceneDeltaX = deltaX / zoom
      const sceneDeltaY = deltaY / zoom

      // Calculate new center position
      const newX = centerStartRef.current.x + sceneDeltaX
      const newY = centerStartRef.current.y + sceneDeltaY

      // Clamp to bounds
      const clamped = clampToBounds(newX, newY)
      onCenterChange?.(clamped.x, clamped.y)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, zoom, onCenterChange, clampToBounds])

  // Early return after all hooks are called
  if (!visible || !appState) {
    return null
  }

  return (
    <div
      className="rotation-center-overlay"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {/* Crosshair marker */}
      <div
        className={`rotation-center-marker ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          left: viewportX - 10,
          top: viewportY - 10,
          width: 20,
          height: 20,
          pointerEvents: onCenterChange ? 'all' : 'none',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20">
          <line x1="0" y1="10" x2="20" y2="10" stroke="#ff4444" strokeWidth="2" />
          <line x1="10" y1="0" x2="10" y2="20" stroke="#ff4444" strokeWidth="2" />
          <circle cx="10" cy="10" r="4" fill="none" stroke="#ff4444" strokeWidth="2" />
        </svg>
      </div>
    </div>
  )
}

export default RotationCenterOverlay
