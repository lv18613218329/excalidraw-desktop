import { useState, useEffect, useRef } from 'react'
import ExcalidrawCanvas, { ExcalidrawCanvasRef } from './components/ExcalidrawCanvas'
import { useAppStore } from './stores/appStore'
import './App.css'

export type SubjectType = 'math' | 'physics' | 'chemistry'
export type ToolType = 'select' | 'pencil' | 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'polygon' | 'text' | 'notes' | 'image'

function App() {
  const [currentTool, setCurrentTool] = useState<ToolType>('select')
  const [currentSubject, setCurrentSubject] = useState<SubjectType>('math')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  // Ref for ExcalidrawCanvas to access exposed methods
  // Usage: canvasRef.current?.updateElementProperties({ strokeColor: '#ff0000' })
  const canvasRef = useRef<ExcalidrawCanvasRef>(null)

  const zoom = useAppStore((s) => s.zoom)
  const gridEnabled = useAppStore((s) => s.gridEnabled)
  const rulerEnabled = useAppStore((s) => s.rulerEnabled)
  const currentFilePath = useAppStore((s) => s.currentFilePath)
  const isDirty = useAppStore((s) => s.isDirty)
  const selectedElementIds = useAppStore((s) => s.selectedElementIds)

  useEffect(() => {
    if (!window.electronAPI) return

    window.electronAPI.windowIsMaximized().then(setIsMaximized)

    const unsubscribe = window.electronAPI.onWindowMaximizeChanged(setIsMaximized)
    return unsubscribe
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

  const subjectTools: Record<SubjectType, { name: string; icon: string; tools: { name: string; icon: string }[] }> = {
    math: {
      name: '数学',
      icon: '🎯',
      tools: [
        { name: '三角形', icon: '△' }, { name: '正方形', icon: '□' }, { name: '圆形', icon: '⬭' },
        { name: '六边形', icon: '⬡' }, { name: '直尺', icon: '📐' }, { name: '量角器', icon: '📏' },
        { name: '坐标轴', icon: '＋' }, { name: '点', icon: '⋅' }, { name: '线段', icon: '─' },
        { name: '曲线', icon: '⤵' }, { name: '角', icon: '∠' }, { name: '平行', icon: '≋' },
        { name: '求和', icon: '∑' }, { name: '积分', icon: '∫' }, { name: '无穷', icon: '∞' },
        { name: '根号', icon: '√' }, { name: '圆周率', icon: 'π' },
      ]
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
        { name: '双键', icon: '＝' }, { name: '三键', icon: '≡' }, { name: '官能团', icon: '⤴' },
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
        <button className="toolbar-btn">📄 新建</button>
        <button className="toolbar-btn">📂 打开</button>
        <button className="toolbar-btn">💾 保存</button>
        <div className="toolbar-dropdown">
          <button className="toolbar-btn" onClick={() => setShowExportMenu(!showExportMenu)}>
            📤 导出 ▼
          </button>
          {showExportMenu && (
            <div className="dropdown-menu">
              <button>PNG 图片</button>
              <button>SVG 矢量图</button>
              <button>PDF 文档</button>
              <button>剪贴板</button>
            </div>
          )}
        </div>
        <span className="toolbar-separator">|</span>
        <button className="toolbar-btn">↩ 撤销</button>
        <button className="toolbar-btn">↪ 重做</button>
        <span className="toolbar-separator">|</span>
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
        <button className={`toolbar-btn ${gridEnabled ? 'active' : ''}`}>
          ☑ 网格
        </button>
        <button className={`toolbar-btn ${rulerEnabled ? 'active' : ''}`}>
          ☑ 标尺
        </button>
      </div>

      <div className="main-content">
        <div className="left-panel">
          <div className="panel-section">
            <div className="panel-header">基础工具</div>
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
                  <button key={idx} className="tool-btn subject-tool">
                    <span className="icon">{tool.icon}</span>
                    <span>{tool.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <ExcalidrawCanvas ref={canvasRef} />

        <div className="right-panel">
          <div className="panel-header" style={{ marginBottom: '16px' }}>属性设置</div>

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
