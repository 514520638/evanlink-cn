# 博客前端部署模块

接收 GitHub 构建的前端产物，备份、替换并验证线上页面，不构建 Java 或 Agent。

| 文件 | 职责 |
| --- | --- |
| ci-deploy.sh | 共享发布锁、资源校验、原子切换首页与失败恢复 |
| AUTO_DEPLOY.md | Secrets 配置、自动发布和错误定位说明 |

依赖 .github/workflows/deploy.yml（前端构建与传输流程），输出给宿主机 Nginx 的静态目录。
共享锁协调 Java 与 Agent 发布，详见 [AUTO_DEPLOY.md](AUTO_DEPLOY.md)。

ci-upload.sh：显示上传进度、检测传输停滞、最多三次断点续传；上传成功后才执行部署。依赖 runner 与服务器的 rsync。
