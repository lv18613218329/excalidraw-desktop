import { useEffect, useRef, useState, useCallback } from 'react'
import './LaserPointerOverlay.css'

interface LaserPointerOverlayProps {
  isActive: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
}

interface TrailPoint {
  x: number
  y: number
  timestamp: number
}

export default function LaserPointerOverlay({ isActive, containerRef }: LaserPointerOverlayProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [trail, setTrail] = useState<TrailPoint[]>([])
  const animationRef = useRef<number>()
  const lastPosRef = useRef({ x: 0, y: 0 })

  const updateTrail = useCallback(() => {
    const now = Date.now()
    setTrail(prev => {
      // 添加新点
      const newPoint: TrailPoint = {
        x: lastPosRef.current.x,
        y: lastPosRef.current.y,
        timestamp: now
      }

      // 保留最近 150ms 的轨迹点，并限制最大数量
      const filtered = [...prev, newPoint].filter(
        p => now - p.timestamp < 150
      ).slice(-15)

      return filtered
    })

    animationRef.current = requestAnimationFrame(updateTrail)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !isActive) {
      setIsVisible(false)
      setTrail([])
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      lastPosRef.current = { x, y }
      setMousePos({ x, y })
      setIsVisible(true)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    const handleMouseEnter = () => {
      setIsVisible(true)
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)
    container.addEventListener('mouseenter', handleMouseEnter)

    // 启动轨迹更新动画
    animationRef.current = requestAnimationFrame(updateTrail)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
      container.removeEventListener('mouseenter', handleMouseEnter)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, containerRef, updateTrail])

  if (!isActive) return null

  return (
    <div className="laser-pointer-overlay">
      {/* 轨迹 */}
      {trail.map((point, index) => {
        const age = Date.now() - point.timestamp
        const opacity = Math.max(0, 1 - age / 150) * (index / trail.length)
        const size = 4 + (index / trail.length) * 8

        return (
          <div
            key={`${point.x}-${point.y}-${point.timestamp}`}
            className="laser-trail-point"
            style={{
              left: point.x - size / 2,
              top: point.y - size / 2,
              width: size,
              height: size,
              opacity: opacity * 0.6,
            }}
          />
        )
      })}

      {/* 主光点 */}
      {isVisible && (
        <div
          className="laser-pointer"
          style={{
            left: mousePos.x - 10,
            top: mousePos.y - 10,
          }}
        >
          <div className="laser-core" />
          <div className="laser-glow" />
        </div>
      )}
    </div>
  )
}
