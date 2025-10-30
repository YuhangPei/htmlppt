export interface Project {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  pages: Page[]
  config: ProjectConfig
  theme: Theme
  path: string // 项目文件夹路径
  currentPageId?: string
}

// 项目缓存信息（存储在浏览器缓存中）
export interface ProjectCache {
  id: string
  name: string
  description?: string
  path: string // 项目文件夹路径
  pageCount: number
  updatedAt: Date
  thumbnail?: string // 项目缩略图
}

export interface Page {
  id: string
  name: string
  order: number
  html: string
  css: string
  js?: string
  thumbnail?: string // 页面缩略图路径
  createdAt: Date
  updatedAt: Date
  // 新增：文件路径信息（在文件夹模式下使用）
  htmlPath?: string
  cssPath?: string
  jsPath?: string
}

export interface ProjectConfig {
  autoSave: boolean
  autoSaveInterval: number
  defaultTransition: string
  showPageNumbers: boolean
  loopPresentation: boolean
}

export interface Theme {
  id: string
  name: string
  colors: ThemeColors
  fonts: ThemeFonts
  spacing: ThemeSpacing
}

export interface ThemeColors {
  primary: string
  secondary: string
  background: string
  text: string
  accent: string
}

export interface ThemeFonts {
  heading: string
  body: string
  code: string
}

export interface ThemeSpacing {
  small: number
  medium: number
  large: number
}

export interface ProjectFile {
  name: string
  content: string
  type: 'html' | 'css' | 'js' | 'json'
  path: string
}

// 文件系统操作接口
export interface FileSystemAPI {
  // 选择项目文件夹
  selectProjectFolder(): Promise<string | null>
  // 创建项目文件夹
  createProjectFolder(path: string, projectName: string): Promise<string>
  // 读取项目
  loadProject(projectPath: string): Promise<Project>
  // 保存项目
  saveProject(project: Project): Promise<void>
  // 读取文件
  readFile(filePath: string): Promise<string>
  // 写入文件
  writeFile(filePath: string, content: string): Promise<void>
  // 检查文件是否存在
  fileExists(filePath: string): Promise<boolean>
  // 创建目录
  createDirectory(dirPath: string): Promise<void>
}

// 项目存储管理器接口
export interface ProjectStorageManager {
  // 获取缓存的项目列表
  getCachedProjects(): ProjectCache[]
  // 添加项目到缓存
  addProjectToCache(projectCache: ProjectCache): void
  // 从缓存中移除项目
  removeProjectFromCache(projectId: string): void
  // 更新缓存中的项目信息
  updateProjectInCache(projectCache: ProjectCache): void
  // 清空缓存
  clearCache(): void
}