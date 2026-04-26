import { useState, useEffect, useRef } from 'react'
import ExcalidrawCanvas, { ExcalidrawCanvasRef } from './components/ExcalidrawCanvas'
import { useAppStore } from './stores/appStore'
import { useFileOperations } from './hooks/useFileOperations'
import { mathShapes, MathShapeCategory, getShapeById } from './libraries/math'
import './App.css'

export type SubjectType = 'math' | 'physics' | 'chemistry'
export type ToolType = 'select' | 'pencil' | 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'polygon' | 'text' | 'notes' | 'image'

function App() {
  const [currentTool, setCurrentTool] = useState<ToolType>('select')
  const [currentSubject, setCurrentSubject] = useState<SubjectType>('math')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [rightPanelExpanded, setRightPanelExpanded] = useState(false)
  const [leftPanelExpanded, setLeftPanelExpanded] = useState(true)
  const [rotation, setRotation] = useState(0)
  const [isDraggingSlider, setIsDraggingSlider] = useState(false)
  const [rotationCenter, setRotationCenter] = useState({ x: 0, y: 0 })
  const [useCustomCenter, setUseCustomCenter] = useState(false)
  const [showCenterMarker, setShowCenterMarker] = useState(false)

  // Ref for ExcalidrawCanvas to access exposed methods
  // Usage: canvasRef.current?.updateElementProperties({ strokeColor: '#ff0000' })
  const canvasRef = useRef<ExcalidrawCanvasRef>(null)

  const zoom = useAppStore((s) => s.zoom)
  const gridEnabled = useAppStore((s) => s.gridEnabled)
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const currentFilePath = useAppStore((s) => s.currentFilePath)
  const isDirty = useAppStore((s) => s.isDirty)
  const selectedElementIds = useAppStore((s) => s.selectedElementIds)

  // 获取 Excalidraw API 用于导出功能
  // 文件操作 Hook - 使用 canvasRef 获取 API
  const fileOperations = useFileOperations(canvasRef)

  // 监听学科切换菜单事件
  useEffect(() => {
    if (!window.electronAPI) return
    const cleanup = window.electronAPI.onMenuSubject((subject: string) => {
      if (subject === 'math' || subject === 'physics' || subject === 'chemistry') {
        setCurrentSubject(subject)
      }
    })
    return cleanup
  }, [])

  useEffect(() => {
    if (!window.electronAPI) return

    window.electronAPI.windowIsMaximized().then(setIsMaximized)

    const unsubscribe = window.electronAPI.onWindowMaximizeChanged(setIsMaximized)
    return unsubscribe
  }, [])

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 工具切换快捷键
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'v': setCurrentTool('select'); break
          case 'p': setCurrentTool('pencil'); break
          case 'r': setCurrentTool('rectangle'); break
          case 'o': setCurrentTool('ellipse'); break
          case 'l': setCurrentTool('line'); break
          case 'a': setCurrentTool('arrow'); break
          case 't': setCurrentTool('text'); break
        }
      }
      // 学科切换快捷键
      if (e.ctrlKey) {
        switch (e.key) {
          case '1': setCurrentSubject('math'); break
          case '2': setCurrentSubject('physics'); break
          case '3': setCurrentSubject('chemistry'); break
        }
        // Ctrl+Shift+G 分割图形
        if (e.shiftKey && e.key.toLowerCase() === 'g') {
          e.preventDefault()
          const result = canvasRef.current?.splitSelectedGroup()
          if (result) {
            if (result.count > 0) {
              alert(result.message || `已分割为 ${result.count} 个子图形`)
            } else if (result.message) {
              alert(result.message)
            }
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleMinimize = async () => {
    await window.electronAPI?.windowMinimize()
  }

  const handleMaximize = async () => {
    await window.electronAPI?.windowMaximize()
  }

  const handleClose = async () => {
    await window.electronAPI?.windowClose()
  }

  const basicTools: { id: ToolType; name: string; icon: string }[] = [
    { id: 'select', name: '选择', icon: '↖' },
    { id: 'pencil', name: '画笔', icon: '✏️' },
    { id: 'rectangle', name: '矩形', icon: '□' },
    { id: 'ellipse', name: '椭圆', icon: '○' },
    { id: 'line', name: '直线', icon: '╱' },
    { id: 'arrow', name: '箭头', icon: '→' },
    { id: 'polygon', name: '多边形', icon: '⬡' },
    { id: 'text', name: '文本', icon: 'T' },
    { id: 'notes', name: '笔记', icon: '📝' },
    { id: 'image', name: '图片', icon: '🖼️' },
  ]

  const subjectTools: Record<SubjectType, { name: string; icon: string; tools: { name: string; icon: string; shapeId?: string; category?: MathShapeCategory }[] }> = {
    math: {
      name: '数学',
      icon: '🎯',
      tools: mathShapes.map(shape => ({
        name: shape.name,
        icon: shape.icon,
        shapeId: shape.id,
        category: shape.category,
      })),
    },
    physics: {
      name: '物理',
      icon: '⚛️',
      tools: [
        { name: '滑轮组', icon: '⚙' }, { name: '弹簧', icon: '〰' }, { name: '小车', icon: '🚗' },
        { name: '斜面', icon: '📐' }, { name: '受力箭头', icon: '→F←' }, { name: '电阻', icon: '⏛' },
        { name: '电容', icon: '⏚' }, { name: '电源', icon: '⚡' }, { name: '开关', icon: '⊘' },
        { name: '电压表', icon: '🗲' }, { name: '电流表', icon: '🗲' }, { name: '凸透镜', icon: '◝' },
        { name: '凹透镜', icon: '◜' }, { name: '光路', icon: '⟷' }, { name: '反射', icon: '↗' },
        { name: '折射', icon: '↘' }, { name: '光源', icon: '☀' },
      ]
    },
    chemistry: {
      name: '化学',
      icon: '⚗️',
      tools: [
        { name: '六元环', icon: '⬡' }, { name: '苯环', icon: '🍱' }, { name: '单键', icon: '─' },
        { name: '双键', icon: '=' }, { name: '三键', icon: '≡' }, { name: '官能团', icon: '⤴' },
        { name: '试管', icon: '🧪' }, { name: '烧瓶', icon: '⚗️' }, { name: '酒精灯', icon: '🔥' },
        { name: '冷凝管', icon: '💧' }, { name: '烧杯', icon: '🫙' }, { name: '量筒', icon: '📊' },
        { name: '液面填充', icon: '💧' }, { name: '原子模型', icon: '⚛' }, { name: '反应箭头', icon: '🔄' },
        { name: '催化箭头', icon: '⏩' },
      ]
    }
  }

  const subjectColors: Record<SubjectType, string> = {
    math: '#4a90d9',
    physics: '#00acc1',
    chemistry: '#66bb6a',
  }

  const currentSubjectData = subjectTools[currentSubject]
  const primaryColor = subjectColors[currentSubject]

  const handleMathShapeClick = (shapeId?: string) => {
    if (!shapeId || currentSubject !== 'math') return
    const shape = getShapeById(shapeId)
    if (shape) {
      canvasRef.current?.insertMathShape(shape)
    }
  }

  const fileName = currentFilePath
    ? currentFilePath.split(/[/\\]/).pop()
    : '未命名'

  return (
    <div className={`app-container subject-${currentSubject}`} style={{ '--primary': primaryColor } as any}>
      <div className="menu-bar">
        <div className="menu-items">
          <div className="menu-item">文件</div>
          <div className="menu-item">编辑</div>
          <div className="menu-item">视图</div>
          <div className="menu-item">学科</div>
          <div className="menu-item">帮助</div>
        </div>
        <div className="file-info">
          {fileName}
          {isDirty && <span className="dirty">*</span>}
        </div>
        <div className="window-controls">
          <button className="win-btn min" title="最小化" onClick={handleMinimize}>─</button>
          <button className="win-btn max" title={isMaximized ? '还原' : '最大化'} onClick={handleMaximize}>
            {isMaximized ? '❐' : '□'}
          </button>
          <button className="win-btn close" title="关闭" onClick={handleClose}>×</button>
        </div>
      </div>

      <div className="toolbar">
        <button className="toolbar-btn" onClick={fileOperations.handleNew}>📄 新建</button>
        <button className="toolbar-btn" onClick={fileOperations.handleOpen}>📂 打开</button>
        <button className="toolbar-btn" onClick={fileOperations.handleSave}>💾 保存</button>
        <div className="toolbar-dropdown">
          <button className="toolbar-btn" onClick={() => setShowExportMenu(!showExportMenu)}>
            📤 导出 ▼
          </button>
          {showExportMenu && (
            <div className="dropdown-menu">
              <button onClick={fileOperations.handleExportPNG}>PNG 图片</button>
              <button onClick={fileOperations.handleExportSVG}>SVG 矢量图</button>
              <button onClick={fileOperations.handleExportPDF}>PDF 文档</button>
              <button onClick={fileOperations.handleCopyToClipboard}>剪贴板</button>
            </div>
          )}
        </div>
        <span className="toolbar-separator">|</span>
        <button className="toolbar-btn" onClick={() => canvasRef.current?.undo()}>↩ 撤销</button>
        <button className="toolbar-btn" onClick={() => canvasRef.current?.redo()}>↪ 重做</button>
        <span className="toolbar-separator">|</span>
        <button
          className="toolbar-btn"
          disabled={selectedElementIds.length === 0}
          onClick={() => {
            const result = canvasRef.current?.splitSelectedGroup()
            if (result) {
              if (result.count > 0) {
                alert(result.message || `已分割为 ${result.count} 个子图形`)
              } else if (result.message) {
                alert(result.message)
              }
            }
          }}
          title="选中图形+线条，用线条将图形分割为子图形"
        >
          ✂️ 分割
        </button>
        <div className="toolbar-dropdown">
          <button className="toolbar-btn">🔍 {zoom}% ▼</button>
          <div className="dropdown-menu">
            <button onClick={() => canvasRef.current?.setZoom(0.5)}>50%</button>
            <button onClick={() => canvasRef.current?.setZoom(0.75)}>75%</button>
            <button onClick={() => canvasRef.current?.setZoom(1.0)}>100%</button>
            <button onClick={() => canvasRef.current?.setZoom(1.5)}>150%</button>
            <button onClick={() => canvasRef.current?.setZoom(2.0)}>200%</button>
            <button onClick={() => canvasRef.current?.fitToScreen()}>适应画布</button>
            <button onClick={() => canvasRef.current?.setZoom(1.0)}>实际大小</button>
          </div>
        </div>
        <button className={`toolbar-btn ${gridEnabled ? 'active' : ''}`} onClick={() => canvasRef.current?.toggleGrid()}>
          {gridEnabled ? '☑' : '☐'} 网格
        </button>
        <button className="toolbar-btn" onClick={() => {
          const newTheme = theme === 'light' ? 'dark' : 'light'
          setTheme(newTheme)
          canvasRef.current?.setTheme(newTheme)
        }}>
          {theme === 'light' ? '☀️' : '🌙'} {theme === 'light' ? '亮色' : '暗色'}
        </button>
      </div>

      <div className="main-content">
        {/* 左侧面板折叠按钮 - 1024-1199px 时显示 */}
        <button
          className="left-panel-toggle"
          onClick={() => setLeftPanelExpanded(true)}
          title="展开工具面板"
        >
          ▶
        </button>

        <div className={`left-panel ${leftPanelExpanded ? '' : 'collapsed'}`}>
          <div className="panel-section">
            <div 
              className="panel-header"
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setLeftPanelExpanded(false)}
              title="点击收起面板"
            >
              基础工具
              <span style={{ marginLeft: 'auto', fontSize: '12px' }}>◀</span>
            </div>
            <div className="tool-grid">
              {basicTools.map((tool) => (
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
            <div className="panel-header">
              <span>学科工具</span>
              <select
                className="subject-select"
                value={currentSubject}
                onChange={(e) => setCurrentSubject(e.target.value as SubjectType)}
                style={{ borderColor: primaryColor }}
              >
                <option value="math">🎯 数学</option>
                <option value="physics">⚛️ 物理</option>
                <option value="chemistry">⚗️ 化学</option>
              </select>
            </div>
            <div className="subject-tools">
              <div className="panel-header" style={{ color: primaryColor, fontSize: '12px' }}>
                {currentSubjectData.icon} {currentSubjectData.name}
              </div>
              <div className="tool-grid">
                {currentSubjectData.tools.map((tool, idx) => (
                  <button
                    key={idx}
                    className="tool-btn subject-tool"
                    onClick={() => handleMathShapeClick(tool.shapeId)}
                  >
                    <span className="icon">{tool.icon}</span>
                    <span>{tool.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <ExcalidrawCanvas ref={canvasRef} />

        {/* 右侧面板折叠按钮 - 1024-1439px 时显示 */}
        <button
          className="right-panel-toggle"
          onClick={() => setRightPanelExpanded(true)}
          title="展开属性面板"
        >
          ◀
        </button>

        <div className={`right-panel ${rightPanelExpanded ? 'expanded' : ''}`}>
          <div 
            className="panel-header" 
            style={{ marginBottom: '16px', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setRightPanelExpanded(false)}
            title="点击收起面板"
          >
            属性设置
            <span style={{ marginLeft: 'auto', fontSize: '12px' }}>✕</span>
          </div>

          <div className="property-group">
            <div className="property-label">提示</div>
            <p className="hint-text">
              {selectedElementIds.length > 0
                ? `已选中 ${selectedElementIds.length} 个元素`
                : '在画布上选择一个图形查看属性'}
            </p>
          </div>

          <div className="property-group">
            <div className="property-label">填充颜色</div>
            <div className="property-row">
              <input type="color" className="color-picker" defaultValue="#4a90d9" />
              <input type="range" className="slider" min="0" max="100" defaultValue="100" />
              <span className="slider-value">100%</span>
            </div>
          </div>

          <div className="property-group">
            <div className="property-label">描边颜色</div>
            <div className="property-row">
              <input type="color" className="color-picker" defaultValue="#333333" />
              <select className="stroke-width-select" defaultValue="2">
                <option value="1">1px</option>
                <option value="2">2px</option>
                <option value="3">3px</option>
                <option value="4">4px</option>
              </select>
            </div>
          </div>

          <div className="property-group">
            <div className="property-label">线型</div>
            <select className="stroke-style-select" defaultValue="solid">
              <option value="solid">实线</option>
              <option value="dashed">虚线</option>
              <option value="dotted">点线</option>
            </select>
          </div>

          <div className="property-group">
            <div className="property-label">旋转角度</div>
            <div className="property-row">
              <input 
                type="range" 
                className="slider" 
                min="0" 
                max="360" 
                value={rotation}
                onChange={(e) => {
                  setRotation(Number(e.target.value))
                  if (useCustomCenter) {
                    canvasRef.current?.rotateElements(
                      Number(e.target.value) - rotation,
                      rotationCenter.x,
                      rotationCenter.y
                    )
                  } else {
                    canvasRef.current?.setRotation(Number(e.target.value))
                  }
                }}
                onMouseDown={() => setIsDraggingSlider(true)}
                onMouseUp={() => setIsDraggingSlider(false)}
                onMouseLeave={() => setIsDraggingSlider(false)}
                disabled={selectedElementIds.length === 0}
              />
              <span className="slider-value">{rotation}°</span>
            </div>
            <div className="property-row" style={{ marginTop: '8px' }}>
              <button 
                className="quick-rotate-btn"
                onClick={() => {
                  if (useCustomCenter) {
                    canvasRef.current?.rotateElements(-90, rotationCenter.x, rotationCenter.y)
                    setRotation((r) => (r - 90 + 360) % 360)
                  } else {
                    canvasRef.current?.rotateElements(-90)
                    setRotation((r) => (r - 90 + 360) % 360)
                  }
                }}
                disabled={selectedElementIds.length === 0}
                title="逆时针旋转 90°"
              >
                ↺ -90°
              </button>
              <button 
                className="quick-rotate-btn"
                onClick={() => {
                  if (useCustomCenter) {
                    canvasRef.current?.rotateElements(90, rotationCenter.x, rotationCenter.y)
                    setRotation((r) => (r + 90) % 360)
                  } else {
                    canvasRef.current?.rotateElements(90)
                    setRotation((r) => (r + 90) % 360)
                  }
                }}
                disabled={selectedElementIds.length === 0}
                title="顺时针旋转 90°"
              >
                ↻ +90°
              </button>
              <button 
                className="quick-rotate-btn"
                onClick={() => {
                  setRotation(0)
                  canvasRef.current?.setRotation(0)
                }}
                disabled={selectedElementIds.length === 0}
                title="重置旋转"
              >
                ⊟ 重置
              </button>
            </div>
          </div>

          <div className="property-group">
            <div className="property-label">旋转中心点</div>
            <div className="property-row">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <input 
                  type="checkbox" 
                  checked={useCustomCenter}
                  onChange={(e) => {
                    setUseCustomCenter(e.target.checked)
                    setShowCenterMarker(e.target.checked)
                  }}
                  disabled={selectedElementIds.length === 0}
                />
                使用自定义中心点
              </label>
            </div>
            {useCustomCenter && (
              <>
                <div className="property-row" style={{ marginTop: '8px' }}>
                  <span className="slider-value" style={{ textAlign: 'left' }}>X:</span>
                  <input 
                    type="number"
                    className="number-input"
                    value={Math.round(rotationCenter.x)}
                    onChange={(e) => setRotationCenter({ ...rotationCenter, x: Number(e.target.value) })}
                    disabled={selectedElementIds.length === 0}
                  />
                  <span className="slider-value" style={{ textAlign: 'left', marginLeft: '16px' }}>Y:</span>
                  <input 
                    type="number"
                    className="number-input"
                    value={Math.round(rotationCenter.y)}
                    onChange={(e) => setRotationCenter({ ...rotationCenter, y: Number(e.target.value) })}
                    disabled={selectedElementIds.length === 0}
                  />
                </div>
                <div className="property-row" style={{ marginTop: '8px' }}>
                  <button 
                    className="quick-rotate-btn"
                    onClick={() => {
                      // 设置中心点到选中图形的中心
                      const elements = canvasRef.current?.getSceneElements()
                      if (elements && elements.length > 0) {
                        const selected = elements.filter(el => selectedElementIds.includes(el.id))
                        if (selected.length > 0) {
                          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
                          selected.forEach(el => {
                            if ('x' in el && 'y' in el && 'width' in el && 'height' in el) {
                              minX = Math.min(minX, (el as any).x)
                              maxX = Math.max(maxX, (el as any).x + (el as any).width)
                              minY = Math.min(minY, (el as any).y)
                              maxY = Math.max(maxY, (el as any).y + (el as any).height)
                            }
                          })
                          const centerX = (minX + maxX) / 2
                          const centerY = (minY + maxY) / 2
                          setRotationCenter({ x: centerX, y: centerY })
                        }
                      }
                    }}
                    disabled={selectedElementIds.length === 0}
                    title="设置为选中图形中心"
                  >
                    📍 设为图形中心
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="property-group">
            <div className="property-label">快捷键</div>
            <div className="shortcuts">
              <div className="shortcut-item"><kbd>V</kbd> 选择工具</div>
              <div className="shortcut-item"><kbd>P</kbd> 画笔</div>
              <div className="shortcut-item"><kbd>R</kbd> 矩形</div>
              <div className="shortcut-item"><kbd>O</kbd> 椭圆</div>
              <div className="shortcut-item"><kbd>L</kbd> 直线</div>
              <div className="shortcut-item"><kbd>A</kbd> 箭头</div>
              <div className="shortcut-item"><kbd>T</kbd> 文本</div>
              <div className="shortcut-item"><kbd>Ctrl+Z</kbd> 撤销</div>
              <div className="shortcut-item"><kbd>Ctrl+Y</kbd> 重做</div>
              <div className="shortcut-item"><kbd>Ctrl+1</kbd> 数学</div>
              <div className="shortcut-item"><kbd>Ctrl+2</kbd> 物理</div>
              <div className="shortcut-item"><kbd>Ctrl+3</kbd> 化学</div>
            </div>
          </div>
        </div>
      </div>

      <div className="status-bar">
        <span>当前工具: {basicTools.find(t => t.id === currentTool)?.name || '选择'}</span>
        <span className="separator">|</span>
        <span>缩放: {zoom}%</span>
        <span className="separator">|</span>
        <span>网格: {gridEnabled ? '☑' : '☐'}</span>
        <span className="separator">|</span>
        <span>学科: {currentSubjectData.icon} {currentSubjectData.name}</span>
      </div>
    </div>
  )
}

export default App
