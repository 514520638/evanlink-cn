# EvanLink 个人博客

> 基于 React + TypeScript + Ant Design + Vite 构建的现代化个人博客

## 特性

- **主题切换** - 支持浅色/深色模式
- **国际化** - 支持中文和英文
- **响应式设计** - 适配常见桌面和移动设备
- **快速构建** - 基于 Vite 开发和构建
- **Markdown 支持** - 文章渲染和代码高亮
- **图片优化** - 对 `https://i.ibb.co` 做 preconnect，并在空闲时间预加载微信二维码

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 4.5
- **UI 组件库**: Ant Design 5
- **路由**: React Router 6
- **国际化**: i18next + react-i18next
- **Markdown**: react-markdown + react-syntax-highlighter
- **样式**: CSS Modules

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

本地开发端口配置在 `vite.config.ts`：

```text
http://127.0.0.1:8081
```

前端 API 基础路径为 `/api`，生产环境由 Nginx 转发到后端：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080/api/;
}
```

## 项目结构

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

## 页面路由

| 路径 | 页面 | 描述 |
|------|------|------|
| `/` | Home | 首页 |
| `/blog` | Blog | 博客列表 |
| `/blog/:slug` | Article | 文章详情 |
| `/about` | About | 关于我 |
| `/projects` | Projects | 项目展示 |
| `/friends` | Friends | 友链 |

## 配置

### 主题配置

在 `src/styles/variables.less` 中修改主题变量。

### 国际化

- 中文语言包: `src/locales/zh.json`
- 英文语言包: `src/locales/en.json`

### 文章数据

在 `src/data/articles.ts` 中管理文章数据。

## 部署到服务器

当前线上部署方式：

- 前端构建产物由 Nginx 托管
- 服务器静态目录：`/opt/evanlink-frontend/html`
- 域名：`https://evanlink.cn`
- API 请求走同域 `/api/...`，由 Nginx 代理到本机后端 `127.0.0.1:8080`

### 1. 本地构建

```bash
cd ~/Desktop/project/evanlink-cn
npm run build
```

构建产物目录：

```text
dist/
```

### 2. 上传到服务器

```bash
scp -r dist/* root@62.234.72.18:/opt/evanlink-frontend/html/
```

注意：线上 Nginx 实际 root 是 `/opt/evanlink-frontend/html`，不要上传到 `/var/www/evanlink-cn`。

### 3. 服务器 reload Nginx

```bash
nginx -t
systemctl reload nginx
```

### 4. 验证前端是否更新

服务器上检查入口 HTML 是否包含当前版本变更，例如图片域名预连接：

```bash
grep -n "i.ibb.co" /opt/evanlink-frontend/html/index.html
```

浏览器强制刷新：

```text
macOS: Cmd + Shift + R
Windows: Ctrl + F5
```

### 5. 关键 Nginx 配置

```nginx
server {
    listen 443 ssl;
    server_name evanlink.cn www.evanlink.cn;

    ssl_certificate /etc/nginx/ssl/evanlink.cn/fullchain.cer;
    ssl_certificate_key /etc/nginx/ssl/evanlink.cn/privkey.key;

    root /opt/evanlink-frontend/html;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## License

MIT © Evan Tang
