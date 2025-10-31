<template>
  <div v-if="isPlaying" class="presentation-player" @keydown="handleKeydown" tabindex="0">
    <!-- 当前页面内容 -->
    <div class="slide-container">
      <div class="slide-content" ref="slideContent">
        <!-- 页面HTML内容 -->
        <div v-html="currentSlideHtml" class="slide-html"></div>
        <!-- 画布层 -->
        <canvas
          ref="drawingCanvas"
          :class="[
            'drawing-canvas',
            {
              'pen-cursor': currentTool === 'pen',
              'eraser-cursor': currentTool === 'eraser',
              'laser-cursor': laserPointerActive
            }
          ]"
          @mousedown="startDrawing"
          @mousemove="handleMouseMove"
          @mouseup="stopDrawing"
          @mouseleave="stopDrawing"
        ></canvas>
        <!-- 激光笔 -->
        <div
          v-if="laserPointerActive"
          class="laser-pointer"
          :style="{ left: laserX + 'px', top: laserY + 'px' }"
        ></div>
      </div>
    </div>

    <!-- 左侧翻页控制 -->
    <div class="page-controls page-controls-left">
      <button
        :disabled="currentPageIndex === 0"
        @click="previousPage"
        class="control-button"
        title="上一页"
      >
        <el-icon><ArrowUp /></el-icon>
      </button>
      <button
        :disabled="currentPageIndex >= pages.length - 1"
        @click="nextPage"
        class="control-button"
        title="下一页"
      >
        <el-icon><ArrowDown /></el-icon>
      </button>
    </div>

    <!-- 右侧翻页控制 -->
    <div class="page-controls page-controls-right">
      <button
        :disabled="currentPageIndex === 0"
        @click="previousPage"
        class="control-button"
        title="上一页"
      >
        <el-icon><ArrowUp /></el-icon>
      </button>
      <button
        :disabled="currentPageIndex >= pages.length - 1"
        @click="nextPage"
        class="control-button"
        title="下一页"
      >
        <el-icon><ArrowDown /></el-icon>
      </button>
    </div>

    <!-- 浮动工具箱 -->
    <div
      :class="['floating-toolbar', { transparent: isToolbarTransparent }]"
      :style="{ left: toolbarX + 'px', top: toolbarY + 'px' }"
      @mouseenter="handleToolbarMouseEnter"
      @mouseleave="handleToolbarMouseLeave"
    >
      <div class="toolbar-handle" @mousedown="startDragToolbar">
        <el-icon><Rank /></el-icon>
      </div>

      <div class="toolbar-content">
        <!-- 画笔工具 -->
        <button
          :class="['tool-button', { active: currentTool === 'pen' }]"
          @click="selectTool('pen')"
          title="画笔"
        >
          <el-icon><Edit /></el-icon>
        </button>

        <!-- 画笔选项 -->
        <div v-if="currentTool === 'pen'" class="tool-options-inline" @mousedown.stop>
          <div class="preset-colors-inline">
            <button
              v-for="color in presetColors"
              :key="color"
              :class="['color-button-small', { active: penColor === color }]"
              :style="{ backgroundColor: color }"
              @click="setPenColor(color)"
              :title="`颜色: ${color}`"
            ></button>
          </div>
          <div class="preset-sizes-inline">
            <button
              v-for="size in presetPenSizes"
              :key="size"
              :class="['size-button-small', { active: penSize === size }]"
              @click="setPenSize(size)"
              :title="`大小: ${size}px`"
            >
              {{ size }}
            </button>
          </div>
        </div>

        <!-- 橡皮工具 -->
        <button
          :class="['tool-button', { active: currentTool === 'eraser' }]"
          @click="selectTool('eraser')"
          title="橡皮"
        >
          <el-icon><Delete /></el-icon>
        </button>

        <!-- 橡皮选项 -->
        <div v-if="currentTool === 'eraser'" class="tool-options-inline" @mousedown.stop>
          <div class="preset-sizes-inline">
            <button
              v-for="size in presetEraserSizes"
              :key="size"
              :class="['size-button-small', { active: eraserSize === size }]"
              @click="setEraserSize(size)"
              :title="`大小: ${size}px`"
            >
              {{ size }}
            </button>
          </div>
          <button
            class="clear-button-small"
            @click="clearAllDrawings"
            title="清除全部"
          >
            清除
          </button>
        </div>

        <!-- 激光笔 -->
        <button
          :class="['tool-button', { active: laserPointerActive }]"
          @click="toggleLaserPointer"
          title="激光笔"
        >
          <el-icon><Location /></el-icon>
        </button>

        <!-- 关闭播放 -->
        <button
          class="tool-button close-button"
          @click="exitPresentation"
          title="退出播放"
        >
          <el-icon><Close /></el-icon>
        </button>
      </div>
    </div>

    <!-- 页面指示器 -->
    <div class="page-indicator">
      {{ currentPageIndex + 1 }} / {{ pages.length }}
    </div>

    <!-- 样式注入 -->
    <component :is="'style'" v-if="currentSlideStyle">
      {{ currentSlideStyle }}
    </component>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElButton, ElSlider, ElIcon } from 'element-plus'
import {
  ArrowUp,
  ArrowDown,
  Edit,
  Delete,
  Location,
  Close,
  Rank
} from '@element-plus/icons-vue'
import type { Page } from '@/types'

interface Props {
  pages: Page[]
  initialPageIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialPageIndex: 0
})

const emit = defineEmits<{
  close: []
}>()

// 响应式数据
const isPlaying = ref(true)
const currentPageIndex = ref(props.initialPageIndex)
const slideContent = ref<HTMLElement>()
const drawingCanvas = ref<HTMLCanvasElement>()

// 工具状态
const currentTool = ref<'pen' | 'eraser' | 'none'>('none')
const penColor = ref('#ff0000')
const penSize = ref(3)
const eraserSize = ref(20)
const laserPointerActive = ref(false)
const laserX = ref(0)
const laserY = ref(0)

// 预设选项
const presetColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff']
const presetPenSizes = [2, 4, 6, 8]
const presetEraserSizes = [10, 20, 30, 40]

// 工具箱位置
const toolbarX = ref(window.innerWidth / 2 - 150)
const toolbarY = ref(20)
const isDraggingToolbar = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const isToolbarTransparent = ref(false)
let toolbarTimer: NodeJS.Timeout | null = null

// 绘画状态
const isDrawing = ref(false)
const drawingContext = ref<CanvasRenderingContext2D | null>(null)
const lastX = ref(0)
const lastY = ref(0)

// 画布数据存储 - 为每个页面保存绘制内容
const canvasDataMap = ref<Map<number, ImageData>>(new Map())

// 计算属性
const currentSlide = computed(() => {
  return props.pages[currentPageIndex.value] || null
})

const currentSlideHtml = computed(() => {
  return currentSlide.value?.html || ''
})

const currentSlideStyle = computed(() => {
  const globalStyle = `
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      font-family: 'Microsoft YaHei', Arial, sans-serif;
      background: #f5f7fa;
    }
    .slide-html {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #f5f7fa;
    }
  `
  return globalStyle + (currentSlide.value?.css || '')
})

// 方法
const previousPage = () => {
  if (currentPageIndex.value > 0) {
    // 保存当前页面的绘制内容
    saveCanvasData()
    currentPageIndex.value--
    // 恢复上一页的绘制内容
    nextTick(() => {
      restoreCanvasData()
    })
  }
}

const nextPage = () => {
  if (currentPageIndex.value < props.pages.length - 1) {
    // 保存当前页面的绘制内容
    saveCanvasData()
    currentPageIndex.value++
    // 恢复下一页的绘制内容
    nextTick(() => {
      restoreCanvasData()
    })
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowLeft':
    case 'ArrowUp':
    case 'PageUp':
      event.preventDefault()
      previousPage()
      break
    case 'ArrowRight':
    case 'ArrowDown':
    case 'PageDown':
    case ' ':
      event.preventDefault()
      nextPage()
      break
    case 'Escape':
      event.preventDefault()
      exitPresentation()
      break
  }
}

const selectTool = (tool: 'pen' | 'eraser') => {
  if (currentTool.value === tool) {
    currentTool.value = 'none'
  } else {
    currentTool.value = tool
    laserPointerActive.value = false
  }
}

const setPenColor = (color: string) => {
  penColor.value = color
  if (drawingContext.value) {
    drawingContext.value.strokeStyle = color
  }
}

const setPenSize = (size: number) => {
  penSize.value = size
  if (drawingContext.value) {
    drawingContext.value.lineWidth = size
  }
}

const setEraserSize = (size: number) => {
  eraserSize.value = size
}

const toggleLaserPointer = () => {
  laserPointerActive.value = !laserPointerActive.value
  if (laserPointerActive.value) {
    currentTool.value = 'none'
  }
}

const updateLaserPosition = (event: MouseEvent) => {
  if (laserPointerActive.value) {
    laserX.value = event.clientX
    laserY.value = event.clientY
  }
}

const handleMouseMove = (event: MouseEvent) => {
  if (laserPointerActive.value) {
    updateLaserPosition(event)
  } else {
    draw(event)
  }
}

const startDrawing = (event: MouseEvent) => {
  if (currentTool.value === 'none') return

  isDrawing.value = true
  const rect = drawingCanvas.value!.getBoundingClientRect()
  lastX.value = event.clientX - rect.left
  lastY.value = event.clientY - rect.top

  if (drawingContext.value) {
    drawingContext.value.beginPath()
    drawingContext.value.moveTo(lastX.value, lastY.value)
  }
}

const draw = (event: MouseEvent) => {
  if (!isDrawing.value || currentTool.value === 'none' || !drawingContext.value) return

  const rect = drawingCanvas.value!.getBoundingClientRect()
  const currentX = event.clientX - rect.left
  const currentY = event.clientY - rect.top

  if (currentTool.value === 'pen') {
    drawingContext.value.globalCompositeOperation = 'source-over'
    drawingContext.value.strokeStyle = penColor.value
    drawingContext.value.lineWidth = penSize.value
    drawingContext.value.lineCap = 'round'
    drawingContext.value.lineJoin = 'round'

    drawingContext.value.lineTo(currentX, currentY)
    drawingContext.value.stroke()
    drawingContext.value.beginPath()
    drawingContext.value.moveTo(currentX, currentY)
  } else if (currentTool.value === 'eraser') {
    drawingContext.value.globalCompositeOperation = 'destination-out'
    drawingContext.value.lineWidth = eraserSize.value
    drawingContext.value.lineCap = 'round'
    drawingContext.value.lineJoin = 'round'

    drawingContext.value.lineTo(currentX, currentY)
    drawingContext.value.stroke()
    drawingContext.value.beginPath()
    drawingContext.value.moveTo(currentX, currentY)
  }

  lastX.value = currentX
  lastY.value = currentY

  // 绘制后自动保存当前页面的画布状态
  saveCanvasData()
}

const stopDrawing = () => {
  if (isDrawing.value && drawingContext.value) {
    drawingContext.value.beginPath()
  }
  isDrawing.value = false
}

const clearAllDrawings = () => {
  if (drawingContext.value && drawingCanvas.value) {
    drawingContext.value.clearRect(0, 0, drawingCanvas.value.width, drawingCanvas.value.height)
    // 从存储中删除当前页面的绘制数据
    canvasDataMap.value.delete(currentPageIndex.value)
  }
}

const saveCanvasData = () => {
  if (drawingContext.value && drawingCanvas.value) {
    const imageData = drawingContext.value.getImageData(0, 0, drawingCanvas.value.width, drawingCanvas.value.height)
    canvasDataMap.value.set(currentPageIndex.value, imageData)
  }
}

const restoreCanvasData = () => {
  if (drawingContext.value && drawingCanvas.value) {
    drawingContext.value.clearRect(0, 0, drawingCanvas.value.width, drawingCanvas.value.height)
    const savedData = canvasDataMap.value.get(currentPageIndex.value)
    if (savedData) {
      drawingContext.value.putImageData(savedData, 0, 0)
    }
  }
}

const startDragToolbar = (event: MouseEvent) => {
  isDraggingToolbar.value = true
  dragStartX.value = event.clientX - toolbarX.value
  dragStartY.value = event.clientY - toolbarY.value
  resetToolbarTimer()

  const handleMouseMove = (e: MouseEvent) => {
    if (isDraggingToolbar.value) {
      toolbarX.value = e.clientX - dragStartX.value
      toolbarY.value = e.clientY - dragStartY.value
    }
  }

  const handleMouseUp = () => {
    isDraggingToolbar.value = false
    startToolbarTimer()
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleToolbarMouseEnter = () => {
  resetToolbarTimer()
}

const handleToolbarMouseLeave = () => {
  startToolbarTimer()
}

const startToolbarTimer = () => {
  resetToolbarTimer()
  toolbarTimer = setTimeout(() => {
    isToolbarTransparent.value = true
  }, 3000) // 3秒后变透明
}

const resetToolbarTimer = () => {
  if (toolbarTimer) {
    clearTimeout(toolbarTimer)
    toolbarTimer = null
  }
  isToolbarTransparent.value = false
}

const exitPresentation = () => {
  isPlaying.value = false
  emit('close')
}

const initCanvas = () => {
  nextTick(() => {
    if (drawingCanvas.value) {
      drawingCanvas.value.width = window.innerWidth
      drawingCanvas.value.height = window.innerHeight
      drawingContext.value = drawingCanvas.value.getContext('2d')

      if (drawingContext.value) {
        drawingContext.value.strokeStyle = penColor.value
        drawingContext.value.lineWidth = penSize.value
        drawingContext.value.lineCap = 'round'
        drawingContext.value.lineJoin = 'round'
      }
    }
  })
}

const handleResize = () => {
  // 保存当前画布内容
  saveCanvasData()

  if (drawingCanvas.value) {
    drawingCanvas.value.width = window.innerWidth
    drawingCanvas.value.height = window.innerHeight

    // 恢复当前页面的画布内容
    nextTick(() => {
      restoreCanvasData()
    })
  }
}

// 监听页面变化，执行JS代码并恢复画布
watch(currentSlide, (newSlide, oldSlide) => {
  if (newSlide && newSlide.js) {
    try {
      // 在安全的环境中执行JS代码
      new Function(newSlide.js)()
    } catch (error) {
      console.warn('Failed to execute page script:', error)
    }
  }

  // 如果页面发生了变化（不是初始化），恢复画布内容
  if (oldSlide !== undefined && newSlide !== oldSlide) {
    nextTick(() => {
      restoreCanvasData()
    })
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  // 进入全屏
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen()
  }

  // 初始化画布
  initCanvas()

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)

  // 启动工具栏定时器
  startToolbarTimer()

  // 聚焦以接收键盘事件
  nextTick(() => {
    const player = document.querySelector('.presentation-player') as HTMLElement
    if (player) {
      player.focus()
    }
  })
})

onUnmounted(() => {
  // 退出全屏
  if (document.fullscreenElement) {
    document.exitFullscreen()
  }

  // 清理定时器
  resetToolbarTimer()

  // 移除事件监听
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.presentation-player {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #f5f7fa;
  z-index: 9999;
  overflow: hidden;
  outline: none;
}

.slide-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.slide-content {
  position: relative;
  width: 100%;
  height: 100%;
}

.slide-html {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.drawing-canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  cursor: default;
}

.drawing-canvas.pen-cursor {
  cursor: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMiIgZmlsbD0iIzAwMCIvPgo8L3N2Zz4K') 12 12, crosshair;
}

.drawing-canvas.eraser-cursor {
  cursor: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+Cg==') 12 12, pointer;
}

.drawing-canvas.laser-cursor {
  cursor: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNCIgZmlsbD0iI2ZmMDAwMCIgZmlsbC1vcGFjaXR5PSIwLjgiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMiIgZmlsbD0iI2ZmMDAwMCIvPgo8L3N2Zz4K') 12 12, pointer;
}

.laser-pointer {
  position: fixed;
  width: 12px;
  height: 12px;
  background: radial-gradient(circle, #ff0000 0%, rgba(255, 0, 0, 0.9) 40%, rgba(255, 0, 0, 0.5) 70%, transparent 100%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 3;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 8px rgba(255, 0, 0, 0.6);
  animation: laser-pulse 1s ease-in-out infinite alternate;
}

@keyframes laser-pulse {
  0% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

.page-controls {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 20px;
  z-index: 4;
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

.page-controls:hover {
  opacity: 1;
}

.page-controls-left {
  left: 20px;
}

.page-controls-right {
  right: 20px;
}

.control-button {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.control-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.control-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.floating-toolbar {
  position: fixed;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 25px;
  padding: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 1;
  transition: opacity 0.5s ease;
}

.floating-toolbar.transparent {
  opacity: 0.3;
}

.floating-toolbar:hover {
  opacity: 1;
}

.toolbar-handle {
  color: #666;
  cursor: grab;
  padding: 6px;
  border-radius: 50%;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.toolbar-handle:hover {
  background: rgba(0, 0, 0, 0.05);
}

.toolbar-handle:active {
  cursor: grabbing;
}

.toolbar-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tool-item {
  display: flex;
  align-items: center;
  position: relative;
}

.tool-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid transparent;
  background: rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-button:hover {
  background: rgba(0, 0, 0, 0.1);
}

.tool-button.active {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.1);
}

.tool-button.close-button {
  background: rgba(255, 0, 0, 0.1);
  border-color: transparent;
}

.tool-button.close-button:hover {
  background: rgba(255, 0, 0, 0.2);
}

.tool-options-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 6px;
  padding-left: 6px;
  border-left: 1px solid rgba(0, 0, 0, 0.1);
}

.preset-colors-inline {
  display: flex;
  gap: 3px;
}

.preset-sizes-inline {
  display: flex;
  gap: 3px;
}

.color-button-small {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-button-small:hover {
  transform: scale(1.1);
}

.color-button-small.active {
  border-color: #000;
  transform: scale(1.1);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.size-button-small {
  min-width: 24px;
  height: 20px;
  border-radius: 10px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 10px;
  padding: 0 6px;
}

.size-button-small:hover {
  background: #f0f0f0;
}

.size-button-small.active {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.clear-button-small {
  height: 20px;
  border-radius: 10px;
  border: 1px solid #ff4757;
  background: rgba(255, 71, 87, 0.1);
  color: #ff4757;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 10px;
  padding: 0 8px;
}

.clear-button-small:hover {
  background: rgba(255, 71, 87, 0.2);
}

.page-indicator {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  z-index: 4;
  backdrop-filter: blur(10px);
}
</style>