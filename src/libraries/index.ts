/**
 * Libraries Index - Export all library modules
 */

// Math library
export {
  mathShapes,
  getShapesByCategory,
  getShapeById,
} from './math'

export type {
  MathShape,
  MathShapeCategory,
} from './math'

// Library utilities
export {
  convertSvgToElements,
  convertMathShapeToElements,
  createLibraryItemFromShape,
  getMathLibraryItems,
} from './libraryUtils'