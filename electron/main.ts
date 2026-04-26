import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { join } from 'path'
import { readFile, writeFile, stat } from 'fs/promises'
import log from 'electron-log'

// Configure logging
log.transports.file.level = 'info'
log.transports.console.level = 'debug'

// Log startup
log.info('Excalidraw Desktop starting...')

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error)
  app.exit(1)
})

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Rejection:', reason)
})

let mainWindow: BrowserWindow | null = null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件(_F)',
      submenu: [
        {
          label: '新建',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu-new')
        },
        {
          label: '打开...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow!, {
              filters: [
                { name: 'Excalidraw', extensions: ['excalidraw'] },
                { name: 'JSON', extensions: ['json'] }
              ],
              properties: ['openFile']
            })
            if (!result.canceled && result.filePaths[0]) {
              const content = await readFile(result.filePaths[0], 'utf-8')
              mainWindow?.webContents.send('file-opened', { path: result.filePaths[0], content })
            }
          }
        },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu-save')
        },
        {
          label: '另存为...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow?.webContents.send('menu-save-as')
        },
        { type: 'separator' },
        {
          label: '导出 PNG',
          click: () => mainWindow?.webContents.send('menu-export', 'png')
        },
        {
          label: '导出 SVG',
          click: () => mainWindow?.webContents.send('menu-export', 'svg')
        },
        {
          label: '导出 PDF',
          click: () => mainWindow?.webContents.send('menu-export', 'pdf')
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: '编辑(_E)',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: '视图(_V)',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: '学科(_S)',
      submenu: [
        {
          label: '数学',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow?.webContents.send('menu-subject', 'math')
        },
        {
          label: '物理',
          accelerator: 'CmdOrCtrl+2',
          click: () => mainWindow?.webContents.send('menu-subject', 'physics')
        },
        {
          label: '化学',
          accelerator: 'CmdOrCtrl+3',
          click: () => mainWindow?.webContents.send('menu-subject', 'chemistry')
        }
      ]
    },
    {
      label: '帮助(_H)',
      submenu: [
        {
          label: '使用教程',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: '使用教程',
              message: 'Excalidraw Desktop 使用教程',
              detail: '1. 使用左侧工具栏选择绘图工具\n2. 在画布上绘制图形\n3. 使用右侧属性面板修改样式\n4. 通过文件菜单保存和导出\n\n快捷键：\nCtrl+N 新建 | Ctrl+O 打开 | Ctrl+S 保存\nCtrl+Z 撤销 | Ctrl+Y 重做\nCtrl+1 数学 | Ctrl+2 物理 | Ctrl+3 化学'
            })
          }
        },
        {
          label: '快捷键列表',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: '快捷键列表',
              message: '快捷键一览',
              detail: '文件操作：\nCtrl+N 新建\nCtrl+O 打开\nCtrl+S 保存\nCtrl+Shift+S 另存为\n\n编辑操作：\nCtrl+Z 撤销\nCtrl+Y 重做\nDelete 删除选中\nCtrl+A 全选\n\n工具切换：\nV 选择 | P 画笔 | R 矩形\nO 椭圆 | L 直线 | A 箭头\nT 文本\n\n学科切换：\nCtrl+1 数学\nCtrl+2 物理\nCtrl+3 化学\n\n视图：\nCtrl+滚轮 缩放\nSpace+拖拽 移动画布'
            })
          }
        },
        { type: 'separator' },
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: '关于 Excalidraw Desktop',
              message: 'Excalidraw Desktop v1.0.0',
              detail: '跨平台桌面端教学绘图笔记系统\n基于 Electron + Excalidraw'
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createWindow() {
  log.info('Creating main window...')

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Excalidraw Desktop',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  createMenu()

  // Load the app
  if (VITE_DEV_SERVER_URL) {
    log.info('Loading dev server:', VITE_DEV_SERVER_URL)
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    log.info('Loading production build')
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  // 强制关闭窗口
  mainWindow.on('close', (event) => {
    console.log('[Main] close 事件触发')
    log.info('[Main] close event triggered')
    // 不阻止默认行为，让窗口正常关闭
    mainWindow?.destroy()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-maximize-changed', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-maximize-changed', false)
  })

  // Enable DevTools shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
      mainWindow?.webContents.toggleDevTools()
      event.preventDefault()
    }
  })

  log.info('Main window created successfully')
}

// IPC Handlers for file operations
ipcMain.handle('save-file', async (_event, { content, filePath }) => {
  try {
    let targetPath = filePath
    if (!targetPath) {
      const result = await dialog.showSaveDialog(mainWindow!, {
        filters: [
          { name: 'Excalidraw', extensions: ['excalidraw'] }
        ]
      })
      if (result.canceled) return { success: false, canceled: true }
      targetPath = result.filePath
    }
    await writeFile(targetPath, content, 'utf-8')
    return { success: true, filePath: targetPath }
  } catch (error) {
    log.error('Save file error:', error)
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('open-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      filters: [
        { name: 'Excalidraw', extensions: ['excalidraw'] },
        { name: 'JSON', extensions: ['json'] }
      ],
      properties: ['openFile']
    })
    if (result.canceled) return { success: false, canceled: true }
    const content = await readFile(result.filePaths[0], 'utf-8')
    return { success: true, filePath: result.filePaths[0], content }
  } catch (error) {
    log.error('Open file error:', error)
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('export-file', async (_event, { format, data }) => {
  try {
    const filters = {
      png: [{ name: 'PNG Image', extensions: ['png'] }],
      svg: [{ name: 'SVG Image', extensions: ['svg'] }],
      pdf: [{ name: 'PDF Document', extensions: ['pdf'] }]
    }
    const result = await dialog.showSaveDialog(mainWindow!, {
      filters: filters[format as keyof typeof filters] || filters.png
    })
    if (result.canceled) return { success: false, canceled: true }
    await writeFile(result.filePath!, data)
    return { success: true, filePath: result.filePath }
  } catch (error) {
    log.error('Export file error:', error)
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('window-minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.handle('window-close', () => {
  console.log('[IPC] window-close 被调用')
  log.info('[IPC] window-close called, quitting app')
  app.quit()
})

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() ?? false
})

ipcMain.handle('get-file-stats', async (_event, filePath: string) => {
  try {
    const stats = await stat(filePath)
    return {
      success: true,
      mtime: stats.mtime.toISOString(),
      ctime: stats.ctime.toISOString(),
      size: stats.size
    }
  } catch (error) {
    log.error('Get file stats error:', error)
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('auto-save', async (_event, { filePath, content }) => {
  try {
    await writeFile(filePath, content, 'utf-8')
    log.info('Auto-save successful:', filePath)
    return { success: true }
  } catch (error) {
    log.error('Auto-save error:', error)
    return { success: false, error: String(error) }
  }
})

// App lifecycle
app.whenReady().then(() => {
  log.info('App ready')
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  log.info('All windows closed')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  log.info('App quitting')
})
