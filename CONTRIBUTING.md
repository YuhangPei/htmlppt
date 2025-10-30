# 贡献指南

感谢您对 HTML PPT 编辑器项目的关注！我们欢迎任何形式的贡献，包括但不限于：

- 🐛 报告和修复 bug
- ✨ 提出和实现新功能
- 📖 改进文档
- 🧪 编写测试
- 🎨 优化 UI/UX

## 开始之前

在开始贡献之前，请确保您已经：

1. ⭐ 给项目点了 Star
2. 🍴 Fork 了项目到您的 GitHub 账户
3. 📖 阅读了项目的 [README.md](README.md)
4. 🔍 检查了 [Issues](https://github.com/your-username/htmlppt/issues) 确保没有重复

## 开发环境设置

### 系统要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### 克隆和安装

```bash
# 克隆您 fork 的仓库
git clone https://github.com/YOUR_USERNAME/htmlppt.git
cd htmlppt

# 添加上游仓库
git remote add upstream https://github.com/your-username/htmlppt.git

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建项目
npm run build

# 代码检查
npm run lint

# 代码格式化
npm run format

# TypeScript 类型检查
npm run type-check

# 预览构建结果
npm run preview
```

## 贡献流程

### 1. 创建 Issue

在开始编码之前，请先创建一个 Issue 来描述：

- **Bug 报告**：详细描述问题、复现步骤、期望行为
- **功能请求**：说明功能的目的、使用场景、预期效果
- **改进建议**：描述当前问题和改进方案

### 2. 创建分支

```bash
# 更新主分支
git checkout main
git pull upstream main

# 创建新分支
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

### 3. 开发和测试

- 遵循项目的代码规范
- 确保代码通过 ESLint 检查
- 测试您的更改在不同浏览器中的表现
- 确保不破坏现有功能

### 4. 提交代码

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
# 添加更改
git add .

# 提交更改
git commit -m "feat: add new drawing tool"
# 或
git commit -m "fix: resolve canvas rendering issue"
```

#### 提交类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 5. 推送和创建 Pull Request

```bash
# 推送分支
git push origin feature/your-feature-name

# 在 GitHub 上创建 Pull Request
```

#### Pull Request 要求

- 清晰的标题和描述
- 关联相关的 Issue
- 包含变更的截图或 GIF（如果适用）
- 确保 CI 检查通过

## 代码规范

### TypeScript/JavaScript

- 使用 TypeScript 进行开发
- 遵循 ESLint 和 Prettier 配置
- 优先使用 Vue 3 Composition API
- 使用有意义的变量和函数名

### Vue 组件

- 使用 `<script setup>` 语法
- 组件名使用 PascalCase
- Props 和 events 要有明确的类型定义
- 使用 scoped 样式

### CSS

- 使用语义化的类名
- 优先使用 CSS 变量
- 保持响应式设计
- 避免使用 `!important`

### 文件命名

- 组件文件：`PascalCase.vue`
- 工具文件：`camelCase.ts`
- 类型文件：`camelCase.ts`
- 样式文件：`kebab-case.css`

## 测试指南

### 手动测试

在提交 PR 之前，请确保：

1. **基础功能测试**
   - 项目创建和打开
   - 页面编辑和预览
   - 项目保存和加载

2. **播放器测试**
   - 全屏播放
   - 翻页功能
   - 绘图工具

3. **浏览器兼容性**
   - Chrome（推荐）
   - Firefox
   - Safari
   - Edge

### 性能测试

- 大项目加载速度
- 编辑器响应性
- 内存使用情况

## 文档贡献

### README 更新

如果您的更改影响了：
- 安装或使用流程
- 新功能介绍
- API 变更

请相应更新 README.md。

### 代码注释

- 复杂逻辑需要注释说明
- 公共 API 需要 JSDoc 注释
- 注释使用中文

## 发布流程

项目维护者会处理版本发布：

1. 更新版本号
2. 生成 CHANGELOG
3. 创建 Git tag
4. 发布到 npm（如果适用）

## 社区行为准则

### 我们的承诺

为了营造一个开放和友好的环境，我们承诺：

- 尊重不同观点和经验
- 接受建设性批评
- 专注于对社区最有益的事情
- 对其他社区成员表示同情

### 不当行为

不可接受的行为包括：

- 使用性别化语言或图像
- 人身攻击或政治攻击
- 公开或私下骚扰
- 发布他人隐私信息

## 获得帮助

如果您需要帮助：

- 📖 查看 [README.md](README.md)
- 🐛 搜索现有 [Issues](https://github.com/your-username/htmlppt/issues)
- 💬 创建新的 Issue 或 Discussion
- 📧 联系维护者

## 致谢

感谢所有为这个项目做出贡献的开发者！

您的贡献将被记录在 [Contributors](https://github.com/your-username/htmlppt/graphs/contributors) 页面。

---

再次感谢您的贡献！🎉