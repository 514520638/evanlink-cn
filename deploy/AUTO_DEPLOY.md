# 自动发布

本仓库 .github/workflows/deploy.yml 在 main/master push 后构建并发布前端，PR 只构建。
从 feature_agent 合并到 master 会触发发布，直接 push 到 main/master 也会触发。

需要在 GitHub Actions 仓库 Secrets 添加 DEPLOY_SSH_KEY 与 DEPLOY_KNOWN_HOSTS。
本机专用部署文件位于相邻 evan-agent 仓库的 .local/deploy-keys，不提交密钥。
完整配置、回滚和启用步骤见 evan-agent/docs/AUTO_DEPLOY.md。

deploy/ci-deploy.sh 先复制资源，再替换首页并验证，失败恢复旧首页。
上传前检查私钥、known_hosts 主机记录和 SSH 连接，必须输出 SSH_READY。
上传与部署分为独立步骤，分别最多 32 分钟、20 分钟。
服务器的 /var/lock/evanlink-release.lock 与 Agent、Java 后端共享，防止并发发布，最长等待 10 分钟。
Host key verification failed 表示需要在本仓库重新填写已验证的 DEPLOY_KNOWN_HOSTS；不能关闭主机身份校验。

上传使用 rsync --append-verify，日志显示字节进度。60 秒无传输活动会失败重试，每次最多 10 分钟，共三次；重试保留部分文件。总上传步骤限制 32 分钟。当前服务器已安装 rsync。传输速度仍取决于 GitHub runner 到服务器的网络，续传不保证提高带宽。

## HTML 缓存与静态资源压缩

合并后自动发布会调用 ci-nginx-cache.sh，将 nginx-frontend-cache.conf 包含到 /etc/nginx/conf.d/evanlink.cn.conf 的 HTTPS server。
现有站点需要恰好一个 index index.html 指令；若已手写同路径 location，脚本会拒绝覆盖，需人工合并。
规则：index.html 使用 no-cache，/assets/ 下成功响应使用一年 immutable，缺失资产直接 404；只在 HTML/静态资源 location 启用 gzip，聊天 SSE 与 API 不受影响。
应用前备份站点/旧 snippet，nginx -t 通过才 reload；验证 /chat 缓存头、资产缓存头与 gzip，失败恢复旧页面入口及配置。
本次代码提交本身不更新服务器，必须触发新提交的 Actions；重跑旧提交不会带上新脚本。

路由改为 lazy + Suspense；浮动聊天入口保留轻量按钮，点击才加载完整聊天，首次自动打开抽屉。
测试首页实际首次 JS 约 1.02MB，之前线上单个主 JS 已约 2.20MB；实际传输还受 gzip 和浏览器缓存影响，不能把包体减少直接等同于固定加载秒数。
