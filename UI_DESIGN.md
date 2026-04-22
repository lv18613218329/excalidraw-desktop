# Excalidraw 桌面端教学绘图笔记系统 - 界面设计文档

> 版本：v1.0  
> 日期：2026-04-22  
> 目标平台：Windows / 统信 UOS / 麒麟

---

## 1. 整体界面布局

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 顶部菜单栏 (40px)                                                       │
│ [文件] [编辑] [视图] [学科] [帮助]                    [─] [□] [×]      │
├─────────────────────────────────────────────────────────────────────────┤
│ 顶部工具栏 (48px)                                                       │
│ [新建] [打开] [保存] [导出▼] │ [撤销] [重做] │ [缩放: 100%] │ [网格]    │
├────────┬───────────────────────────────────────────────────┬────────────┤
│        │                                                   │            │
│ 左侧   │                                                   │   右侧     │
│ 工具   │              主画布区域                           │   属性     │
│ 面板   │              (Excalidraw Canvas)                  │   面板     │
│ (240px)│                                                   │  (280px)   │
│        │                                                   │            │
│ ────── │                                                   │ ─────────  │
│        │                                                   │            │
│ 学科   │                                                   │ 图形属性   │
│ 工具   │                                                   │ 设置       │
│ 面板   │                                                   │            │
│ (可折叠)│                                                   │            │
│        │                                                   │            │
├────────┴───────────────────────────────────────────────────┴────────────┤
│ 底部状态栏 (28px)                                                       │
│ 当前工具: 选择 │ 缩放: 100% │ 画布: 1920×1080 │ 网格: 开启             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 基础功能区详细设计

### 2.1 顶部菜单栏 (40px 高度)

| 菜单项 | 功能 | 快捷键 |
|--------|------|--------|
| 文件 | 新建、打开、保存、另存为、导出、退出 | Alt+F |
| 编辑 | 撤销、重做、剪切、复制、粘贴、删除、全选 | Alt+E |
| 视图 | 缩放、网格、标尺、画布背景、主题 | Alt+V |
| 学科 | 切换学科视图（数学/物理/化学） | Alt+S |
| 帮助 | 使用教程、快捷键列表、关于 | Alt+H |

**窗口控制按钮**（右侧）：最小化 ─ | 最大化 □ | 关闭 ×

### 2.2 顶部工具栏 (48px 高度)

```
┌────────────────────────────────────────────────────────────────┐
│ [📄 新建] [📂 打开] [💾 保存] [📤 导出▼] │ [↩ 撤销] [↪ 重做] │
├────────────────────────────────────────────────────────────────┤
│  │ [🔍 100%▼] │ [☑ 网格] [☑ 标尺] │ [🎨 主题▼]              │
└────────────────────────────────────────────────────────────────┘
```

**按钮尺寸**：36×36px，图标 20×20px  
**间距**：8px  
**导出下拉菜单**：PNG、SVG、PDF、Clipboard

### 2.3 左侧工具面板 (240px 宽度)

#### 2.3.1 基础绘图工具区

```
┌─────────────────────────────┐
│ 基础工具                    │
├─────────────────────────────┤
│ [↖ 选择]    [✏️ 画笔]       │
│ [□ 矩形]    [○ 椭圆]       │
│ [╱ 直线]    [→ 箭头]       │
│ [⬡ 多边形] [T 文本]       │
│ [📝 笔记]   [🖼️ 图片]      │
└─────────────────────────────┘
```

**工具按钮网格**：2列，每格 52×52px，间距 4px  
**选中状态**：背景 #4a90d9，文字白色，圆角 6px

#### 2.3.2 学科专用工具面板（可折叠）

```
┌─────────────────────────────┐
│ ▼ 学科工具    [数学 ▼]     │  ← 学科切换下拉
├─────────────────────────────┤
│ (根据选择学科显示对应工具)  │
└─────────────────────────────┘
```

**学科切换下拉选项**：  
- 🎯 数学（默认）
- ⚛️ 物理
- ⚗️ 化学

---

## 3. 学科专用工具集详细设计

### 3.1 数学学科面板

```
┌────────────────────────────────────┐
│ 几何工具                           │
├────────────────────────────────────┤
│ [△ 三角形] [□ 正方形] [⬭ 圆形]   │
│ [⬡ 正六边形] [📐 直尺] [📏 量角器]│
├────────────────────────────────────┤
│ 坐标系统                           │
├────────────────────────────────────┤
│ [＋ 坐标轴] [⋅ 点] [─ 线段]       │
│ [⤵ 曲线] [∠ 角] [≋ 平行标记]    │
├────────────────────────────────────┤
│ 公式输入                           │
├────────────────────────────────────┤
│ [∑ 求和] [∫ 积分] [∞ 无穷]       │
│ [√ 根号] [π 圆周率] [× 乘除]     │
└────────────────────────────────────┘
```

### 3.2 物理学科面板

```
┌────────────────────────────────────┐
│ 力学工具                    (物理) │
├────────────────────────────────────┤
│ [⚙ 滑轮组] [〰 弹簧] [🚗 小车]   │
│ [📐 斜面] [→F← 受力箭头]          │
├────────────────────────────────────┤
│ 电路图工具                         │
├────────────────────────────────────┤
│ [⏛ 电阻] [⏚ 电容] [⚡ 电源]      │
│ [⊘ 开关] [🗲 电压表] [🗲 电流表] │
├────────────────────────────────────┤
│ 光学工具                           │
├────────────────────────────────────┤
│ [◝ 凸透镜] [◜ 凹透镜] [⟷ 光路]  │
│ [↗ 反射] [↘ 折射] [☀ 光源]      │
└────────────────────────────────────┘
```

**受力箭头专用功能**：
- 拖拽端点调整箭头方向和长度
- 双击添加标签（F1、F2、G、N 等）
- 预设常用力：重力 G、摩擦力 f、支持力 N、拉力 T

### 3.3 化学学科面板

```
┌────────────────────────────────────┐
│ 分子结构                    (化学) │
├────────────────────────────────────┤
│ [⬡ 六元环] [🍱 苯环] [─ 单键]    │
│ [＝ 双键] [≡ 三键] [⤴ 官能团]    │
├────────────────────────────────────┤
│ 实验器材                           │
├────────────────────────────────────┤
│ [🧪 试管] [⚗️ 烧瓶] [🔥 酒精灯] │
│ [💧 冷凝管] [🫙 烧杯] [📊 量筒]  │
├────────────────────────────────────┤
│ 特殊功能                           │
├────────────────────────────────────┤
│ [💧 液面填充] [⚛ 原子模型]       │
│ [🔄 反应箭头] [⏩ 催化箭头]       │
└────────────────────────────────────┘
```

**液面填充功能**：
- 选中容器后点击激活
- 拖拽水平线调整液面高度
- 可选填充颜色和透明度

---

## 4. 右侧属性面板 (280px 宽度)

```
┌────────────────────────────────────┐
│ 属性设置                    [▼]   │
├────────────────────────────────────┤
│ 填充                               │
│ [■ 颜色] ████████ [100%]          │
├────────────────────────────────────┤
│ 描边                               │
│ [■ 颜色] ████████ [2px ▼]         │
│ [实线 ▼]                           │
├────────────────────────────────────┤
│ 文字 (仅文本对象)                  │
│ [Arial ▼] [14px ▼] [B] [I] [U]   │
├────────────────────────────────────┤
│ 变换                               │
│ 旋转: [━━━●━━━] 90°              │
│ 翻转: [↔ 水平] [↕ 垂直]          │
├────────────────────────────────────┤
│ 图层                               │
│ [↑ 上移一层] [↓ 下移一层]         │
│ [🗑 删除] [👁 隐藏]               │
└────────────────────────────────────┘
```

**面板折叠功能**：点击顶部标题可折叠/展开

---

## 5. 底部状态栏 (28px 高度)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 当前工具: [选择] │ 缩放: [100% ▼] │ 画布: [1920 × 1080] │ 网格: [☑]   │
└─────────────────────────────────────────────────────────────────────────┘
```

**信息项**：
- 当前选中的工具名称
- 缩放比例（点击可输入自定义值）
- 画布尺寸
- 网格开关状态

---

## 6. 配色方案

### 6.1 主色调

| 用途 | 颜色代码 | 说明 |
|------|----------|------|
| 主色 | `#4a90d9` | 蓝色，用于选中状态、主要按钮 |
| 悬停 | `#5a9fe9` | 浅蓝，鼠标悬停状态 |
| 按下 | `#3a80c9` | 深蓝，按下状态 |
| 背景 | `#f5f5f5` | 浅灰，面板背景 |
| 边框 | `#e0e0e0` | 灰色，分割线 |
| 文字 | `#333333` | 深灰，主要文字 |
| 次要文字 | `#666666` | 中灰，辅助说明 |

### 6.2 学科主题色

| 学科 | 主色 | 强调色 |
|------|------|--------|
| 数学 | `#4a90d9` (蓝) | `#7c4dff` (紫) |
| 物理 | `#00acc1` (青) | `#ff7043` (橙) |
| 化学 | `#66bb6a` (绿) | `#ffa726` (黄) |

**主题色应用**：学科切换时，工具面板标题栏、图标选中背景使用对应学科主题色

---

## 7. 交互流程说明

### 7.1 学科切换流程

```
1. 点击左侧工具面板「学科工具」区域的 [数学 ▼] 下拉菜单
2. 选择目标学科：数学 / 物理 / 化学
3. 面板自动刷新，显示对应学科工具
4. 学科主题色同步变更
5. 快捷键：Ctrl+1 (数学) / Ctrl+2 (物理) / Ctrl+3 (化学)
```

### 7.2 工具选择流程

```
1. 在左侧工具面板点击目标工具图标
2. 图标变为选中状态（背景高亮）
3. 光标变为对应工具形态
4. 在画布上点击/拖拽进行绘制
5. 选中已有图形时，自动切换到选择工具
```

### 7.3 属性调整流程

```
1. 在画布上选中一个或多个图形
2. 右侧属性面板自动显示选中对象的属性
3. 修改属性值（颜色、线宽等）
4. 画布实时预览修改效果
5. 取消选中后，属性面板恢复默认状态
```

---

## 8. 响应式布局断点

| 屏幕宽度 | 布局调整 |
|----------|----------|
| ≥ 1440px | 默认布局：左侧 240px + 右侧 280px |
| 1200-1439px | 右侧面板折叠（点击展开） |
| 1024-1199px | 左侧面板可折叠，右侧面板默认折叠 |
| < 1024px | 工具面板移至顶部，属性面板浮窗显示 |

---

## 9. 快捷键汇总

### 9.1 常用快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+N | 新建 |
| Ctrl+O | 打开 |
| Ctrl+S | 保存 |
| Ctrl+Shift+S | 另存为 |
| Ctrl+Z | 撤销 |
| Ctrl+Y | 重做 |
| Delete | 删除选中 |
| Ctrl+A | 全选 |
| Space+拖拽 | 移动画布 |
| 滚轮 | 缩放画布 |

### 9.2 学科快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+1 | 切换到数学学科 |
| Ctrl+2 | 切换到物理学科 |
| Ctrl+3 | 切换到化学学科 |

---

## 10. HTML/CSS 原型预览

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Excalidraw 教学版 - 界面原型</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: "Microsoft YaHei", sans-serif; background: #e8e8e8; }
        
        /* 主容器 */
        .app-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        
        /* 顶部菜单栏 */
        .menu-bar {
            height: 40px;
            background: #f5f5f5;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            align-items: center;
            padding: 0 12px;
        }
        .menu-item { padding: 8px 16px; cursor: pointer; color: #333; font-size: 14px; }
        .menu-item:hover { background: #e0e0e0; }
        .window-controls { margin-left: auto; display: flex; gap: 8px; }
        .win-btn { width: 32px; height: 24px; border: none; cursor: pointer; border-radius: 4px; }
        .win-btn.min { background: #ddd; }
        .win-btn.max { background: #ddd; }
        .win-btn.close { background: #e74c3c; color: white; }
        
        /* 顶部工具栏 */
        .toolbar {
            height: 48px;
            background: #fff;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            align-items: center;
            padding: 0 12px;
            gap: 8px;
        }
        .toolbar-btn {
            height: 36px;
            padding: 0 12px;
            border: 1px solid #e0e0e0;
            background: #fff;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
        }
        .toolbar-btn:hover { background: #f5f5f5; }
        .toolbar-separator { width: 1px; height: 24px; background: #e0e0e0; margin: 0 8px; }
        
        /* 主内容区 */
        .main-content {
            display: flex;
            flex: 1;
            overflow: hidden;
        }
        
        /* 左侧工具面板 */
        .left-panel {
            width: 240px;
            background: #f5f5f5;
            border-right: 1px solid #e0e0e0;
            display: flex;
            flex-direction: column;
        }
        .panel-section { border-bottom: 1px solid #e0e0e0; }
        .panel-header {
            padding: 12px 16px;
            font-size: 13px;
            font-weight: 600;
            color: #333;
            background: #fff;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .tool-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 4px;
            padding: 8px;
        }
        .tool-btn {
            height: 52px;
            border: 1px solid #e0e0e0;
            background: #fff;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            font-size: 11px;
            color: #666;
            transition: all 0.15s;
        }
        .tool-btn:hover { background: #f0f7ff; border-color: #4a90d9; }
        .tool-btn.active { background: #4a90d9; color: #fff; border-color: #4a90d9; }
        .tool-btn .icon { font-size: 20px; }
        
        /* 学科选择器 */
        .subject-selector {
            display: flex;
            background: #fff;
            border-radius: 6px;
            margin: 8px;
            overflow: hidden;
            border: 1px solid #e0e0e0;
        }
        .subject-tab {
            flex: 1;
            padding: 8px;
            text-align: center;
            font-size: 12px;
            cursor: pointer;
            border-right: 1px solid #e0e0e0;
        }
        .subject-tab:last-child { border-right: none; }
        .subject-tab.active { background: #4a90d9; color: #fff; }
        
        /* 学科面板 - 物理主题 */
        .subject-panel { background: #fff; }
        .subject-panel.physics .panel-header { color: #00acc1; }
        .subject-panel.chemistry .panel-header { color: #66bb6a; }
        
        /* 画布区域 */
        .canvas-area {
            flex: 1;
            background: #fff;
            position: relative;
            background-image: 
                linear-gradient(#f0f0f0 1px, transparent 1px),
                linear-gradient(90deg, #f0f0f0 1px, transparent 1px);
            background-size: 20px 20px;
        }
        
        /* 右侧属性面板 */
        .right-panel {
            width: 280px;
            background: #f5f5f5;
            border-left: 1px solid #e0e0e0;
            padding: 16px;
        }
        .property-group { margin-bottom: 16px; }
        .property-label { font-size: 12px; color: #666; margin-bottom: 8px; }
        .property-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .color-picker { width: 32px; height: 32px; border: 1px solid #e0e0e0; border-radius: 4px; cursor: pointer; }
        .slider { flex: 1; height: 4px; -webkit-appearance: none; background: #ddd; border-radius: 2px; }
        .slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: #4a90d9; border-radius: 50%; cursor: pointer; }
        
        /* 状态栏 */
        .status-bar {
            height: 28px;
            background: #f5f5f5;
            border-top: 1px solid #e0e0e0;
            display: flex;
            align-items: center;
            padding: 0 16px;
            font-size: 12px;
            color: #666;
            gap: 24px;
        }
        .status-item { display: flex; align-items: center; gap: 6px; }
        
        /* 学科主题色变量 */
        :root {
            --primary: #4a90d9;
            --hover: #5a9fe9;
            --bg: #f5f5f5;
            --border: #e0e0e0;
            --text: #333;
            --text-secondary: #666;
        }
        .subject-math { --primary: #4a90d9; }
        .subject-physics { --primary: #00acc1; }
        .subject-chemistry { --primary: #66bb6a; }
    </style>
</head>
<body>
    <div class="app-container">
        <!-- 顶部菜单栏 -->
        <div class="menu-bar">
            <div class="menu-item">文件</div>
            <div class="menu-item">编辑</div>
            <div class="menu-item">视图</div>
            <div class="menu-item">学科</div>
            <div class="menu-item">帮助</div>
            <div class="window-controls">
                <button class="win-btn min">─</button>
                <button class="win-btn max">□</button>
                <button class="win-btn close">×</button>
            </div>
        </div>
        
        <!-- 顶部工具栏 -->
        <div class="toolbar">
            <button class="toolbar-btn">📄 新建</button>
            <button class="toolbar-btn">📂 打开</button>
            <button class="toolbar-btn">💾 保存</button>
            <button class="toolbar-btn">📤 导出</button>
            <div class="toolbar-separator"></div>
            <button class="toolbar-btn">↩ 撤销</button>
            <button class="toolbar-btn">↪ 重做</button>
            <div class="toolbar-separator"></div>
            <button class="toolbar-btn">🔍 100%</button>
            <button class="toolbar-btn">☑ 网格</button>
        </div>
        
        <!-- 主内容区 -->
        <div class="main-content">
            <!-- 左侧工具面板 -->
            <div class="left-panel">
                <!-- 基础工具 -->
                <div class="panel-section">
                    <div class="panel-header">基础工具</div>
                    <div class="tool-grid">
                        <div class="tool-btn active"><span class="icon">↖</span>选择</div>
                        <div class="tool-btn"><span class="icon">✏️</span>画笔</div>
                        <div class="tool-btn"><span class="icon">□</span>矩形</div>
                        <div class="tool-btn"><span class="icon">○</span>椭圆</div>
                        <div class="tool-btn"><span class="icon">╱</span>直线</div>
                        <div class="tool-btn"><span class="icon">→</span>箭头</div>
                        <div class="tool-btn"><span class="icon">⬡</span>多边形</div>
                        <div class="tool-btn"><span class="icon">T</span>文本</div>
                    </div>
                </div>
                
                <!-- 学科选择器 -->
                <div class="panel-section">
                    <div class="panel-header">学科工具 ▼</div>
                    <div class="subject-selector">
                        <div class="subject-tab" onclick="setSubject('math')">🎯 数学</div>
                        <div class="subject-tab active" onclick="setSubject('physics')">⚛️ 物理</div>
                        <div class="subject-tab" onclick="setSubject('chemistry')">⚗️ 化学</div>
                    </div>
                    
                    <!-- 物理学科面板 -->
                    <div class="panel-section subject-panel physics" id="physics-panel">
                        <div class="panel-header">⚛️ 力学工具</div>
                        <div class="tool-grid">
                            <div class="tool-btn"><span class="icon">⚙</span>滑轮组</div>
                            <div class="tool-btn"><span class="icon">〰</span>弹簧</div>
                            <div class="tool-btn"><span class="icon">🚗</span>小车</div>
                            <div class="tool-btn"><span class="icon">📐</span>斜面</div>
                            <div class="tool-btn"><span class="icon">→F←</span>受力箭头</div>
                        </div>
                        <div class="panel-header">🔌 电路图工具</div>
                        <div class="tool-grid">
                            <div class="tool-btn"><span class="icon">⏛</span>电阻</div>
                            <div class="tool-btn"><span class="icon">⏚</span>电容</div>
                            <div class="tool-btn"><span class="icon">⚡</span>电源</div>
                            <div class="tool-btn"><span class="icon">⊘</span>开关</div>
                            <div class="tool-btn"><span class="icon">🗲</span>电压表</div>
                            <div class="tool-btn"><span class="icon">🗲</span>电流表</div>
                        </div>
                        <div class="panel-header">🔆 光学工具</div>
                        <div class="tool-grid">
                            <div class="tool-btn"><span class="icon">◝</span>凸透镜</div>
                            <div class="tool-btn"><span class="icon">◜</span>凹透镜</div>
                            <div class="tool-btn"><span class="icon">⟷</span>光路</div>
                            <div class="tool-btn"><span class="icon">↗</span>反射</div>
                            <div class="tool-btn"><span class="icon">↘</span>折射</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 画布区域 -->
            <div class="canvas-area">
                <!-- Excalidraw 画布将嵌入此处 -->
            </div>
            
            <!-- 右侧属性面板 -->
            <div class="right-panel">
                <div class="panel-header" style="margin-bottom: 16px;">属性设置</div>
                
                <div class="property-group">
                    <div class="property-label">填充颜色</div>
                    <div class="property-row">
                        <div class="color-picker" style="background: #4a90d9;"></div>
                        <input type="range" class="slider" value="100">
                        <span>100%</span>
                    </div>
                </div>
                
                <div class="property-group">
                    <div class="property-label">描边颜色</div>
                    <div class="property-row">
                        <div class="color-picker" style="background: #333;"></div>
                        <select style="width: 60px;"><option>2px</option></select>
                    </div>
                </div>
                
                <div class="property-group">
                    <div class="property-label">旋转</div>
                    <div class="property-row">
                        <input type="range" class="slider" value="0">
                        <span>0°</span>
                    </div>
                </div>
                
                <div class="property-group">
                    <div class="property-label">图层</div>
                    <div class="property-row">
                        <button class="toolbar-btn" style="flex:1">↑ 上移</button>
                        <button class="toolbar-btn" style="flex:1">↓ 下移</button>
                    </div>
                    <div class="property-row">
                        <button class="toolbar-btn" style="flex:1">🗑 删除</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 状态栏 -->
        <div class="status-bar">
            <div class="status-item">当前工具: <strong>选择</strong></div>
            <div class="status-item">缩放: <strong>100%</strong></div>
            <div class="status-item">画布: <strong>1920 × 1080</strong></div>
            <div class="status-item">网格: <strong>☑ 开启</strong></div>
        </div>
    </div>
    
    <script>
        function setSubject(subject) {
            document.querySelectorAll('.subject-tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
        }
    </script>
</body>
</html>
```

---

## 11. 后续开发建议

1. **图标设计**：建议为每个学科工具设计统一风格的可视化图标
2. **拖拽组件**：实现工具面板的可拖拽分隔，用户可自定义宽度
3. **主题切换**：支持亮色/暗色主题，适应不同使用环境
4. **自定义工具**：允许用户保存常用工具组合为预设
5. **模板库**：预设常见教学场景模板（力学分析图、实验装置图等）

---

*文档结束*
