import React from 'react'
import './MenuBar.css'

interface MenuBarProps {
  filePath?: string | null
  isDirty?: boolean
}

const MenuBar: React.FC<MenuBarProps> = ({ filePath, isDirty }) => {
  const fileName = filePath 
    ? filePath.split(/[/\\]/).pop() 
    : '未命名'

  const handleMinimize = () => {
    window.electronAPI?.windowMinimize()
  }

  const handleMaximize = () => {
    window.electronAPI?.windowMaximize()
  }

  const handleClose = () => {
    window.electronAPI?.windowClose()
  }

  return (
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
        <button className="win-btn max" title="最大化" onClick={handleMaximize}>□</button>
        <button className="win-btn close" title="关闭" onClick={handleClose}>×</button>
      </div>
    </div>
  )
}

export default MenuBar
