import React, { useState } from 'react'
import './RightPanel.css'

interface ElementData {
  id: string
  type: string
  x?: number
  y?: number
  width?: number
  height?: number
  strokeColor?: string
  backgroundColor?: string
  strokeWidth?: number
}

interface RightPanelProps {
  elements?: ElementData[]
  selectedElementIds?: string[]
}

const typeNames: Record<string, string> = {
  rectangle: '矩形',
  ellipse: '椭圆',
  line: '直线',
  arrow: '箭头',
  text: '文本',
  draw: '画笔',
  polygon: '多边形',
  image: '图片',
}

const RightPanel: React.FC<RightPanelProps> = ({ elements = [], selectedElementIds = [] }) => {
  const [fillColor, setFillColor] = useState('#4a90d9')
  const [fillOpacity, setFillOpacity] = useState(100)
  const [strokeColor, setStrokeColor] = useState('#333333')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [rotation, setRotation] = useState(0)

  const selectedElement = elements.find(el => selectedElementIds?.includes(el.id))

  return (
    <div className="right-panel">
      <div className="panel-header" style={{ marginBottom: '16px' }}>
        属性设置
        <span className="collapse-btn">▼</span>
      </div>

      {/* 选中元素信息 */}
      {selectedElement ? (
        <div className="property-group">
          <div className="property-label">选中元素</div>
          <div className="selected-info">
            <div className="info-row">
              <span className="info-label">类型</span>
              <span className="info-value">{typeNames[selectedElement.type] || selectedElement.type}</span>
            </div>
            <div className="info-row">
              <span className="info-label">位置</span>
              <span className="info-value">
                X: {Math.round(selectedElement.x || 0)}, Y: {Math.round(selectedElement.y || 0)}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">尺寸</span>
              <span className="info-value">
                {Math.round(selectedElement.width || 0)} × {Math.round(selectedElement.height || 0)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="property-group">
          <div className="property-label">提示</div>
          <p className="hint-text">在画布上选择一个图形查看属性</p>
        </div>
      )}

      {/* 填充 */}
      <div className="property-group">
        <div className="property-label">填充颜色</div>
        <div className="property-row">
          <input 
            type="color" 
            className="color-picker" 
            value={fillColor}
            onChange={(e) => setFillColor(e.target.value)}
          />
          <input 
            type="range" 
            className="slider" 
            min="0" 
            max="100" 
            value={fillOpacity}
            onChange={(e) => setFillOpacity(Number(e.target.value))}
          />
          <span className="slider-value">{fillOpacity}%</span>
        </div>
      </div>

      {/* 描边 */}
      <div className="property-group">
        <div className="property-label">描边颜色</div>
        <div className="property-row">
          <input 
            type="color" 
            className="color-picker" 
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
          />
          <select 
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="stroke-width-select"
          >
            <option value="1">1px</option>
            <option value="2">2px</option>
            <option value="3">3px</option>
            <option value="4">4px</option>
            <option value="6">6px</option>
            <option value="8">8px</option>
          </select>
        </div>
        <div className="property-row">
          <select className="stroke-style-select">
            <option value="solid">实线</option>
            <option value="dashed">虚线</option>
            <option value="dotted">点线</option>
          </select>
        </div>
      </div>

      {/* 变换 */}
      <div className="property-group">
        <div className="property-label">旋转角度</div>
        <div className="property-row">
          <input 
            type="range" 
            className="slider" 
            min="0" 
            max="360" 
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
          />
          <span className="slider-value">{rotation}°</span>
        </div>
      </div>

      <div className="property-group">
        <div className="property-label">翻转</div>
        <div className="property-row flip-buttons">
          <button className="flip-btn">↔ 水平</button>
          <button className="flip-btn">↕ 垂直</button>
        </div>
      </div>

      {/* 图层 */}
      <div className="property-group">
        <div className="property-label">图层操作</div>
        <div className="property-row">
          <button className="layer-btn">↑ 上移一层</button>
          <button className="layer-btn">↓ 下移一层</button>
        </div>
        <div className="property-row">
          <button className="layer-btn danger">🗑 删除</button>
          <button className="layer-btn">👁 隐藏</button>
        </div>
      </div>

      {/* 快捷键提示 */}
      <div className="property-group shortcuts">
        <div className="property-label">快捷键</div>
        <div className="shortcut-item"><kbd>V</kbd> 选择工具</div>
        <div className="shortcut-item"><kbd>P</kbd> 画笔</div>
        <div className="shortcut-item"><kbd>R</kbd> 矩形</div>
        <div className="shortcut-item"><kbd>O</kbd> 椭圆</div>
        <div className="shortcut-item"><kbd>L</kbd> 直线</div>
        <div className="shortcut-item"><kbd>A</kbd> 箭头</div>
        <div className="shortcut-item"><kbd>T</kbd> 文本</div>
        <div className="shortcut-item"><kbd>Ctrl+Z</kbd> 撤销</div>
        <div className="shortcut-item"><kbd>Ctrl+Y</kbd> 重做</div>
      </div>
    </div>
  )
}

export default RightPanel
