# 前端共享 hooks

useTheme.ts：单例主题状态由 useSyncExternalStore 订阅，ConfigProvider 与 Header 使用同一来源；同步 HTML data-theme/color-scheme、浏览器 theme-color、storage 和系统配色变化。index.html 在首次绘制前应用同样的偏好规则；About 页面不再覆盖全站 Modal。
