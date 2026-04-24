/**
 * Electron API Type Definitions
 *
 * Types for the exposed electron API via contextBridge in preload.ts
 */

interface ElectronAPI {
  // File operations
  saveFile: (content: string, filePath?: string) => Promise<{
    success: boolean
    filePath?: string
    canceled?: boolean
    error?: string
  }>
  openFile: () => Promise<{
    success: boolean
    filePath?: string
    content?: string
    canceled?: boolean
    error?: string
  }>
  exportFile: (format: string, data: string) => Promise<{
    success: boolean
    filePath?: string
    canceled?: boolean
    error?: string
  }>

  // Menu event listeners
  onMenuNew: (callback: () => void) => () => void
  onMenuSave: (callback: () => void) => () => void
  onMenuSaveAs: (callback: () => void) => () => void
  onMenuExport: (callback: (format: string) => void) => () => void
  onMenuSubject: (callback: (subject: string) => void) => () => void
  onFileOpened: (callback: (data: { path: string; content: string }) => void) => () => void

  // Window controls
  windowMinimize: () => Promise<void>
  windowMaximize: () => Promise<void>
  windowClose: () => Promise<void>
  windowIsMaximized: () => Promise<boolean>
  onWindowMaximizeChanged: (callback: (isMaximized: boolean) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}