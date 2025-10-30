export interface PlayerState {
  currentPageIndex: number
  isPlaying: boolean
  isFullscreen: boolean
  showControls: boolean
  autoPlay: boolean
  loop: boolean
  transition: string
}

export interface FloatingButtonConfig {
  position: 'left' | 'right'
  opacity: number
  size: 'small' | 'medium' | 'large'
  autoHide: boolean
  showOnHover: boolean
}

export interface DrawingTool {
  type: 'pen' | 'eraser' | 'laser'
  color: string
  size: number
  isActive: boolean
}

export interface DrawingState {
  isDrawing: boolean
  currentTool: DrawingTool
  strokes: Stroke[]
  currentStroke: Stroke | null
}

export interface Stroke {
  id: string
  tool: DrawingTool['type']
  points: Point[]
  color: string
  size: number
  timestamp: Date
}

export interface Point {
  x: number
  y: number
  timestamp?: number
}

export interface PlayerControls {
  play: () => void
  pause: () => void
  next: () => void
  previous: () => void
  goToPage: (index: number) => void
  toggleFullscreen: () => void
  toggleDrawingTool: (tool: DrawingTool) => void
  clearDrawings: () => void
}

export interface PresentationConfig {
  autoPlay: boolean
  autoPlayInterval: number
  showPageNumbers: boolean
  showProgress: boolean
  enableKeyboardShortcuts: boolean
  enableMouseNavigation: boolean
  enableTouchGestures: boolean
  transition: string
  transitionDuration: number
}

export interface KeyboardShortcuts {
  next: string[]
  previous: string[]
  playPause: string[]
  fullscreen: string[]
  drawing: {
    pen: string[]
    eraser: string[]
    laser: string[]
  }
  clear: string[]
  exit: string[]
}