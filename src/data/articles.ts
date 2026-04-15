import type { Article } from '../types';

export const articles: Article[] = [
  {
    id: '1',
    title: 'React 18 新特性深度解析',
    titleEn: 'Deep Dive into React 18 New Features',
    slug: 'react-18-new-features',
    excerpt: '探索 React 18 中的并发渲染、Suspense 增强以及新的 Hook API',
    excerptEn: 'Explore concurrent rendering, enhanced Suspense, and new Hook APIs in React 18',
    content: `
# React 18 新特性深度解析

React 18 是近年来最重要的版本更新，引入了多项革命性的新特性。

## 并发渲染 (Concurrent Rendering)

并发渲染是 React 18 的核心特性，它允许 React 同时准备多个版本的 UI。

\`\`\`tsx
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
\`\`\`

## 自动批处理 (Automatic Batching)

React 18 默认启用自动批处理，减少不必要的重新渲染。

## 新 Hooks

### useId

用于生成唯一 ID：

\`\`\`tsx
const id = useId();
\`\`\`

### useTransition

将耗时操作标记为非阻塞：

\`\`\`tsx
const [isPending, startTransition] = useTransition();

startTransition(() => {
  setTab(tab);
});
\`\`\`

### useDeferredValue

延迟更新非关键 UI：

\`\`\`tsx
const deferredValue = useDeferredValue(value);
\`\`\`

## Suspense 增强

服务端渲染现在完全支持 Suspense。

## 总结

React 18 为开发者带来了更强大的工具和更好的性能。
`,
    category: '前端',
    tags: ['React', 'JavaScript', '前端'],
    author: 'Evan',
    publishDate: '2024-01-15',
    updateDate: '2024-01-20',
    readingTime: 8,
    views: 1250,
    featured: true,
  },
  {
    id: '2',
    title: 'Go 语言高性能 Web 服务实战',
    titleEn: 'Building High-Performance Web Services with Go',
    slug: 'go-high-performance-web',
    excerpt: '使用 Go 语言构建高性能 Web 服务的最佳实践',
    excerptEn: 'Best practices for building high-performance web services with Go',
    content: `
# Go 语言高性能 Web 服务实战

Go 语言以其出色的并发性能和简洁的语法成为构建高性能服务的首选。

## Gin 框架入门

\`\`\`go
package main

import "github.com/gin-gonic/gin"

func main() {
    r := gin.Default()
    r.GET("/ping", func(c *gin.Context) {
        c.JSON(200, gin.H{"message": "pong"})
    })
    r.Run()
}
\`\`\`

## 并发模型

Go 的 goroutine 使得并发编程变得简单：

\`\`\`go
func worker(jobs <-chan int, results chan<- int) {
    for j := range jobs {
        results <- j * 2
    }
}

func main() {
    jobs := make(chan int, 100)
    results := make(chan int, 100)

    for w := 1; w <= 3; w++ {
        go worker(jobs, results)
    }
}
\`\`\`

## 性能优化技巧

1. 使用 sync.Pool 复用对象
2. 合理设置缓冲区大小
3. 使用 pprof 进行性能分析
`,
    category: '后端',
    tags: ['Go', 'Web', '后端'],
    author: 'Evan',
    publishDate: '2024-01-10',
    readingTime: 12,
    views: 890,
    featured: true,
  },
  {
    id: '3',
    title: 'Docker 容器化部署完全指南',
    titleEn: 'Complete Guide to Docker Containerization',
    slug: 'docker-complete-guide',
    excerpt: '从零开始掌握 Docker 容器化部署的各个环节',
    excerptEn: 'Master every aspect of Docker containerization from scratch',
    content: `
# Docker 容器化部署完全指南

Docker 已经成为现代应用部署的标准，本指南帮助你从零掌握容器化技术。

## Dockerfile 最佳实践

\`\`\`dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
\`\`\`

## Docker Compose 编排

\`\`\`yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
  db:
    image: postgres:14
    volumes:
      - db-data:/var/lib/postgresql/data
volumes:
  db-data:
\`\`\`

## 安全最佳实践

1. 最小化镜像大小
2. 不使用 root 用户运行
3. 定期更新基础镜像
`,
    category: '运维',
    tags: ['Docker', 'DevOps', '运维'],
    author: 'Evan',
    publishDate: '2024-01-05',
    readingTime: 10,
    views: 720,
  },
  {
    id: '4',
    title: 'TypeScript 高级类型技巧',
    titleEn: 'Advanced TypeScript Type Techniques',
    slug: 'typescript-advanced-types',
    excerpt: '深入探索 TypeScript 高级类型系统',
    excerptEn: 'Deep dive into TypeScript advanced type system',
    content: `
# TypeScript 高级类型技巧

TypeScript 的类型系统非常强大，这里介绍一些高级技巧。

## 条件类型

\`\`\`typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">; // true
type B = IsString<123>;     // false
\`\`\`

## 映射类型

\`\`\`typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Partial<T> = {
  [P in keyof T]?: T[P];
};
\`\`\`

## 模板字面量类型

\`\`\`typescript
type EventName = \`on\${Capitalize<string>}\`;
\`\`\`

## 总结

掌握这些高级类型技巧，可以让代码更加类型安全。
`,
    category: '前端',
    tags: ['TypeScript', 'JavaScript', '前端'],
    author: 'Evan',
    publishDate: '2023-12-28',
    readingTime: 6,
    views: 560,
  },
];

export const categories = ['全部', '前端', '后端', '运维', '生活随笔'];

export const allTags = ['React', 'TypeScript', 'Go', 'Docker', 'JavaScript', 'Web', 'DevOps', '算法', '前端', '后端', '运维'];

export const getArticleBySlug = (slug: string): Article | undefined => {
  return articles.find(article => article.slug === slug);
};

export const getArticlesByCategory = (category: string): Article[] => {
  if (category === '全部') return articles;
  return articles.filter(article => article.category === category);
};

export const getArticlesByTag = (tag: string): Article[] => {
  return articles.filter(article => article.tags.includes(tag));
};

export const searchArticles = (query: string): Article[] => {
  const lowerQuery = query.toLowerCase();
  return articles.filter(
    article =>
      article.title.toLowerCase().includes(lowerQuery) ||
      article.titleEn.toLowerCase().includes(lowerQuery) ||
      article.excerpt.toLowerCase().includes(lowerQuery) ||
      article.excerptEn.toLowerCase().includes(lowerQuery)
  );
};
