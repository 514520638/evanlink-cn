# 本地 Agent API 接入

Agent 后端项目：`../evan-agent`。先在后端执行 `uv sync && uv run evan-api`，
再在此项目执行 `npm start`。本地网页端口 8081，Agent 端口 8001。

`src/api/agent.ts` 已封装 Cookie 认证、聊天 SSE、待审批恢复／取消。
Vite 的 `/agent-api` 代理已配置；原 `/api` 仍指向博客后端 8080。

完整接口契约和 React 调用示例见 [Agent API 文档](../evan-agent/docs/API.md)。

推荐页面顺序：

1. `agentApi.me()` 查询身份，只有 401 时才调用 `agentApi.guest()`。
2. 加载／创建聊天，通过 `agentApi.send()` 收到 message_start、delta、done。
3. 收到 approval_required 后展示待保存内容、可选补充字段、公开范围与发布状态。
4. 本人确认后调用 `agentApi.review()`，将表单合成最终 content；取消则调用 cancelReview()。
5. 刷新页面后用 conversation() 获取 messages 和 pending，避免丢失待确认事项。

登录后身份为 owner（小磊助手），访客身份为 guest（作者数字分身）。
Agent 本人认证独立于博客现有管理员认证，使用后端 evan-auth init 设置的密码。
密码不放进聊天消息，模型 Key 不进入前端代码。

本次完成接口调用模块及代理，没有添加聊天窗口／登录表单／审批表单的视觉组件。
