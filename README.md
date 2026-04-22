# Excalidraw 桌面端教学绘图笔记系统

> 跨平台桌面端教学绘图笔记系统 | 基于 Electron + React + Excalidraw

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20UOS%20%7C%20Linux-blue)]()
[![Electron](https://img.shields.io/badge/Electron-28+-green.svg)]()
[![React](https://img.shields.io/badge/React-18+-blue.svg)]()

## 📖 项目简介

Excalidraw Desktop 是一款专为教育场景设计的跨平台桌面端绘图软件，支持数学、物理、化学等学科的专用绘图工具。界面简洁美观，功能丰富实用。

## 🖥️ 支持平台

- Windows 10/11
- 统信 UOS
- 麒麟系统

## ✨ 功能特点

### 基础绘图工具
- 选择工具、画笔、矩形、椭圆
- 直线、箭头、多边形、文本
- 笔记、图片插入

### 学科专用工具

#### 🎯 数学工具
- 几何工具：三角形、正方形、圆形、正六边形
- 测量工具：直尺、量角器
- 坐标系统：坐标轴、点、线段、曲线、角
- 公式输入：求和、积分、无穷、根号、圆周率

#### ⚛️ 物理工具
- 力学工具：滑轮组、弹簧、小车、斜面、受力箭头
- 电路图：电阻、电容、电源、开关、电压表、电流表
- 光学工具：凸透镜、凹透镜、光路、反射、折射、光源

#### ⚗️ 化学工具
- 分子结构：六元环、苯环、单键、双键、三键、官能团
- 实验器材：试管、烧瓶、酒精灯、冷凝管、烧杯、量筒
- 特殊功能：液面填充、原子模型、反应箭头、催化箭头

### 其他功能
- 文件操作：新建、打开、保存、另存为
- 导出支持：PNG、SVG、PDF
- 撤销/重做
- 缩放控制（50%-200%）
- 网格/标尺显示
- 学科主题色切换

## 🛠️ 技术栈

| 技术 | 说明 |
|------|------|
| Electron | 桌面端框架 |
| React 18 | 前端框架 |
| TypeScript | 开发语言 |
| Vite 5 | 构建工具 |
| Excalidraw | 绘图引擎 |

## 📦 安装依赖

```bash
npm install
```

## 🚀 开发模式

```bash
npm run dev
```

## 📦 构建生产版本

```bash
npm run build
```

## 📁 项目结构

```
Excalidraw/
├── electron/           # Electron 主进程
│   ├── main.ts        # 主入口
│   └── preload.ts     # 预加载脚本
├── src/               # 源代码
│   ├── components/    # React 组件
│   ├── stores/        # 状态管理
│   ├── types/         # 类型定义
│   ├── App.tsx        # 主应用组件
│   ├── App.css        # 主样式
│   ├── main.tsx       # React 入口
│   └── index.css      # 全局样式
├── public/            # 静态资源
├── dist/              # 构建输出
├── dist-electron/     # Electron 构建输出
├── index.html         # HTML 入口
├── package.json       # 项目配置
├── vite.config.ts     # Vite 配置
└── tsconfig.json      # TypeScript 配置
```

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+N | 新建 |
| Ctrl+O | 打开 |
| Ctrl+S | 保存 |
| Ctrl+Shift+S | 另存为 |
| Ctrl+Z | 撤销 |
| Ctrl+Y | 重做 |
| V | 选择工具 |
| P | 画笔 |
| R | 矩形 |
| O | 椭圆 |
| L | 直线 |
| A | 箭头 |
| T | 文本 |
| Ctrl+1 | 数学学科 |
| Ctrl+2 | 物理学科 |
| Ctrl+3 | 化学学科 |

## 🎨 配色方案

### 主色调

| 用途 | 颜色代码 |
|------|----------|
| 主色 | `#4a90d9` |
| 悬停 | `#5a9fe9` |
| 按下 | `#3a80c9` |
| 背景 | `#f5f5f5` |
| 边框 | `#e0e0e0` |

### 学科主题色

| 学科 | 主色 | 强调色 |
|------|------|--------|
| 数学 | `#4a90d9` (蓝) | `#7c4dff` (紫) |
| 物理 | `#00acc1` (青) | `#ff7043` (橙) |
| 化学 | `#66bb6a` (绿) | `#ffa726` (黄) |

## 📄 许可证

本项目基于 [MIT](LICENSE) 许可证开源。

---

Made with ❤️ by WenGe
