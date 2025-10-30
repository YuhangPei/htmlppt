<template>
  <div class="project-manager">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-dropdown @command="handleCreateCommand">
        <el-button type="primary" :icon="Plus">
          新建项目
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="folder" v-if="projectStore.fileSystemSupported.supported">
              <el-icon><FolderAdd /></el-icon>
              文件夹项目（推荐）
            </el-dropdown-item>
            <el-dropdown-item command="memory">
              <el-icon><Plus /></el-icon>
              内存项目
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown @command="handleOpenCommand">
        <el-button :icon="FolderOpened">
          打开项目
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="folder" v-if="projectStore.fileSystemSupported.supported">
              <el-icon><FolderOpened /></el-icon>
              打开文件夹项目
            </el-dropdown-item>
            <el-dropdown-item command="json">
              <el-icon><Document /></el-icon>
              导入JSON项目
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-button
        :icon="Download"
        :disabled="!projectStore.hasCurrentProject"
        :loading="projectStore.isLoading"
        @click="saveCurrentProject"
      >
        保存项目
      </el-button>
      <div class="search-box">
        <el-input
          v-model="searchQuery"
          placeholder="搜索项目..."
          :prefix-icon="Search"
          clearable
          @input="handleSearch"
        />
      </div>
    </div>

    <!-- 项目列表 -->
    <div class="project-list">
      <div class="list-header">
        <h3>我的项目</h3>
        <span class="project-count">{{ filteredProjects.length }} 个项目</span>
        <div class="header-actions">
          <el-button
            v-if="!projectStore.fileSystemSupported.supported"
            size="small"
            type="warning"
            :icon="Warning"
            @click="showCompatibilityDialog = true"
          >
            兼容性提示
          </el-button>
        </div>
      </div>

      <div v-if="filteredProjects.length === 0" class="empty-state">
        <el-empty description="暂无项目">
          <el-button type="primary" @click="handleCreateCommand('folder')">
            创建第一个项目
          </el-button>
        </el-empty>
      </div>

      <div v-else class="project-grid">
        <div
          v-for="project in filteredProjects"
          :key="project.id"
          class="project-card"
          :class="{ active: projectStore.currentProject?.id === project.id }"
          @click="selectProject(project)"
        >
          <div class="project-thumbnail">
            <el-icon class="thumbnail-icon">
              <component :is="getProjectIcon(project)" />
            </el-icon>
            <div class="project-type-badge">
              {{ getProjectTypeName(project) }}
            </div>
          </div>
          <div class="project-info">
            <h4 class="project-name">{{ project.name }}</h4>
            <p class="project-description">
              {{ project.description || '暂无描述' }}
            </p>
            <div class="project-meta">
              <span class="page-count">{{ getProjectPageCount(project) }} 页</span>
              <span class="update-time">{{ formatDate(getProjectUpdateTime(project)) }}</span>
            </div>
            <div class="project-path" v-if="isProjectCache(project)">
              <el-icon><FolderOpened /></el-icon>
              <span>{{ project.path }}</span>
            </div>
          </div>
          <div class="project-actions" @click.stop>
            <el-dropdown trigger="click">
              <el-button :icon="MoreFilled" circle />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="duplicateProject(project)" v-if="!isProjectCache(project)">
                    <el-icon><CopyDocument /></el-icon>
                    复制项目
                  </el-dropdown-item>
                  <el-dropdown-item @click="renameProject(project)" v-if="!isProjectCache(project)">
                    <el-icon><Edit /></el-icon>
                    重命名
                  </el-dropdown-item>
                  <el-dropdown-item @click="removeFromCache(project)" v-if="isProjectCache(project)">
                    <el-icon><Delete /></el-icon>
                    从列表移除
                  </el-dropdown-item>
                  <el-dropdown-item
                    @click="deleteProject(project)"
                    v-if="!isProjectCache(project)"
                    divided
                  >
                    <el-icon><Delete /></el-icon>
                    删除项目
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </div>

    <!-- 当前项目信息 -->
    <div
      v-if="projectStore.hasCurrentProject"
      class="current-project-panel"
    >
      <div class="panel-header">
        <h3>当前项目</h3>
        <el-button
          size="small"
          :icon="Close"
          @click="projectStore.closeProject"
        >
          关闭
        </el-button>
      </div>
      <div class="project-details">
        <h4>{{ projectStore.currentProject?.name }}</h4>
        <p>{{ projectStore.currentProject?.description }}</p>
        <div class="project-stats">
          <div class="stat-item">
            <span class="label">页面数:</span>
            <span class="value">{{ projectStore.totalPages }}</span>
          </div>
          <div class="stat-item">
            <span class="label">创建时间:</span>
            <span class="value">{{ formatDate(projectStore.currentProject?.createdAt) }}</span>
          </div>
          <div class="stat-item">
            <span class="label">最后修改:</span>
            <span class="value">{{ formatDate(projectStore.currentProject?.updatedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- 页面导航 -->
      <div class="page-navigation-section">
        <PageNavigation />
      </div>
    </div>

    <!-- 兼容性提示对话框 -->
    <el-dialog
      v-model="showCompatibilityDialog"
      title="浏览器兼容性提示"
      width="500px"
    >
      <div class="compatibility-info">
        <el-alert
          type="warning"
          :closable="false"
          show-icon
        >
          <template #title>
            当前浏览器不支持文件系统访问功能
          </template>
          <p>{{ projectStore.fileSystemSupported.message }}</p>
          <p>推荐使用以下浏览器以获得最佳体验：</p>
          <ul>
            <li>Chrome 86+</li>
            <li>Edge 86+</li>
            <li>Opera 72+</li>
          </ul>
          <p>在不支持的浏览器中，您仍可以使用内存项目功能，但项目将无法持久化保存到本地文件系统。</p>
        </el-alert>
      </div>
      <template #footer>
        <el-button @click="showCompatibilityDialog = false">我知道了</el-button>
      </template>
    </el-dialog>

    <!-- 创建项目对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="createDialogTitle"
      width="500px"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="80px"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input
            v-model="createForm.name"
            placeholder="请输入项目名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            placeholder="请输入项目描述（可选）"
            maxlength="200"
            show-word-limit
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button
          type="primary"
          :loading="projectStore.isLoading"
          @click="createProject"
        >
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 重命名项目对话框 -->
    <el-dialog
      v-model="showRenameDialog"
      title="重命名项目"
      width="400px"
    >
      <el-form
        ref="renameFormRef"
        :model="renameForm"
        :rules="renameRules"
        label-width="80px"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input
            v-model="renameForm.name"
            placeholder="请输入新的项目名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRenameDialog = false">取消</el-button>
        <el-button
          type="primary"
          :loading="projectStore.isLoading"
          @click="confirmRename"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import {
  Plus,
  FolderOpened,
  FolderAdd,
  Download,
  Search,
  Document,
  MoreFilled,
  CopyDocument,
  Edit,
  Delete,
  Close,
  ArrowDown,
  Warning,
  Folder,
} from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/project'
import PageNavigation from './PageNavigation.vue'
import type { Project, ProjectCache } from '@/types'

const projectStore = useProjectStore()
const router = useRouter()

// 响应式数据
const searchQuery = ref('')
const showCreateDialog = ref(false)
const showRenameDialog = ref(false)
const showCompatibilityDialog = ref(false)
const fileInput = ref<HTMLInputElement>()
const createFormRef = ref<FormInstance>()
const renameFormRef = ref<FormInstance>()
const createMode = ref<'folder' | 'memory'>('folder') // 创建模式

// 创建项目表单
const createForm = ref({
  name: '',
  description: '',
})

// 重命名表单
const renameForm = ref({
  name: '',
  projectId: '',
})

// 表单验证规则
const createRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 50, message: '项目名称长度在 2 到 50 个字符', trigger: 'blur' },
  ],
}

const renameRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 50, message: '项目名称长度在 2 到 50 个字符', trigger: 'blur' },
  ],
}

// 计算属性
const filteredProjects = computed(() => {
  // 合并缓存项目和内存项目
  const allProjects = [
    ...projectStore.projectsCache,
    // 暂时保留内存项目的兼容性（如果有的话）
  ]

  if (!searchQuery.value) {
    return allProjects
  }

  const query = searchQuery.value.toLowerCase()
  return allProjects.filter(project =>
    project.name.toLowerCase().includes(query) ||
    project.description?.toLowerCase().includes(query)
  )
})

const createDialogTitle = computed(() => {
  return createMode.value === 'folder' ? '创建文件夹项目' : '创建内存项目'
})

// 方法
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
}

// 处理创建命令
const handleCreateCommand = (command: string) => {
  if (command === 'folder') {
    createMode.value = 'folder'
    showCreateDialog.value = true
  } else if (command === 'memory') {
    createMode.value = 'memory'
    showCreateDialog.value = true
  }
}

// 处理打开命令
const handleOpenCommand = (command: string) => {
  if (command === 'folder') {
    openFolderProject()
  } else if (command === 'json') {
    openProject()
  }
}

// 打开文件夹项目
const openFolderProject = async () => {
  try {
    const project = await projectStore.openFolderProject()
    if (project) {
      ElMessage.success(`已打开项目: ${project.name}`)
      router.push(`/editor/${project.id}`)
    }
  } catch (error) {
    console.error('Failed to open folder project:', error)
    ElMessage.error(error instanceof Error ? error.message : '打开项目失败')
  }
}

// 判断是否为项目缓存
const isProjectCache = (project: any): project is ProjectCache => {
  return 'pageCount' in project && !('pages' in project)
}

// 获取项目图标
const getProjectIcon = (project: Project | ProjectCache) => {
  return isProjectCache(project) ? Folder : Document
}

// 获取项目类型名称
const getProjectTypeName = (project: Project | ProjectCache) => {
  return isProjectCache(project) ? '文件夹' : '内存'
}

// 获取项目页面数量
const getProjectPageCount = (project: Project | ProjectCache) => {
  return isProjectCache(project) ? project.pageCount : project.pages.length
}

// 获取项目更新时间
const getProjectUpdateTime = (project: Project | ProjectCache) => {
  return project.updatedAt
}

// 从缓存中移除项目
const removeFromCache = async (project: ProjectCache) => {
  try {
    await ElMessageBox.confirm(
      `确定要从列表中移除项目 "${project.name}" 吗？这不会删除文件夹中的项目文件。`,
      '移除确认',
      {
        confirmButtonText: '确定移除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    projectStore.removeProjectFromCache(project.id)
    ElMessage.success('项目已从列表中移除')
  } catch (error) {
    // 用户取消移除，不做处理
  }
}

const selectProject = async (project: Project | ProjectCache) => {
  try {
    if (isProjectCache(project)) {
      // 从缓存加载项目
      const loadedProject = await projectStore.loadProjectFromCache(project)
      ElMessage.success(`已打开项目: ${loadedProject.name}`)
      router.push(`/editor/${loadedProject.id}`)
    } else {
      // 直接打开内存项目
      projectStore.openProject(project)
      ElMessage.success(`已打开项目: ${project.name}`)
      router.push(`/editor/${project.id}`)
    }
  } catch (error) {
    console.error('Failed to select project:', error)
    ElMessage.error(error instanceof Error ? error.message : '打开项目失败')
  }
}

const openProject = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const projectData = JSON.parse(text) as Project

    // 验证项目数据格式
    if (!projectData.id || !projectData.name || !Array.isArray(projectData.pages)) {
      throw new Error('项目文件格式不正确')
    }

    // 直接打开项目（内存模式）
    projectStore.openProject(projectData)

    ElMessage.success(`项目 "${projectData.name}" 已成功打开`)
  } catch (error) {
    console.error('Failed to open project:', error)
    ElMessage.error('打开项目失败，请检查文件格式')
  }

  // 清空文件输入
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const saveCurrentProject = async () => {
  if (!projectStore.currentProject) {
    ElMessage.error('没有可保存的项目')
    return
  }

  try {
    // 如果是文件夹项目，使用文件夹保存
    if (projectStore.currentProject.path) {
      await projectStore.saveCurrentProject()
      ElMessage.success('项目已保存到文件夹')
    } else {
      // 如果是内存项目，提供下载JSON的选项
      const projectData = JSON.stringify(projectStore.currentProject, null, 2)
      const blob = new Blob([projectData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `${projectStore.currentProject.name}.json`
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

const createProject = async () => {
  if (!createFormRef.value) return

  try {
    await createFormRef.value.validate()

    let project: Project

    if (createMode.value === 'folder') {
      // 创建文件夹项目
      project = await projectStore.createFolderProject(
        createForm.value.name,
        createForm.value.description
      )
    } else {
      // 创建内存项目
      project = projectStore.createProject(
        createForm.value.name,
        createForm.value.description
      )
    }

    ElMessage.success(`项目 "${project.name}" 创建成功`)

    // 重置表单
    createForm.value = { name: '', description: '' }
    showCreateDialog.value = false

    // 跳转到编辑器
    router.push(`/editor/${project.id}`)
  } catch (error) {
    console.error('Failed to create project:', error)
    ElMessage.error(error instanceof Error ? error.message : '创建项目失败')
  }
}

const duplicateProject = async (project: Project) => {
  try {
    const newName = `${project.name} - 副本`
    const newProject = projectStore.createProject(newName, project.description)

    // 复制页面数据
    newProject.pages = [...project.pages]
    newProject.config = { ...project.config }
    newProject.theme = { ...project.theme }
    newProject.updatedAt = new Date()

    ElMessage.success(`项目 "${newName}" 复制成功`)
  } catch (error) {
    console.error('Failed to duplicate project:', error)
    ElMessage.error('复制项目失败')
  }
}

const renameProject = (project: Project) => {
  renameForm.value = {
    name: project.name,
    projectId: project.id,
  }
  showRenameDialog.value = true
}

const confirmRename = async () => {
  if (!renameFormRef.value) return

  try {
    await renameFormRef.value.validate()

    // 只能重命名当前项目
    if (projectStore.currentProject && projectStore.currentProject.id === renameForm.value.projectId) {
      projectStore.updateProject({ name: renameForm.value.name })
      ElMessage.success('项目重命名成功')
    }

    showRenameDialog.value = false
  } catch (error) {
    console.error('Failed to rename project:', error)
  }
}

const deleteProject = async (project: Project) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除项目 "${project.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    projectStore.deleteProject(project.id)
    ElMessage.success('项目已删除')
  } catch (error) {
    // 用户取消删除，不做处理
  }
}

const formatDate = (date?: Date) => {
  if (!date) return '-'

  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes === 0 ? '刚刚' : `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// 生命周期
onMounted(() => {
  // 初始化项目存储，加载缓存的项目列表
  projectStore.initializeProjectStorage()
})
</script>

<style scoped>
.project-manager {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.search-box {
  margin-left: auto;
  width: 300px;
}

.project-list {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.list-header h3 {
  margin: 0;
  color: #303133;
}

.project-count {
  color: #909399;
  font-size: 14px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.project-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
}

.project-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.project-card.active {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.project-thumbnail {
  width: 60px;
  height: 60px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  position: relative;
}

.project-type-badge {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  background: #409eff;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  white-space: nowrap;
}

.thumbnail-icon {
  font-size: 24px;
  color: #909399;
}

.project-info {
  flex: 1;
}

.project-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.project-description {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.project-path {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 11px;
  color: #909399;
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
}

.project-path span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.compatibility-info {
  padding: 16px 0;
}

.compatibility-info ul {
  margin: 12px 0;
  padding-left: 20px;
}

.compatibility-info li {
  margin: 4px 0;
}

.project-actions {
  position: absolute;
  top: 16px;
  right: 16px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.project-card:hover .project-actions {
  opacity: 1;
}

.current-project-panel {
  background: white;
  border-top: 1px solid #e4e7ed;
  padding: 20px 24px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-header h3 {
  margin: 0;
  color: #303133;
}

.project-details h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.project-details p {
  margin: 0 0 16px 0;
  color: #606266;
}

.project-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item .label {
  color: #909399;
  font-size: 14px;
}

.stat-item .value {
  color: #303133;
  font-weight: 500;
}

.page-navigation-section {
  margin-top: 20px;
  border-top: 1px solid #e4e7ed;
  padding-top: 16px;
}
</style>