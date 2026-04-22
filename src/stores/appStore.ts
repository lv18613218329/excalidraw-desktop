import { create } from 'zustand'
import { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'

export type Subject = 'math' | 'physics' | 'chemistry'

export interface AppState {
  // File state
  currentFilePath: string | null
  isDirty: boolean
  
  // Canvas state
  elements: ExcalidrawElement[]
  zoom: number
  gridEnabled: boolean
  rulerEnabled: boolean
  
  // Subject state
  currentSubject: Subject
  subjectPanelCollapsed: boolean
  
  // Selection state
  selectedElementIds: string[]
  
  // Actions
  setCurrentFilePath: (path: string | null) => void
  setIsDirty: (dirty: boolean) => void
  setElements: (elements: ExcalidrawElement[]) => void
  setZoom: (zoom: number) => void
  setGridEnabled: (enabled: boolean) => void
  setRulerEnabled: (enabled: boolean) => void
  setCurrentSubject: (subject: Subject) => void
  setSubjectPanelCollapsed: (collapsed: boolean) => void
  setSelectedElementIds: (ids: string[]) => void
  reset: () => void
}

const initialState = {
  currentFilePath: null,
  isDirty: false,
  elements: [],
  zoom: 100,
  gridEnabled: true,
  rulerEnabled: false,
  currentSubject: 'math' as Subject,
  subjectPanelCollapsed: false,
  selectedElementIds: [],
}

export const useAppStore = create<AppState>((set) => ({
  ...initialState,
  
  setCurrentFilePath: (path) => set({ currentFilePath: path }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  setElements: (elements) => set({ elements, isDirty: true }),
  setZoom: (zoom) => set({ zoom }),
  setGridEnabled: (enabled) => set({ gridEnabled: enabled }),
  setRulerEnabled: (enabled) => set({ rulerEnabled: enabled }),
  setCurrentSubject: (subject) => set({ currentSubject: subject }),
  setSubjectPanelCollapsed: (collapsed) => set({ subjectPanelCollapsed: collapsed }),
  setSelectedElementIds: (ids) => set({ selectedElementIds: ids }),
  reset: () => set(initialState),
}))
