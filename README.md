# EvanLink 个人博客

> 🚀 基于 React + TypeScript + Ant Design + Vite 构建的现代化个人博客

## ✨ 特性

- 🎨 **主题切换** - 支持浅色/深色模式
- 🌐 **国际化** - 支持中文和英文
- 📱 **响应式设计** - 完美适配各种设备
- ⚡ **快速构建** - 基于 Vite 极速开发体验
- 📝 **Markdown 支持** - 优雅的文章渲染
- 🔍 **SEO 友好** - 优化的搜索引擎收录

## 🛠️ 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 4.5
- **UI 组件库**: Ant Design 5
- **路由**: React Router 6
- **国际化**: i18next + react-i18next
- **Markdown**: react-markdown + react-syntax-highlighter
- **样式**: CSS Modules

## 📦 安装

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 📁 项目结构

```
src/
├── components/     # 公共组件
│   ├── Header/     # 头部导航
│   ├── Footer/     # 页脚
│   ├── Layout/     # 布局组件
│   └── ArticleCard/ # 文章卡片
├── pages/          # 页面组件
│   ├── Home/       # 首页
│   ├── Blog/       # 博客列表
│   ├── Article/    # 文章详情
│   ├── About/      # 关于我
│   ├── Projects/   # 项目展示
│   └── Friends/    # 友链
├── hooks/          # 自定义 Hooks
├── locales/        # 国际化语言包
├── styles/         # 全局样式
├── types/          # TypeScript 类型定义
├── utils/          # 工具函数
└── data/           # 静态数据
```

## 🎯 页面路由

| 路径 | 页面 | 描述 |
|------|------|------|
| `/` | Home | 首页 |
| `/blog` | Blog | 博客列表 |
| `/blog/:slug` | Article | 文章详情 |
| `/about` | About | 关于我 |
| `/projects` | Projects | 项目展示 |
| `/friends` | Friends | 友链 |

## 🔧 配置

### 主题配置

在 `src/styles/variables.less` 中修改主题变量。

### 国际化

- 中文语言包: `src/locales/zh.json`
- 英文语言包: `src/locales/en.json`

### 文章数据

在 `src/data/articles.ts` 中管理文章数据。

## 📝 License

MIT © Evan Tang
