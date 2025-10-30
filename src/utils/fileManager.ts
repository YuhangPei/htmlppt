import type { Project, Page, ProjectFile, Theme } from '@/types'

/**
 * 文件管理服务
 * 处理项目文件的读写、验证、打包等操作
 */
export class FileManager {
  /**
   * 验证项目数据结构
   */
  static validateProject(projectData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!projectData || typeof projectData !== 'object') {
      errors.push('项目数据格式无效')
      return { isValid: false, errors }
    }

    // 必需字段检查
    const requiredFields = ['id', 'name', 'createdAt', 'updatedAt', 'pages', 'config', 'theme']
    for (const field of requiredFields) {
      if (!(field in projectData)) {
        errors.push(`缺少必需字段: ${field}`)
      }
    }

    // 字段类型检查
    if (projectData.id && typeof projectData.id !== 'string') {
      errors.push('项目ID必须是字符串')
    }

    if (projectData.name && typeof projectData.name !== 'string') {
      errors.push('项目名称必须是字符串')
    }

    if (projectData.pages && !Array.isArray(projectData.pages)) {
      errors.push('页面列表必须是数组')
    }

    // 验证页面数据
    if (Array.isArray(projectData.pages)) {
      projectData.pages.forEach((page: any, index: number) => {
        const pageErrors = this.validatePage(page, index)
        errors.push(...pageErrors)
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * 验证页面数据结构
   */
  static validatePage(pageData: any, index: number): string[] {
    const errors: string[] = []

    if (!pageData || typeof pageData !== 'object') {
      errors.push(`页面 ${index}: 数据格式无效`)
      return errors
    }

    const requiredFields = ['id', 'name', 'order', 'html', 'css', 'createdAt', 'updatedAt']
    for (const field of requiredFields) {
      if (!(field in pageData)) {
        errors.push(`页面 ${index}: 缺少必需字段 ${field}`)
      }
    }

    if (pageData.id && typeof pageData.id !== 'string') {
      errors.push(`页面 ${index}: ID必须是字符串`)
    }

    if (pageData.name && typeof pageData.name !== 'string') {
      errors.push(`页面 ${index}: 名称必须是字符串`)
    }

    if (pageData.order && typeof pageData.order !== 'number') {
      errors.push(`页面 ${index}: 顺序必须是数字`)
    }

    if (pageData.html && typeof pageData.html !== 'string') {
      errors.push(`页面 ${index}: HTML内容必须是字符串`)
    }

    if (pageData.css && typeof pageData.css !== 'string') {
      errors.push(`页面 ${index}: CSS样式必须是字符串`)
    }

    return errors
  }

  /**
   * 从文件加载项目
   */
  static async loadProjectFromFile(file: File): Promise<Project> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const content = event.target?.result as string
          const projectData = JSON.parse(content)

          const validation = this.validateProject(projectData)
          if (!validation.isValid) {
            reject(new Error(`项目文件格式错误:\n${validation.errors.join('\n')}`))
            return
          }

          // 转换日期字符串为Date对象
          const project = this.parseProjectDates(projectData)
          resolve(project)
        } catch (error) {
          reject(new Error(`文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`))
        }
      }

      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }

      reader.readAsText(file, 'utf-8')
    })
  }

  /**
   * 保存项目到文件
   */
  static saveProjectToFile(project: Project, filename?: string): void {
    const projectData = JSON.stringify(project, null, 2)
    const blob = new Blob([projectData], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename || `${project.name}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 清理URL对象
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 100)
  }

  /**
   * 创建项目文件夹结构
   */
  static createProjectStructure(project: Project): ProjectFile[] {
    const files: ProjectFile[] = []

    // 创建配置文件
    files.push({
      name: 'global_config.json',
      content: JSON.stringify(project.config, null, 2),
      type: 'json',
      path: 'config/global_config.json',
    })

    files.push({
      name: 'settings.json',
      content: JSON.stringify({
        autoPlay: false,
        autoPlayInterval: 5000,
        showPageNumbers: true,
        transition: 'fade',
        transitionDuration: 300,
      }, null, 2),
      type: 'json',
      path: 'config/settings.json',
    })

    // 创建主题文件
    files.push({
      name: `${project.theme.id}.json`,
      content: JSON.stringify(project.theme, null, 2),
      type: 'json',
      path: `config/themes/${project.theme.id}.json`,
    })

    // 创建页面文件
    project.pages.forEach((page, index) => {
      // HTML文件
      files.push({
        name: `page_${index + 1}.html`,
        content: this.generatePageHTML(page, project.theme),
        type: 'html',
        path: `pages/page_${index + 1}.html`,
      })

      // CSS文件
      if (page.css) {
        files.push({
          name: `page_${index + 1}.css`,
          content: page.css,
          type: 'css',
          path: `assets/styles/page_${index + 1}.css`,
        })
      }

      // JavaScript文件
      if (page.js) {
        files.push({
          name: `page_${index + 1}.js`,
          content: page.js,
          type: 'js',
          path: `assets/scripts/page_${index + 1}.js`,
        })
      }
    })

    // 创建主入口文件
    files.push({
      name: 'index.html',
      content: this.generateMainIndex(project),
      type: 'html',
      path: 'index.html',
    })

    // 创建播放器脚本
    files.push({
      name: 'player.js',
      content: this.generatePlayerScript(project),
      type: 'js',
      path: 'assets/scripts/player.js',
    })

    // 创建通用样式
    files.push({
      name: 'common.css',
      content: this.generateCommonStyles(project.theme),
      type: 'css',
      path: 'assets/styles/common.css',
    })

    return files
  }

  /**
   * 打包项目为ZIP文件
   */
  static async packProject(project: Project): Promise<Blob> {
    const files = this.createProjectStructure(project)

    // 这里可以使用JSZip库来创建ZIP文件
    // 目前先返回一个包含所有文件的JSON
    const packageData = {
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      files: files.map(f => ({
        name: f.name,
        path: f.path,
        type: f.type,
        content: f.content,
      })),
    }

    const content = JSON.stringify(packageData, null, 2)
    return new Blob([content], { type: 'application/json' })
  }

  /**
   * 解析项目中的日期字符串
   */
  private static parseProjectDates(projectData: any): Project {
    const project = { ...projectData }

    // 转换项目日期
    if (typeof project.createdAt === 'string') {
      project.createdAt = new Date(project.createdAt)
    }
    if (typeof project.updatedAt === 'string') {
      project.updatedAt = new Date(project.updatedAt)
    }

    // 转换页面日期
    if (Array.isArray(project.pages)) {
      project.pages = project.pages.map((page: any): Page => {
        const parsedPage = { ...page }
        if (typeof parsedPage.createdAt === 'string') {
          parsedPage.createdAt = new Date(parsedPage.createdAt)
        }
        if (typeof parsedPage.updatedAt === 'string') {
          parsedPage.updatedAt = new Date(parsedPage.updatedAt)
        }
        return parsedPage
      })
    }

    return project as Project
  }

  /**
   * 生成页面HTML
   */
  private static generatePageHTML(page: Page, theme: Theme): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.name}</title>
    <link rel="stylesheet" href="../assets/styles/common.css">
    <link rel="stylesheet" href="../assets/styles/page_${page.order + 1}.css">
    <style>
        body {
            font-family: ${theme.fonts.body};
            color: ${theme.colors.text};
            background: ${theme.colors.background};
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        .slide {
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .content {
            max-width: 90%;
            max-height: 90%;
            overflow: auto;
        }
    </style>
</head>
<body>
    <div class="slide">
        <div class="content">
            ${page.html}
        </div>
    </div>
    ${page.js ? `<script src="../assets/scripts/page_${page.order + 1}.js"></script>` : ''}
</body>
</html>`
  }

  /**
   * 生成主入口文件
   */
  private static generateMainIndex(project: Project): string {
    const pageList = project.pages.map((page, index) =>
      `<a href="pages/page_${index + 1}.html" class="page-link">
        <div class="page-thumbnail">
            <h3>${page.name}</h3>
            <p>${page.order + 1} / ${project.pages.length}</p>
        </div>
    </a>`
    ).join('')

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.name}</title>
    <link rel="stylesheet" href="assets/styles/common.css">
    <style>
        body {
            font-family: ${project.theme.fonts.body};
            background: ${project.theme.colors.background};
            color: ${project.theme.colors.text};
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .header h1 {
            color: ${project.theme.colors.primary};
            margin: 0;
        }
        .header p {
            color: ${project.theme.colors.secondary};
            margin: 10px 0 0 0;
        }
        .page-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .page-link {
            text-decoration: none;
            color: inherit;
        }
        .page-thumbnail {
            border: 2px solid ${project.theme.colors.primary};
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            background: white;
        }
        .page-thumbnail:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .page-thumbnail h3 {
            margin: 0 0 10px 0;
            color: ${project.theme.colors.primary};
        }
        .page-thumbnail p {
            margin: 0;
            color: ${project.theme.colors.secondary};
            font-size: 14px;
        }
        .actions {
            text-align: center;
            margin-top: 40px;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 0 10px;
            background: ${project.theme.colors.primary};
            color: white;
            text-decoration: none;
            border-radius: 6px;
            transition: background-color 0.3s ease;
        }
        .btn:hover {
            background: ${project.theme.colors.secondary};
        }
        .btn.secondary {
            background: transparent;
            border: 2px solid ${project.theme.colors.primary};
            color: ${project.theme.colors.primary};
        }
        .btn.secondary:hover {
            background: ${project.theme.colors.primary};
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${project.name}</h1>
            <p>${project.description || ''}</p>
        </div>

        <div class="page-grid">
            ${pageList}
        </div>

        <div class="actions">
            <a href="pages/page_1.html" class="btn">开始演示</a>
            <a href="#" class="btn secondary" onclick="window.print()">打印</a>
        </div>
    </div>
</body>
</html>`
  }

  /**
   * 生成播放器脚本
   */
  private static generatePlayerScript(project: Project): string {
    return `// PPT Player Script
class PPTPlayer {
  constructor() {
    this.currentPage = 0;
    this.pages = ${project.pages.length};
    this.isPlaying = false;
    this.autoPlayTimer = null;
    this.init();
  }

  init() {
    this.setupKeyboardShortcuts();
    this.setupTouchGestures();
    this.updatePageNumber();
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          this.nextPage();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.previousPage();
          break;
        case 'Home':
          e.preventDefault();
          this.goToPage(0);
          break;
        case 'End':
          e.preventDefault();
          this.goToPage(this.pages - 1);
          break;
        case 'F11':
          e.preventDefault();
          this.toggleFullscreen();
          break;
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          break;
      }
    });
  }

  setupTouchGestures() {
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    });

    this.handleSwipe = () => {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          this.nextPage();
        } else {
          this.previousPage();
        }
      }
    };
  }

  nextPage() {
    if (this.currentPage < this.pages - 1) {
      this.currentPage++;
      this.loadPage();
    }
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadPage();
    }
  }

  goToPage(pageIndex) {
    if (pageIndex >= 0 && pageIndex < this.pages) {
      this.currentPage = pageIndex;
      this.loadPage();
    }
  }

  loadPage() {
    // 页面切换逻辑
    window.location.href = \`page_\${this.currentPage + 1}.html\`;
  }

  updatePageNumber() {
    const pageNumberElement = document.querySelector('.page-number');
    if (pageNumberElement) {
      pageNumberElement.textContent = \`\${this.currentPage + 1} / \${this.pages}\`;
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  startAutoPlay(interval = 5000) {
    this.stopAutoPlay();
    this.isPlaying = true;
    this.autoPlayTimer = setInterval(() => {
      if (this.currentPage < this.pages - 1) {
        this.nextPage();
      } else {
        this.stopAutoPlay();
      }
    }, interval);
  }

  stopAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
    this.isPlaying = false;
  }
}

// 初始化播放器
document.addEventListener('DOMContentLoaded', () => {
  window.pptPlayer = new PPTPlayer();
});`
  }

  /**
   * 生成通用样式
   */
  private static generateCommonStyles(theme: Theme): string {
    return `/* Common Styles */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: ${theme.fonts.body};
  color: ${theme.colors.text};
  background: ${theme.colors.background};
  line-height: 1.6;
}

h1, h2, h3, h4, h5, h6 {
  font-family: ${theme.fonts.heading};
  color: ${theme.colors.primary};
  margin-top: 0;
  margin-bottom: 1rem;
}

p {
  margin-top: 0;
  margin-bottom: 1rem;
}

a {
  color: ${theme.colors.primary};
  text-decoration: none;
}

a:hover {
  color: ${theme.colors.secondary};
  text-decoration: underline;
}

code {
  font-family: ${theme.fonts.code};
  background-color: #f5f5f5;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.9em;
}

pre {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 5px;
  overflow-x: auto;
}

pre code {
  background: none;
  padding: 0;
}

img {
  max-width: 100%;
  height: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

th, td {
  border: 1px solid #ddd;
  padding: 0.5rem;
  text-align: left;
}

th {
  background-color: ${theme.colors.primary};
  color: white;
}

blockquote {
  border-left: 4px solid ${theme.colors.primary};
  padding-left: 1rem;
  margin-left: 0;
  font-style: italic;
}

hr {
  border: none;
  border-top: 1px solid #ddd;
  margin: 2rem 0;
}

.page-number {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
}

/* Animation Classes */
.fade-in {
  animation: fadeIn 0.5s ease-in;
}

.fade-out {
  animation: fadeOut 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

.slide-in-right {
  animation: slideInRight 0.5s ease-out;
}

.slide-out-left {
  animation: slideOutLeft 0.5s ease-in;
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes slideOutLeft {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
}`
  }

  /**
   * 修复项目数据
   */
  static repairProject(projectData: any): Project {
    const repaired = { ...projectData }

    // 修复缺失的必需字段
    if (!repaired.id) {
      repaired.id = this.generateId()
    }

    if (!repaired.name) {
      repaired.name = '未命名项目'
    }

    if (!repaired.createdAt) {
      repaired.createdAt = new Date()
    } else if (typeof repaired.createdAt === 'string') {
      repaired.createdAt = new Date(repaired.createdAt)
    }

    if (!repaired.updatedAt) {
      repaired.updatedAt = new Date()
    } else if (typeof repaired.updatedAt === 'string') {
      repaired.updatedAt = new Date(repaired.updatedAt)
    }

    // 修复页面数组
    if (!Array.isArray(repaired.pages)) {
      repaired.pages = []
    }

    // 修复每个页面
    repaired.pages = repaired.pages.map((page: any, index: number): Page => {
      const repairedPage = { ...page }

      if (!repairedPage.id) {
        repairedPage.id = this.generateId()
      }

      if (!repairedPage.name) {
        repairedPage.name = `页面 ${index + 1}`
      }

      if (typeof repairedPage.order !== 'number') {
        repairedPage.order = index
      }

      if (!repairedPage.html) {
        repairedPage.html = '<div></div>'
      }

      if (!repairedPage.css) {
        repairedPage.css = ''
      }

      if (!repairedPage.createdAt) {
        repairedPage.createdAt = new Date()
      } else if (typeof repairedPage.createdAt === 'string') {
        repairedPage.createdAt = new Date(repairedPage.createdAt)
      }

      if (!repairedPage.updatedAt) {
        repairedPage.updatedAt = new Date()
      } else if (typeof repairedPage.updatedAt === 'string') {
        repairedPage.updatedAt = new Date(repairedPage.updatedAt)
      }

      return repairedPage
    })

    // 修复配置
    if (!repaired.config || typeof repaired.config !== 'object') {
      repaired.config = {
        autoSave: true,
        autoSaveInterval: 30000,
        defaultTransition: 'fade',
        showPageNumbers: true,
        loopPresentation: false,
      }
    }

    // 修复主题
    if (!repaired.theme || typeof repaired.theme !== 'object') {
      repaired.theme = {
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
      }
    }

    return repaired as Project
  }

  /**
   * 生成唯一ID
   */
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * 获取文件扩展名
   */
  static getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase()
  }

  /**
   * 验证文件类型
   */
  static isValidProjectFile(filename: string): boolean {
    const extension = this.getFileExtension(filename)
    return extension === 'json'
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

export default FileManager