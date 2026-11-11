# EvanLink Frontend

React + TypeScript + Vite 实现的个人博客前端。文章、个人信息、技能栈都来自后端接口，不再维护本地静态文章数据。

## 技术栈

- React 18
- TypeScript
- Vite
- Ant Design
- React Router
- Redux Toolkit
- i18next
- react-markdown

## 本地开发

```bash
npm install
npm run start
```

默认开发地址：

```text
http://127.0.0.1:8081
```

生产构建：

```bash
npm run build
```

构建产物在：

```text
dist/
```

## 路由

| 路由 | 说明 |
| --- | --- |
| `/` | 首页，展示个人信息和最新文章 |
| `/blog` | 文章列表 |
| `/blog/:slug` | 文章详情 |
| `/editor` | 写文章，需要管理员登录 |
| `/editor/:slug` | 编辑文章，需要管理员登录 |
| `/about` | 关于我 |
| `/admin` | 管理后台登录与资料维护 |

## 管理后台

后台入口：

```text
/admin
```

后台登录成功后会保存 `admin_token` 到 `localStorage`。写文章、编辑文章、删除文章、维护个人信息和技能栈都会复用这个 token。

需要管理员登录的操作：

- 新增文章
- 编辑文章
- 删除文章
- 修改个人信息
- 修改技能栈

公开可访问：

- 首页
- 文章列表
- 文章详情
- 关于我

## API

前端统一请求同域 `/api`，由 Nginx 代理到后端。

主要接口封装：

```text
src/api/articles.ts
```

文章数据不是静态文件；首页、博客列表、文章详情、编辑器都通过后端接口获取。

## 部署

### 1. 构建

```bash
cd /Users/xdf/Desktop/project/evanlink-cn
npm run build
```

### 2. 上传到服务器

```bash
ssh root@62.234.72.18 "rm -rf /opt/evanlink-frontend/html/*"
scp -r dist/* root@62.234.72.18:/opt/evanlink-frontend/html/
```

### 3. 重载 Nginx

```bash
ssh root@62.234.72.18 "nginx -t && systemctl reload nginx"
```

## Nginx 要点

前端静态目录：

```text
/opt/evanlink-frontend/html
```

核心配置：

```nginx
root /opt/evanlink-frontend/html;
index index.html;

location / {
    try_files $uri $uri/ /index.html;
}

location /api/ {
    proxy_pass http://127.0.0.1:8080/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 常用排查

确认构建产物：

```bash
ls -la dist
```

确认服务器文件：

```bash
ssh root@62.234.72.18 "ls -la /opt/evanlink-frontend/html"
```

浏览器如果仍看到旧页面，强制刷新：

```text
macOS: Cmd + Shift + R
Windows: Ctrl + F5
```
