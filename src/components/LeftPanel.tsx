import React from 'react'
import { ToolType, SubjectType } from '../App'
import { getShapesByCategory } from '../libraries/math'
import './LeftPanel.css'

interface LeftPanelProps {
  currentTool: ToolType
  setCurrentTool: (tool: ToolType) => void
  currentSubject: SubjectType
  setCurrentSubject: (subject: SubjectType) => void
  onMathShapeClick?: (shapeId: string) => void
}

const baseTools: { id: ToolType; name: string; icon: string }[] = [
  { id: 'select', name: '选择', icon: '↖' },
  { id: 'pencil', name: '画笔', icon: '✏️' },
  { id: 'rectangle', name: '矩形', icon: '□' },
  { id: 'ellipse', name: '椭圆', icon: '○' },
  { id: 'line', name: '直线', icon: '╱' },
  { id: 'arrow', name: '箭头', icon: '→' },
  { id: 'polygon', name: '多边形', icon: '⬡' },
  { id: 'text', name: '文本', icon: 'T' },
]

const LeftPanel: React.FC<LeftPanelProps> = ({
  currentTool,
  setCurrentTool,
  currentSubject,
  setCurrentSubject,
  onMathShapeClick,
}) => {
  return (
    <div className="left-panel">
      <div className="panel-section">
        <div className="panel-header">基础工具</div>
        <div className="tool-grid">
          {baseTools.map((tool) => (
            <button
              key={tool.id}
              className={`tool-btn ${currentTool === tool.id ? 'active' : ''}`}
              onClick={() => setCurrentTool(tool.id)}
            >
              <span className="icon">{tool.icon}</span>
              <span>{tool.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-header">学科工具 ▼</div>
        <div className="subject-selector">
          {[
            { id: 'math' as SubjectType, name: '数学', icon: '🎯' },
            { id: 'physics' as SubjectType, name: '物理', icon: '⚛️' },
            { id: 'chemistry' as SubjectType, name: '化学', icon: '⚗️' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`subject-tab ${currentSubject === tab.id ? 'active' : ''}`}
              onClick={() => setCurrentSubject(tab.id)}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>

        <div className={`subject-panel subject-${currentSubject}`}>
          <div className="panel-header">
            {currentSubject === 'math' ? '🎯 数学工具' : 
             currentSubject === 'physics' ? '⚛️ 物理工具' : '⚗️ 化学工具'}
          </div>
          <div className="tool-grid">
            {currentSubject === 'physics' && [
              { name: '滑轮组', icon: '⚙' },
              { name: '弹簧', icon: '〰' },
              { name: '小车', icon: '🚗' },
              { name: '斜面', icon: '📐' },
              { name: '受力箭头', icon: '→F←' },
              { name: '力臂', icon: '📏' },
              { name: '电阻', icon: '⏛' },
              { name: '电容', icon: '⏚' },
              { name: '电源', icon: '⚡' },
              { name: '开关', icon: '⊘' },
              { name: '电压表', icon: '🗲' },
              { name: '电流表', icon: '🗲' },
              { name: '凸透镜', icon: '◝' },
              { name: '凹透镜', icon: '◜' },
              { name: '光路', icon: '⟷' },
              { name: '反射', icon: '↗' },
              { name: '折射', icon: '↘' },
              { name: '光源', icon: '☀' },
            ].map((tool, index) => (
              <button key={index} className="tool-btn">
                <span className="icon">{tool.icon}</span>
                <span>{tool.name}</span>
              </button>
            ))}
            {currentSubject === 'chemistry' && [
              { name: '六元环', icon: '⬡' },
              { name: '苯环', icon: '🍱' },
              { name: '单键', icon: '─' },
              { name: '双键', icon: '＝' },
              { name: '三键', icon: '≡' },
              { name: '官能团', icon: '⤴' },
              { name: '试管', icon: '🧪' },
              { name: '烧瓶', icon: '⚗️' },
              { name: '酒精灯', icon: '🔥' },
              { name: '冷凝管', icon: '💧' },
              { name: '烧杯', icon: '🫙' },
              { name: '量筒', icon: '📊' },
              { name: '液面填充', icon: '💧' },
              { name: '原子模型', icon: '⚛' },
              { name: '反应箭头', icon: '🔄' },
              { name: '催化箭头', icon: '⏩' },
            ].map((tool, index) => (
              <button key={index} className="tool-btn">
                <span className="icon">{tool.icon}</span>
                <span>{tool.name}</span>
              </button>
            ))}
            {currentSubject === 'math' && (
              <>
                {/* Geometry category */}
                <div className="panel-subheader">几何图形</div>
                {getShapesByCategory('geometry').map((shape) => (
                  <button
                    key={shape.id}
                    className="tool-btn"
                    onClick={() => onMathShapeClick?.(shape.id)}
                  >
                    <span className="icon">{shape.icon}</span>
                    <span>{shape.name}</span>
                  </button>
                ))}
                {/* Coordinate category */}
                <div className="panel-subheader">坐标标记</div>
                {getShapesByCategory('coordinate').map((shape) => (
                  <button
                    key={shape.id}
                    className="tool-btn"
                    onClick={() => onMathShapeClick?.(shape.id)}
                  >
                    <span className="icon">{shape.icon}</span>
                    <span>{shape.name}</span>
                  </button>
                ))}
                {/* Formula category */}
                <div className="panel-subheader">公式符号</div>
                {getShapesByCategory('formula').map((shape) => (
                  <button
                    key={shape.id}
                    className="tool-btn"
                    onClick={() => onMathShapeClick?.(shape.id)}
                  >
                    <span className="icon">{shape.icon}</span>
                    <span>{shape.name}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeftPanel
