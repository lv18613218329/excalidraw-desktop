import { useCallback, useEffect, useRef } from 'react'
import { useAppStore } from '../stores/appStore'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import type { ExcalidrawCanvasRef } from '../components/ExcalidrawCanvas'

interface FileData {
  elements: ExcalidrawElement[]
  appState: {
    theme?: string
    viewBackgroundColor?: string
  }
  version?: number
}

export function useFileOperations(canvasRef: React.RefObject<ExcalidrawCanvasRef>) {
  const {
    currentFilePath,
    isDirty,
    elements,
    setCurrentFilePath,
    setIsDirty,
    setElements,
    setTheme,
    reset
  } = useAppStore()

  // 使用 ref 缓存 Excalidraw API
  const excalidrawAPIRef = useRef<any>(null)

  // 同步 API 引用
  useEffect(() => {
    if (canvasRef?.current?.isReady()) {
      excalidrawAPIRef.current = canvasRef.current.getAPI()
    }
  })

  // 新建画布
  const handleNew = useCallback(() => {
    if (isDirty) {
      if (!confirm('当前文件尚未保存，确定要新建吗？')) {
        return
      }
    }
    reset()
    setCurrentFilePath(null)
    if (excalidrawAPIRef.current) {
      excalidrawAPIRef.current.resetScene()
    }
  }, [isDirty, reset, setCurrentFilePath])

  // 打开文件
  const handleOpen = useCallback(async () => {
    try {
      const result = await window.electronAPI.openFile()
      if (result.canceled || !result.success || !result.content) return

      const data: FileData = JSON.parse(result.content)
      setElements(data.elements || [])
      setCurrentFilePath(result.filePath === undefined ? null : result.filePath)
      setIsDirty(false)

      // 恢复应用状态
      if (data.appState) {
        if (data.appState.theme) {
          setTheme(data.appState.theme as 'light' | 'dark')
        }
      }

      // 加载到 Excalidraw
      if (excalidrawAPIRef.current) {
        excalidrawAPIRef.current.updateScene({
          elements: data.elements || [],
          appState: data.appState
        })
      }
    } catch (error) {
      console.error('Open file error:', error)
      alert('打开文件失败：' + error)
    }
  }, [setElements, setCurrentFilePath, setIsDirty, setTheme])

  // 保存文件
  const handleSave = useCallback(async () => {
    const fileData: FileData = {
      elements,
      appState: {
        theme: useAppStore.getState().theme
      },
      version: 1
    }
    const content = JSON.stringify(fileData, null, 2)

    try {
      const result = await window.electronAPI.saveFile(content, currentFilePath ?? undefined)
      if (result.success && result.filePath) {
        setCurrentFilePath(result.filePath)
        setIsDirty(false)
      }
    } catch (error) {
      console.error('Save file error:', error)
      alert('保存文件失败：' + error)
    }
  }, [elements, currentFilePath, setCurrentFilePath, setIsDirty])

  // 另存为
  const handleSaveAs = useCallback(async () => {
    const fileData: FileData = {
      elements,
      appState: {
        theme: useAppStore.getState().theme
      },
      version: 1
    }
    const content = JSON.stringify(fileData, null, 2)

    try {
      const result = await window.electronAPI.saveFile(content, undefined)
      if (result.success && result.filePath) {
        setCurrentFilePath(result.filePath)
        setIsDirty(false)
      }
    } catch (error) {
      console.error('Save as error:', error)
      alert('另存为失败：' + error)
    }
  }, [elements, setCurrentFilePath, setIsDirty])

  // 导出 PNG
  const handleExportPNG = useCallback(async () => {
    if (!excalidrawAPIRef.current) {
      alert('画布未就绪')
      return
    }

    try {
      const blob = await (excalidrawAPIRef.current as any).exportToBlob({
        type: 'png',
        exportPadding: 10,
        scale: 2
      })
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        await window.electronAPI.exportFile('png', base64)
      }
      reader.readAsDataURL(blob)
    } catch (error) {
      console.error('Export PNG error:', error)
      alert('导出 PNG 失败：' + error)
    }
  }, [])

  // 导出 SVG
  const handleExportSVG = useCallback(async () => {
    if (!excalidrawAPIRef.current) {
      alert('画布未就绪')
      return
    }

    try {
      const svg = await (excalidrawAPIRef.current as any).exportToSvg({
        exportPadding: 10
      })
      const serializer = new XMLSerializer()
      const svgString = serializer.serializeToString(svg)
      await window.electronAPI.exportFile('svg', svgString)
    } catch (error) {
      console.error('Export SVG error:', error)
      alert('导出 SVG 失败：' + error)
    }
  }, [])

  // 导出 PDF (使用打印功能)
  const handleExportPDF = useCallback(async () => {
    if (!excalidrawAPIRef.current) {
      alert('画布未就绪')
      return
    }

    try {
      const blob = await (excalidrawAPIRef.current as any).exportToBlob({
        type: 'png',
        exportPadding: 10,
        scale: 2
      })
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        await window.electronAPI.exportFile('pdf', base64)
      }
      reader.readAsDataURL(blob)
    } catch (error) {
      console.error('Export PDF error:', error)
      alert('导出 PDF 失败：' + error)
    }
  }, [])

  // 复制到剪贴板
  const handleCopyToClipboard = useCallback(async () => {
    if (!excalidrawAPIRef.current) {
      alert('画布未就绪')
      return
    }

    try {
      const blob = await (excalidrawAPIRef.current as any).exportToBlob({
        type: 'png',
        exportPadding: 10,
        scale: 2
      })
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      alert('已复制到剪贴板')
    } catch (error) {
      console.error('Copy to clipboard error:', error)
      alert('复制到剪贴板失败：' + error)
    }
  }, [])

  // 注册菜单事件监听
  useEffect(() => {
    if (!window.electronAPI) return

    const cleanups = [
      window.electronAPI.onMenuNew(handleNew),
      window.electronAPI.onMenuSave(handleSave),
      window.electronAPI.onMenuSaveAs(handleSaveAs),
      window.electronAPI.onMenuExport((format: string) => {
        switch (format) {
          case 'png':
            handleExportPNG()
            break
          case 'svg':
            handleExportSVG()
            break
          case 'pdf':
            handleExportPDF()
            break
        }
      }),
      window.electronAPI.onFileOpened((data: { path: string; content: string }) => {
        try {
          const fileData: FileData = JSON.parse(data.content)
          setElements(fileData.elements || [])
          setCurrentFilePath(data.path)
          setIsDirty(false)

          if (excalidrawAPIRef.current) {
            excalidrawAPIRef.current.updateScene({
              elements: fileData.elements || [],
              appState: fileData.appState
            })
          }
        } catch (error) {
          console.error('Load file error:', error)
        }
      })
    ]

    return () => {
      cleanups.forEach(cleanup => cleanup?.())
    }
  }, [handleNew, handleSave, handleSaveAs, handleExportPNG, handleExportSVG, handleExportPDF, setElements, setCurrentFilePath, setIsDirty])

  // 监听窗口关闭，检查未保存文件
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  return {
    handleNew,
    handleOpen,
    handleSave,
    handleSaveAs,
    handleExportPNG,
    handleExportSVG,
    handleExportPDF,
    handleCopyToClipboard
  }
}
