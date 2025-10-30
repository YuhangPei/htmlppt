export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  code?: number
}

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
  icon?: string
  description?: string
}

export interface TreeNode {
  id: string
  label: string
  children?: TreeNode[]
  isExpanded?: boolean
  isSelected?: boolean
  icon?: string
  data?: any
}

export interface FileUpload {
  id: string
  name: string
  size: number
  type: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  url?: string
  error?: string
}

export interface NotificationItem {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    handler: () => void
  }
  timestamp: Date
}

export interface ModalConfig {
  title: string
  content?: string
  component?: any
  props?: Record<string, any>
  width?: string | number
  height?: string | number
  closable?: boolean
  maskClosable?: boolean
  showFooter?: boolean
  okText?: string
  cancelText?: string
  onOk?: () => void | Promise<void>
  onCancel?: () => void
}

export type Size = 'small' | 'medium' | 'large'
export type ThemeMode = 'light' | 'dark' | 'auto'
export type Language = 'zh-CN' | 'en-US' | 'ja-JP'

export interface AppConfig {
  version: string
  name: string
  description: string
  author: string
  homepage: string
  repository: string
  license: string
  theme: ThemeMode
  language: Language
  autoUpdate: boolean
  telemetry: boolean
}