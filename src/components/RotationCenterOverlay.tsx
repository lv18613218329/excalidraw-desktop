import React from 'react'
import './RotationCenterOverlay.css'

interface RotationCenterOverlayProps {
  visible: boolean
  centerX: number
  centerY: number
  onCenterChange?: (x: number, y: number) => void
  appState?: any
}

const RotationCenterOverlay: React.FC<RotationCenterOverlayProps> = ({
  visible,
  centerX,
  centerY,
  onCenterChange,
  appState,
}) => {
  if (!visible || !appState) {
    return null
  }

  // Convert scene coordinates to viewport coordinates
  const zoom = appState.zoom || 1
  const scrollX = appState.scrollX || 0
  const scrollY = appState.scrollY || 0

  const viewportX = centerX * zoom + scrollX
  const viewportY = centerY * zoom + scrollY

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
        className="rotation-center-marker"
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
