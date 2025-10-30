import type { ProjectCache, ProjectStorageManager } from '@/types'

const STORAGE_KEY = 'htmlppt_project_cache'

/**
 * 项目存储管理器实现
 * 负责管理项目缓存，将项目列表存储在浏览器的 localStorage 中
 */
export class ProjectStorageManagerImpl implements ProjectStorageManager {
  /**
   * 获取缓存的项目列表
   */
  getCachedProjects(): ProjectCache[] {
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (!cached) return []

      const projects = JSON.parse(cached) as ProjectCache[]

      // 将日期字符串转换为 Date 对象
      return projects.map(project => ({
        ...project,
        updatedAt: new Date(project.updatedAt)
      }))
    } catch (error) {
      console.error('Failed to load cached projects:', error)
      return []
    }
  }

  /**
   * 添加项目到缓存
   */
  addProjectToCache(projectCache: ProjectCache): void {
    try {
      const projects = this.getCachedProjects()

      // 检查是否已存在相同路径的项目
      const existingIndex = projects.findIndex(p => p.path === projectCache.path)

      if (existingIndex >= 0) {
        // 更新现有项目
        projects[existingIndex] = projectCache
      } else {
        // 添加新项目
        projects.push(projectCache)
      }

      this.saveProjectsToCache(projects)
    } catch (error) {
      console.error('Failed to add project to cache:', error)
    }
  }

  /**
   * 从缓存中移除项目
   */
  removeProjectFromCache(projectId: string): void {
    try {
      const projects = this.getCachedProjects()
      const filteredProjects = projects.filter(p => p.id !== projectId)
      this.saveProjectsToCache(filteredProjects)
    } catch (error) {
      console.error('Failed to remove project from cache:', error)
    }
  }

  /**
   * 更新缓存中的项目信息
   */
  updateProjectInCache(projectCache: ProjectCache): void {
    try {
      const projects = this.getCachedProjects()
      const index = projects.findIndex(p => p.id === projectCache.id)

      if (index >= 0) {
        projects[index] = projectCache
        this.saveProjectsToCache(projects)
      } else {
        // 如果项目不存在，则添加它
        this.addProjectToCache(projectCache)
      }
    } catch (error) {
      console.error('Failed to update project in cache:', error)
    }
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  /**
   * 将项目列表保存到缓存
   */
  private saveProjectsToCache(projects: ProjectCache[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
    } catch (error) {
      console.error('Failed to save projects to cache:', error)
      throw error
    }
  }

  /**
   * 从项目对象创建缓存信息
   */
  static createProjectCache(project: {
    id: string
    name: string
    description?: string
    path: string
    pages: any[]
    updatedAt: Date
    thumbnail?: string
  }): ProjectCache {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      path: project.path,
      pageCount: project.pages.length,
      updatedAt: project.updatedAt,
      thumbnail: project.thumbnail
    }
  }
}

// 导出单例实例
export const projectStorageManager = new ProjectStorageManagerImpl()