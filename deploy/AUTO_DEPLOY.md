# 自动发布

本仓库 .github/workflows/deploy.yml 在 main/master push 后构建并发布前端，PR 只构建。
从 feature_agent 合并到 master 会触发发布，直接 push 到 main/master 也会触发。

需要在 GitHub Actions 仓库 Secrets 添加 DEPLOY_SSH_KEY 与 DEPLOY_KNOWN_HOSTS。
本机专用部署文件位于相邻 evan-agent 仓库的 .local/deploy-keys，不提交密钥。
完整配置、回滚和启用步骤见 evan-agent/docs/AUTO_DEPLOY.md。

deploy/ci-deploy.sh 先复制资源，再替换首页并验证，失败恢复旧首页。
服务器的 /var/lock/evanlink-release.lock 与 Agent 共享，防止并发发布。
