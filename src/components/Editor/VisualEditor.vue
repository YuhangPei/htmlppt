<template>
  <div class="visual-editor">
    <!-- 编辑器工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <el-button-group>
          <el-button
            :icon="Pointer"
            :type="editorMode === 'select' ? 'primary' : 'default'"
            @click="setEditorMode('select')"
          >
            选择
          </el-button>
          <el-button
            :icon="Edit"
            :type="editorMode === 'edit' ? 'primary' : 'default'"
            @click="setEditorMode('edit')"
          >
            编辑
          </el-button>
        </el-button-group>

        <el-divider direction="vertical" />

        <el-button-group>
          <el-button :icon="DocumentAdd" @click="addTextComponent">
            文本
          </el-button>
          <el-button :icon="Picture" @click="addImageComponent">
            图片
          </el-button>
          <el-button :icon="VideoPlay" @click="addVideoComponent">
            视频
          </el-button>
          <el-button :icon="Grid" @click="addContainerComponent">
            容器
          </el-button>
        </el-button-group>
      </div>

      <div class="toolbar-center">
        <el-button-group>
          <el-button :icon="RefreshLeft" @click="undo">
            撤销
          </el-button>
          <el-button :icon="RefreshRight" @click="redo">
            重做
          </el-button>
        </el-button-group>

        <el-divider direction="vertical" />

        <el-button-group>
          <el-button :icon="View" @click="togglePreview">
            {{ editorStore.state.isPreviewMode ? '编辑' : '预览' }}
          </el-button>
          <el-button :icon="FullScreen" @click="toggleFullscreen">
            全屏
          </el-button>
        </el-button-group>
      </div>

      <div class="toolbar-right">
        <el-button
          :icon="MagicStick"
          @click="showStylePanel = !showStylePanel"
        >
          样式
        </el-button>
        <el-button
          :icon="FolderOpened"
          @click="showAssetPanel = !showAssetPanel"
        >
          资源
        </el-button>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-main">
      <!-- 左侧面板 -->
      <div v-show="showAssetPanel" class="editor-panel asset-panel">
        <div class="panel-header">
          <h4>资源管理</h4>
          <el-button
            size="small"
            :icon="Close"
            @click="showAssetPanel = false"
          />
        </div>
        <div class="panel-content">
          <el-tabs v-model="activeAssetTab" type="border-card">
            <el-tab-pane label="组件" name="components">
              <div class="component-library">
                <div
                  v-for="component in componentLibrary"
                  :key="component.name"
                  class="component-item"
                  draggable="true"
                  @dragstart="handleComponentDragStart(component, $event)"
                  @click="handleComponentClick(component)"
                >
                  <div class="component-icon">
                    <el-icon>
                      <component :is="component.icon" />
                    </el-icon>
                  </div>
                  <span class="component-name">{{ component.label }}</span>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="图片" name="images">
              <div class="image-library">
                <el-upload
                  class="upload-demo"
                  drag
                  :action="uploadUrl"
                  :on-success="handleImageUpload"
                  :show-file-list="false"
                  accept="image/*"
                >
                  <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                  <div class="el-upload__text">
                    将图片拖到此处，或<em>点击上传</em>
                  </div>
                </el-upload>
                <div class="image-list">
                  <div
                    v-for="image in uploadedImages"
                    :key="image.id"
                    class="image-item"
                    draggable="true"
                    @dragstart="handleImageDragStart(image, $event)"
                  >
                    <img :src="image.url" :alt="image.name" />
                    <span class="image-name">{{ image.name }}</span>
                  </div>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="模板" name="templates">
              <div class="template-library">
                <div
                  v-for="template in pageTemplates"
                  :key="template.id"
                  class="template-item"
                  @click="applyTemplate(template)"
                >
                  <div class="template-preview">
                    <img :src="template.thumbnail" :alt="template.name" />
                  </div>
                  <span class="template-name">{{ template.name }}</span>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 编辑器画布 -->
      <div class="editor-canvas">
        <div id="gjs-editor" class="gjs-editor"></div>
      </div>

      <!-- 右侧样式面板 -->
      <div v-show="showStylePanel" class="editor-panel style-panel">
        <div class="panel-header">
          <h4>样式设置</h4>
          <el-button
            size="small"
            :icon="Close"
            @click="showStylePanel = false"
          />
        </div>
        <div class="panel-content">
          <el-tabs v-model="activeStyleTab" type="border-card">
            <el-tab-pane label="属性" name="properties">
              <div class="style-properties">
                <div v-if="selectedComponent" class="property-group">
                  <h5>{{ selectedComponent.type }} 属性</h5>
                  <el-form :model="componentProperties" label-width="80px" size="small">
                    <el-form-item label="ID">
                      <el-input v-model="componentProperties.id" />
                    </el-form-item>
                    <el-form-item label="类名">
                      <el-input v-model="componentProperties.className" />
                    </el-form-item>
                    <el-form-item label="文本内容" v-if="selectedComponent.type === 'text'">
                      <el-input
                        v-model="componentProperties.text"
                        type="textarea"
                        :rows="3"
                      />
                    </el-form-item>
                  </el-form>
                </div>
                <div v-else class="no-selection">
                  <p>请选择一个组件来编辑属性</p>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="样式" name="styles">
              <div class="style-styles">
                <div v-if="selectedComponent" class="style-group">
                  <h5>样式设置</h5>
                  <el-form :model="componentStyles" label-width="80px" size="small">
                    <el-form-item label="宽度">
                      <el-input v-model="componentStyles.width" />
                    </el-form-item>
                    <el-form-item label="高度">
                      <el-input v-model="componentStyles.height" />
                    </el-form-item>
                    <el-form-item label="背景色">
                      <el-color-picker v-model="componentStyles.backgroundColor" />
                    </el-form-item>
                    <el-form-item label="文字颜色">
                      <el-color-picker v-model="componentStyles.color" />
                    </el-form-item>
                    <el-form-item label="字体大小">
                      <el-input-number v-model="componentStyles.fontSize" :min="1" />
                    </el-form-item>
                    <el-form-item label="边距">
                      <el-input-number v-model="componentStyles.margin" :min="0" />
                    </el-form-item>
                    <el-form-item label="内边距">
                      <el-input-number v-model="componentStyles.padding" :min="0" />
                    </el-form-item>
                  </el-form>
                </div>
                <div v-else class="no-selection">
                  <p>请选择一个组件来编辑样式</p>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="动画" name="animations">
              <div class="style-animations">
                <el-form label-width="80px" size="small">
                  <el-form-item label="进入动画">
                    <el-select v-model="animationSettings.enter">
                      <el-option label="无" value="none" />
                      <el-option label="淡入" value="fadeIn" />
                      <el-option label="滑入" value="slideIn" />
                      <el-option label="缩放" value="zoomIn" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="持续时间">
                    <el-input-number v-model="animationSettings.duration" :min="0" :step="0.1" />
                  </el-form-item>
                  <el-form-item label="延迟">
                    <el-input-number v-model="animationSettings.delay" :min="0" :step="0.1" />
                  </el-form-item>
                </el-form>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Pointer,
  Edit,
  DocumentAdd,
  Picture,
  VideoPlay,
  Grid,
  RefreshLeft,
  RefreshRight,
  View,
  FullScreen,
  MagicStick,
  FolderOpened,
  Close,
  UploadFilled,
} from '@element-plus/icons-vue'
import grapesjs from 'grapesjs'
import 'grapesjs/dist/css/grapes.min.css'
import { useEditorStore } from '@/stores/editor'
import { useProjectStore } from '@/stores/project'
import type { EditorComponent } from '@/types'

const editorStore = useEditorStore()
const projectStore = useProjectStore()

// 响应式数据
const editorMode = ref<'select' | 'edit'>('select')
const showStylePanel = ref(true)
const showAssetPanel = ref(true)
const activeAssetTab = ref('components')
const activeStyleTab = ref('properties')

// 组件库
const componentLibrary = ref([
  { name: 'text', label: '文本', icon: DocumentAdd },
  { name: 'image', label: '图片', icon: Picture },
  { name: 'video', label: '视频', icon: VideoPlay },
  { name: 'container', label: '容器', icon: Grid },
])

// 上传相关
const uploadUrl = '/api/upload'
const uploadedImages = ref([
  { id: '1', name: '示例图片1', url: 'https://via.placeholder.com/300x200' },
  { id: '2', name: '示例图片2', url: 'https://via.placeholder.com/400x300' },
])

// 页面模板
const pageTemplates = ref([
  {
    id: '1',
    name: '标题页',
    thumbnail: 'https://via.placeholder.com/200x150',
    content: '<h1>标题</h1><p>副标题</p>',
  },
  {
    id: '2',
    name: '内容页',
    thumbnail: 'https://via.placeholder.com/200x150',
    content: '<h2>内容标题</h2><p>内容描述</p>',
  },
])

// 选中的组件
const selectedComponent = ref<EditorComponent | null>(null)
const componentProperties = ref({
  id: '',
  className: '',
  text: '',
})

const componentStyles = ref({
  width: '',
  height: '',
  backgroundColor: '',
  color: '',
  fontSize: 16,
  margin: 0,
  padding: 0,
})

const animationSettings = ref({
  enter: 'none',
  duration: 0.5,
  delay: 0,
})

// GrapesJS编辑器实例
let grapesEditor: any = null

// 方法
const initGrapesEditor = () => {
  const editorConfig = {
    container: '#gjs-editor',
    height: '100%',
    width: '100%',
    plugins: ['gjs-preset-webpage'],
    storageManager: false,
    canvas: {
      styles: [
        'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css',
      ],
    },
    panels: { defaults: [] },
    // 启用拖拽功能
    dragAndDrop: true,
    // 自定义组件块
    blockManager: {
      appendTo: '.blocks-container',
      blocks: [
        {
          id: 'text-block',
          label: '文本',
          content: '<div class="text-block"><h1>标题文本</h1><p>段落文本</p></div>',
          category: 'Basic',
          attributes: { class: 'text-block' },
        },
        {
          id: 'image-block',
          label: '图片',
          content: '<img src="https://via.placeholder.com/300x200" alt="示例图片" style="width: 100%; height: auto;">',
          category: 'Media',
          attributes: { class: 'image-block' },
        },
        {
          id: 'video-block',
          label: '视频',
          content: '<video controls style="width: 100%; max-width: 600px;"><source src="" type="video/mp4">您的浏览器不支持视频标签。</video>',
          category: 'Media',
          attributes: { class: 'video-block' },
        },
        {
          id: 'container-block',
          label: '容器',
          content: '<div class="container-block" style="padding: 20px; border: 1px dashed #ccc; background: #f9f9f9;"><p>容器内容</p></div>',
          category: 'Layout',
          attributes: { class: 'container-block' },
        },
      ],
    },
  }

  try {
    grapesEditor = grapesjs.init(editorConfig)

    // 设置拖拽区域
    const canvas = grapesEditor.Canvas
    canvas.getElement().addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault()
      e.dataTransfer!.dropEffect = 'copy'
    })

    canvas.getElement().addEventListener('drop', (e: DragEvent) => {
      e.preventDefault()
      handleCanvasDrop(e)
    })

  } catch (error) {
    console.error('Failed to initialize GrapesJS:', error)
    ElMessage.error('编辑器初始化失败，请刷新页面重试')
    return
  }

  // 监听选择事件
  grapesEditor.on('component:selected', (component: any) => {
    handleComponentSelect(component)
  })

  grapesEditor.on('component:deselected', () => {
    handleComponentDeselect()
  })

  // 监听变化事件
  grapesEditor.on('component:update', () => {
    editorStore.setDirty(true)
    saveCurrentPage()
  })

  grapesEditor.on('component:add', () => {
    editorStore.setDirty(true)
    saveCurrentPage()
  })

  grapesEditor.on('component:remove', () => {
    editorStore.setDirty(true)
    saveCurrentPage()
  })

  // 设置编辑器实例到store
  editorStore.setEditorInstance(grapesEditor)

  // 加载当前页面内容
  loadCurrentPage()
}

const loadCurrentPage = () => {
  if (!grapesEditor) return

  if (!projectStore.currentProject) {
    // 如果没有项目，创建一个默认的空白页面
    grapesEditor.setComponents('<div class="default-content"><h1>欢迎使用HTML PPT编辑器</h1><p>请先创建或打开一个项目</p></div>')
    grapesEditor.setStyle('.default-content { text-align: center; padding: 50px; }')
    return
  }

  const currentPage = projectStore.currentPage
  if (currentPage) {
    grapesEditor.setComponents(currentPage.html || '<div><p>空白页面</p></div>')
    grapesEditor.setStyle(currentPage.css || '')
  } else {
    // 如果项目存在但没有页面，创建一个默认页面
    grapesEditor.setComponents('<div class="default-content"><h1>新页面</h1><p>开始编辑您的内容</p></div>')
    grapesEditor.setStyle('.default-content { text-align: center; padding: 50px; }')
  }
}

const saveCurrentPage = () => {
  if (!grapesEditor || !projectStore.currentProject) return

  const currentPage = projectStore.currentPage
  if (!currentPage) return

  try {
    const html = grapesEditor.getHtml()
    const css = grapesEditor.getCss()

    projectStore.updatePage(currentPage.id, {
      html,
      css,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error('Failed to save page:', error)
  }
}

const setEditorMode = (mode: 'select' | 'edit') => {
  editorMode.value = mode
  if (grapesEditor) {
    if (mode === 'select') {
      grapesEditor.runCommand('core:component-select')
    } else {
      grapesEditor.runCommand('core:component-edit')
    }
  }
}

const addTextComponent = () => {
  if (!grapesEditor) return

  const textComponent = {
    type: 'text',
    content: '双击编辑文本',
    style: {
      padding: '10px',
      margin: '5px',
      backgroundColor: '#f0f0f0',
      borderRadius: '4px',
    },
  }

  grapesEditor.addComponent(textComponent)
  editorStore.setDirty(true)
  ElMessage.success('已添加文本组件')
}

const addImageComponent = () => {
  if (!grapesEditor) return

  const imageComponent = {
    type: 'image',
    src: 'https://via.placeholder.com/300x200',
    attributes: { alt: '示例图片' },
    style: {
      maxWidth: '100%',
      height: 'auto',
      margin: '10px',
    },
  }

  grapesEditor.addComponent(imageComponent)
  editorStore.setDirty(true)
  ElMessage.success('已添加图片组件')
}

const addVideoComponent = () => {
  if (!grapesEditor) return

  const videoComponent = {
    type: 'video',
    src: '',
    attributes: {
      controls: '',
      style: 'width: 100%; max-width: 600px; margin: 10px;',
    },
  }

  grapesEditor.addComponent(videoComponent)
  editorStore.setDirty(true)
  ElMessage.success('已添加视频组件')
}

const addContainerComponent = () => {
  if (!grapesEditor) return

  const containerComponent = {
    type: 'default',
    classes: ['container'],
    content: '<div class="row"><div class="col-md-6">左侧内容</div><div class="col-md-6">右侧内容</div></div>',
    style: {
      padding: '15px',
      margin: '10px',
      border: '1px dashed #ccc',
      backgroundColor: '#fafafa',
    },
  }

  grapesEditor.addComponent(containerComponent)
  editorStore.setDirty(true)
  ElMessage.success('已添加容器组件')
}

const undo = () => {
  if (grapesEditor) {
    grapesEditor.runCommand('core:undo')
  }
}

const redo = () => {
  if (grapesEditor) {
    grapesEditor.runCommand('core:redo')
  }
}

const togglePreview = () => {
  editorStore.togglePreview()
  if (grapesEditor) {
    grapesEditor.runCommand('core:preview')
  }
}

const toggleFullscreen = () => {
  const editorCanvas = document.querySelector('.editor-canvas')
  if (editorCanvas) {
    if (!document.fullscreenElement) {
      editorCanvas.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }
}

// 拖拽处理
const handleComponentDragStart = (component: any, event: DragEvent) => {
  console.log('拖拽开始:', component.name)
  if (event.dataTransfer) {
    event.dataTransfer.setData('component-type', component.name)
    event.dataTransfer.effectAllowed = 'copy'
  }
}

const handleImageDragStart = (image: any, event: DragEvent) => {
  console.log('图片拖拽开始:', image.url)
  if (event.dataTransfer) {
    event.dataTransfer.setData('image-url', image.url)
    event.dataTransfer.effectAllowed = 'copy'
  }
}

// 组件选择处理
const handleComponentSelect = (component: any) => {
  selectedComponent.value = {
    id: component.getId(),
    name: component.getName(),
    type: component.getType(),
    attributes: component.getAttributes(),
    children: [],
    styles: component.getStyle(),
    position: { x: 0, y: 0, width: 0, height: 0 },
  }

  // 更新属性面板
  componentProperties.value = {
    id: component.getId() || '',
    className: component.getClasses().join(' ') || '',
    text: component.get('content') || '',
  }

  // 更新样式面板
  const styles = component.getStyle() || {}
  componentStyles.value = {
    width: styles.width || '',
    height: styles.height || '',
    backgroundColor: styles['background-color'] || '',
    color: styles.color || '',
    fontSize: parseInt(styles['font-size']) || 16,
    margin: parseInt(styles.margin) || 0,
    padding: parseInt(styles.padding) || 0,
  }
}

const handleComponentDeselect = () => {
  selectedComponent.value = null
}

// 图片上传处理
const handleImageUpload = (response: any) => {
  const newImage = {
    id: Date.now().toString(),
    name: response.name,
    url: response.url,
  }
  uploadedImages.value.push(newImage)
  ElMessage.success('图片上传成功')
}

// 模板应用
const applyTemplate = (template: any) => {
  if (grapesEditor) {
    grapesEditor.setComponents(template.content)
    editorStore.setDirty(true)
    ElMessage.success(`已应用模板: ${template.name}`)
  }
}

// 处理画布拖拽
const handleCanvasDrop = (event: DragEvent) => {
  console.log('画布拖拽事件触发')
  if (!grapesEditor) {
    console.log('编辑器未初始化')
    return
  }

  const componentType = event.dataTransfer?.getData('component-type')
  const imageUrl = event.dataTransfer?.getData('image-url')

  console.log('拖拽数据:', { componentType, imageUrl })

  if (componentType) {
    // 从组件库拖拽
    console.log('处理组件拖拽:', componentType)
    handleComponentDrop(componentType)
  } else if (imageUrl) {
    // 从图片库拖拽
    console.log('处理图片拖拽:', imageUrl)
    handleImageDrop(imageUrl)
  } else {
    console.log('未识别的拖拽类型')
  }
}

const handleComponentDrop = (componentType: string) => {
  if (!grapesEditor) {
    console.log('编辑器未初始化，无法添加组件')
    return
  }

  console.log('开始添加组件:', componentType)

  let componentContent = ''

  switch (componentType) {
    case 'text':
      componentContent = '<div class="text-component"><h2>标题文本</h2><p>在这里输入您的文本内容...</p></div>'
      break
    case 'image':
      componentContent = '<img src="https://via.placeholder.com/400x300" alt="图片" style="width: 100%; height: auto; margin: 10px 0;">'
      break
    case 'video':
      componentContent = '<video controls style="width: 100%; max-width: 600px; margin: 10px 0;"><source src="" type="video/mp4">您的浏览器不支持视频标签。</video>'
      break
    case 'container':
      componentContent = '<div class="container-component" style="padding: 20px; border: 1px solid #ddd; background: #f9f9f9; margin: 10px 0;"><p>容器内容</p></div>'
      break
    default:
      componentContent = '<div>默认组件</div>'
  }

  try {
    const component = grapesEditor.addComponent(componentContent)
    console.log('组件添加成功:', component)
    editorStore.setDirty(true)
    ElMessage.success(`已添加${componentType}组件`)
  } catch (error) {
    console.error('添加组件失败:', error)
    ElMessage.error(`添加${componentType}组件失败`)
  }
}

const handleImageDrop = (imageUrl: string) => {
  if (!grapesEditor) return

  const imageComponent = {
    type: 'image',
    src: imageUrl,
    attributes: { alt: '拖拽的图片' },
    style: {
      maxWidth: '100%',
      height: 'auto',
      margin: '10px 0',
    },
  }

  grapesEditor.addComponent(imageComponent)
  editorStore.setDirty(true)
  ElMessage.success('已添加图片')
}

// 点击组件库中的组件也能添加
const handleComponentClick = (component: any) => {
  handleComponentDrop(component.name)
}

// 监听属性变化
watch(componentProperties, (newProps) => {
  if (grapesEditor && selectedComponent.value) {
    const component = grapesEditor.getComponent(selectedComponent.value.id)
    if (component) {
      if (newProps.id) component.set('id', newProps.id)
      if (newProps.className) component.setClass(newProps.className.split(' '))
      if (newProps.text) component.set('content', newProps.text)
    }
  }
}, { deep: true })

// 监听样式变化
watch(componentStyles, (newStyles) => {
  if (grapesEditor && selectedComponent.value) {
    const component = grapesEditor.getComponent(selectedComponent.value.id)
    if (component) {
      const styles: any = {}
      if (newStyles.width) styles.width = newStyles.width
      if (newStyles.height) styles.height = newStyles.height
      if (newStyles.backgroundColor) styles['background-color'] = newStyles.backgroundColor
      if (newStyles.color) styles.color = newStyles.color
      if (newStyles.fontSize) styles['font-size'] = `${newStyles.fontSize}px`
      if (newStyles.margin) styles.margin = `${newStyles.margin}px`
      if (newStyles.padding) styles.padding = `${newStyles.padding}px`

      component.setStyle(styles)
    }
  }
}, { deep: true })

// 生命周期
onMounted(() => {
  nextTick(() => {
    initGrapesEditor()
  })
})

onUnmounted(() => {
  if (grapesEditor) {
    grapesEditor.destroy()
  }
})
</script>

<style scoped>
.visual-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  gap: 16px;
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.editor-main {
  flex: 1;
  display: flex;
  height: calc(100vh - 60px);
}

.editor-panel {
  width: 280px;
  background: white;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
}

.panel-header h4 {
  margin: 0;
  color: #303133;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
}

.editor-canvas {
  flex: 1;
  position: relative;
  background: white;
}

.gjs-editor {
  width: 100%;
  height: 100%;
}

/* 组件库样式 */
.component-library {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.component-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.3s ease;
}

.component-item:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.component-item:active {
  cursor: grabbing;
}

.component-icon {
  font-size: 24px;
  color: #606266;
  margin-bottom: 8px;
}

.component-name {
  font-size: 12px;
  color: #303133;
}

/* 图片库样式 */
.image-library {
  padding: 16px;
}

.upload-demo {
  margin-bottom: 16px;
}

.image-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.image-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: grab;
}

.image-item img {
  width: 100%;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 4px;
}

.image-name {
  font-size: 10px;
  color: #606266;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

/* 模板库样式 */
.template-library {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.template-item {
  cursor: pointer;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.template-item:hover {
  border-color: #409eff;
  transform: translateY(-2px);
}

.template-preview {
  height: 80px;
  overflow: hidden;
}

.template-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.template-name {
  padding: 8px;
  font-size: 12px;
  color: #303133;
  text-align: center;
  background: white;
}

/* 样式面板样式 */
.style-properties,
.style-styles,
.style-animations {
  padding: 16px;
}

.property-group,
.style-group {
  margin-bottom: 20px;
}

.property-group h5,
.style-group h5 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
}

.no-selection {
  text-align: center;
  color: #909399;
  padding: 40px 20px;
}

.no-selection p {
  margin: 0;
}
</style>