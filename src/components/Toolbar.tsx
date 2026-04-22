import React from 'react'
import './Toolbar.css'

interface ToolbarProps {
  zoom: number
  setZoom: (zoom: number) => void
  gridEnabled: boolean
  setGridEnabled: (enabled: boolean) => void
}

const Toolbar: React.FC<ToolbarProps> = ({ zoom, setZoom, gridEnabled, setGridEnabled }) => {
  const handleZoomChange = (delta: number) => {
    const newZoom = Math.max(25, Math.min(400, zoom + delta))
    setZoom(newZoom)
  }

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button className="toolbar-btn">
          <span className="icon">📄</span>
          <span>新建</span>
        </button>
        <button className="toolbar-btn">
          <span className="icon">📂</span>
          <span>打开</span>
        </button>
        <button className="toolbar-btn">
          <span className="icon">💾</span>
          <span>保存</span>
        </button>
        <button className="toolbar-btn">
          <span className="icon">📤</span>
          <span>导出</span>
        </button>
      </div>
      
      <div className="toolbar-separator"></div>
      
      <div className="toolbar-group">
        <button className="toolbar-btn">
          <span className="icon">↩</span>
          <span>撤销</span>
        </button>
        <button className="toolbar-btn">
          <span className="icon">↪</span>
          <span>重做</span>
        </button>
      </div>
      
      <div className="toolbar-separator"></div>
      
      <div className="toolbar-group zoom-group">
        <button className="toolbar-btn" onClick={() => handleZoomChange(-25)}>
          <span className="icon">➖</span>
        </button>
        <button className="toolbar-btn zoom-display">
          <span>{zoom}%</span>
        </button>
        <button className="toolbar-btn" onClick={() => handleZoomChange(25)}>
          <span className="icon">➕</span>
        </button>
      </div>
      
      <div className="toolbar-group">
        <button 
          className={`toolbar-btn ${gridEnabled ? 'active' : ''}`}
          onClick={() => setGridEnabled(!gridEnabled)}
        >
          <span className="icon">{gridEnabled ? '☑' : '☐'}</span>
          <span>网格</span>
        </button>
      </div>
    </div>
  )
}

export default Toolbar
