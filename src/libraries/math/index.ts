/**
 * Math Shapes Library for Excalidraw
 * 数学图形库 - 提供几何、坐标系统和公式符号图形
 */

import { ToolType } from '../../App'

/**
 * Shape category types
 */
export type MathShapeCategory = 'geometry' | 'coordinate' | 'formula'

/**
 * MathShape interface - defines a mathematical shape for the library
 */
export interface MathShape {
  /** Unique identifier for the shape */
  id: string
  /** Display name in Chinese */
  name: string
  /** Icon character for UI display */
  icon: string
  /** SVG path data or SVG string */
  svg: string
  /** Category: geometry, coordinate, or formula */
  category: MathShapeCategory
  /** Default width when inserted */
  defaultWidth?: number
  /** Default height when inserted */
  defaultHeight?: number
  /**
   * The Excalidraw tool to activate when this math shape is selected.
   * When the user clicks a math tool, we switch to this tool instead of
   * auto-inserting a shape, allowing the user to draw manually.
   */
  toolType?: ToolType
}

/**
 * Geometry tools - basic geometric shapes
 * 几何工具类
 */
const geometryShapes: MathShape[] = [
  {
    id: 'math-triangle',
    name: '三角形',
    icon: '△',
    category: 'geometry',
    svg: `<svg width="100" height="100" viewBox="0 0 100 100">
      <polygon points="50,10 90,90 10,90" fill="none" stroke="#000" stroke-width="2"/>
    </svg>`,
    defaultWidth: 100,
    defaultHeight: 100,
    toolType: 'polygon', // 三角形使用多边形工具绘制
  },
  {
    id: 'math-rectangle',
    name: '直方形',
    icon: '□',
    category: 'geometry',
    svg: `<svg width="100" height="80" viewBox="0 0 100 80">
      <rect x="10" y="10" width="80" height="60" fill="none" stroke="#000" stroke-width="2"/>
    </svg>`,
    defaultWidth: 100,
    defaultHeight: 80,
    toolType: 'rectangle', // 直方形使用矩形工具绘制
  },
  {
    id: 'math-circle',
    name: '圆形',
    icon: '○',
    category: 'geometry',
    svg: `<svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" fill="none" stroke="#000" stroke-width="2"/>
    </svg>`,
    defaultWidth: 100,
    defaultHeight: 100,
    toolType: 'ellipse', // 圆形使用椭圆工具绘制
  },
  {
    id: 'math-hexagon',
    name: '正六边形',
    icon: '⬡',
    category: 'geometry',
    svg: `<svg width="100" height="100" viewBox="0 0 100 100">
      <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" fill="none" stroke="#000" stroke-width="2"/>
    </svg>`,
    defaultWidth: 100,
    defaultHeight: 100,
    toolType: 'polygon', // 六边形使用多边形工具绘制
  },
]

/**
 * Coordinate system tools - for mathematical graphs and plots
 * 坐标系统类
 */
const coordinateShapes: MathShape[] = [
  {
    id: 'math-coordinate-axis',
    name: '坐标轴',
    icon: '+',
    category: 'coordinate',
    svg: `<svg width="150" height="150" viewBox="0 0 150 150">
      <!-- X axis -->
      <line x1="10" y1="140" x2="140" y2="140" stroke="#000" stroke-width="2"/>
      <!-- X arrow -->
      <polygon points="140,140 130,135 130,145" fill="#000"/>
      <!-- Y axis -->
      <line x1="10" y1="140" x2="10" y2="10" stroke="#000" stroke-width="2"/>
      <!-- Y arrow -->
      <polygon points="10,10 5,20 15,20" fill="#000"/>
      <!-- Origin mark -->
      <circle cx="10" cy="140" r="3" fill="#000"/>
      <!-- Labels -->
      <text x="135" y="125" font-size="12">x</text>
      <text x="20" y="15" font-size="12">y</text>
      <text x="15" y="155" font-size="10">O</text>
    </svg>`,
    defaultWidth: 150,
    defaultHeight: 150,
    toolType: 'line', // 坐标轴使用直线工具绘制
  },
  {
    id: 'math-point-marker',
    name: '点标记',
    icon: '⋅',
    category: 'coordinate',
    svg: `<svg width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="5" fill="#000"/>
      <circle cx="20" cy="20" r="8" fill="none" stroke="#000" stroke-width="1"/>
    </svg>`,
    defaultWidth: 40,
    defaultHeight: 40,
    toolType: 'ellipse', // 点标记使用椭圆工具绘制（画小圆点）
  },
  {
    id: 'math-line-segment',
    name: '线段标记',
    icon: '─',
    category: 'coordinate',
    svg: `<svg width="100" height="40" viewBox="0 0 100 40">
      <line x1="10" y1="20" x2="90" y2="20" stroke="#000" stroke-width="2"/>
      <!-- End markers -->
      <circle cx="10" cy="20" r="4" fill="#000"/>
      <circle cx="90" cy="20" r="4" fill="#000"/>
      <!-- Labels A and B -->
      <text x="5" y="35" font-size="12">A</text>
      <text x="85" y="35" font-size="12">B</text>
    </svg>`,
    defaultWidth: 100,
    defaultHeight: 40,
    toolType: 'line', // 线段标记使用直线工具绘制
  },
  {
    id: 'math-curve-marker',
    name: '曲线标记',
    icon: '⤵',
    category: 'coordinate',
    svg: `<svg width="100" height="60" viewBox="0 0 100 60">
      <path d="M10,50 Q30,10 50,30 T90,20" fill="none" stroke="#000" stroke-width="2"/>
    </svg>`,
    defaultWidth: 100,
    defaultHeight: 60,
    toolType: 'pencil', // 曲线标记使用画笔工具绘制
  },
  {
    id: 'math-angle-marker',
    name: '角度标记',
    icon: '∠',
    category: 'coordinate',
    svg: `<svg width="80" height="80" viewBox="0 0 80 80">
      <!-- Angle arc -->
      <path d="M20,60 L20,20 A40,40 0 0,0 60,60" fill="none" stroke="#000" stroke-width="2"/>
      <!-- Angle arc indicator -->
      <path d="M20,50 A10,10 0 0,0 30,60" fill="none" stroke="#000" stroke-width="1"/>
    </svg>`,
    defaultWidth: 80,
    defaultHeight: 80,
    toolType: 'polygon', // 角度标记使用多边形工具绘制
  },
  {
    id: 'math-parallel-marker',
    name: '平行标记',
    icon: '≋',
    category: 'coordinate',
    svg: `<svg width="100" height="60" viewBox="0 0 100 60">
      <!-- Two parallel lines -->
      <line x1="10" y1="20" x2="90" y2="20" stroke="#000" stroke-width="2"/>
      <line x1="10" y1="40" x2="90" y2="40" stroke="#000" stroke-width="2"/>
      <!-- Parallel marks (arrows) -->
      <path d="M30,18 L35,15 L40,18" fill="none" stroke="#000" stroke-width="1"/>
      <path d="M30,22 L35,25 L40,22" fill="none" stroke="#000" stroke-width="1"/>
      <path d="M60,38 L65,35 L70,38" fill="none" stroke="#000" stroke-width="1"/>
      <path d="M60,42 L65,45 L70,42" fill="none" stroke="#000" stroke-width="1"/>
    </svg>`,
    defaultWidth: 100,
    defaultHeight: 60,
    toolType: 'line', // 平行标记使用直线工具绘制
  },
]

/**
 * Formula symbols - mathematical notation symbols
 * 公式符号类
 */
const formulaShapes: MathShape[] = [
  {
    id: 'math-sum-symbol',
    name: '求和',
    icon: '∑',
    category: 'formula',
    svg: `<svg width="60" height="80" viewBox="0 0 60 80">
      <text x="30" y="70" font-size="60" font-family="serif" text-anchor="middle">∑</text>
    </svg>`,
    defaultWidth: 60,
    defaultHeight: 80,
    toolType: 'text', // 公式符号使用文本工具
  },
  {
    id: 'math-integral-symbol',
    name: '积分',
    icon: '∫',
    category: 'formula',
    svg: `<svg width="40" height="80" viewBox="0 0 40 80">
      <text x="20" y="70" font-size="60" font-family="serif" text-anchor="middle">∫</text>
    </svg>`,
    defaultWidth: 40,
    defaultHeight: 80,
    toolType: 'text', // 公式符号使用文本工具
  },
  {
    id: 'math-infinity-symbol',
    name: '无穷',
    icon: '∞',
    category: 'formula',
    svg: `<svg width="60" height="40" viewBox="0 0 60 40">
      <text x="30" y="35" font-size="40" font-family="serif" text-anchor="middle">∞</text>
    </svg>`,
    defaultWidth: 60,
    defaultHeight: 40,
    toolType: 'text', // 公式符号使用文本工具
  },
  {
    id: 'math-square-root',
    name: '根号',
    icon: '√',
    category: 'formula',
    svg: `<svg width="80" height="60" viewBox="0 0 80 60">
      <path d="M5,30 L15,35 L20,10 L80,10" fill="none" stroke="#000" stroke-width="2"/>
      <line x1="80" y1="10" x2="80" y2="50" stroke="#000" stroke-width="1"/>
      <line x1="20" y1="50" x2="80" y2="50" stroke="#000" stroke-width="1"/>
    </svg>`,
    defaultWidth: 80,
    defaultHeight: 60,
    toolType: 'text', // 公式符号使用文本工具
  },
  {
    id: 'math-pi-symbol',
    name: '圆周率',
    icon: 'π',
    category: 'formula',
    svg: `<svg width="50" height="50" viewBox="0 0 50 50">
      <text x="25" y="40" font-size="40" font-family="serif" text-anchor="middle">π</text>
    </svg>`,
    defaultWidth: 50,
    defaultHeight: 50,
    toolType: 'text', // 公式符号使用文本工具
  },
  {
    id: 'math-multiply-symbol',
    name: '乘号',
    icon: '×',
    category: 'formula',
    svg: `<svg width="40" height="40" viewBox="0 0 40 40">
      <line x1="10" y1="10" x2="30" y2="30" stroke="#000" stroke-width="3"/>
      <line x1="30" y1="10" x2="10" y2="30" stroke="#000" stroke-width="3"/>
    </svg>`,
    defaultWidth: 40,
    defaultHeight: 40,
    toolType: 'text', // 公式符号使用文本工具
  },
  {
    id: 'math-divide-symbol',
    name: '除号',
    icon: '÷',
    category: 'formula',
    svg: `<svg width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="10" r="3" fill="#000"/>
      <line x1="5" y1="20" x2="35" y2="20" stroke="#000" stroke-width="2"/>
      <circle cx="20" cy="30" r="3" fill="#000"/>
    </svg>`,
    defaultWidth: 40,
    defaultHeight: 40,
    toolType: 'text', // 公式符号使用文本工具
  },
]

/**
 * All math shapes combined
 * 导出所有数学图形数组
 */
export const mathShapes: MathShape[] = [
  ...geometryShapes,
  ...coordinateShapes,
  ...formulaShapes,
]

/**
 * Get shapes by category
 * 按类别获取图形
 */
export function getShapesByCategory(category: MathShapeCategory): MathShape[] {
  return mathShapes.filter(shape => shape.category === category)
}

/**
 * Get shape by id
 * 按 ID 获取图形
 */
export function getShapeById(id: string): MathShape | undefined {
  return mathShapes.find(shape => shape.id === id)
}

/**
 * Default export - shapes array
 */
export default mathShapes