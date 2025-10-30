import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project, Page, ProjectConfig, Theme, ProjectCache } from '@/types'
import { projectStorageManager, ProjectStorageManagerImpl } from '@/utils/projectStorage'
import { fileSystemAPI, checkFileSystemSupport } from '@/utils/fileSystem'

export const useProjectStore = defineStore('project', () => {
  // State
  const projectsCache = ref<ProjectCache[]>([]) // 项目缓存列表
  const currentProject = ref<Project | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const fileSystemSupported = ref(checkFileSystemSupport())

  // Getters
  const hasCurrentProject = computed(() => currentProject.value !== null)
  const currentPage = computed(() => {
    if (!currentProject.value) return null
    const pageId = currentProject.value.pages.find(p => p.id === currentProject.value?.currentPageId)
    return pageId || null
  })
  const totalPages = computed(() => currentProject.value?.pages.length || 0)
  const cachedProjectsCount = computed(() => projectsCache.value.length)

  // Actions

  /**
   * 初始化项目存储，加载缓存的项目列表
   */
  const initializeProjectStorage = () => {
    try {
      projectsCache.value = projectStorageManager.getCachedProjects()
    } catch (error) {
      console.error('Failed to initialize project storage:', error)
      setError('初始化项目存储失败')
    }
  }

  /**
   * 创建新的文件夹项目
   */
  const createFolderProject = async (name: string, description?: string, parentPath?: string): Promise<Project> => {
    setLoading(true)
    clearError()

    try {
      if (!fileSystemSupported.value.supported) {
        throw new Error('当前浏览器不支持文件系统访问')
      }

      // 创建项目文件夹
      const projectPath = await fileSystemAPI.createProjectFolder(parentPath || '', name)

      // 创建项目对象
      const newProject: Project = {
        id: generateId(),
        name,
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
        pages: [],
        config: getDefaultConfig(),
        theme: getDefaultTheme(),
        path: projectPath,
      }

      // 添加默认的第一页
      const firstPage: Page = {
        id: generateId(),
        name: '标题页',
        order: 0,
        html: `<div class="slide">
          <h1 style="font-size: 48px; color: #409eff; margin-bottom: 20px;">${name}</h1>
          <p style="font-size: 24px; color: #606266;">欢迎使用 HTML PPT 编辑器</p>
        </div>`,
        css: `/* 页面样式 */
.slide {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}`,
        js: '// 页面脚本\nconsole.log("标题页已加载");',
        createdAt: new Date(),
        updatedAt: new Date(),
        htmlPath: `pages/${generateId()}.html`,
        cssPath: `pages/${generateId()}.css`,
        jsPath: `pages/${generateId()}.js`,
      }

      newProject.pages.push(firstPage)
      newProject.currentPageId = firstPage.id

      // 保存项目到文件系统
      await fileSystemAPI.saveProject(newProject)

      // 添加到缓存
      const projectCache = ProjectStorageManagerImpl.createProjectCache(newProject)
      projectStorageManager.addProjectToCache(projectCache)
      projectsCache.value = projectStorageManager.getCachedProjects()

      currentProject.value = newProject
      return newProject
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建项目失败'
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  /**
   * 打开文件夹项目
   */
  const openFolderProject = async (): Promise<Project | null> => {
    setLoading(true)
    clearError()

    try {
      if (!fileSystemSupported.value.supported) {
        throw new Error('当前浏览器不支持文件系统访问')
      }

      // 选择项目文件夹
      const projectPath = await fileSystemAPI.selectProjectFolder()
      if (!projectPath) {
        return null // 用户取消选择
      }

      // 加载项目
      const project = await fileSystemAPI.loadProject(projectPath)

      // 更新缓存
      const projectCache = ProjectStorageManagerImpl.createProjectCache(project)
      projectStorageManager.addProjectToCache(projectCache)
      projectsCache.value = projectStorageManager.getCachedProjects()

      currentProject.value = project
      return project
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '打开项目失败'
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  /**
   * 从缓存中加载项目
   */
  const loadProjectFromCache = async (projectCache: ProjectCache): Promise<Project> => {
    setLoading(true)
    clearError()

    try {
      const project = await fileSystemAPI.loadProject(projectCache.path)
      currentProject.value = project

      // 更新缓存中的项目信息
      const updatedCache = ProjectStorageManagerImpl.createProjectCache(project)
      projectStorageManager.updateProjectInCache(updatedCache)
      projectsCache.value = projectStorageManager.getCachedProjects()

      return project
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载项目失败'
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  /**
   * 保存当前项目
   */
  const saveCurrentProject = async (): Promise<void> => {
    if (!currentProject.value) {
      throw new Error('没有当前项目')
    }

    setLoading(true)
    clearError()

    try {
      currentProject.value.updatedAt = new Date()
      await fileSystemAPI.saveProject(currentProject.value)

      // 更新缓存
      const projectCache = ProjectStorageManagerImpl.createProjectCache(currentProject.value)
      projectStorageManager.updateProjectInCache(projectCache)
      projectsCache.value = projectStorageManager.getCachedProjects()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存项目失败'
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  /**
   * 从缓存中移除项目
   */
  const removeProjectFromCache = (projectId: string) => {
    try {
      projectStorageManager.removeProjectFromCache(projectId)
      projectsCache.value = projectStorageManager.getCachedProjects()

      // 如果移除的是当前项目，则关闭它
      if (currentProject.value?.id === projectId) {
        currentProject.value = null
      }
    } catch (error) {
      console.error('Failed to remove project from cache:', error)
      setError('移除项目失败')
    }
  }

  // 保持原有的内存项目创建方法（向后兼容）
  const createProject = (name: string, description?: string): Project => {
    const newProject: Project = {
      id: generateId(),
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      pages: [],
      config: getDefaultConfig(),
      theme: getDefaultTheme(),
      path: '',
    }

    // 添加默认的第一页
    const firstPage: Page = {
      id: generateId(),
      name: '标题页',
      order: 0,
      html: '<div style="text-align: center; padding: 100px 20px;"><h1 style="font-size: 48px; color: #409eff; margin-bottom: 20px;">' + name + '</h1><p style="font-size: 24px; color: #606266;">欢迎使用 HTML PPT 编辑器</p></div>',
      css: 'body { font-family: Arial, sans-serif; margin: 0; padding: 0; }',
      js: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    newProject.pages.push(firstPage)
    newProject.currentPageId = firstPage.id

    // 内存项目不需要持久化，直接设置为当前项目
    currentProject.value = newProject
    return newProject
  }

  const openProject = (project: Project) => {
    currentProject.value = project
    error.value = null
  }

  const closeProject = () => {
    currentProject.value = null
  }

  const updateProject = (updates: Partial<Project>) => {
    if (!currentProject.value) return

    currentProject.value = {
      ...currentProject.value,
      ...updates,
      updatedAt: new Date(),
    }

    // 如果是文件夹项目，更新缓存
    if (currentProject.value.path) {
      const projectCache = ProjectStorageManagerImpl.createProjectCache(currentProject.value)
      projectStorageManager.updateProjectInCache(projectCache)
      projectsCache.value = projectStorageManager.getCachedProjects()
    }
  }

  const deleteProject = (projectId: string) => {
    // 只能删除当前项目
    if (currentProject.value?.id === projectId) {
      currentProject.value = null
    }
  }

  const addPage = (name: string): Page => {
    if (!currentProject.value) {
      throw new Error('No current project')
    }

    const pageNumber = currentProject.value.pages.length + 1
    const newPage: Page = {
      id: generateId(),
      name,
      order: currentProject.value.pages.length,
      html: `<div style="padding: 40px; min-height: 400px;">
        <h2 style="color: #303133; margin-bottom: 20px;">${name}</h2>
        <p style="color: #606266; font-size: 16px; line-height: 1.6;">
          这是第 ${pageNumber} 页的内容。点击"编辑"模式开始编辑 HTML 代码。
        </p>
        <ul style="color: #606266; margin-top: 20px;">
          <li>你可以在这里添加任何 HTML 内容</li>
          <li>支持 CSS 样式定制</li>
          <li>也可以添加 JavaScript 交互</li>
        </ul>
      </div>`,
      css: `
/* 页面样式 */
body {
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  margin: 0;
  padding: 0;
  background: #f8f9fa;
}

h2 {
  border-bottom: 2px solid #409eff;
  padding-bottom: 10px;
}

ul {
  list-style-type: disc;
  padding-left: 20px;
}

li {
  margin-bottom: 8px;
}
      `,
      js: '// 在这里添加 JavaScript 代码\nconsole.log("页面已加载:", "' + name + '");',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    currentProject.value.pages.push(newPage)
    currentProject.value.updatedAt = new Date()

    return newPage
  }

  const updatePage = (pageId: string, updates: Partial<Page>) => {
    if (!currentProject.value) return

    const pageIndex = currentProject.value.pages.findIndex(p => p.id === pageId)
    if (pageIndex === -1) return

    currentProject.value.pages[pageIndex] = {
      ...currentProject.value.pages[pageIndex],
      ...updates,
      updatedAt: new Date(),
    }

    currentProject.value.updatedAt = new Date()
  }

  const deletePage = (pageId: string) => {
    if (!currentProject.value) return

    const pageIndex = currentProject.value.pages.findIndex(p => p.id === pageId)
    if (pageIndex === -1) return

    currentProject.value.pages.splice(pageIndex, 1)

    // Reorder remaining pages
    currentProject.value.pages.forEach((page, index) => {
      page.order = index
    })

    currentProject.value.updatedAt = new Date()
  }

  const reorderPages = (fromIndex: number, toIndex: number) => {
    if (!currentProject.value) return

    const [movedPage] = currentProject.value.pages.splice(fromIndex, 1)
    currentProject.value.pages.splice(toIndex, 0, movedPage)

    // Update order for all pages
    currentProject.value.pages.forEach((page, index) => {
      page.order = index
    })

    currentProject.value.updatedAt = new Date()

    // 如果是文件夹项目，更新缓存
    if (currentProject.value.path) {
      const projectCache = ProjectStorageManagerImpl.createProjectCache(currentProject.value)
      projectStorageManager.updateProjectInCache(projectCache)
      projectsCache.value = projectStorageManager.getCachedProjects()
    }
  }

  const setCurrentPage = (pageId: string) => {
    if (!currentProject.value) return

    const page = currentProject.value.pages.find(p => p.id === pageId)
    if (page) {
      currentProject.value.currentPageId = pageId
    }
  }

  const updateConfig = (config: Partial<ProjectConfig>) => {
    if (!currentProject.value) return

    currentProject.value.config = {
      ...currentProject.value.config,
      ...config,
    }

    currentProject.value.updatedAt = new Date()
  }

  const updateTheme = (theme: Partial<Theme>) => {
    if (!currentProject.value) return

    currentProject.value.theme = {
      ...currentProject.value.theme,
      ...theme,
    }

    currentProject.value.updatedAt = new Date()
  }

  const setError = (errorMessage: string) => {
    error.value = errorMessage
  }

  const clearError = () => {
    error.value = null
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  // Helper functions
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }

  const getDefaultConfig = (): ProjectConfig => ({
    autoSave: true,
    autoSaveInterval: 30000,
    defaultTransition: 'fade',
    showPageNumbers: true,
    loopPresentation: false,
  })

  const getDefaultTheme = (): Theme => ({
    id: 'default',
    name: '默认主题',
    colors: {
      primary: '#409eff',
      secondary: '#67c23a',
      background: '#ffffff',
      text: '#303133',
      accent: '#e6a23c',
    },
    fonts: {
      heading: 'Arial, sans-serif',
      body: 'Arial, sans-serif',
      code: 'Consolas, monospace',
    },
    spacing: {
      small: 8,
      medium: 16,
      large: 24,
    },
  })

  return {
    // State
    projectsCache, // 替换原有的 projects
    currentProject,
    isLoading,
    error,
    fileSystemSupported,

    // Getters
    hasCurrentProject,
    currentPage,
    totalPages,
    cachedProjectsCount,

    // New file-based project actions
    initializeProjectStorage,
    createFolderProject,
    openFolderProject,
    loadProjectFromCache,
    saveCurrentProject,
    removeProjectFromCache,

    // Legacy memory-based actions (for backward compatibility)
    createProject,
    openProject,
    closeProject,
    updateProject,
    deleteProject,
    addPage,
    updatePage,
    deletePage,
    reorderPages,
    setCurrentPage,
    updateConfig,
    updateTheme,
    setError,
    clearError,
    setLoading,
  }
})