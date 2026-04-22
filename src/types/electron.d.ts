export {}

declare global {
  interface Window {
    electronAPI?: {
      saveFile: (content: string, filePath?: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>
      openFile: () => Promise<{ success: boolean; filePath?: string; content?: string; canceled?: boolean; error?: string }>
      exportFile: (format: string, data: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>
      onMenuNew: (callback: () => void) => () => void
      onMenuSave: (callback: () => void) => () => void
      onMenuSaveAs: (callback: () => void) => () => void
      onMenuExport: (callback: (format: string) => void) => () => void
      onFileOpened: (callback: (data: { path: string; content: string }) => void) => () => void
      windowMinimize: () => Promise<void>
      windowMaximize: () => Promise<void>
      windowClose: () => Promise<void>
      windowIsMaximized: () => Promise<boolean>
      onWindowMaximizeChanged: (callback: (isMaximized: boolean) => void) => () => void
    }
  }
}
