export interface EditorConfig {
  mode: 'visual' | 'code'
  theme: string
  fontSize: number
  wordWrap: boolean
  minimap: boolean
  autoSave: boolean
}

export interface EditorState {
  currentPageId: string | null
  mode: 'visual' | 'code'
  isDirty: boolean
  isPreviewMode: boolean
  selectedElement: string | null
}

export interface VisualEditorConfig {
  container: string
  plugins: string[]
  components: ComponentConfig[]
  styleManager: StyleManagerConfig
  assetManager: AssetManagerConfig
}

export interface ComponentConfig {
  name: string
  category: string
  attributes: Record<string, any>
  template: string
  style: string
}

export interface StyleManagerConfig {
  sectors: StyleSector[]
}

export interface StyleSector {
  name: string
  open: boolean
  buildProps: string[]
  properties: StyleProperty[]
}

export interface StyleProperty {
  property: string
  type: 'string' | 'number' | 'color' | 'select' | 'slider'
  default: any
  options?: string[]
  min?: number
  max?: number
  step?: number
}

export interface AssetManagerConfig {
  upload: boolean
  uploadFile: string
  uploadText: string
  modalTitle: string
  openAssetsOnDrop: boolean
  inputPlaceholder: string
  addBtnText: string
  uploadAndEdit: boolean
  files: AssetFile[]
}

export interface AssetFile {
  type: string
  src: string
  name: string
  height?: number
  width?: number
  size?: number
}

export interface CodeEditorConfig {
  language: string
  theme: string
  fontSize: number
  wordWrap: boolean
  minimap: boolean
  lineNumbers: boolean
  folding: boolean
  autoIndent: boolean
  formatOnPaste: boolean
  formatOnType: boolean
}

export interface EditorComponent {
  id: string
  name: string
  type: 'text' | 'image' | 'video' | 'button' | 'container'
  attributes: Record<string, any>
  children: EditorComponent[]
  styles: Record<string, string>
  position: {
    x: number
    y: number
    width: number
    height: number
  }
}