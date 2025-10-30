export enum ExportPlatform {
  Windows = 'win',
  macOS = 'mac',
  Linux = 'linux'
}

export interface ExportConfig {
  platform: ExportPlatform
  outputPath: string
  includeSource: boolean
  compressAssets: boolean
  generateInstaller: boolean
  iconPath?: string
  appName?: string
  appVersion?: string
  appDescription?: string
}

export interface ExportProgress {
  stage: 'preparing' | 'building' | 'packaging' | 'finalizing' | 'completed' | 'error'
  progress: number
  message: string
  error?: string
}

export interface ExportResult {
  success: boolean
  outputPath?: string
  fileName?: string
  fileSize?: number
  error?: string
  warnings?: string[]
}

export interface ElectronConfig {
  main: string
  preload: string
  renderer: string
  build: ElectronBuildConfig
}

export interface ElectronBuildConfig {
  appId: string
  productName: string
  directories: {
    output: string
    buildResources: string
  }
  files: string[]
  extraResources?: string[]
  win: WindowsConfig
  mac: MacConfig
  linux: LinuxConfig
}

export interface WindowsConfig {
  target: 'nsis' | 'portable' | 'zip'
  icon: string
  requestedExecutionLevel: 'asInvoker' | 'highestAvailable'
  publisherName?: string
  verifyUpdateCodeSignature?: boolean
}

export interface MacConfig {
  target: 'dmg' | 'zip' | 'pkg'
  category: string
  icon: string
  hardenedRuntime?: boolean
  entitlements?: string
  entitlementsInherit?: string
}

export interface LinuxConfig {
  target: 'AppImage' | 'snap' | 'deb' | 'rpm' | 'freebsd'
  category: string
  icon: string
  desktop?: DesktopConfig
}

export interface DesktopConfig {
  Name: string
  Comment: string
  Keywords: string[]
  Categories: string[]
}