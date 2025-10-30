<template>
  <div class="editor-view">
    <!-- 顶部项目信息栏 -->
    <div class="project-header">
      <div class="project-info">
        <el-button
          :icon="ArrowLeft"
          size="small"
          @click="goBackToProject"
        >
          返回项目
        </el-button>
        <div class="project-details">
          <h3>{{ currentProject?.name || '未知项目' }}</h3>
          <span class="project-meta">
            {{ currentProject?.pages.length || 0 }} 页 |
            最后修改: {{ formatDate(currentProject?.updatedAt) }}
          </span>
        </div>
      </div>
      <div class="header-actions">
        <el-button
          size="small"
          :icon="Download"
          :loading="projectStore.isLoading"
          @click="saveProject"
        >
          保存
        </el-button>
        <el-button
          size="small"
          :icon="VideoPlay"
          :disabled="!currentProject || currentProject.pages.length === 0"
          @click="startPresentation"
        >
          播放
        </el-button>
      </div>
    </div>

    <!-- 主编辑区域 -->
    <div class="editor-main">
      <!-- 左侧页面缩略图列表 -->
      <div class="page-thumbnails">
        <div class="thumbnails-header">
          <span>页面</span>
          <el-button
            size="small"
            :icon="Plus"
            circle
            @click="addNewPage"
          />
        </div>
        <div class="thumbnails-list">
          <div
            v-for="(page, index) in currentProject?.pages || []"
            :key="page.id"
            class="thumbnail-item"
            :class="{
              active: currentPageId === page.id,
              dragging: draggedPageId === page.id,
              'drag-over': dragOverIndex === index
            }"
            draggable="true"
            @click="handlePageClick(page.id)"
            @dragstart="handleDragStart($event, page.id, index)"
            @dragend="handleDragEnd"
            @dragover="handleDragOver($event, index)"
            @dragleave="handleDragLeave"
            @drop="handleDrop($event, index)"
          >
            <div class="thumbnail-preview">
              <div class="page-number">{{ index + 1 }}</div>
              <div class="preview-content" v-html="page.html"></div>
            </div>
            <div class="thumbnail-title">{{ page.name || `页面 ${index + 1}` }}</div>
            <div class="drag-handle" title="拖拽调整顺序">
              <el-icon><Rank /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧编辑区域 -->
      <div class="edit-area">
        <!-- 编辑模式切换 -->
        <div class="edit-mode-switch">
          <el-radio-group v-model="editMode" size="small">
            <el-radio-button value="preview">预览</el-radio-button>
            <el-radio-button value="edit">编辑</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 编辑内容区域 -->
        <div class="edit-content">
          <!-- 预览模式 -->
          <div v-if="editMode === 'preview'" class="preview-area">
            <div class="preview-container">
              <iframe
                ref="previewFrame"
                class="page-preview"
                :srcdoc="previewContent"
                frameborder="0"
              ></iframe>
            </div>
          </div>

          <!-- 编辑模式 -->
          <div v-else class="code-editor-area">
            <div class="editor-tabs">
              <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
                <el-tab-pane label="HTML" name="html">
                  <div class="editor-container">
                    <div ref="htmlEditorRef" class="monaco-editor-container"></div>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="CSS" name="css">
                  <div class="editor-container">
                    <div ref="cssEditorRef" class="monaco-editor-container"></div>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="JavaScript" name="js">
                  <div class="editor-container">
                    <div ref="jsEditorRef" class="monaco-editor-container"></div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PPT播放器 -->
    <PresentationPlayer
      v-if="isPlaying"
      :pages="currentProject?.pages || []"
      :initial-page-index="getCurrentPageIndex()"
      @close="stopPresentation"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Download, VideoPlay, Plus, Rank } from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/project'
import * as monaco from 'monaco-editor'
import PresentationPlayer from '@/components/Player/PresentationPlayer.vue'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()

// 响应式数据
const editMode = ref<'preview' | 'edit'>('preview')
const activeTab = ref('html')
const currentPageId = ref<string>('')
const previewFrame = ref<HTMLIFrameElement>()

// 拖拽相关状态
const draggedPageId = ref<string>('')
const draggedFromIndex = ref<number>(-1)
const dragOverIndex = ref<number>(-1)
const isDragging = ref<boolean>(false)

// 播放相关状态
const isPlaying = ref<boolean>(false)

// Monaco 编辑器实例
const htmlEditorRef = ref<HTMLElement>()
const cssEditorRef = ref<HTMLElement>()
const jsEditorRef = ref<HTMLElement>()
let currentEditor: monaco.editor.IStandaloneCodeEditor | null = null

// 计算属性
const currentProject = computed(() => projectStore.currentProject)
const currentPage = computed(() => {
  if (!currentProject.value || !currentPageId.value) return null
  return currentProject.value.pages.find(p => p.id === currentPageId.value) || null
})

const previewContent = computed(() => {
  if (!currentPage.value) {
    return generatePreviewHTML('预览', '', '<div style="text-align: center; padding: 100px 20px; color: #909399;">选择一个页面开始编辑</div>', '')
  }

  return generatePreviewHTML(
    currentPage.value.name,
    currentPage.value.css || '',
    currentPage.value.html || '',
    currentPage.value.js || ''
  )
})

const generatePreviewHTML = (title: string, css: string, html: string, js: string) => {
  // 使用字符串拼接避免 Vue 编译器解析 HTML 标签
  const doctype = '<!DOCTYPE html>'
  const htmlOpen = '<html>'
  const htmlClose = '<' + '/html>'
  const headOpen = '<head>'
  const headClose = '<' + '/head>'
  const bodyOpen = '<body>'
  const bodyClose = '<' + '/body>'
  const styleOpen = '<style>'
  const styleClose = '<' + '/style>'
  const scriptOpen = '<script>'
  const scriptClose = '<' + '/script>'
  const titleTag = '<title>' + title + '<' + '/title>'
  const metaCharset = '<meta charset="UTF-8">'
  const metaViewport = '<meta name="viewport" content="width=device-width, initial-scale=1.0">'

  return [
    doctype,
    htmlOpen,
    headOpen,
    metaCharset,
    metaViewport,
    titleTag,
    styleOpen,
    css,
    styleClose,
    headClose,
    bodyOpen,
    html,
    scriptOpen,
    js,
    scriptClose,
    bodyClose,
    htmlClose
  ].join('\n')
}

// 方法
const goBackToProject = () => {
  router.push('/project')
}

const addNewPage = () => {
  if (!currentProject.value) return

  const newPage = projectStore.addPage(`页面 ${currentProject.value.pages.length + 1}`)
  currentPageId.value = newPage.id
  ElMessage.success('新页面已添加')
}

const saveProject = async () => {
  if (!currentProject.value) {
    ElMessage.error('没有可保存的项目')
    return
  }

  try {
    // 如果是文件夹项目，使用文件夹保存
    if (currentProject.value.path) {
      await projectStore.saveCurrentProject()
      ElMessage.success('项目已保存到文件夹')
    } else {
      // 如果是内存项目，提供下载JSON的选项
      const projectData = JSON.stringify(currentProject.value, null, 2)
      const blob = new Blob([projectData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `${currentProject.value.name}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      ElMessage.success('项目已下载为JSON文件')
    }
  } catch (error) {
    console.error('Save project failed:', error)
    ElMessage.error(error instanceof Error ? error.message : '保存项目失败')
  }
}

// 页面点击处理
const handlePageClick = (pageId: string) => {
  // 如果刚刚结束拖拽，不触发选择页面
  if (isDragging.value) {
    isDragging.value = false
    return
  }
  selectPage(pageId)
}

// 拖拽相关方法
const handleDragStart = (event: DragEvent, pageId: string, index: number) => {
  isDragging.value = true
  draggedPageId.value = pageId
  draggedFromIndex.value = index

  // 设置拖拽数据
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', pageId)
  }
}

const handleDragEnd = () => {
  // 清理拖拽状态
  draggedPageId.value = ''
  draggedFromIndex.value = -1
  dragOverIndex.value = -1

  // 延迟重置拖拽标记，防止点击事件误触发
  setTimeout(() => {
    isDragging.value = false
  }, 100)
}

const handleDragOver = (event: DragEvent, index: number) => {
  event.preventDefault()

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }

  // 只有当拖拽的不是当前位置时才显示拖拽提示
  if (draggedFromIndex.value !== index) {
    dragOverIndex.value = index
  }
}

const handleDragLeave = () => {
  dragOverIndex.value = -1
}

const handleDrop = (event: DragEvent, toIndex: number) => {
  event.preventDefault()

  const fromIndex = draggedFromIndex.value

  // 如果拖拽到相同位置，不做任何操作
  if (fromIndex === toIndex || fromIndex === -1) {
    handleDragEnd()
    return
  }

  // 调用store方法重新排序页面
  try {
    projectStore.reorderPages(fromIndex, toIndex)

    // 如果是文件夹项目，自动保存
    if (currentProject.value?.path) {
      projectStore.saveCurrentProject().then(() => {
        ElMessage.success('页面顺序已更新并保存')
      }).catch((error) => {
        console.error('Failed to save after reorder:', error)
        ElMessage.warning('页面顺序已更新，但保存失败')
      })
    } else {
      ElMessage.success('页面顺序已更新')
    }
  } catch (error) {
    console.error('Failed to reorder pages:', error)
    ElMessage.error('调整页面顺序失败')
  }

  // 清理拖拽状态
  handleDragEnd()
}

// 播放相关方法
const startPresentation = () => {
  if (!currentProject.value || currentProject.value.pages.length === 0) {
    ElMessage.error('没有可播放的页面')
    return
  }

  isPlaying.value = true
}

const stopPresentation = () => {
  isPlaying.value = false
}

const getCurrentPageIndex = () => {
  if (!currentProject.value || !currentPageId.value) return 0

  const index = currentProject.value.pages.findIndex(page => page.id === currentPageId.value)
  return index >= 0 ? index : 0
}

const selectPage = (pageId: string) => {
  currentPageId.value = pageId
  // 如果在编辑模式，重新初始化编辑器
  if (editMode.value === 'edit') {
    nextTick(() => {
      initCurrentEditor()
    })
  }
}

const handleTabChange = () => {
  if (editMode.value === 'edit') {
    nextTick(() => {
      initCurrentEditor()
    })
  }
}

const getCurrentContent = () => {
  if (!currentPage.value) return ''

  switch (activeTab.value) {
    case 'html':
      return currentPage.value.html || ''
    case 'css':
      return currentPage.value.css || ''
    case 'js':
      return currentPage.value.js || ''
    default:
      return ''
  }
}

const updateCurrentContent = (value: string) => {
  if (!currentPage.value) return

  const updates: any = {}
  updates[activeTab.value] = value

  projectStore.updatePage(currentPage.value.id, updates)
}

const getLanguage = () => {
  switch (activeTab.value) {
    case 'html':
      return 'html'
    case 'css':
      return 'css'
    case 'js':
      return 'javascript'
    default:
      return 'text'
  }
}

const getCurrentContainer = () => {
  switch (activeTab.value) {
    case 'html':
      return htmlEditorRef.value
    case 'css':
      return cssEditorRef.value
    case 'js':
      return jsEditorRef.value
    default:
      return null
  }
}

const disposeCurrentEditor = () => {
  if (currentEditor) {
    currentEditor.dispose()
    currentEditor = null
  }
}

const initCurrentEditor = async () => {
  // 销毁当前编辑器
  disposeCurrentEditor()

  // 等待 DOM 更新
  await nextTick()

  const container = getCurrentContainer()
  if (!container) {
    return
  }

  // 等待容器完全渲染
  await new Promise(resolve => setTimeout(resolve, 100))

  try {
    currentEditor = monaco.editor.create(container, {
      value: getCurrentContent(),
      language: getLanguage(),
      theme: 'vs',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      automaticLayout: true,
      wordWrap: 'on',
      lineNumbers: 'on',
      folding: true,
    })

    currentEditor.onDidChangeModelContent(() => {
      if (currentEditor) {
        updateCurrentContent(currentEditor.getValue())
      }
    })

    // 强制重新布局
    setTimeout(() => {
      if (currentEditor) {
        currentEditor.layout()
      }
    }, 100)

  } catch (error) {
    console.error('Monaco Editor error:', error)
    ElMessage.error('编辑器初始化失败，请刷新页面重试')
  }
}

const formatDate = (date?: Date) => {
  if (!date) return '-'
  return date.toLocaleDateString('zh-CN')
}

// 监听编辑模式变化
watch(editMode, async (newMode) => {
  if (newMode === 'edit') {
    await nextTick()
    initCurrentEditor()
  } else {
    // 切换到预览模式时销毁编辑器
    disposeCurrentEditor()
  }
})

// 生命周期
onMounted(() => {
  const projectId = route.params.projectId as string

  // 检查是否有当前项目且ID匹配
  if (projectStore.currentProject && projectStore.currentProject.id === projectId) {
    // 设置第一个页面为当前页面
    if (projectStore.currentProject.pages.length > 0) {
      currentPageId.value = projectStore.currentProject.pages[0].id
    }
  } else {
    // 尝试从缓存中查找项目
    const cachedProject = projectStore.projectsCache.find(p => p.id === projectId)
    if (cachedProject) {
      // 从缓存加载项目
      projectStore.loadProjectFromCache(cachedProject).then(() => {
        if (projectStore.currentProject && projectStore.currentProject.pages.length > 0) {
          currentPageId.value = projectStore.currentProject.pages[0].id
        }
      }).catch(error => {
        console.error('Failed to load project from cache:', error)
        ElMessage.error('加载项目失败')
        router.push('/project')
      })
    } else {
      ElMessage.error('项目不存在')
      router.push('/project')
    }
  }
})

onBeforeUnmount(() => {
  // 清理 Monaco 编辑器实例
  disposeCurrentEditor()
})
</script>

<style scoped>
.editor-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.project-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.project-details h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.project-meta {
  font-size: 12px;
  color: #909399;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.editor-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.page-thumbnails {
  width: 240px;
  background: white;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.thumbnails-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 600;
  color: #303133;
}

.thumbnails-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.thumbnail-item {
  margin-bottom: 8px;
  padding: 8px;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  user-select: none;
}

.thumbnail-item:hover {
  background: #f5f7fa;
}

.thumbnail-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.thumbnail-item.dragging {
  opacity: 0.5;
  transform: rotate(5deg);
  z-index: 1000;
}

.thumbnail-item.drag-over {
  border-color: #67c23a;
  background: #f0f9ff;
  transform: scale(1.02);
}

.drag-handle {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  opacity: 0;
  transition: opacity 0.2s;
}

.thumbnail-item:hover .drag-handle {
  opacity: 1;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle .el-icon {
  font-size: 12px;
  color: #606266;
}

.thumbnail-preview {
  position: relative;
  width: 100%;
  height: 120px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.page-number {
  position: absolute;
  top: 4px;
  left: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  z-index: 1;
}

.preview-content {
  width: 100%;
  height: 100%;
  transform: scale(0.2);
  transform-origin: top left;
  pointer-events: none;
}

.thumbnail-title {
  font-size: 12px;
  color: #606266;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.edit-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.edit-mode-switch {
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.edit-content {
  flex: 1;
  overflow: hidden;
}

.preview-area {
  height: 100%;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-container {
  width: 90%;
  max-width: 800px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.page-preview {
  width: 100%;
  min-height: 500px;
  padding: 20px;
}

.code-editor-area {
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
}

.editor-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-tabs :deep(.el-tabs__header) {
  margin: 0;
  flex-shrink: 0;
}

.editor-tabs :deep(.el-tabs__content) {
  flex: 1;
  height: 0; /* 强制使用 flexbox */
  padding: 0;
}

.editor-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.editor-container {
  height: 100%;
  width: 100%;
  position: relative;
}

.monaco-editor-container {
  height: 100%;
  width: 100%;
  min-height: 400px; /* 最小高度 */
}
</style>
