# HTML PPT 编辑器

一个基于 Vue.js 3 的现代化 HTML PPT 编辑器，支持可视化编辑、代码编辑和全屏播放功能。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue](https://img.shields.io/badge/Vue-3.x-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![Vite](https://img.shields.io/badge/Vite-5.x-purple.svg)

## ✨ 主要特性

### 🎨 双模式编辑
- **可视化编辑**：基于 GrapesJS 的拖拽式页面设计
- **代码编辑**：Monaco Editor 提供的专业代码编辑体验
- **实时预览**：所见即所得的编辑体验

### 📁 智能项目管理
- **文件夹项目**：基于浏览器文件系统 API 的本地文件夹存储
- **内存项目**：快速创建和编辑，支持 JSON 导出
- **项目缓存**：智能缓存机制，快速访问最近项目
- **拖拽排序**：可视化页面顺序调整

### 🎭 专业播放器
- **全屏播放**：沉浸式 PPT 演示体验
- **绘图工具**：内置画笔、橡皮擦、激光笔
- **智能导航**：键盘快捷键和可视化翻页控制
- **浮动工具箱**：可拖拽的半透明工具栏

### 🎯 高级功能
- **多页管理**：支持无限页面创建和管理
- **主题系统**：可自定义的主题配置
- **响应式设计**：适配各种屏幕尺寸
- **TypeScript 支持**：完整的类型安全

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- 现代浏览器（推荐 Chrome 86+、Edge 86+）

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用。

### 构建生产版本

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 📖 使用指南

### 创建项目

1. **文件夹项目（推荐）**
   - 点击"新建项目" → "文件夹项目"
   - 选择存储位置，输入项目名称
   - 项目将保存为文件夹结构，支持版本控制

2. **内存项目**
   - 点击"新建项目" → "内存项目"
   - 快速创建，可导出为 JSON 文件

### 编辑页面

1. **可视化编辑**
   - 拖拽组件到画布
   - 实时调整样式和属性
   - 所见即所得的编辑体验

2. **代码编辑**
   - 切换到"编辑"模式
   - 分别编辑 HTML、CSS、JavaScript
   - 支持语法高亮和智能提示

### 播放演示

1. 点击"播放"按钮进入全屏模式
2. 使用键盘快捷键或点击按钮翻页：
   - `←` `↑` `PageUp`：上一页
   - `→` `↓` `PageDown` `Space`：下一页
   - `Esc`：退出播放
3. 使用绘图工具进行标注：
   - 🖊️ **画笔**：8种颜色，4种大小
   - 🧽 **橡皮**：4种大小，一键清除
   - 🔴 **激光笔**：红色指示点

## 🏗️ 项目架构

### 技术栈

- **前端框架**：Vue.js 3 (Composition API)
- **开发语言**：TypeScript
- **构建工具**：Vite
- **状态管理**：Pinia
- **UI 组件**：Element Plus
- **编辑器**：Monaco Editor, GrapesJS
- **样式方案**：CSS3 + Scoped Styles

### 目录结构

```
src/
├── components/          # Vue 组件
│   ├── Editor/         # 编辑器相关组件
│   ├── Player/         # 播放器组件
│   └── ProjectManager/ # 项目管理组件
├── views/              # 页面视图
├── stores/             # Pinia 状态管理
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
│   ├── fileSystem.ts   # 文件系统 API
│   └── projectStorage.ts # 项目存储管理
└── assets/             # 静态资源
```

### 核心模块

1. **项目管理** (`stores/project.ts`)
   - 项目 CRUD 操作
   - 文件系统集成
   - 缓存管理

2. **编辑器** (`components/Editor/`)
   - 双模式编辑切换
   - Monaco Editor 集成
   - GrapesJS 可视化编辑

3. **播放器** (`components/Player/`)
   - 全屏播放控制
   - 绘图工具系统
   - 导航和快捷键

## 🔧 开发指南

### 代码规范

项目使用 ESLint + Prettier 保持代码风格一致：

```bash
# 代码检查
npm run lint

# 代码格式化
npm run format

# TypeScript 类型检查
npm run type-check
```

### 提交规范

遵循 Conventional Commits 规范：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 添加新功能

1. 在 `src/types/` 中定义相关类型
2. 在 `src/stores/` 中添加状态管理逻辑
3. 在 `src/components/` 中创建 Vue 组件
4. 更新相关文档

## 🌐 浏览器兼容性

| 功能 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|---------|------|
| 基础功能 | ✅ 80+ | ✅ 78+ | ✅ 14+ | ✅ 80+ |
| 文件系统 API | ✅ 86+ | ❌ | ❌ | ✅ 86+ |
| 全屏 API | ✅ | ✅ | ✅ | ✅ |
| Canvas 绘图 | ✅ | ✅ | ✅ | ✅ |

**注意**：文件夹项目功能需要支持 File System Access API 的浏览器。在不支持的浏览器中，可以使用内存项目功能。

## 🤝 贡献指南

我们欢迎任何形式的贡献！

### 报告问题

- 使用 [GitHub Issues](https://github.com/your-username/htmlppt/issues) 报告 bug
- 提供详细的复现步骤和环境信息
- 如果可能，请提供最小复现示例

### 提交代码

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'feat: add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 创建 Pull Request

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/your-username/htmlppt.git
cd htmlppt

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 📝 更新日志

### v1.0.0 (2024-10-30)

#### 新功能
- ✨ 基础项目管理和编辑功能
- ✨ 文件夹项目支持
- ✨ 全屏播放器和绘图工具
- ✨ 拖拽页面排序
- ✨ 双模式编辑（可视化 + 代码）

#### 技术特性
- 🔧 基于 Vue 3 + TypeScript
- 🔧 Vite 构建系统
- 🔧 Pinia 状态管理
- 🔧 完整的类型定义

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Element Plus](https://element-plus.org/) - Vue 3 组件库
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 代码编辑器
- [GrapesJS](https://grapesjs.com/) - 可视化编辑器
- [Vite](https://vitejs.dev/) - 下一代前端构建工具

## 📞 联系我们

- 项目主页：[GitHub Repository](https://github.com/your-username/htmlppt)
- 问题反馈：[GitHub Issues](https://github.com/your-username/htmlppt/issues)
- 功能建议：[GitHub Discussions](https://github.com/your-username/htmlppt/discussions)

---

**如果这个项目对你有帮助，请给我们一个 ⭐️！**