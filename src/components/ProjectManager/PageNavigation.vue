<template>
  <div class="page-navigation">
    <!-- 页面导航头部 -->
    <div class="navigation-header">
      <h3>页面导航</h3>
      <div class="header-actions">
        <el-button
          size="small"
          :icon="Plus"
          type="primary"
          @click="addNewPage"
        >
          添加页面
        </el-button>
        <el-dropdown trigger="click" @command="handleBatchAction">
          <el-button size="small" :icon="Operation">
            批量操作
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="duplicate-all">
                <el-icon><CopyDocument /></el-icon>
                复制所有页面
              </el-dropdown-item>
              <el-dropdown-item command="delete-selected" :disabled="selectedPages.length === 0">
                <el-icon><Delete /></el-icon>
                删除选中页面
              </el-dropdown-item>
              <el-dropdown-item command="reorder" divided>
                <el-icon><Sort /></el-icon>
                重新排序
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="navigation-filters">
      <el-input
        v-model="searchQuery"
        placeholder="搜索页面..."
        :prefix-icon="Search"
        size="small"
        clearable
      />
      <el-select
        v-model="filterType"
        placeholder="筛选类型"
        size="small"
        style="width: 120px"
      >
        <el-option label="全部" value="all" />
        <el-option label="有内容" value="has-content" />
        <el-option label="空白" value="empty" />
      </el-select>
    </div>

    <!-- 页面列表 -->
    <div class="page-list" ref="pageListRef">
      <transition-group name="page-list" tag="div">
        <div
          v-for="page in filteredPages"
          :key="page.id"
          class="page-item"
          :class="{
            active: projectStore.currentProject?.currentPageId === page.id,
            selected: selectedPages.includes(page.id),
            dragging: isDragging && draggedPage?.id === page.id,
          }"
          draggable="true"
          @click="selectPage(page)"
          @dragstart="handleDragStart(page, $event)"
          @dragend="handleDragEnd"
          @dragover="handleDragOver($event)"
          @drop="handleDrop(page, $event)"
          @dragenter="handleDragEnter(page)"
          @dragleave="handleDragLeave"
        >
          <!-- 选择框 -->
          <div class="page-checkbox" @click.stop>
            <el-checkbox
              :model-value="selectedPages.includes(page.id)"
              @change="togglePageSelection(page.id, $event)"
            />
          </div>

          <!-- 页面缩略图 -->
          <div class="page-thumbnail" @click.stop="editPage(page)">
            <div class="thumbnail-content">
              <div v-if="page.html.trim()" class="page-preview" v-html="getPagePreview(page.html)"></div>
              <div v-else class="empty-preview">
                <el-icon><Document /></el-icon>
                <span>空白页面</span>
              </div>
            </div>
            <div class="page-number">{{ page.order + 1 }}</div>
          </div>

          <!-- 页面信息 -->
          <div class="page-info">
            <div class="page-name" @click.stop="startEditName(page)">
              <span v-if="editingPageId !== page.id">{{ page.name }}</span>
              <el-input
                v-else
                ref="nameInputRef"
                v-model="editingName"
                size="small"
                @blur="finishEditName(page)"
                @keyup.enter="finishEditName(page)"
                @keyup.esc="cancelEditName"
              />
            </div>
            <div class="page-meta">
              <span class="page-status">
                <el-icon v-if="page.html.trim()" color="#67c23a"><Check /></el-icon>
                <el-icon v-else color="#909399"><Minus /></el-icon>
                {{ page.html.trim() ? '有内容' : '空白' }}
              </span>
              <span class="page-time">{{ formatDate(page.updatedAt) }}</span>
            </div>
          </div>

          <!-- 页面操作 -->
          <div class="page-actions" @click.stop>
            <el-dropdown trigger="click" @command="(command: string) => handlePageAction(command, page)">
              <el-button size="small" :icon="MoreFilled" circle />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">
                    <el-icon><Edit /></el-icon>
                    编辑页面
                  </el-dropdown-item>
                  <el-dropdown-item command="duplicate">
                    <el-icon><CopyDocument /></el-icon>
                    复制页面
                  </el-dropdown-item>
                  <el-dropdown-item command="rename">
                    <el-icon><EditPen /></el-icon>
                    重命名
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="delete"
                    divided
                  >
                    <el-icon><Delete /></el-icon>
                    删除页面
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredPages.length === 0" class="empty-state">
      <el-empty description="暂无页面">
        <el-button type="primary" @click="addNewPage">
          创建第一页
        </el-button>
      </el-empty>
    </div>

    <!-- 批量选择工具栏 -->
    <div v-if="selectedPages.length > 0" class="batch-toolbar">
      <div class="batch-info">
        已选择 {{ selectedPages.length }} 个页面
      </div>
      <div class="batch-actions">
        <el-button size="small" @click="selectAllPages">
          全选
        </el-button>
        <el-button size="small" @click="clearSelection">
          清空选择
        </el-button>
        <el-button
          size="small"
          type="danger"
          @click="deleteSelectedPages"
        >
          删除选中
        </el-button>
      </div>
    </div>

    <!-- 页面设置对话框 -->
    <el-dialog
      v-model="showPageSettings"
      :title="`页面设置 - ${currentSettingsPage?.name}`"
      width="500px"
    >
      <el-form
        v-if="currentSettingsPage"
        ref="settingsFormRef"
        :model="pageSettings"
        label-width="80px"
      >
        <el-form-item label="页面名称">
          <el-input v-model="pageSettings.name" />
        </el-form-item>
        <el-form-item label="页面顺序">
          <el-input-number
            v-model="pageSettings.order"
            :min="0"
            :max="projectStore.totalPages - 1"
          />
        </el-form-item>
        <el-form-item label="背景颜色">
          <el-color-picker v-model="pageSettings.backgroundColor" />
        </el-form-item>
        <el-form-item label="过渡效果">
          <el-select v-model="pageSettings.transition">
            <el-option label="无" value="none" />
            <el-option label="淡入淡出" value="fade" />
            <el-option label="滑动" value="slide" />
            <el-option label="缩放" value="zoom" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPageSettings = false">取消</el-button>
        <el-button type="primary" @click="savePageSettings">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Operation,
  CopyDocument,
  Delete,
  Sort,
  Search,
  Document,
  Check,
  Minus,
  MoreFilled,
  Edit,
  EditPen,
} from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/project'
import type { Page } from '@/types'

const projectStore = useProjectStore()

// 响应式数据
const searchQuery = ref('')
const filterType = ref('all')
const selectedPages = ref<string[]>([])
const isDragging = ref(false)
const draggedPage = ref<Page | null>(null)
const dragOverPage = ref<Page | null>(null)

// 编辑相关
const editingPageId = ref<string | null>(null)
const editingName = ref('')
const nameInputRef = ref()

// 页面设置
const showPageSettings = ref(false)
const currentSettingsPage = ref<Page | null>(null)
const pageSettings = ref({
  name: '',
  order: 0,
  backgroundColor: '#ffffff',
  transition: 'fade',
})

// 引用
const pageListRef = ref()

// 计算属性
const filteredPages = computed(() => {
  if (!projectStore.currentProject) return []

  let pages = [...projectStore.currentProject.pages]

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    pages = pages.filter(page =>
      page.name.toLowerCase().includes(query)
    )
  }

  // 类型过滤
  if (filterType.value === 'has-content') {
    pages = pages.filter(page => page.html.trim())
  } else if (filterType.value === 'empty') {
    pages = pages.filter(page => !page.html.trim())
  }

  return pages.sort((a, b) => a.order - b.order)
})

// 方法
const selectPage = (page: Page) => {
  projectStore.setCurrentPage(page.id)
}

const addNewPage = () => {
  try {
    const page = projectStore.addPage(`页面 ${projectStore.totalPages + 1}`)
    ElMessage.success(`已添加页面: ${page.name}`)
    selectPage(page)
  } catch (error) {
    ElMessage.error('添加页面失败')
  }
}

const editPage = (page: Page) => {
  selectPage(page)
  // 这里可以切换到编辑器视图
}

const startEditName = (page: Page) => {
  editingPageId.value = page.id
  editingName.value = page.name

  nextTick(() => {
    nameInputRef.value?.focus()
  })
}

const finishEditName = (page: Page) => {
  if (editingName.value.trim() && editingName.value !== page.name) {
    projectStore.updatePage(page.id, { name: editingName.value.trim() })
    ElMessage.success('页面名称已更新')
  }

  editingPageId.value = null
  editingName.value = ''
}

const cancelEditName = () => {
  editingPageId.value = null
  editingName.value = ''
}

const togglePageSelection = (pageId: string, selected: boolean) => {
  if (selected) {
    selectedPages.value.push(pageId)
  } else {
    const index = selectedPages.value.indexOf(pageId)
    if (index > -1) {
      selectedPages.value.splice(index, 1)
    }
  }
}

const selectAllPages = () => {
  selectedPages.value = filteredPages.value.map(page => page.id)
}

const clearSelection = () => {
  selectedPages.value = []
}

const handlePageAction = async (command: string, page: Page) => {
  switch (command) {
    case 'edit':
      editPage(page)
      break
    case 'duplicate':
      duplicatePage(page)
      break
    case 'rename':
      startEditName(page)
      break
    case 'delete':
      await deletePage(page)
      break
    case 'settings':
      openPageSettings(page)
      break
  }
}

const duplicatePage = (page: Page) => {
  try {
    const newPage = projectStore.addPage(`${page.name} - 副本`)
    projectStore.updatePage(newPage.id, {
      html: page.html,
      css: page.css,
      js: page.js,
    })
    ElMessage.success(`页面 "${newPage.name}" 已复制`)
  } catch (error) {
    ElMessage.error('复制页面失败')
  }
}

const deletePage = async (page: Page) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除页面 "${page.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    projectStore.deletePage(page.id)
    ElMessage.success('页面已删除')

    // 从选择列表中移除
    const index = selectedPages.value.indexOf(page.id)
    if (index > -1) {
      selectedPages.value.splice(index, 1)
    }
  } catch (error) {
    // 用户取消删除
  }
}

const deleteSelectedPages = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedPages.value.length} 个页面吗？此操作不可恢复。`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    selectedPages.value.forEach(pageId => {
      projectStore.deletePage(pageId)
    })

    clearSelection()
    ElMessage.success('选中页面已删除')
  } catch (error) {
    // 用户取消删除
  }
}

const handleBatchAction = async (command: string) => {
  switch (command) {
    case 'duplicate-all':
      duplicateAllPages()
      break
    case 'delete-selected':
      await deleteSelectedPages()
      break
    case 'reorder':
      // 可以实现重新排序功能
      ElMessage.info('重新排序功能开发中...')
      break
  }
}

const duplicateAllPages = () => {
  if (!projectStore.currentProject) return

  const originalPages = [...projectStore.currentProject.pages]
  originalPages.forEach(page => {
    duplicatePage(page)
  })

  ElMessage.success('所有页面已复制')
}

// 拖拽相关方法
const handleDragStart = (page: Page, event: DragEvent) => {
  isDragging.value = true
  draggedPage.value = page

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/html', page.id)
  }
}

const handleDragEnd = () => {
  isDragging.value = false
  draggedPage.value = null
  dragOverPage.value = null
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const handleDrop = (targetPage: Page, event: DragEvent) => {
  event.preventDefault()

  if (!draggedPage.value || draggedPage.value.id === targetPage.id) {
    return
  }

  const draggedIndex = projectStore.currentProject?.pages.findIndex(p => p.id === draggedPage.value?.id)
  const targetIndex = projectStore.currentProject?.pages.findIndex(p => p.id === targetPage.id)

  if (draggedIndex !== undefined && targetIndex !== undefined && projectStore.currentProject) {
    projectStore.reorderPages(draggedIndex, targetIndex)
    ElMessage.success('页面顺序已更新')
  }

  handleDragEnd()
}

const handleDragEnter = (page: Page) => {
  if (draggedPage.value && draggedPage.value.id !== page.id) {
    dragOverPage.value = page
  }
}

const handleDragLeave = () => {
  dragOverPage.value = null
}

// 页面设置相关
const openPageSettings = (page: Page) => {
  currentSettingsPage.value = page
  pageSettings.value = {
    name: page.name,
    order: page.order,
    backgroundColor: '#ffffff',
    transition: 'fade',
  }
  showPageSettings.value = true
}

const savePageSettings = () => {
  if (!currentSettingsPage.value) return

  projectStore.updatePage(currentSettingsPage.value.id, {
    name: pageSettings.value.name,
    order: pageSettings.value.order,
  })

  showPageSettings.value = false
  ElMessage.success('页面设置已保存')
}

// 工具方法
const getPagePreview = (html: string): string => {
  // 简单的HTML预览处理
  const text = html.replace(/<[^>]*>/g, '').trim()
  return text.length > 50 ? text.substring(0, 50) + '...' : text
}

const formatDate = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`

  return date.toLocaleDateString('zh-CN')
}

// 生命周期
onMounted(() => {
  // 可以在这里添加键盘快捷键等
})
</script>

<style scoped>
.page-navigation {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.navigation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.navigation-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.navigation-filters {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.page-list {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.page-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.page-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.page-item.active {
  border-color: #409eff;
  background: #f0f9ff;
}

.page-item.selected {
  border-color: #67c23a;
}

.page-item.dragging {
  opacity: 0.5;
}

.page-checkbox {
  flex-shrink: 0;
}

.page-thumbnail {
  flex-shrink: 0;
  width: 80px;
  height: 60px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  overflow: hidden;
  position: relative;
  cursor: pointer;
}

.thumbnail-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.page-preview {
  font-size: 10px;
  color: #606266;
  text-align: center;
  padding: 4px;
  overflow: hidden;
}

.empty-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 12px;
}

.empty-preview .el-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.page-number {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
}

.page-info {
  flex: 1;
  min-width: 0;
}

.page-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  cursor: text;
}

.page-name:hover {
  color: #409eff;
}

.page-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.page-status {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-actions {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.page-item:hover .page-actions {
  opacity: 1;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.batch-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #e4e7ed;
}

.batch-info {
  color: #606266;
  font-size: 14px;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

/* 动画 */
.page-list-enter-active,
.page-list-leave-active {
  transition: all 0.3s ease;
}

.page-list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.page-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.page-list-move {
  transition: transform 0.3s ease;
}
</style>