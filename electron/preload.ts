import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  saveFile: (content: string, filePath?: string) =>
    ipcRenderer.invoke('save-file', { content, filePath }),
  openFile: () =>
    ipcRenderer.invoke('open-file'),
  exportFile: (format: string, data: string) =>
    ipcRenderer.invoke('export-file', { format, data }),

  // Menu events
  onMenuNew: (callback: () => void) => {
    ipcRenderer.on('menu-new', callback)
    return () => ipcRenderer.removeListener('menu-new', callback)
  },
  onMenuSave: (callback: () => void) => {
    ipcRenderer.on('menu-save', callback)
    return () => ipcRenderer.removeListener('menu-save', callback)
  },
  onMenuSaveAs: (callback: () => void) => {
    ipcRenderer.on('menu-save-as', callback)
    return () => ipcRenderer.removeListener('menu-save-as', callback)
  },
  onMenuExport: (callback: (format: string) => void) => {
    ipcRenderer.on('menu-export', (_event, format) => callback(format))
    return () => ipcRenderer.removeAllListeners('menu-export')
  },
  onMenuSubject: (callback: (subject: string) => void) => {
    ipcRenderer.on('menu-subject', (_event, subject) => callback(subject))
    return () => ipcRenderer.removeAllListeners('menu-subject')
  },
  onFileOpened: (callback: (data: { path: string; content: string }) => void) => {
    ipcRenderer.on('file-opened', (_event, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('file-opened')
  },

  // Window controls
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onWindowMaximizeChanged: (callback: (isMaximized: boolean) => void) => {
    ipcRenderer.on('window-maximize-changed', (_event, isMaximized) => callback(isMaximized))
    return () => ipcRenderer.removeAllListeners('window-maximize-changed')
  }
})

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      saveFile: (content: string, filePath?: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>
      openFile: () => Promise<{ success: boolean; filePath?: string; content?: string; canceled?: boolean; error?: string }>
      exportFile: (format: string, data: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>
      onMenuNew: (callback: () => void) => () => void
      onMenuSave: (callback: () => void) => () => void
      onMenuSaveAs: (callback: () => void) => () => void
      onMenuExport: (callback: (format: string) => void) => () => void
      onMenuSubject: (callback: (subject: string) => void) => () => void
      onFileOpened: (callback: (data: { path: string; content: string }) => void) => () => void
      windowMinimize: () => Promise<void>
      windowMaximize: () => Promise<void>
      windowClose: () => Promise<void>
      windowIsMaximized: () => Promise<boolean>
      onWindowMaximizeChanged: (callback: (isMaximized: boolean) => void) => () => void
    }
  }
}
