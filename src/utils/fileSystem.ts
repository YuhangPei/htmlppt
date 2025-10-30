import type { FileSystemAPI, Project, Page } from '@/types'

/**
 * 文件系统API实现
 * 基于 File System Access API 实现文件夹项目的读写操作
 * 注意：此API目前只在现代浏览器中支持，需要用户授权
 */
export class FileSystemAPIImpl implements FileSystemAPI {
  private projectFolderHandle: FileSystemDirectoryHandle | null = null

  /**
   * 检查浏览器是否支持 File System Access API
   */
  static isSupported(): boolean {
    return 'showDirectoryPicker' in window
  }

  /**
   * 选择项目文件夹
   */
  async selectProjectFolder(): Promise<string | null> {
    if (!FileSystemAPIImpl.isSupported()) {
      throw new Error('File System Access API is not supported in this browser')
    }

    try {
      this.projectFolderHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      })

      return this.projectFolderHandle.name
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // 用户取消选择
        return null
      }
      throw error
    }
  }

  /**
   * 创建项目文件夹
   */
  async createProjectFolder(_path: string, projectName: string): Promise<string> {
    if (!FileSystemAPIImpl.isSupported()) {
      throw new Error('File System Access API is not supported in this browser')
    }

    try {
      // 选择父文件夹
      const parentHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      })

      // 创建项目文件夹
      const sanitizedName = this.sanitizeFileName(projectName)
      this.projectFolderHandle = await parentHandle.getDirectoryHandle(sanitizedName, {
        create: true
      })

      // 创建基本目录结构
      await this.createProjectStructure()

      return this.projectFolderHandle.name
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('用户取消了文件夹选择')
      }
      throw error
    }
  }

  /**
   * 读取项目
   */
  async loadProject(projectPath: string): Promise<Project> {
    // 如果没有项目文件夹句柄，尝试通过路径重新获取
    if (!this.projectFolderHandle) {
      // 对于缓存的项目，需要用户重新选择文件夹
      try {
        this.projectFolderHandle = await window.showDirectoryPicker({
          mode: 'readwrite'
        })
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('需要选择项目文件夹才能加载项目')
        }
        throw new Error('无法访问项目文件夹：' + (error instanceof Error ? error.message : '未知错误'))
      }
    }

    try {
      // 读取项目元信息
      const projectFile = await this.projectFolderHandle.getFileHandle('project.json')
      const projectFileContent = await this.readFileHandle(projectFile)
      const projectData = JSON.parse(projectFileContent)

      // 读取页面数据
      const pagesHandle = await this.projectFolderHandle.getDirectoryHandle('pages')
      const pages: Page[] = []

      // 获取所有页面文件
      const pageFiles = new Map<string, { html?: string; css?: string; js?: string }>()

      for await (const [name, handle] of pagesHandle.entries()) {
        if (handle.kind === 'file') {
          const content = await this.readFileHandle(handle as FileSystemFileHandle)
          const [pageId, extension] = name.split('.')

          if (!pageFiles.has(pageId)) {
            pageFiles.set(pageId, {})
          }

          const pageData = pageFiles.get(pageId)!
          if (extension === 'html') {
            pageData.html = content
          } else if (extension === 'css') {
            pageData.css = content
          } else if (extension === 'js') {
            pageData.js = content
          }
        }
      }

      // 构建页面对象，按照保存的order顺序
      const pageInfos = projectData.pages || []

      // 按order字段排序页面信息
      pageInfos.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))

      for (const pageInfo of pageInfos) {
        const pageData = pageFiles.get(pageInfo.id)
        if (pageData && pageData.html) {
          pages.push({
            ...pageInfo,
            html: pageData.html,
            css: pageData.css || '',
            js: pageData.js || '',
            htmlPath: `pages/${pageInfo.id}.html`,
            cssPath: `pages/${pageInfo.id}.css`,
            jsPath: `pages/${pageInfo.id}.js`,
            createdAt: new Date(pageInfo.createdAt),
            updatedAt: new Date(pageInfo.updatedAt)
          })
        }
      }

      return {
        ...projectData,
        pages,
        path: projectPath,
        createdAt: new Date(projectData.createdAt),
        updatedAt: new Date(projectData.updatedAt)
      }
    } catch (error) {
      console.error('Failed to load project:', error)
      throw new Error('读取项目失败：' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  /**
   * 保存项目
   */
  async saveProject(project: Project): Promise<void> {
    if (!this.projectFolderHandle) {
      throw new Error('No project folder selected')
    }

    try {
      // 保存项目元信息
      const projectMeta = {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        config: project.config,
        theme: project.theme,
        currentPageId: project.currentPageId,
        pages: project.pages.map(page => ({
          id: page.id,
          name: page.name,
          order: page.order,
          thumbnail: page.thumbnail,
          createdAt: page.createdAt.toISOString(),
          updatedAt: page.updatedAt.toISOString()
        }))
      }

      await this.writeFile('project.json', JSON.stringify(projectMeta, null, 2))

      // 保存页面文件
      const pagesHandle = await this.projectFolderHandle.getDirectoryHandle('pages', {
        create: true
      })

      for (const page of project.pages) {
        // 保存HTML文件
        const htmlFile = await pagesHandle.getFileHandle(`${page.id}.html`, {
          create: true
        })
        await this.writeFileHandle(htmlFile, page.html)

        // 保存CSS文件
        const cssFile = await pagesHandle.getFileHandle(`${page.id}.css`, {
          create: true
        })
        await this.writeFileHandle(cssFile, page.css)

        // 保存JS文件
        if (page.js) {
          const jsFile = await pagesHandle.getFileHandle(`${page.id}.js`, {
            create: true
          })
          await this.writeFileHandle(jsFile, page.js)
        }
      }
    } catch (error) {
      console.error('Failed to save project:', error)
      throw new Error('保存项目失败：' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  /**
   * 读取文件
   */
  async readFile(filePath: string): Promise<string> {
    if (!this.projectFolderHandle) {
      throw new Error('No project folder selected')
    }

    try {
      const pathParts = filePath.split('/')
      let currentHandle: FileSystemDirectoryHandle = this.projectFolderHandle

      // 导航到目标目录
      for (let i = 0; i < pathParts.length - 1; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(pathParts[i])
      }

      // 读取文件
      const fileName = pathParts[pathParts.length - 1]
      const fileHandle = await currentHandle.getFileHandle(fileName)
      return await this.readFileHandle(fileHandle)
    } catch (error) {
      throw new Error(`读取文件失败 ${filePath}: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 写入文件
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    if (!this.projectFolderHandle) {
      throw new Error('No project folder selected')
    }

    try {
      const pathParts = filePath.split('/')
      let currentHandle: FileSystemDirectoryHandle = this.projectFolderHandle

      // 导航到目标目录，必要时创建目录
      for (let i = 0; i < pathParts.length - 1; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(pathParts[i], {
          create: true
        })
      }

      // 写入文件
      const fileName = pathParts[pathParts.length - 1]
      const fileHandle = await currentHandle.getFileHandle(fileName, {
        create: true
      })
      await this.writeFileHandle(fileHandle, content)
    } catch (error) {
      throw new Error(`写入文件失败 ${filePath}: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(filePath: string): Promise<boolean> {
    if (!this.projectFolderHandle) {
      return false
    }

    try {
      await this.readFile(filePath)
      return true
    } catch {
      return false
    }
  }

  /**
   * 创建目录
   */
  async createDirectory(dirPath: string): Promise<void> {
    if (!this.projectFolderHandle) {
      throw new Error('No project folder selected')
    }

    try {
      const pathParts = dirPath.split('/')
      let currentHandle: FileSystemDirectoryHandle = this.projectFolderHandle

      for (const part of pathParts) {
        if (part) {
          currentHandle = await currentHandle.getDirectoryHandle(part, {
            create: true
          })
        }
      }
    } catch (error) {
      throw new Error(`创建目录失败 ${dirPath}: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 创建项目基本目录结构
   */
  private async createProjectStructure(): Promise<void> {
    if (!this.projectFolderHandle) return

    try {
      // 创建基本目录
      await this.projectFolderHandle.getDirectoryHandle('pages', { create: true })
      await this.projectFolderHandle.getDirectoryHandle('global', { create: true })
      await this.projectFolderHandle.getDirectoryHandle('thumbnails', { create: true })

      // 创建全局文件
      const globalHandle = await this.projectFolderHandle.getDirectoryHandle('global')
      await this.createDefaultGlobalFiles(globalHandle)
    } catch (error) {
      console.error('Failed to create project structure:', error)
    }
  }

  /**
   * 创建默认的全局文件
   */
  private async createDefaultGlobalFiles(globalHandle: FileSystemDirectoryHandle): Promise<void> {
    try {
      // 创建全局样式文件
      const stylesFile = await globalHandle.getFileHandle('styles.css', { create: true })
      await this.writeFileHandle(stylesFile, `/* 全局样式 */
body {
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  margin: 0;
  padding: 0;
  background: #f8f9fa;
}

/* 通用样式 */
.slide {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  box-sizing: border-box;
}
`)

      // 创建全局脚本文件
      const scriptsFile = await globalHandle.getFileHandle('scripts.js', { create: true })
      await this.writeFileHandle(scriptsFile, `// 全局脚本
console.log('HTML PPT 项目已加载');

// 通用工具函数
window.PPTUtils = {
  // 页面切换动画
  transition: function(from, to, type = 'fade') {
    // 实现页面切换逻辑
  },

  // 获取当前页面索引
  getCurrentPageIndex: function() {
    // 实现获取当前页面索引的逻辑
  }
};
`)
    } catch (error) {
      console.error('Failed to create default global files:', error)
    }
  }

  /**
   * 读取文件句柄内容
   */
  private async readFileHandle(fileHandle: FileSystemFileHandle): Promise<string> {
    const file = await fileHandle.getFile()
    return await file.text()
  }

  /**
   * 写入文件句柄内容
   */
  private async writeFileHandle(fileHandle: FileSystemFileHandle, content: string): Promise<void> {
    const writable = await fileHandle.createWritable()
    await writable.write(content)
    await writable.close()
  }

  /**
   * 清理文件名，移除不安全字符
   */
  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[<>:"/\\|?*]/g, '_').trim()
  }
}

// 导出单例实例
export const fileSystemAPI = new FileSystemAPIImpl()

// 兼容性检查函数
export function checkFileSystemSupport(): { supported: boolean; message: string } {
  if (FileSystemAPIImpl.isSupported()) {
    return {
      supported: true,
      message: '浏览器支持文件系统访问'
    }
  } else {
    return {
      supported: false,
      message: '当前浏览器不支持 File System Access API，建议使用 Chrome 86+ 或 Edge 86+'
    }
  }
}