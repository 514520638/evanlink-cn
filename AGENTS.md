# 发布约定

日常代码修改只做本地验证与交付，生产发布通过 main/master 的 GitHub Actions。
只有用户在当前任务中明确要求直接部署或回滚时，才执行手动服务器更新。
不得因构建成功或 SSH 可用就自动替换线上页面。
CI 配置见 .github/workflows/deploy.yml，部署入口见 deploy/ci-deploy.sh。
