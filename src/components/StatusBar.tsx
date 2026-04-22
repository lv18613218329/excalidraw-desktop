import { ToolType } from '../App'
import './StatusBar.css'

interface StatusBarProps {
  currentTool: ToolType
  zoom: number
  canvasSize: { width: number; height: number }
  gridEnabled: boolean
}

const toolNames: Record<ToolType, string> = {
  select: '选择',
  pencil: '画笔',
  rectangle: '矩形',
  ellipse: '椭圆',
  line: '直线',
  arrow: '箭头',
  polygon: '多边形',
  text: '文本',
}

const StatusBar: React.FC<StatusBarProps> = ({
  currentTool,
  zoom,
  canvasSize,
  gridEnabled,
}) => {
  return (
    <div className="status-bar">
      <div className="status-item">
        <span className="status-label">当前工具:</span>
        <span className="status-value">{toolNames[currentTool]}</span>
      </div>
      <div className="status-item">
        <span className="status-label">缩放:</span>
        <span className="status-value">{zoom}%</span>
      </div>
      <div className="status-item">
        <span className="status-label">画布:</span>
        <span className="status-value">{canvasSize.width} × {canvasSize.height}</span>
      </div>
      <div className="status-item">
        <span className="status-label">网格:</span>
        <span className="status-value">{gridEnabled ? '☑ 开启' : '☐ 关闭'}</span>
      </div>
    </div>
  )
}

export default StatusBar
