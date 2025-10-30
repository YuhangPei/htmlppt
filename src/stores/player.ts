import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PlayerState, FloatingButtonConfig, DrawingTool, DrawingState, Stroke, Point, PresentationConfig } from '@/types'

export const usePlayerStore = defineStore('player', () => {
  // State
  const state = ref<PlayerState>({
    currentPageIndex: 0,
    isPlaying: false,
    isFullscreen: false,
    showControls: true,
    autoPlay: false,
    loop: false,
    transition: 'fade',
  })

  const floatingButtonConfig = ref<FloatingButtonConfig>({
    position: 'left',
    opacity: 0.3,
    size: 'medium',
    autoHide: false,
    showOnHover: true,
  })

  const drawingState = ref<DrawingState>({
    isDrawing: false,
    currentTool: {
      type: 'pen',
      color: '#ff0000',
      size: 3,
      isActive: false,
    },
    strokes: [],
    currentStroke: null,
  })

  const presentationConfig = ref<PresentationConfig>({
    autoPlay: false,
    autoPlayInterval: 5000,
    showPageNumbers: true,
    showProgress: true,
    enableKeyboardShortcuts: true,
    enableMouseNavigation: true,
    enableTouchGestures: false,
    transition: 'fade',
    transitionDuration: 300,
  })

  const autoPlayTimer = ref<number | null>(null)

  // Getters
  const canGoNext = computed(() => {
    // This would be connected to the actual page count from project store
    return true // Placeholder
  })

  const canGoPrevious = computed(() => {
    return state.value.currentPageIndex > 0
  })

  const currentTool = computed(() => drawingState.value.currentTool)
  const hasDrawings = computed(() => drawingState.value.strokes.length > 0)

  // Actions
  const setCurrentPage = (index: number) => {
    state.value.currentPageIndex = index
  }

  const nextPage = () => {
    if (canGoNext.value) {
      state.value.currentPageIndex++
    } else if (state.value.loop) {
      state.value.currentPageIndex = 0
    }
  }

  const previousPage = () => {
    if (canGoPrevious.value) {
      state.value.currentPageIndex--
    } else if (state.value.loop) {
      // Would need to get total page count from project store
      state.value.currentPageIndex = 0 // Placeholder
    }
  }

  const goToPage = (index: number) => {
    state.value.currentPageIndex = index
  }

  const play = () => {
    state.value.isPlaying = true
    if (state.value.autoPlay) {
      startAutoPlay()
    }
  }

  const pause = () => {
    state.value.isPlaying = false
    stopAutoPlay()
  }

  const togglePlay = () => {
    if (state.value.isPlaying) {
      pause()
    } else {
      play()
    }
  }

  const startAutoPlay = () => {
    if (autoPlayTimer.value) {
      clearInterval(autoPlayTimer.value)
    }

    autoPlayTimer.value = window.setInterval(() => {
      nextPage()
    }, presentationConfig.value.autoPlayInterval)
  }

  const stopAutoPlay = () => {
    if (autoPlayTimer.value) {
      window.clearInterval(autoPlayTimer.value)
      autoPlayTimer.value = null
    }
  }

  const enterFullscreen = () => {
    state.value.isFullscreen = true
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen()
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error)
    }
  }

  const exitFullscreen = () => {
    state.value.isFullscreen = false
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error)
    }
  }

  const toggleFullscreen = () => {
    if (state.value.isFullscreen) {
      exitFullscreen()
    } else {
      enterFullscreen()
    }
  }

  const showControlsBar = () => {
    state.value.showControls = true
  }

  const hideControlsBar = () => {
    state.value.showControls = false
  }

  const toggleControlsBar = () => {
    state.value.showControls = !state.value.showControls
  }

  const setTransition = (transition: string) => {
    state.value.transition = transition
    presentationConfig.value.transition = transition
  }

  const updateFloatingButtonConfig = (config: Partial<FloatingButtonConfig>) => {
    floatingButtonConfig.value = { ...floatingButtonConfig.value, ...config }
  }

  // Drawing actions
  const setDrawingTool = (tool: DrawingTool) => {
    drawingState.value.currentTool = tool
  }

  const activateDrawingTool = (toolType: DrawingTool['type']) => {
    const tool: DrawingTool = {
      type: toolType,
      color: toolType === 'eraser' ? '#ffffff' : '#ff0000',
      size: toolType === 'laser' ? 10 : 3,
      isActive: true,
    }

    setDrawingTool(tool)
  }

  const deactivateDrawingTool = () => {
    drawingState.value.currentTool.isActive = false
  }

  const startDrawing = (point: Point) => {
    if (!drawingState.value.currentTool.isActive) return

    const stroke: Stroke = {
      id: generateStrokeId(),
      tool: drawingState.value.currentTool.type,
      points: [point],
      color: drawingState.value.currentTool.color,
      size: drawingState.value.currentTool.size,
      timestamp: new Date(),
    }

    drawingState.value.currentStroke = stroke
    drawingState.value.isDrawing = true
  }

  const addPointToStroke = (point: Point) => {
    if (!drawingState.value.isDrawing || !drawingState.value.currentStroke) return

    drawingState.value.currentStroke.points.push(point)
  }

  const endDrawing = () => {
    if (!drawingState.value.currentStroke) return

    drawingState.value.strokes.push(drawingState.value.currentStroke)
    drawingState.value.currentStroke = null
    drawingState.value.isDrawing = false
  }

  const clearDrawings = () => {
    drawingState.value.strokes = []
    drawingState.value.currentStroke = null
    drawingState.value.isDrawing = false
  }

  const removeStroke = (strokeId: string) => {
    const index = drawingState.value.strokes.findIndex(s => s.id === strokeId)
    if (index !== -1) {
      drawingState.value.strokes.splice(index, 1)
    }
  }

  const updatePresentationConfig = (config: Partial<PresentationConfig>) => {
    presentationConfig.value = { ...presentationConfig.value, ...config }

    // Restart auto play if config changed and playing
    if (state.value.isPlaying && state.value.autoPlay) {
      stopAutoPlay()
      startAutoPlay()
    }
  }

  const reset = () => {
    state.value = {
      currentPageIndex: 0,
      isPlaying: false,
      isFullscreen: false,
      showControls: true,
      autoPlay: false,
      loop: false,
      transition: 'fade',
    }

    drawingState.value = {
      isDrawing: false,
      currentTool: {
        type: 'pen',
        color: '#ff0000',
        size: 3,
        isActive: false,
      },
      strokes: [],
      currentStroke: null,
    }

    stopAutoPlay()
  }

  // Helper functions
  const generateStrokeId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Keyboard shortcuts
  const handleKeyPress = (event: KeyboardEvent) => {
    if (!presentationConfig.value.enableKeyboardShortcuts) return

    switch (event.key) {
      case 'ArrowRight':
      case ' ':
        event.preventDefault()
        nextPage()
        break
      case 'ArrowLeft':
        event.preventDefault()
        previousPage()
        break
      case 'F11':
        event.preventDefault()
        toggleFullscreen()
        break
      case 'Escape':
        if (state.value.isFullscreen) {
          exitFullscreen()
        }
        break
      case 'p':
      case 'P':
        event.preventDefault()
        togglePlay()
        break
      case 'c':
      case 'C':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          clearDrawings()
        }
        break
    }
  }

  return {
    // State
    state,
    floatingButtonConfig,
    drawingState,
    presentationConfig,

    // Getters
    canGoNext,
    canGoPrevious,
    currentTool,
    hasDrawings,

    // Actions
    setCurrentPage,
    nextPage,
    previousPage,
    goToPage,
    play,
    pause,
    togglePlay,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    showControlsBar,
    hideControlsBar,
    toggleControlsBar,
    setTransition,
    updateFloatingButtonConfig,
    setDrawingTool,
    activateDrawingTool,
    deactivateDrawingTool,
    startDrawing,
    addPointToStroke,
    endDrawing,
    clearDrawings,
    removeStroke,
    updatePresentationConfig,
    reset,
    handleKeyPress,
  }
})