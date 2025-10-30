import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { EditorState, EditorConfig, EditorComponent, VisualEditorConfig, CodeEditorConfig } from '@/types'

export const useEditorStore = defineStore('editor', () => {
  // State
  const state = ref<EditorState>({
    currentPageId: null,
    mode: 'visual',
    isDirty: false,
    isPreviewMode: false,
    selectedElement: null,
  })

  const config = ref<EditorConfig>({
    mode: 'visual',
    theme: 'vs-dark',
    fontSize: 14,
    wordWrap: true,
    minimap: true,
    autoSave: true,
  })

  const visualEditorConfig = ref<VisualEditorConfig>({
    container: '#gjs-editor',
    plugins: ['gjs-preset-webpage'],
    components: [],
    styleManager: {
      sectors: [],
    },
    assetManager: {
      upload: true,
      uploadFile: '',
      uploadText: '拖拽文件到这里或点击上传',
      modalTitle: '选择图片',
      openAssetsOnDrop: true,
      inputPlaceholder: '搜索图片...',
      addBtnText: '添加图片',
      uploadAndEdit: false,
      files: [],
    },
  })

  const codeEditorConfig = ref<CodeEditorConfig>({
    language: 'html',
    theme: 'vs-dark',
    fontSize: 14,
    wordWrap: true,
    minimap: true,
    lineNumbers: true,
    folding: true,
    autoIndent: true,
    formatOnPaste: true,
    formatOnType: true,
  })

  const selectedComponent = ref<EditorComponent | null>(null)
  const editorInstance = ref<any>(null)
  const codeEditorInstance = ref<any>(null)

  // Getters
  const isVisualMode = computed(() => state.value.mode === 'visual')
  const isCodeMode = computed(() => state.value.mode === 'code')
  const hasSelection = computed(() => state.value.selectedElement !== null)
  const canSave = computed(() => state.value.isDirty)

  // Actions
  const setCurrentPage = (pageId: string) => {
    state.value.currentPageId = pageId
    state.value.selectedElement = null
    selectedComponent.value = null
  }

  const setMode = (mode: 'visual' | 'code') => {
    state.value.mode = mode
    config.value.mode = mode
  }

  const toggleMode = () => {
    const newMode = state.value.mode === 'visual' ? 'code' : 'visual'
    setMode(newMode)
  }

  const setDirty = (dirty: boolean) => {
    state.value.isDirty = dirty
  }

  const markAsClean = () => {
    state.value.isDirty = false
  }

  const setPreviewMode = (preview: boolean) => {
    state.value.isPreviewMode = preview
  }

  const togglePreview = () => {
    setPreviewMode(!state.value.isPreviewMode)
  }

  const selectElement = (elementId: string | null) => {
    state.value.selectedElement = elementId
  }

  const clearSelection = () => {
    state.value.selectedElement = null
    selectedComponent.value = null
  }

  const setSelectedComponent = (component: EditorComponent | null) => {
    selectedComponent.value = component
    if (component) {
      state.value.selectedElement = component.id
    } else {
      state.value.selectedElement = null
    }
  }

  const updateConfig = (updates: Partial<EditorConfig>) => {
    config.value = { ...config.value, ...updates }
  }

  const updateVisualEditorConfig = (updates: Partial<VisualEditorConfig>) => {
    visualEditorConfig.value = { ...visualEditorConfig.value, ...updates }
  }

  const updateCodeEditorConfig = (updates: Partial<CodeEditorConfig>) => {
    codeEditorConfig.value = { ...codeEditorConfig.value, ...updates }
  }

  const setEditorInstance = (instance: any) => {
    editorInstance.value = instance
  }

  const setCodeEditorInstance = (instance: any) => {
    codeEditorInstance.value = instance
  }

  const addComponent = (component: EditorComponent) => {
    if (!editorInstance.value) return

    try {
      // Add component to GrapesJS editor
      editorInstance.value.addComponent(component)
      setDirty(true)
    } catch (error) {
      console.error('Failed to add component:', error)
    }
  }

  const updateComponent = (componentId: string, updates: Partial<EditorComponent>) => {
    if (!editorInstance.value) return

    try {
      const component = editorInstance.value.getComponent(componentId)
      if (component) {
        Object.assign(component, updates)
        setDirty(true)
      }
    } catch (error) {
      console.error('Failed to update component:', error)
    }
  }

  const removeComponent = (componentId: string) => {
    if (!editorInstance.value) return

    try {
      const component = editorInstance.value.getComponent(componentId)
      if (component) {
        component.remove()
        setDirty(true)
      }
    } catch (error) {
      console.error('Failed to remove component:', error)
    }
  }

  const getComponentHtml = (): string => {
    if (!editorInstance.value) return ''

    try {
      return editorInstance.value.getHtml()
    } catch (error) {
      console.error('Failed to get HTML:', error)
      return ''
    }
  }

  const getComponentCss = (): string => {
    if (!editorInstance.value) return ''

    try {
      return editorInstance.value.getCss()
    } catch (error) {
      console.error('Failed to get CSS:', error)
      return ''
    }
  }

  const setComponentHtml = (html: string) => {
    if (!editorInstance.value) return

    try {
      editorInstance.value.setComponents(html)
      setDirty(true)
    } catch (error) {
      console.error('Failed to set HTML:', error)
    }
  }

  const setComponentCss = (css: string) => {
    if (!editorInstance.value) return

    try {
      editorInstance.value.setStyle(css)
      setDirty(true)
    } catch (error) {
      console.error('Failed to set CSS:', error)
    }
  }

  const getCodeEditorValue = (): string => {
    if (!codeEditorInstance.value) return ''

    try {
      return codeEditorInstance.value.getValue()
    } catch (error) {
      console.error('Failed to get code editor value:', error)
      return ''
    }
  }

  const setCodeEditorValue = (value: string) => {
    if (!codeEditorInstance.value) return

    try {
      codeEditorInstance.value.setValue(value)
      setDirty(true)
    } catch (error) {
      console.error('Failed to set code editor value:', error)
    }
  }

  const formatCode = () => {
    if (!codeEditorInstance.value) return

    try {
      codeEditorInstance.value.getAction('editor.action.formatDocument').run()
    } catch (error) {
      console.error('Failed to format code:', error)
    }
  }

  const reset = () => {
    state.value = {
      currentPageId: null,
      mode: 'visual',
      isDirty: false,
      isPreviewMode: false,
      selectedElement: null,
    }
    selectedComponent.value = null
    editorInstance.value = null
    codeEditorInstance.value = null
  }

  return {
    // State
    state,
    config,
    visualEditorConfig,
    codeEditorConfig,
    selectedComponent,
    editorInstance,
    codeEditorInstance,

    // Getters
    isVisualMode,
    isCodeMode,
    hasSelection,
    canSave,

    // Actions
    setCurrentPage,
    setMode,
    toggleMode,
    setDirty,
    markAsClean,
    setPreviewMode,
    togglePreview,
    selectElement,
    clearSelection,
    setSelectedComponent,
    updateConfig,
    updateVisualEditorConfig,
    updateCodeEditorConfig,
    setEditorInstance,
    setCodeEditorInstance,
    addComponent,
    updateComponent,
    removeComponent,
    getComponentHtml,
    getComponentCss,
    setComponentHtml,
    setComponentCss,
    getCodeEditorValue,
    setCodeEditorValue,
    formatCode,
    reset,
  }
})