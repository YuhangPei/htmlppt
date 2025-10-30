// Export all type definitions
export * from './project'
export * from './editor'
export * from './player'
export * from './export'
export * from './common'

// Re-export commonly used types
export type {
  Project,
  Page,
  Theme,
  ProjectConfig,
  ProjectCache,
  ProjectFile,
  FileSystemAPI,
  ProjectStorageManager,
} from './project'

export type {
  EditorConfig,
  VisualEditorConfig,
  CodeEditorConfig,
  EditorComponent,
  EditorState,
} from './editor'

export type {
  DrawingTool,
  DrawingState,
  Stroke,
  PlayerControls,
  PresentationConfig,
  KeyboardShortcuts,
  PlayerState,
  FloatingButtonConfig,
} from './player'

export type {
  ExportPlatform,
  ExportResult,
  ExportProgress,
  ExportConfig,
  ElectronConfig,
} from './export'

export type {
  TreeNode,
  FileUpload,
  NotificationItem,
  ModalConfig,
  Size,
  ThemeMode,
  Language,
  AppConfig,
  ApiResponse,
  SelectOption,
} from './common'