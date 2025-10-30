# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Vue.js 3 的 HTML PPT 编辑器，支持可视化编辑和代码编辑两种模式。项目使用现代化的前端技术栈，包括 TypeScript、Pinia 状态管理、Element Plus UI 组件库等。

## 开发命令

### 基础开发命令
```bash
# 启动开发服务器 (http://localhost:3000)
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 代码检查和修复
npm run lint

# 代码格式化
npm run format

# TypeScript 类型检查
npm run type-check
```

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

## 项目架构

### 核心技术栈
- **Vue.js 3** - 使用 Composition API
- **TypeScript** - 严格类型检查
- **Vite** - 构建工具和开发服务器
- **Pinia** - 状态管理
- **Element Plus** - UI 组件库
- **GrapesJS** - 可视化编辑器
- **Monaco Editor** - 代码编辑器

### 目录结构
```
src/
├── components/          # Vue 组件
│   ├── Editor/         # 编辑器相关组件
│   └── ProjectManager/ # 项目管理组件
├── views/              # 页面视图
├── stores/             # Pinia 状态管理
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
└── assets/             # 静态资源
```

### 状态管理架构

项目使用 Pinia 进行状态管理，主要包含三个核心 Store：

1. **项目状态 (`stores/project.ts`)**
   - 管理项目列表、当前项目、页面管理
   - 核心方法：`createProject()`, `addPage()`, `updatePage()`
   - 状态：`currentProject`, `projects`, `isLoading`

2. **编辑器状态 (`stores/editor.ts`)**
   - 管理编辑模式、选中元素、编辑器配置
   - 支持可视化和代码编辑模式切换

3. **播放器状态 (`stores/player.ts`)**
   - 管理 PPT 播放控制、绘图工具、悬浮按钮配置
   - 支持全屏播放、画笔工具、激光笔等功能

### 类型系统

项目具有完整的 TypeScript 类型定义：
- `Project` - 项目数据结构
- `Page` - 页面数据结构
- `EditorConfig` - 编辑器配置
- `PlayerState` - 播放器状态
- `Theme` - 主题配置

### 构建配置

Vite 配置特点：
- 代码分割：vendor (Vue/Pinia)、ui (Element Plus)、editor (GrapesJS/Monaco)
- 路径别名：`@` 指向 `src` 目录
- 开发服务器：端口 3000，自动打开浏览器
- 生产构建：包含 sourcemap，输出到 `dist` 目录

## 开发规范

### 代码风格
- 使用 ESLint + Prettier 保持代码风格一致
- 组件命名：PascalCase
- 文件命名：kebab-case
- 禁用 `vue/multi-word-component-names` 规则
- 未使用变量以 `_` 开头忽略检查

### TypeScript 配置
- 严格类型检查模式
- 使用最新 ECMAScript 版本
- 支持 Vue 3 单文件组件

### Git 提交规范
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

## 关键实现细节

### GrapesJS 集成
项目集成 GrapesJS 作为可视化编辑器，支持拖拽式页面设计。编辑器配置包括自定义插件和样式。

### Monaco Editor 集成
使用 Monaco Editor 提供代码编辑功能，支持 HTML、CSS、JavaScript 的语法高亮和智能提示。

### 文件管理
项目支持创建、打开、保存 PPT 项目，每个项目包含多个页面，每个页面包含 HTML、CSS、JS 代码。

### 播放功能
支持全屏 PPT 播放，包含悬浮导航按钮、画笔工具、激光笔等交互功能。

## 开发注意事项

1. **状态管理**：所有业务状态通过 Pinia stores 管理，避免在组件间直接传递复杂状态
2. **类型安全**：充分利用 TypeScript 类型系统，确保代码的类型安全
3. **组件设计**：遵循单一职责原则，保持组件的可复用性
4. **性能优化**：注意大型 PPT 项目的编辑和播放性能
5. **错误处理**：在 stores 中统一处理错误状态和加载状态

## 项目特殊配置

- 开发服务器自动在 3000 端口启动并打开浏览器
- 构建时进行代码分割优化，提高加载性能
- 支持路径别名 `@` 简化模块导入
- 配置了依赖预构建优化，提升开发体验